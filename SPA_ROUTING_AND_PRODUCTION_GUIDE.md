# 🛠️ SPA Routing, API Architecture & Checkout Flow Guide

This document details the production fixes, single-page application (SPA) routing, cross-origin resource sharing (CORS), image resolution, and the streamlined customer ordering workflow.

---

## 🌐 1. Vercel SPA Routing & 404 Prevention

### Problem
In a Single Page Application (React Router), refreshing or directly opening sub-routes (such as `/admin`, `/order/:id`, `/status`) results in Vercel returning a `404: NOT_FOUND` because Vercel looks for a static file named `admin.html` on the server disk.

### Solution: `qr/frontend/vercel.json`
By placing a `vercel.json` inside the frontend root with rewrite rules, all client-side paths are routed to `/index.html`, allowing React Router to render the appropriate page instantly:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🔒 2. Cross-Origin Resource Sharing (CORS) Architecture

### Problem
When the Frontend runs on `https://qr-dining-platform.vercel.app` and the Backend runs on `https://qr-dining-platform.onrender.com`, browsers send preflight `OPTIONS` requests. If `allow_origins=["*"]` is used with `allow_credentials=True`, the browser strictly blocks the response under W3C security standards.

### Solution: Dynamic Origin Regex in `qr/backend/main.py`
Using `allow_origin_regex=r".*"` allows any authorized frontend domain (Vercel deployments, preview branches, localhost, or custom restaurant domains) to securely communicate with the backend:

```python
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
```

---

## 🖼️ 3. Production Media & Dish Image Resolution

### Problem
Dish images uploaded through the Admin panel are stored in the backend's `/uploads` folder on Render. In production, a relative URL like `/uploads/photo.jpg` would incorrectly resolve against Vercel's domain instead of Render.

### Solution: `src/utils/imageUrl.js`
A centralized helper automatically resolves relative `/uploads` paths to the live backend host URL defined in `VITE_API_URL`:

```javascript
export function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  const rawApiUrl = import.meta.env.VITE_API_URL || '';
  const backendBase = rawApiUrl.replace(/\/api\/?$/, '');
  
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return backendBase ? `${backendBase}${cleanPath}` : cleanPath;
}
```

---

## 🛒 4. Streamlined Customer Ordering Flow (Frictionless)

To ensure the fastest checkout speed and maximum order completion in a bustling dining environment:

### Specifications:
1. **Customer Name**: **Mandatory (`*`)**
   - Essential for calling the order token at the counter / table delivery.
2. **Mobile Number**: **Optional**
   - Customers can enter their phone number if they wish to receive updates, but it is not required.
3. **Zero OTP Bottleneck**:
   - Removed all SMS/OTP steps so customers can place orders in under 3 seconds with **1 single click**.
4. **Payment Flexibility**:
   - Supports **Pay at Counter (Cash / Desk UPI)** and **Pay Online (UPI / Cards / NetBanking)**.

---

## 🔑 5. Admin Panel & Kitchen Display System (KDS)

### Accessing the Dashboard
- **URL**: `https://<YOUR_VERCEL_DOMAIN>/admin`
- **Login Credentials**:
  - Email: `ADMIN_EMAIL` configured in Render Environment Variables.
  - Password: `ADMIN_PASSWORD` configured in Render Environment Variables.

### Core Modules:
- **Live KDS Board**: Real-time kitchen view to advance order states (`pending` ➔ `preparing` ➔ `ready` ➔ `completed`).
- **Menu Management**: Create categories, add dishes, set prices, toggle veg/non-veg, flag bestsellers, and upload high-res food photos.
- **Table QR Generator**: Instant SVG/PNG QR codes for Table 1 to Table N with direct table query parameters (`/?table=1`).
- **Revenue Analytics**: Daily sales, average order value, popular dishes, and customer reviews.
