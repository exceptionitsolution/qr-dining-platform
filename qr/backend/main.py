import os
import json
import uuid
import random
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db, seed_db, get_db_connection, DB_PATH
from auth import hash_password, verify_password, create_access_token, get_current_admin
from otp_service import dispatch_otp
from models import (
    LoginRequest, LoginResponse, SendOtpRequest, SendOtpResponse,
    VerifyOtpRequest, VerifyOtpResponse, CreateOrderRequest,
    UpdateOrderStatusRequest, VerifyPaymentRequest, ReviewCreateRequest, MenuItemPayload
)

# Initialize database eagerly
init_db()
seed_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_db()
    yield

app = FastAPI(title="Zaika Restaurant QR Dine API", version="2.0.0", lifespan=lifespan)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://qr-dining-platform.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# ----------------- PUBLIC API -----------------

@app.get("/")
def root():
    return {
        "message": "Zaika Restaurant QR Dine Backend API is running!",
        "docs": "http://localhost:8000/docs",
        "frontend_menu": "http://localhost:3000/?table=4",
        "admin_panel": "http://localhost:3000/admin"
    }

@app.get("/api/config")
def get_config():
    online_enabled = os.environ.get("RAZORPAY_KEY_ID") is not None and len(os.environ.get("RAZORPAY_KEY_ID", "")) > 0
    return {
        "online_enabled": online_enabled,
        "razorpay_key_id": os.environ.get("RAZORPAY_KEY_ID", ""),
        "sms_provider": os.environ.get("FAST2SMS_API_KEY") and "fast2sms" or os.environ.get("TWILIO_ACCOUNT_SID") and "twilio" or "demo"
    }

@app.get("/api/menu")
def get_public_menu():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name")
    rows = cursor.fetchall()
    conn.close()

    items = []
    categories = []
    for r in rows:
        item = dict(r)
        item["is_veg"] = bool(item.get("is_veg", 1))
        item["available"] = bool(item.get("available", 1))
        item["is_bestseller"] = bool(item.get("is_bestseller", 0))
        item["spice_level"] = int(item.get("spice_level", 1))
        items.append(item)
        if item["category"] not in categories:
            categories.append(item["category"])

    return {
        "categories": categories,
        "items": items
    }

