# HMS — Deployment Guide
# Run these commands in order

## ─────────────────────────────────────────────────────
## STEP 1 · Set up Neon PostgreSQL (free, 5 min)
## ─────────────────────────────────────────────────────
# 1. Go to  https://neon.tech  → Sign up (GitHub login works)
# 2. Create project → name it "hms-db"
# 3. Copy the "Connection string (pooled)" — it looks like:
#    postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
# 4. Paste it below as DATABASE_URL


## ─────────────────────────────────────────────────────
## STEP 2 · Backend .env  (create this file)
## ─────────────────────────────────────────────────────
# File: apps/backend/.env

DATABASE_URL="postgresql://USER:PASS@HOST/DB?sslmode=require"   # ← paste Neon URL here
JWT_ACCESS_SECRET="hms_access_secret_change_me_in_prod_32chars"
JWT_REFRESH_SECRET="hms_refresh_secret_change_me_in_prod_32chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=production
CORS_ORIGIN="https://YOUR-FRONTEND.vercel.app"    # ← fill after Vercel deploy


## ─────────────────────────────────────────────────────
## STEP 3 · Install deps & migrate database
## ─────────────────────────────────────────────────────
cd apps/backend
npm install
npx prisma generate
npx prisma migrate deploy          # creates all tables
npx tsx prisma/seed.ts             # seeds admin + staff users + sample data


## ─────────────────────────────────────────────────────
## STEP 4 · Deploy Backend → Render (free tier)
## ─────────────────────────────────────────────────────
# 1. Go to https://render.com → New → Web Service
# 2. Connect your GitHub repo
# 3. Settings:
#      Root Directory : apps/backend
#      Build Command  : npm install && npx prisma generate && npm run build
#      Start Command  : node dist/app.js
#      Environment    : Node
# 4. Add ALL the env vars from Step 2 in the Render dashboard
# 5. Deploy → copy the URL (e.g. https://hms-backend.onrender.com)


## ─────────────────────────────────────────────────────
## STEP 5 · Frontend .env  (create this file)
## ─────────────────────────────────────────────────────
# File: apps/frontend/.env.production

VITE_API_URL="https://hms-backend.onrender.com/api"   # ← your Render URL


## ─────────────────────────────────────────────────────
## STEP 6 · Deploy Frontend → Vercel (free)
## ─────────────────────────────────────────────────────
# 1. Go to https://vercel.com → New Project → import your GitHub repo
# 2. Settings:
#      Framework Preset : Vite
#      Root Directory   : apps/frontend
#      Build Command    : npm run build
#      Output Directory : dist
# 3. Add Environment Variable:
#      VITE_API_URL = https://hms-backend.onrender.com/api
# 4. Deploy → copy the Vercel URL


## ─────────────────────────────────────────────────────
## STEP 7 · Update CORS on Render
## ─────────────────────────────────────────────────────
# In Render dashboard → your backend service → Environment
# Update:  CORS_ORIGIN = https://YOUR-APP.vercel.app
# Redeploy the backend


## ─────────────────────────────────────────────────────
## LOGIN CREDENTIALS (after seeding)
## ─────────────────────────────────────────────────────
# Admin  →  username: admin   password: Admin@123
# Staff  →  username: staff   password: Staff@123
