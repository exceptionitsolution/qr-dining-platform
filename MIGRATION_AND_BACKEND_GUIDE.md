# 🚀 Zaika QR Dine - Backend & Database Migration Guide

This comprehensive guide covers everything needed to understand the database schema, execute and manage database migrations, configure environment variables, and run the FastAPI backend in development and production environments.

---

## 📑 Table of Contents

1. [Architecture & Tech Stack](#1-architecture--tech-stack)
2. [Database Schema & Architecture](#2-database-schema--architecture)
3. [Database Migrations Management](#3-database-migrations-management)
   - [Migration System Overview](#migration-system-overview)
   - [Migration CLI Commands](#migration-cli-commands)
4. [Step-by-Step Backend Setup & Run Guide](#4-step-by-step-backend-setup--run-guide)
   - [Step 1: Environment Setup](#step-1-environment-setup)
   - [Step 2: Virtual Environment & Dependencies](#step-2-virtual-environment--dependencies)
   - [Step 3: Environment Configuration (.env)](#step-3-environment-configuration-env)
   - [Step 4: Run Migrations & Seed Data](#step-4-run-migrations--seed-data)
   - [Step 5: Start the FastAPI Server](#step-5-start-the-fastapi-server)
5. [Default Credentials & Demo Configurations](#5-default-credentials--demo-configurations)
6. [API Endpoints & Testing with cURL](#6-api-endpoints--testing-with-curl)
7. [Production Deployment Recommendations](#7-production-deployment-recommendations)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)

---

## 1. Architecture & Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Database**: SQLite 3 with **WAL (Write-Ahead Logging)** mode enabled for concurrent reads and writes
- **Authentication**: Custom stateless JWT authentication with PBKDF2-HMAC-SHA256 password hashing
- **Validation**: Pydantic v2 data models
- **SMS / OTP Providers**: Fast2SMS, Twilio, MSG91, and automatic Demo fallback
- **Payments**: Razorpay order generation & signature verification support

---

## 2. Database Schema & Architecture

The database file is stored by default at `qr/backend/zaika.db` (customizable via `DB_PATH`).

### Tables Overview

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `schema_migrations` | Tracks applied migration versions and timestamps | `version (PK)`, `applied_at`, `description` |
| `admin_users` | Admin authentication accounts | `id (PK)`, `email (UNIQUE)`, `password_hash`, `created_at` |
| `menu_items` | Restaurant catalog items | `id (PK)`, `name`, `category`, `price`, `is_veg`, `is_bestseller`, `spice_level`, `image_url`, `available`, `created_at` |
| `orders` | Dine-in customer orders | `id (PK)`, `token`, `table_id`, `customer_name`, `phone`, `payment_mode`, `payment_status`, `status`, `instructions`, `total`, `items_json`, `created_at` |
| `reviews` | Customer feedback & ratings | `id (PK)`, `order_id`, `rating`, `comment`, `token`, `table_id`, `created_at` |
| `otp_sessions` | Phone number verification & OTP tracking | `phone (PK)`, `otp`, `otp_token`, `created_at` |
| `config` | Dynamic key-value configuration | `key (PK)`, `value` |

### Database Performance Indexes

The migration runner automatically configures the following B-Tree indexes:
- `idx_orders_created_at` on `orders(created_at DESC)`
- `idx_orders_status` on `orders(status)`
- `idx_orders_table_id` on `orders(table_id)`
- `idx_menu_items_category` on `menu_items(category, available)`
- `idx_reviews_order_id` on `reviews(order_id)`
- `idx_reviews_created_at` on `reviews(created_at DESC)`

---

## 3. Database Migrations Management

A dedicated migration tool is provided at `qr/backend/migrate.py`.

### Migration System Overview

The migration runner tracks all applied versions in the `schema_migrations` table:

1. **`001_initial_schema`**: Creates `admin_users`, `menu_items`, `orders`, `reviews`, `otp_sessions`, and `config` tables.
2. **`002_add_order_and_menu_fields`**: Safely adds `customer_name`, `status`, `instructions` to `orders`, and `is_bestseller`, `spice_level` to `menu_items`.
3. **`003_add_performance_indexes`**: Generates B-tree indexes for fast filtering and dashboard statistics.
4. **`004_wal_mode_and_optimizations`**: Enables `PRAGMA journal_mode=WAL`, `synchronous=NORMAL`, and foreign keys.

### Migration CLI Commands

Navigate to `qr/backend`:
```bash
cd /Users/deepchauhan/Projects/QR/qr/backend
```

#### 1. Check Migration Status
Shows which migrations have been applied and which are pending:
```bash
python3 migrate.py status
```
*Sample output:*
```text
============================================================
Migration Version                   | Status     | Applied At
------------------------------------------------------------
001_initial_schema                  | APPLIED    | 2026-09-01T16:58:43Z
002_add_order_and_menu_fields       | APPLIED    | 2026-09-01T16:58:43Z
003_add_performance_indexes         | APPLIED    | 2026-09-01T16:58:43Z
004_wal_mode_and_optimizations      | APPLIED    | 2026-09-01T16:58:43Z
============================================================
```

#### 2. Apply All Pending Migrations
Applies any unapplied migrations in ascending sequential order:
```bash
python3 migrate.py up
# OR
python3 migrate.py migrate
```

#### 3. Verify Database Integrity
Executes SQLite PRAGMA checks, table row counts, and verifies custom indexes:
```bash
python3 migrate.py verify
```

#### 4. Seed Initial Data
Seeds default admin (`admin@restaurant.com` / `admin123`) and 8 curated Indian cuisine menu items if absent:
```bash
python3 migrate.py seed
```

#### 5. Reset Database (Fresh Start)
Drops existing database, runs all migrations from scratch, seeds default data, and verifies integrity:
```bash
python3 migrate.py reset --force
```

---

## 4. Step-by-Step Backend Setup & Run Guide

### Step 1: Navigate to Backend Directory

```bash
cd /Users/deepchauhan/Projects/QR/qr/backend
```

### Step 2: Virtual Environment & Dependencies

1. Create a Python 3 virtual environment:
   ```bash
   python3 -m venv venv
   ```

2. Activate the virtual environment:
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```

3. Install required packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

### Step 3: Environment Configuration (.env)

Copy the `.env.example` template:
```bash
cp .env.example .env
```

Configure your `.env` as required:
```ini
# Security key for Admin JWT tokens
SECRET_KEY=zaika-super-secret-jwt-key-2026

# Optional custom database path
# DB_PATH=/custom/path/zaika.db

# Razorpay credentials (Optional - leave blank for demo mode)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# SMS Gateways (Optional - leave blank for demo OTP mode)
FAST2SMS_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Step 4: Run Migrations & Seed Data

Ensure the database schema and default items are initialized:
```bash
python3 migrate.py up
python3 migrate.py seed
```

### Step 5: Start the FastAPI Server

#### Development Mode (with Live Hot Reloading)
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
or run directly via Python:
```bash
python3 main.py
```

The backend server is now live at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Interactive Documentation**: `http://localhost:8000/redoc`

---

## 5. Default Credentials & Demo Configurations

### Admin Panel Login
- **URL**: `http://localhost:3000/admin` (Frontend) or `http://localhost:8000/api/auth/login` (API)
- **Email**: `admin@restaurant.com`
- **Password**: `admin123`

### OTP Verification
- **Real SMS Mode**: If `FAST2SMS_API_KEY`, `TWILIO_ACCOUNT_SID`, or `MSG91_AUTH_KEY` is provided in `.env`, a real 4-digit OTP will be dispatched via SMS.
- **Demo Mode**: If no SMS gateway is configured:
  - The API response contains `demo_otp`.
  - The master code `1234` is also accepted for test phones.

---

## 6. API Endpoints & Testing with cURL

### 1. Health & Root Info
```bash
curl -X GET http://localhost:8000/
```

### 2. Fetch Public Menu
```bash
curl -X GET http://localhost:8000/api/menu
```

### 3. Send Customer OTP
```bash
curl -X POST http://localhost:8000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

### 4. Verify Customer OTP
```bash
curl -X POST http://localhost:8000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "1234"}'
```

### 5. Create Order (Cash on Delivery / Counter)
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": "Table 4",
    "customer_name": "Aarav Sharma",
    "phone": "9876543210",
    "payment_mode": "cod",
    "instructions": "Extra spicy, no onions",
    "items": [
      {"item_id": "ee063aa1-36a9-493d-8070-d31b83c3279b", "qty": 1},
      {"item_id": "1353136d-d00a-40fe-b277-72e10fb27e50", "qty": 2}
    ]
  }'
```

### 6. Admin Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@restaurant.com", "password": "admin123"}'
```

### 7. Fetch Live Orders (Admin Authenticated)
```bash
curl -X GET http://localhost:8000/api/admin/orders \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 8. Update Order Status
```bash
curl -X PATCH http://localhost:8000/api/admin/orders/<ORDER_ID>/status \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing"}'
```

---

## 7. Production Deployment Recommendations

### Using Systemd Service (Linux)

Create `/etc/systemd/system/zaika-backend.service`:
```ini
[Unit]
Description=Zaika QR Dine FastAPI Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/qr/backend
Environment="PATH=/var/www/qr/backend/venv/bin"
EnvironmentFile=/var/www/qr/backend/.env
ExecStart=/var/www/qr/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable zaika-backend
sudo systemctl start zaika-backend
```

### Nginx Reverse Proxy Configuration
```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias /var/www/qr/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 8. Troubleshooting & FAQ

### Q1: `OperationalError: database is locked`
**Cause**: Multiple processes writing simultaneously without WAL mode.  
**Resolution**: Run `python3 migrate.py up` which automatically turns on `PRAGMA journal_mode=WAL` and `PRAGMA synchronous=NORMAL`.

### Q2: Port 8000 is already in use
**Resolution**: Specify a different port:
```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### Q3: Uploaded images return 404
**Resolution**: Verify that the `uploads` directory exists inside `qr/backend/uploads` with read/write permissions:
```bash
mkdir -p uploads
chmod -R 755 uploads
```

---

*Zaika Restaurant QR Dine Platform &bull; Built with FastAPI & Modern Python.*
