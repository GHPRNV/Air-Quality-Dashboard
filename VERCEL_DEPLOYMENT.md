# Deploying AirScope to Vercel

Your AirScope Air Quality Dashboard is now fully prepared and configured for 1-click deployment on Vercel with serverless API integration to your Redis Cloud database.

---

## 1. Prerequisites
- A [Vercel](https://vercel.com/) account
- A GitHub repository with this code pushed

---

## 2. Steps to Deploy on Vercel

### Step 1: Import Repository
1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **"Add New..."** -> **"Project"**.
3. Select your GitHub repository for this project.

### Step 2: Configure Project Settings
Vercel will automatically detect the settings:
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `pnpm run build` (or `npm run build`)
- **Output Directory**: `dist`

### Step 3: Add Redis Cloud Environment Variable (Critical)
Before clicking deploy, expand the **Environment Variables** section and add:
- **Key**: `REDIS_URL`
- **Value**: `redis://default:eF8JUK1kZCWhvD3sLsGr0iakDNB0ik7S@scale-rabbit-flight-14618.db.redis.io:18455`

### Step 4: Click "Deploy"
1. Click **Deploy**.
2. Within ~30 seconds, Vercel will build the frontend and deploy the serverless functions in `/api/`.
3. Your live application will be available at:
   `https://<your-project-name>.vercel.app`

---

## 3. Architecture on Vercel
- **Frontend SPA**: Vite-compiled static bundle hosted on Vercel Global Edge Network.
- **Serverless API Routes**:
  - `GET /api/overview` — Computes KPIs, trends, and rankings from Redis Cloud.
  - `GET /api/cities` — Returns station metrics and latest readings across all 10 cities.
  - `GET /api/analytics` — Statistical calculations and CSV export data.
- **Database**: Redis Cloud hosted on `scale-rabbit-flight-14618.db.redis.io:18455`.
