# Zaika QR Dine - Backend Service

FastAPI REST backend with SQLite persistence, OTP verification, live order tracking, and admin dashboard APIs.

## 🚀 Quick Start

```bash
# 1. Enter directory
cd qr/backend

# 2. Setup virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Copy environment configuration
cp .env.example .env

# 5. Run migrations and seed data
python3 migrate.py up
python3 migrate.py seed

# 6. Start development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 🛠️ Migration CLI Tools

- `python3 migrate.py status` - View applied and pending migration status
- `python3 migrate.py up` - Apply all pending migrations
- `python3 migrate.py verify` - Verify database integrity & schema
- `python3 migrate.py seed` - Seed initial admin and menu items
- `python3 migrate.py reset --force` - Cleanly reset and reinitialize database

For the full detailed documentation, check [MIGRATION_AND_BACKEND_GUIDE.md](../../MIGRATION_AND_BACKEND_GUIDE.md).
