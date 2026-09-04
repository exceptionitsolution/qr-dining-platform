# 🚀 Full-Stack Deployment, Client Onboarding & Handover Guide

This comprehensive guide covers the step-by-step process for deploying the QR Dining Platform (FastAPI Backend + React Frontend + SQLite Database), connecting custom domains, and completing a full client handover.

---

## 🏗️ Architecture Overview

The system uses a high-performance, decoupled architecture:
- **Frontend**: React + Vite hosted on **Vercel** (Global Edge CDN for fast mobile QR code menu loading).
- **Backend & Database**: Python FastAPI + SQLite + Image Uploads hosted on **Render** (Continuous server running API & serving dish photos).
- **Domain**: Custom branded restaurant domain linked directly to Vercel and Render.

```
📱 Customer / Staff (Mobile / Tablet / Desktop)
                   │
                   ▼
       🌐 Custom Restaurant Domain
         (e.g., menu.restaurant.com)
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
  ⚡ Vercel               🚀 Render
 (React Frontend)     (FastAPI + SQLite DB + Photos)
```

---

## 📋 PART 1: Prerequisites & Code Preparation

### 1. Initialize Git Repository
Run the following commands in the project root folder:
```bash
cd /Users/deepchauhan/Projects/QR
git init
git add .
git commit -m "Production release for QR Dining System"
git branch -M main
```

### 2. Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Connect and push your code:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

## 🚀 PART 2: Deploying the Backend on Render

Render hosts the FastAPI backend, runs SQLite queries, and stores all uploaded dish photos.

### Step 1: Create a Web Service
1. Log in to [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Select your GitHub repository.

### Step 2: Configure Service Settings
- **Name**: `restaurant-backend` (or client name, e.g., `zaika-backend`)
- **Region**: Select the region closest to the restaurant location (e.g., Singapore/Frankfurt/Oregon)
- **Branch**: `main`
- **Root Directory**: `qr/backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 3: Add Environment Variables
In the **Environment Variables** section on Render, add:
| Key | Example Value | Description |
| :--- | :--- | :--- |
| `SECRET_KEY` | `production_jwt_secret_hash_2026` | Random secure string for auth tokens |
| `ADMIN_EMAIL` | `admin@restaurant.com` | Default admin login email |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` | Default admin login password |
| `PYTHON_VERSION` | `3.11.0` | Python runtime version |

### Step 4: Deploy & Copy Backend URL
1. Click **Create Web Service**.
2. Wait 2–3 minutes for the build and deployment to complete.
3. Once the status turns **Live**, copy your service URL:
   `https://restaurant-backend.onrender.com`

---

## ⚡ PART 3: Deploying the Frontend on Vercel

Vercel builds the React application and delivers it globally across edge servers.

### Step 1: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.

### Step 2: Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and choose `qr/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables
In the **Environment Variables** section on Vercel, add:
| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://restaurant-backend.onrender.com/api` | Your live Render backend URL + `/api` |

### Step 4: Deploy & Verify
1. Click **Deploy**.
2. Vercel will build the frontend and provide a live URL:
   `https://restaurant-menu.vercel.app`
3. Open the URL on your mobile phone or browser to test:
   - Menu browsing, category filtering, search, and veg/non-veg toggles.
   - Admin Login at `/admin` using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` set in Render.
   - Adding a new dish with a photo upload.
   - Placing a test order and viewing the live KDS / Order Management dashboard.

---

## 🌐 PART 4: Connecting a Custom Domain

When you or the client has a custom domain (e.g., `restaurantdining.com` or `menu.restaurant.com`):

### 1. Point Domain to Frontend (Vercel)
1. In Vercel Dashboard → Your Project → **Settings** → **Domains**.
2. Enter the domain name (e.g., `menu.restaurant.com` or `restaurantdining.com`).
3. Vercel will show the required DNS record:
   - **Type**: `CNAME`
   - **Name**: `menu` (or `@` for root domain)
   - **Value**: `cname.vercel-dns.com` (or `76.76.21.21` for A record)
4. Add this record in the domain provider's DNS panel (GoDaddy, Namecheap, Hostinger, Cloudflare, etc.).
5. Vercel automatically generates a free SSL certificate (`https://`).

### 2. (Optional) Custom API Subdomain
To have a branded API URL (e.g., `api.restaurant.com`):
1. In Render Dashboard → Your Backend Service → **Settings** → **Custom Domains**.
2. Add `api.restaurant.com`.
3. Add the `CNAME` record in the DNS panel pointing to the Render onrender.com host.
4. Update `VITE_API_URL` in Vercel environment variables to `https://api.restaurant.com/api`.

---

## 🤝 PART 5: Client Handover & Onboarding Checklist

When handing over the deployed product to a restaurant owner:

### 1. Account Setup & Ownership Transfer
- [ ] Create domain account under the client's business email.
- [ ] Set up hosting accounts (Vercel & Render) under the client's email (or invite their email as Admin/Owner).
- [ ] Ensure billing/credit card details are set directly by the client for any future domain renewals.

### 2. Deliverables Package to Client
Provide the restaurant owner with a branded document containing:
- **Customer Menu URL**: `https://menu.restaurant.com` (or Vercel URL)
- **Admin Dashboard URL**: `https://menu.restaurant.com/admin`
- **Default Admin Login**:
  - Email: `admin@restaurant.com`
  - Temporary Password: `[Provided securely]`
- **Table QR Codes**: High-resolution generated QR codes for Table 1 to Table N ready for printing on table stands/acrylic holders.
- **Account Logins**: Domain registrar login & Hosting logins.

### 3. Client Onboarding Session (10–15 Minutes)
- [ ] Show how to log in to `/admin`.
- [ ] Demonstrate how to add/edit menu items, upload photos, change prices, and toggle out-of-stock items.
- [ ] Demonstrate how incoming orders appear in real-time in the Live Orders dashboard.
- [ ] Advise the owner to change their admin password after first login in the Profile/Security section.

---

## 💾 PART 6: Database Backups & Maintenance

### Creating Backups
The SQLite database file (`zaika.db`) stores all menu items, categories, and orders.
To download a local backup:
1. Use Render Shell or SFTP / CLI to download `zaika.db`.
2. Keep a timestamped copy: `backup_zaika_YYYY_MM_DD.db`.

### Resetting or Seeding Menu Data
If the client wants sample data re-populated:
```bash
python migrate.py --seed
```
To check migration status:
```bash
python migrate.py --status
```