@app.post("/api/otp/send", response_model=SendOtpResponse)
def send_otp(req: SendOtpRequest):
    phone = req.phone.strip()
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit phone number")
    
    # Dispatch OTP via real SMS gateway or demo
    result = dispatch_otp(phone)
    otp = result["otp"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO otp_sessions (phone, otp, otp_token, created_at)
    VALUES (?, ?, NULL, ?)
    """, (phone, otp, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()

    msg = "OTP sent to your phone via SMS" if result["sent_real_sms"] else f"Demo Mode OTP: {otp}"
    return {
        "status": "ok",
        "demo_otp": result["demo_otp"],
        "sent_real_sms": result["sent_real_sms"],
        "message": msg
    }

@app.post("/api/otp/verify", response_model=VerifyOtpResponse)
def verify_otp(req: VerifyOtpRequest):
    phone = req.phone.strip()
    otp = req.otp.strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM otp_sessions WHERE phone = ?", (phone,))
    session = cursor.fetchone()

    # Allow demo master OTP 1234 or database match
    if not session or (session["otp"] != otp and otp != "1234"):
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")

    otp_token = str(uuid.uuid4())
    cursor.execute("UPDATE otp_sessions SET otp_token = ? WHERE phone = ?", (otp_token, phone))
    conn.commit()
    conn.close()

    return {"otp_token": otp_token}

@app.post("/api/orders")
def place_order(req: CreateOrderRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    customer_name = (req.customer_name or "").strip()
    if not customer_name:
        conn.close()
        raise HTTPException(status_code=400, detail="Customer name is required")

    phone = (req.phone or "").strip()

    # Validate OTP session ONLY if phone was provided and otp_token was sent
    # If phone was skipped by customer, allow order directly!
    if phone and len(phone) >= 10:
        if req.otp_token:
            cursor.execute("SELECT * FROM otp_sessions WHERE phone = ? AND otp_token = ?", (phone, req.otp_token))
            session = cursor.fetchone()
            # If not verified, still allow if guest mode

    # Fetch menu items and compute total
    item_ids = [i.item_id for i in req.items]
    if not item_ids:
        conn.close()
        raise HTTPException(status_code=400, detail="Cart is empty")

    placeholders = ",".join("?" * len(item_ids))
    cursor.execute(f"SELECT * FROM menu_items WHERE id IN ({placeholders})", item_ids)
    menu_db_map = {row["id"]: row for row in cursor.fetchall()}

    order_items = []
    total = 0.0
    for i in req.items:
        db_item = menu_db_map.get(i.item_id)
        if not db_item:
            continue
        price = float(db_item["price"])
        item_total = price * i.qty
        total += item_total
        order_items.append({
            "item_id": db_item["id"],
            "name": db_item["name"],
            "price": price,
            "qty": i.qty
        })

    if not order_items:
        conn.close()
        raise HTTPException(status_code=400, detail="No valid items in order")

    # Generate short token like #101 or A14
    token_num = random.randint(100, 999)
    token = f"#{token_num}"
    order_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    instructions = (req.instructions or "").strip()

    if req.payment_mode == "online":
        key_id = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_mock")
        razorpay_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        
        cursor.execute("""
        INSERT INTO orders (id, token, table_id, customer_name, phone, payment_mode, payment_status, status, instructions, total, items_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (order_id, token, req.table_id, customer_name, phone, "online", "pending", "pending", instructions, total, json.dumps(order_items), created_at))
        conn.commit()
        conn.close()

        return {
            "order_id": order_id,
            "razorpay_order_id": razorpay_order_id,
            "amount": int(total * 100),
            "key_id": key_id
        }

    # COD Order
    cursor.execute("""
    INSERT INTO orders (id, token, table_id, customer_name, phone, payment_mode, payment_status, status, instructions, total, items_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (order_id, token, req.table_id, customer_name, phone, "cod", "pending", "pending", instructions, total, json.dumps(order_items), created_at))
    conn.commit()
    conn.close()

    return {
        "id": order_id,
        "token": token,
        "table_id": req.table_id,
        "customer_name": customer_name,
        "phone": phone,
        "payment_mode": "cod",
        "payment_status": "pending",
        "status": "pending",
        "instructions": instructions,
        "total": total,
        "items": order_items,
        "created_at": created_at
    }

@app.get("/api/orders/{order_id}/status")
def get_order_status(order_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    conn.close()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    res = dict(order)
    res["items"] = json.loads(res["items_json"])
    return res

@app.post("/api/payments/verify")
def verify_payment(req: VerifyPaymentRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (req.order_id,))
    order = cursor.fetchone()

    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    cursor.execute("UPDATE orders SET payment_status = 'paid' WHERE id = ?", (req.order_id,))
    conn.commit()

    cursor.execute("SELECT * FROM orders WHERE id = ?", (req.order_id,))
    updated = cursor.fetchone()
    conn.close()

    result = dict(updated)
    result["items"] = json.loads(result["items_json"])
    return result

@app.post("/api/reviews")
def create_review(req: ReviewCreateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM orders WHERE id = ?", (req.order_id,))
    order = cursor.fetchone()
    token = order["token"] if order else ""
    table_id = order["table_id"] if order else ""

    review_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO reviews (id, order_id, rating, comment, token, table_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (review_id, req.order_id, req.rating, req.comment or "", token, table_id, created_at))
    conn.commit()
    conn.close()

    return {"status": "ok", "id": review_id}

# ----------------- ADMIN API -----------------

@app.post("/api/auth/login", response_model=LoginResponse)
def admin_login(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin_users WHERE email = ?", (req.email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"], "email": user["email"]})
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"]}
    }

@app.get("/api/auth/me")
def admin_me(current_user: dict = Depends(get_current_admin)):
    return {"id": current_user["sub"], "email": current_user["email"]}

@app.post("/api/auth/logout")
def admin_logout():
    return {"status": "ok"}

@app.get("/api/admin/orders")
def get_admin_orders(
    filter: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_admin)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM orders WHERE 1=1"
    params = []

    if filter == "today":
        today_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query += " AND created_at LIKE ?"
        params.append(f"{today_prefix}%")
    
    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    orders = []
    for r in rows:
        o = dict(r)
        o["items"] = json.loads(o["items_json"])
        orders.append(o)
    return orders

@app.patch("/api/admin/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    req: UpdateOrderStatusRequest,
    current_user: dict = Depends(get_current_admin)
):
    valid_statuses = ["pending", "preparing", "ready", "completed", "cancelled"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid order status")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (req.status, order_id))
    conn.commit()
    
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    updated = cursor.fetchone()
    conn.close()

    res = dict(updated)
    res["items"] = json.loads(res["items_json"])
    return res

@app.get("/api/admin/stats")
def get_admin_stats(
    period: Optional[str] = Query("today"),
    current_user: dict = Depends(get_current_admin)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query orders based on timeframe
    if period == "today":
        today_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        cursor.execute("SELECT * FROM orders WHERE created_at LIKE ?", (f"{today_prefix}%",))
    elif period == "week":
        cursor.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200")
    else:
        cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
        
    orders_list = [dict(r) for r in cursor.fetchall()]

    # Fetch reviews for customer satisfaction metric
    cursor.execute("SELECT * FROM reviews")
    reviews_list = [dict(r) for r in cursor.fetchall()]
    conn.close()

    total_orders = len(orders_list)
    completed_orders = sum(1 for o in orders_list if o["status"] == "completed")
    pending_orders = sum(1 for o in orders_list if o["status"] in ["pending", "preparing", "ready"])
    cancelled_orders = sum(1 for o in orders_list if o["status"] == "cancelled")
    
    cod_rev = sum(o["total"] for o in orders_list if o["payment_mode"] == "cod" and o["status"] != "cancelled")
    online_rev = sum(o["total"] for o in orders_list if o["payment_mode"] == "online" and o["status"] != "cancelled")
    total_rev = cod_rev + online_rev
    aov = (total_rev / total_orders) if total_orders > 0 else 0.0

    # Dish popularity breakdown from items_json
    dish_counts = {}
    table_stats = {}
    hour_counts = {f"{h:02d}:00": 0 for h in range(11, 24)} # 11 AM to 11 PM

    for o in orders_list:
        # Table stats
        tbl = o.get("table_id") or "Table"
        table_stats[tbl] = table_stats.get(tbl, 0) + o.get("total", 0)

        # Busy hours
        created = o.get("created_at", "")
        if "T" in created:
            try:
                hour_str = created.split("T")[1][:2] + ":00"
                if hour_str in hour_counts:
                    hour_counts[hour_str] += 1
            except:
                pass

        # Dish sales
        try:
            items = json.loads(o["items_json"])
            for itm in items:
                name = itm.get("name", "Dish")
                qty = itm.get("qty", 1)
                price = itm.get("price", 0)
                if name not in dish_counts:
                    dish_counts[name] = {"name": name, "qty": 0, "revenue": 0.0}
                dish_counts[name]["qty"] += qty
                dish_counts[name]["revenue"] += price * qty
        except:
            continue

    top_dishes = sorted(dish_counts.values(), key=lambda x: x["qty"], reverse=True)[:5]
    top_tables = sorted([{"table": k, "revenue": v} for k, v in table_stats.items()], key=lambda x: x["revenue"], reverse=True)[:4]

    # Customer ratings summary
    avg_rating = (sum(r["rating"] for r in reviews_list) / len(reviews_list)) if reviews_list else 5.0

    return {
        "period": period,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "cancelled_orders": cancelled_orders,
        "cod_revenue": cod_rev,
        "online_revenue": online_rev,
        "total_revenue": total_rev,
        "average_order_value": round(aov, 2),
        "top_dishes": top_dishes,
        "top_tables": top_tables,
        "hourly_trends": hour_counts,
        "avg_rating": round(avg_rating, 1),
        "total_reviews": len(reviews_list)
    }

@app.get("/api/admin/menu")
def get_admin_menu(current_user: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM menu_items ORDER BY category, name")
    rows = cursor.fetchall()
    conn.close()

    items = []
    for r in rows:
        item = dict(r)
        item["is_veg"] = bool(item.get("is_veg", 1))
        item["available"] = bool(item.get("available", 1))
        item["is_bestseller"] = bool(item.get("is_bestseller", 0))
        item["spice_level"] = int(item.get("spice_level", 1))
        items.append(item)
    return items

@app.post("/api/admin/menu")
def create_menu_item(item: MenuItemPayload, current_user: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    item_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO menu_items (id, name, description, category, price, is_veg, is_bestseller, spice_level, image_url, available, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item_id, item.name, item.description, item.category, item.price,
        1 if item.is_veg else 0, 1 if item.is_bestseller else 0, item.spice_level,
        item.image_url, 1 if item.available else 0, created_at
    ))
    conn.commit()
    conn.close()

    return {
        "id": item_id,
        "name": item.name,
        "description": item.description,
        "category": item.category,
        "price": item.price,
        "is_veg": item.is_veg,
        "is_bestseller": item.is_bestseller,
        "spice_level": item.spice_level,
        "image_url": item.image_url,
        "available": item.available,
        "created_at": created_at
    }

@app.put("/api/admin/menu/{item_id}")
def update_menu_item(item_id: str, item: MenuItemPayload, current_user: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE menu_items
    SET name = ?, description = ?, category = ?, price = ?, is_veg = ?, is_bestseller = ?, spice_level = ?, image_url = ?, available = ?
    WHERE id = ?
    """, (
        item.name, item.description, item.category, item.price,
        1 if item.is_veg else 0, 1 if item.is_bestseller else 0, item.spice_level,
        item.image_url, 1 if item.available else 0, item_id
    ))
    conn.commit()
    conn.close()
    return {"status": "ok", "id": item_id}

@app.delete("/api/admin/menu/{item_id}")
def delete_menu_item(item_id: str, current_user: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM menu_items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.patch("/api/admin/menu/{item_id}/availability")
def toggle_availability(item_id: str, current_user: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT available FROM menu_items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    new_val = 0 if row["available"] else 1
    cursor.execute("UPDATE menu_items SET available = ? WHERE id = ?", (new_val, item_id))
    conn.commit()
    conn.close()
    return {"status": "ok", "available": bool(new_val)}

@app.post("/api/admin/upload")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_admin)):
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {"url": f"/uploads/{filename}"}

@app.get("/api/admin/reviews")
def get_admin_reviews(current_user: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reviews ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
