# ClickMart

This is an e-commerce store for dry fruits, sarees and gift hampers. It delivers within Patna now and is built so it can expand later.

```
backend/   Express 5 + MongoDB (Mongoose) REST API
frontend/  Next.js 15 (App Router) storefront + admin panel, Tailwind CSS
```

## Quick start

### 1. Backend
```bash
cd backend
npm install
# Edit .env and set MONGO_URI, JWT_SECRET (and SMS keys when ready)
npm run seed      # creates the admin account + a demo catalogue
npm run dev       # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
# Edit .env.local and set BACKEND_URL, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
npm run dev       # http://localhost:3000
```
