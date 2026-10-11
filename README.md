# AirScope — Environmental Intelligence Dashboard

An interactive, high-performance air quality monitoring and analytics dashboard powered by **React 19**, **Vite**, **Tailwind CSS v4**, and **Redis Cloud**.

Built to monitor, benchmark, and analyze air quality across 10 major Indian metropolitan hubs using over **88,340 verified hourly environmental observations** for the full year 2024.

---

## Features

- **Environmental Command Center**: Real-time KPIs for Average AQI, PM2.5, PM10, and active station coverage.
- **Dynamic Trend Visualizations**: Time-series charting for AQI and individual pollutants (PM2.5, PM10, NO₂, SO₂, CO, O₃).
- **Location Comparisons**: Inter-city AQI rankings (Delhi, Mumbai, Bengaluru, Ahmedabad, Chennai, Hyderabad, Kolkata, Lucknow, Patna, Pune).
- **Indian National AQI Distribution**: Breakdowns categorized according to Central Pollution Control Board (CPCB) standards (Good, Satisfactory, Moderate, Poor, Very Poor, Severe).
- **Analytics Explorer**: Statistical breakdowns (Mean, Median, Min, Max, Standard Deviation) and filtered CSV data exports.
- **Monitoring Hub Directory**: Network coverage directory with station-level metrics and latest timestamps.
- **Serverless Redis Architecture**: Sub-millisecond response times using Redis Cloud pipelined data structures and Vercel Serverless API routes.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide React, React Router 7.
- **Database**: [Redis Cloud](https://redis.io/cloud/) (in-memory data structures, sorted sets, and JSON document caches).
- **Serverless API**: Node.js API handlers ready for Vercel deployment (`/api/overview`, `/api/cities`, `/api/analytics`).
- **Data Ingestion**: Pipelined Python bulk uploader (`upload_to_redis.py`).

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/GHPRNV/Air-Quality-Dashboard.git
cd Air-Quality-Dashboard
```

### 2. Install dependencies
```bash
pnpm install
# or
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
REDIS_URL=redis://default:<your-password>@<your-redis-endpoint>:<port>
```

### 4. Run locally
```bash
pnpm run dev
# or
npm run dev
```
Open your browser at `http://localhost:8443` (or the port specified in terminal).

---

## Deploy to Vercel

1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/), click **Add New Project** and select this repository.
3. In **Project Settings -> Environment Variables**, add:
   - `REDIS_URL`: Your Redis Cloud database connection string.
4. Click **Deploy**. Vercel will build the Vite frontend and deploy the serverless functions in `/api/`.

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for full instructions.

---

## License
MIT
