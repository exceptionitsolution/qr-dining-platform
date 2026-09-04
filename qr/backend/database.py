import sqlite3
import os
import json
import uuid
from datetime import datetime, timezone

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "zaika.db"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        from migrate import run_migrations
        run_migrations()
    except Exception as e:
        # Fallback inline initialization in case migrate cannot be imported directly
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            is_veg INTEGER NOT NULL DEFAULT 1,
            image_url TEXT,
            available INTEGER NOT NULL DEFAULT 1,
            is_bestseller INTEGER NOT NULL DEFAULT 0,
            spice_level INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            table_id TEXT NOT NULL,
            customer_name TEXT NOT NULL DEFAULT 'Guest',
            phone TEXT DEFAULT '',
            payment_mode TEXT NOT NULL,
            payment_status TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            instructions TEXT DEFAULT '',
            total REAL NOT NULL,
            items_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            token TEXT,
            table_id TEXT,
            created_at TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS otp_sessions (
            phone TEXT PRIMARY KEY,
            otp TEXT NOT NULL,
            otp_token TEXT,
            created_at TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """)

        conn.commit()
        conn.close()

def seed_db():
    from auth import hash_password

    conn = get_db_connection()
    cursor = conn.cursor()

    # Seed Admin User if not exists
    cursor.execute("SELECT COUNT(*) as cnt FROM admin_users WHERE email = ?", ("admin@restaurant.com",))
    if cursor.fetchone()["cnt"] == 0:
        admin_id = str(uuid.uuid4())
        pw_hash = hash_password("admin123")
        cursor.execute(
            "INSERT INTO admin_users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (admin_id, "admin@restaurant.com", pw_hash, datetime.now(timezone.utc).isoformat())
        )
        print("Default admin created: admin@restaurant.com / admin123")

    # Seed initial menu items if table is empty
    cursor.execute("SELECT COUNT(*) as cnt FROM menu_items")
    if cursor.fetchone()["cnt"] == 0:
        initial_items = [
            {
                "id": "ee063aa1-36a9-493d-8070-d31b83c3279b",
                "name": "Butter Chicken (Murgh Makhani)",
                "description": "Tender tandoori chicken simmered in rich creamy tomato, butter and fenugreek gravy.",
                "category": "Mains",
                "price": 340.0,
                "is_veg": 0,
                "is_bestseller": 1,
                "spice_level": 2,
                "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBidXR0ZXIlMjBjaGlja2VuJTIwY3VycnklMjBib3dsfGVufDB8fHx8MTc4NzU1ODQxOHww&ixlib=rb-4.1.0&q=85",
                "available": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "0c6eb3a9-a514-4d55-b2ef-baa7c106bb43",
                "name": "Smoky Paneer Tikka",
                "description": "Fresh cottage cheese cubes marinated in spiced yogurt and grilled in charcoal tandoor.",
                "category": "Starters",
                "price": 240.0,
                "is_veg": 1,
                "is_bestseller": 1,
                "spice_level": 2,
                "image_url": "https://images.pexels.com/photos/3928854/pexels-photo-3928854.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "97704023-e948-4bc9-9a64-708a87364d63",
                "name": "Crispy Punjabi Samosa (2 pcs)",
                "description": "Golden crispy crust stuffed with roasted cumin potatoes, green peas and served with tangy chutneys.",
                "category": "Starters",
                "price": 70.0,
                "is_veg": 1,
                "is_bestseller": 0,
                "spice_level": 1,
                "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxzYW1vc2ElMjBzbmFjayUyMHBsYXRlfGVufDB8fHx8MTc4NzU1ODQxOHww&ixlib=rb-4.1.0&q=85",
                "available": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "5155d8a6-bb4c-48a5-936d-6dd9962257bb",
                "name": "Hyderabadi Dum Biryani",
                "description": "Fragrant long-grain basmati layered with garden veggies, whole spices, saffron and caramelized onions.",
                "category": "Mains",
                "price": 260.0,
                "is_veg": 1,
                "is_bestseller": 1,
                "spice_level": 3,
                "image_url": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwxfHx2ZWclMjBiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MHx8fHwxNzg3NTU4NDE4fDA&ixlib=rb-4.1.0&q=85",
                "available": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "7e2d3149-559a-4c05-970c-d10662950f63",
                "name": "Mysore Masala Dosa",
                "description": "Crispy golden fermented crepe lined with spicy red chili-garlic paste and aloo masala.",
                "category": "Mains",
                "price": 160.0,
                "is_veg": 1,
                "is_bestseller": 0,
                "spice_level": 2,
                "image_url": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxtYXNhbGElMjBkb3NhJTIwaW5kaWFuJTIwZm9vZHxlbnwwfHx8fDE3ODc1NTg0MTh8MA&ixlib=rb-4.1.0&q=85",
                "available": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "1353136d-d00a-40fe-b277-72e10fb27e50",
                "name": "Garlic Butter Naan",
                "description": "Tandoor baked soft flatbread topped with minced garlic, fresh coriander and melted butter.",
                "category": "Breads",
                "price": 65.0,
                "is_veg": 1,
                "is_bestseller": 1,
                "spice_level": 1,
                "image_url": "https://images.pexels.com/photos/1117862/pexels-photo-1117862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "6387c8f7-f2a0-4e5b-8b3a-c314b0ad8301",
                "name": "Gulab Jamun with Rabri (2 pcs)",
                "description": "Soft melt-in-mouth khoya dumplings served hot with saffron cardamom infused rabri.",
                "category": "Desserts",
                "price": 110.0,
                "is_veg": 1,
                "is_bestseller": 1,
                "spice_level": 0,
                "image_url": "https://images.pexels.com/photos/9198596/pexels-photo-9198596.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "6d20deea-b99c-48f7-95e7-2ce79b3103fc",
                "name": "Royal Mango Lassi",
                "description": "Thick artisanal yogurt smoothie blended with sweet Alphonso mango pulp and topped with pistachios.",
                "category": "Beverages",
                "price": 120.0,
                "is_veg": 1,
                "is_bestseller": 1,
                "spice_level": 0,
                "image_url": "https://images.pexels.com/photos/14509267/pexels-photo-14509267.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]

        for item in initial_items:
            cursor.execute("""
            INSERT INTO menu_items (id, name, description, category, price, is_veg, is_bestseller, spice_level, image_url, available, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item["id"], item["name"], item["description"], item["category"],
                item["price"], item["is_veg"], item["is_bestseller"], item["spice_level"],
                item["image_url"], item["available"], item["created_at"]
            ))
        print(f"Seeded {len(initial_items)} default menu items.")

    conn.commit()
    conn.close()
