# AirScope: Big Data-Driven Air Quality Monitoring & Analytics Platform

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Redis Cloud](https://img.shields.io/badge/Redis_Cloud-NoSQL_In--Memory-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/cloud/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless_API-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

---

## Academic Evaluation Mapping (100 Marks Breakdown)

This project has been structured according to the official **Mini-Project Evaluation Rubric**:

| Evaluation Component | Weightage | Addressed in Section | Highlights / Evidence |
| :--- | :---: | :--- | :--- |
| **1. Problem Definition & Objectives** | **10 Marks** | [Section 1](#1-problem-definition--objectives-10-marks) | Public health dilemma, IoT sensor volume, CPCB alignment, scalable objectives |
| **2. Dataset & Preprocessing** | **15 Marks** | [Section 2](#2-dataset--preprocessing-pipeline-15-marks) | 88,340 hourly observations, 10 metro hubs, anomaly detection, null imputation, timestamp normalization |
| **3. Big Database Implementation** | **20 Marks** | [Section 3](#3-big-database-implementation--redis-cloud-20-marks) | Redis Cloud NoSQL, batch pipelining (1.9k ops/sec), memory optimization (12.76 MB footprint), sorted sets |
| **4. Analytics & Results** | **20 Marks** | [Section 4](#4-analytics--statistical-results-20-marks) | CPCB National AQI sub-index formulation, parametric stats (mean, median, variance, std dev), city rankings |
| **5. Visualization** | **10 Marks** | [Section 5](#5-visualization--frontend-ux-10-marks) | Interactive Recharts time-series, location comparison bars, AQI category donut, responsive dark UI |
| **6. Report & Methodology** | **10 Marks** | [Section 6](#6-project-report--methodology-10-marks) | Architectural blueprint, CPCB NAAQS standards, time handling, zero-data-loss policy |
| **7. Demo & Viva Preparation** | **15 Marks** | [Section 7](#7-demo--viva-preparation-guide-15-marks) | 10 examiner questions & answers, live demo script, performance benchmarks |
| **Total** | **100 Marks** | Full Document | End-to-end full-stack Big Data engineering implementation |

---

## High-Level System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    DATA SOURCE LAYER                                  |
|   india_air_quality_2024_hourly.csv (88,340 Hourly Records across 10 Metropolitan Hubs)|
+---------------------------------------------------------------------------------------+
                                           |
                                           v  [Pipeline Stream: 1,900 ops/sec]
+---------------------------------------------------------------------------------------+
|                             INGESTION & PREPROCESSING (Python)                        |
|   • upload_to_redis.py  • Anomaly validation  • CPCB sub-index computation            |
|   • Chronological partitioning  • Memory compression (Hashes -> Daily Buckets)        |
+---------------------------------------------------------------------------------------+
                                           |
                                           v  [TCP / TLS]
+---------------------------------------------------------------------------------------+
|                              BIG DATABASE LAYER (Redis Cloud)                         |
|   • aqi:daily:<city>:<YYYY-MM-DD>  -> Daily Aggregates + 24 Hourly JSON Readings      |
|   • aqi:dates:<city>               -> Sorted Set (Indexed by YYYYMMDD Epoch Score)    |
|   • aqi:latest:<city>              -> Real-Time Sensor Snapshot (Hashes)              |
|   • aqi:summary:<city>             -> Annual Mean Metrics & Geolocation Coordinates   |
|   • aqi:cities                     -> Monitored Hub Index Set                         |
+---------------------------------------------------------------------------------------+
                                           |
                                           v  [ioredis Connection Pool]
+---------------------------------------------------------------------------------------+
|                           SERVERLESS BACKEND LAYER (Vercel Node.js)                    |
|   • /api/overview.js   -> Instant KPI aggregation, dynamic trend & city ranking       |
|   • /api/cities.js     -> Station network directory & live coordinates               |
|   • /api/analytics.js  -> Statistical distributions (Mean/Median/StdDev) & CSV stream |
+---------------------------------------------------------------------------------------+
                                           |
                                           v  [JSON via HTTP/REST]
+---------------------------------------------------------------------------------------+
|                            PRESENTATION LAYER (React 19 + Vite)                       |
|   • Command Center Dashboard (TrendChart, LocationBars, DistributionChart)             |
|   • Analytics Explorer (Statistical indicators, pollutant toggles, CSV exporter)     |
|   • Monitoring Directory (Hub table, latest timestamps, geolocation cards)            |
+---------------------------------------------------------------------------------------+
```

---

## 1. Problem Definition & Objectives (10 Marks)

### Problem Statement
Rapid urbanization and industrial emissions across Indian metropolitan hubs have led to severe air pollution challenges. Environmental monitoring agencies like the **Central Pollution Control Board (CPCB)** generate massive streams of continuous sensor telemetry (particulate matter $\text{PM}_{2.5}$, $\text{PM}_{10}$, and toxic gases $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, $\text{O}_3$). However, legacy relational database systems (RDBMS) struggle with:
1. **High Ingestion Bottlenecks**: Writing thousands of sensor observations per minute introduces transaction locks and disk I/O bottlenecks.
2. **Slow Historical Aggregations**: Querying large multi-year time-series tables requires expensive table scans, causing dashboard latency.
3. **Complex Telemetry Transformations**: Raw pollutant concentrations cannot simply be averaged; they require dynamic breakpoint sub-indexing to compute the true **Indian National Air Quality Index (NAQI)**.

### Objectives of the Project
- **Scalable Big Data Architecture**: Implement an in-memory NoSQL database (**Redis Cloud**) capable of processing telemetry streams at sub-millisecond retrieval speeds.
- **Holistic Dataset Coverage**: Store, clean, and analyze **88,340 hourly observations** across 10 major Indian urban centers for the entire year 2024.
- **Standardized Environmental Intelligence**: Compute official CPCB sub-indices and categorize air quality into the 6 Indian NAQI bands (*Good, Satisfactory, Moderate, Poor, Very Poor, Severe*).
- **Interactive Multi-Dimensional Visualizations**: Provide policy makers, researchers, and citizens with an interactive dashboard offering real-time filtering by city, date ranges (10 days, 30 days, annual), and individual pollutants.
- **Production-Ready Serverless Deployment**: Deploy the architecture globally on Vercel with serverless API integration.

---

## 2. Dataset & Preprocessing Pipeline (15 Marks)

### Dataset Profile
- **Filename**: `india_air_quality_2024_hourly.csv`
- **Total Rows**: `88,340` hourly observations
- **Temporal Range**: January 1, 2024 to December 31, 2024 (8,784 hours per city)
- **Monitored Cities (10)**:
  1. **Ahmedabad** (8,829 records) — Lat: 23.02, Lon: 72.57
  2. **Bengaluru** (8,851 records) — Lat: 12.97, Lon: 77.59
  3. **Chennai** (8,828 records) — Lat: 13.08, Lon: 80.27
  4. **Delhi** (8,844 records) — Lat: 28.61, Lon: 77.21
  5. **Hyderabad** (8,829 records) — Lat: 17.38, Lon: 78.48
  6. **Kolkata** (8,831 records) — Lat: 22.57, Lon: 88.36
  7. **Lucknow** (8,839 records) — Lat: 26.84, Lon: 80.94
  8. **Mumbai** (8,825 records) — Lat: 19.07, Lon: 72.87
  9. **Patna** (8,837 records) — Lat: 25.59, Lon: 85.13
  10. **Pune** (8,827 records) — Lat: 18.52, Lon: 73.85

### Sensor Feature Schema

| Attribute | Data Type | Units | Physical Significance |
| :--- | :---: | :---: | :--- |
| `datetime` | String (ISO) | `YYYY-MM-DD HH:mm:ss` | Time of telemetry observation |
| `city` | String | Categorical | City/monitoring region |
| `latitude`, `longitude` | Float | Degrees | Geolocation coordinates |
| `pm25` | Float | $\mu\text{g/m}^3$ | Fine Particulate Matter ($<2.5\mu\text{m}$) |
| `pm10` | Float | $\mu\text{g/m}^3$ | Coarse Particulate Matter ($<10\mu\text{m}$) |
| `no2` | Float | $\mu\text{g/m}^3$ | Nitrogen Dioxide |
| `so2` | Float | $\mu\text{g/m}^3$ | Sulfur Dioxide |
| `co` | Float | $\text{mg/m}^3$ | Carbon Monoxide |
| `o3` | Float | $\mu\text{g/m}^3$ | Ground-level Ozone |
| `temperature` | Float | $^\circ\text{C}$ | Ambient Temperature |
| `humidity` | Float | $\%$ | Relative Humidity |
| `wind_speed` | Float | $\text{m/s}$ | Wind velocity |

### Preprocessing & Transformation Steps
Executed via `upload_to_redis.py`:
1. **Timestamp Normalization & Epoch Transformation**:
   $$\text{datetime} \longrightarrow \text{Epoch Timestamp} \ (T_{\text{epoch}} = \text{UNIX timestamp})$$
   Used as sorted set scores for range queries.
2. **Missing & Null Handling**:
   Sensors occasionally drop out; missing fields are converted to `null` to avoid distorting arithmetic means (zero-imputation is strictly avoided as $0\ \mu\text{g/m}^3$ represents perfect cleanliness).
3. **Outlier & Physical Boundary Checks**:
   - Concentrations $< 0$ are discarded as physical sensor noise.
   - Latitude validated within $[-90, 90]$, Longitude within $[-180, 180]$.
4. **Duplicate Deduplication**:
   Composite key validation: $(\text{City} + \text{Datetime})$ ensures no two observations occupy the same temporal slot.

---

## 3. Big Database Implementation – Redis Cloud (20 Marks)

### Why NoSQL In-Memory Database (Redis)?
Traditional disk-backed relational databases (MySQL, PostgreSQL) require heavy B-Tree disk index lookups. For a time-series dashboard serving simultaneous queries, **Redis Cloud** provides:
- **Sub-millisecond query execution** ($< 2\text{ms}$ latency).
- **In-memory data structures** specifically optimized for time-series range lookups (Sorted Sets).
- **High throughput** with zero locking overhead.

### Overcoming the Free-Tier Big Data Challenge (Memory Optimization)
- **The Challenge**: Storing 88,340 separate Redis Hashes with 14 field keys each requires $\approx 35\text{ MB}$, exceeding the **30 MB** Redis Cloud Free Tier limit (`OutOfMemoryError`).
- **The Solution (Hierarchical Bucketing)**:
  Instead of 88,340 individual keys, we partitioned the dataset into **3,660 City-Day Buckets**:
  $$\text{Key Pattern: } \texttt{aqi:daily:<city>:<YYYY-MM-DD>}$$
  Each bucket contains pre-calculated daily averages + the full 24 hourly readings serialized in compact JSON.
- **Results**:
  - Memory usage decreased from **$35\text{ MB} \longrightarrow \mathbf{12.76\text{ MB}}$** ($63\%$ reduction).
  - Storage headroom: $> 17\text{ MB}$ ($55\%$) remains available.
  - Query round-trips: A 10-day range query requires just **1 `MGET` request** instead of 240 round trips.

### Redis Key Schema Architecture

```
+-----------------------------------+--------------------------------------------------------------+
| Key Pattern                       | Redis Type & Payload Description                             |
+-----------------------------------+--------------------------------------------------------------+
| aqi:daily:<city>:<date>           | STRING (JSON) -> Daily Averages (PM2.5, PM10, AQI) + 24 hrs   |
| aqi:dates:<city>                  | ZSET -> Dates scored by YYYYMMDD integer for fast ZRANGE     |
| aqi:latest:<city>                 | STRING (JSON) -> Most recent hourly snapshot                 |
| aqi:summary:<city>                | STRING (JSON) -> Annual mean concentrations & geo-coordinates|
| aqi:cities                        | SET -> All 10 unique monitored cities                        |
| aqi:total_records                 | STRING -> Total observations count (88,340)                  |
+-----------------------------------+--------------------------------------------------------------+
```

### High-Speed Batch Pipeline Ingestion
The ingestion script `upload_to_redis.py` uses Redis pipelining with batch sizes of 500:
$$\text{Throughput: } \mathbf{1,901\text{ operations/sec}} \quad \vert \quad \text{Total Upload Time: } \mathbf{11.92\text{ seconds}}$$

---

## 4. Analytics & Statistical Results (20 Marks)

### 1. Indian National AQI (NAQI) Formula Implementation
According to CPCB standards, the sub-index $I_p$ for pollutant concentration $C_p$ is calculated using linear interpolation across standard breakpoints:

$$I_p = I_{\text{low}} + \frac{I_{\text{high}} - I_{\text{low}}}{B_{\text{high}} - B_{\text{low}}} \times (C_p - B_{\text{low}})$$

#### CPCB $\text{PM}_{2.5}$ Breakpoint Matrix:

| Category | Concentration Range ($B_{\text{low}} - B_{\text{high}}$) | Sub-Index Range ($I_{\text{low}} - I_{\text{high}}$) | Color Indicator |
| :--- | :---: | :---: | :---: |
| **Good** | $0 - 30\ \mu\text{g/m}^3$ | $0 - 50$ | `#2dd4bf` (Teal) |
| **Satisfactory** | $31 - 60\ \mu\text{g/m}^3$ | $51 - 100$ | `#84cc16` (Green) |
| **Moderate** | $61 - 90\ \mu\text{g/m}^3$ | $101 - 200$ | `#facc15` (Yellow) |
| **Poor** | $91 - 120\ \mu\text{g/m}^3$ | $201 - 300$ | `#fb923c` (Orange) |
| **Very Poor** | $121 - 250\ \mu\text{g/m}^3$ | $301 - 400$ | `#f87171` (Red) |
| **Severe** | $> 250\ \mu\text{g/m}^3$ | $401 - 500$ | `#c084fc` (Purple) |

### 2. Parametric Statistical Measures (Analytics Engine)
Our `/api/analytics` endpoint dynamically computes:

- **Arithmetic Mean ($\mu$)**:
  $$\mu = \frac{1}{N} \sum_{i=1}^{N} x_i$$
- **Median**: Value separating the higher half from the lower half of sorted observations.
- **Population Variance ($\sigma^2$)**:
  $$\sigma^2 = \frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^2$$
- **Standard Deviation ($\sigma$)**:
  $$\sigma = \sqrt{\sigma^2}$$
- **Extremum (Min / Max)**: Minimum and maximum recorded concentrations within the query window.

### 3. Key Analytical Findings (2024 Dataset)
- **Most Polluted Metropolitan Hub**: **Delhi** recorded the highest annual average AQI ($\approx 226$) and mean $\text{PM}_{2.5}$ concentration ($110.4\ \mu\text{g/m}^3$), driven by winter meteorological stagnation and stubble burning periods.
- **Cleanest Metropolitan Hub**: **Bengaluru** and **Chennai** maintained the lowest average AQI levels, benefiting from coastal air circulation and geographical elevation.
- **Peak Pollution Window**: November–December across North Indian hubs (Delhi, Patna, Lucknow) showed spikes exceeding $\text{AQI } 350$ ("Very Poor" to "Severe").

---

## 5. Visualization & Frontend UX (10 Marks)

### Design Philosophy
Built with **Tailwind CSS v4** and modern glassmorphism in an environmental dark mode aesthetic (`#07111e` background, `#2dd4bf` teal accents).

### Core Visual Components
1. **Time-Series Multi-Pollutant Trend Chart (`TrendChart`)**:
   - Interactive SVG charting using **Recharts**.
   - Supports multi-series toggles for $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, and AQI.
   - Custom Cartesian grid with tooltips displaying Indian date formats (`15 Jan 2024`).
2. **Location Benchmark Bars (`LocationBars`)**:
   - Horizontal ranking bar chart color-coded by the active CPCB category.
   - Interactive bar selection updates the entire dashboard view.
3. **CPCB Category Distribution Donut (`DistributionChart`)**:
   - Proportion of days categorized into Good, Satisfactory, Moderate, Poor, Very Poor, and Severe.
4. **KPI Summary Cards**:
   - High-contrast visual metric tiles with trend indicators, units ($\mu\text{g/m}^3$), and station counters.
5. **Analytics Explorer**:
   - Filterable statistical explorer with live **CSV Exporter** that generates browser-downloadable filtered extracts.

---

## 6. Project Report & Methodology (10 Marks)

### Data Provenance & Reliability
Data structures comply with National Ambient Air Quality Standards (NAAQS) established under the Air (Prevention and Control of Pollution) Act, 1981.

### Policy on Edge Cases
1. **Missing Telemetry**: Sensor dropouts are flagged as `null`. Calculations use valid observations count $n_{\text{valid}}$ rather than $N_{\text{total}}$, preventing statistical bias.
2. **Timezone Handling**: Observation timestamps are normalized to UTC for database storage and formatted in Indian Standard Time (IST, UTC+05:30) for presentation.
3. **Data Immutability**: Raw sensor records are treated as append-only time series.

---

## 7. Demo & Viva Preparation Guide (15 Marks)

This section helps you answer questions during the project evaluation and viva examination.

### Walkthrough Script for the Demonstration

1. **Introduction (30 seconds)**:
   > *"Good morning/afternoon, Sir/Madam. My project is AirScope, a Big Data-driven environmental analytics platform. It ingests 88,340 hourly air quality observations across 10 Indian metropolitan cities for the entire year 2024, indexes them into a high-performance Redis Cloud NoSQL database, and visualizes them through an interactive React dashboard deployed on Vercel."*

2. **Database Demonstration (1 minute)**:
   > *"Show Redis Cloud Console: Notice that all 88,340 observations are indexed across 3,693 keys using only 12.76 MB of memory. By using daily buckets and sorted sets instead of uncompressed rows, we achieved a 63% memory reduction and sub-millisecond retrieval."*

3. **Dashboard Demonstration (1 minute)**:
   > *"Switch city dropdown to Delhi, then Bengaluru: Demonstrate how the KPIs, trend lines, and AQI category donut chart update instantly. Point out how Delhi's average AQI sits in the Poor/Very Poor band, whereas Bengaluru is Satisfactory."*

4. **Analytics & Export Demonstration (30 seconds)**:
   > *"Navigate to Analytics Explorer: Show the computed Mean, Median, Variance, and Standard Deviation. Click 'Export CSV' to demonstrate real-time filtered CSV generation from the database."*

---

### Top 10 Viva Questions & Model Answers

#### Q1: Why did you choose Redis instead of MongoDB or MySQL?
> **Answer**: MySQL relies on disk I/O and B-Tree indexes, which slow down when querying continuous time-series sensor data. While MongoDB is document-oriented, Redis is an in-memory key-value data-structure store with sub-millisecond latency. Redis sorted sets allow us to fetch date-range queries in $O(\log N + M)$ time directly from RAM without disk reads.

#### Q2: How did you fit 88,340 rows into the 30 MB free-tier limit of Redis Cloud?
> **Answer**: Storing 88,340 individual hashes with 14 field names caused hash dictionary overhead that exceeded 30 MB. We solved this with **Hierarchical Daily Bucketing**: grouping 24 hourly readings per city into a single serialized JSON key `aqi:daily:<city>:<date>` and indexing dates in a sorted set `aqi:dates:<city>`. This reduced the key count to 3,660 and the memory footprint to just 12.76 MB.

#### Q3: How is the Air Quality Index (AQI) calculated in your project?
> **Answer**: We implemented the official Central Pollution Control Board (CPCB) linear interpolation breakpoint formula for $\text{PM}_{2.5}$. Concentrations are mapped into standard ranges (0–30 for Good, 31–60 for Satisfactory, up to $>250$ for Severe) using mathematical interpolation.

#### Q4: What is the significance of Standard Deviation in your Analytics tab?
> **Answer**: Standard deviation measures the volatility of air pollution. A high standard deviation in Delhi indicates extreme seasonal fluctuations (severe spikes in winter versus moderate monsoon levels), whereas a low standard deviation indicates stable year-round air quality.

#### Q5: What is Redis Pipelining and why did you use it during data upload?
> **Answer**: In normal Redis execution, each command requires a network round-trip (RTT). Sending 88,340 commands individually across the internet would take over an hour. Pipelining buffers commands in batches of 500 and sends them together, achieving a throughput of 1,901 operations/second and completing the upload in under 12 seconds.

#### Q6: How does the serverless architecture work on Vercel?
> **Answer**: Files placed in the `/api` directory (`overview.js`, `cities.js`, `analytics.js`) are executed on-demand as serverless Node.js functions. They connect to Redis Cloud via cached connection pooling (`ioredis`), execute the query, and return JSON to the React frontend.

#### Q7: How do you handle missing sensor values?
> **Answer**: Sensor dropouts are maintained as `null` rather than imputed with `0`. When calculating averages, the denominator only counts valid, non-null observations. Setting missing values to 0 would artificially lower the calculated pollution index.

#### Q8: What frontend visualization libraries did you use?
> **Answer**: We used **Recharts**, a composable SVG charting library built on React components and D3 math. It supports animated responsive rendering, customized Cartesian grids, and dynamic tooltips.

#### Q9: What security measures did you implement for database credentials?
> **Answer**: Database credentials and passwords are stored in environment variables (`REDIS_URL`) and accessed via `process.env`. The `.env` file is explicitly ignored in `.gitignore`, ensuring secrets are never leaked to the public GitHub repository.

#### Q10: What is the difference between $\text{PM}_{2.5}$ and $\text{PM}_{10}$?
> **Answer**: $\text{PM}_{10}$ refers to inhalable coarse particulate matter with a diameter under 10 micrometers (like dust and pollen). $\text{PM}_{2.5}$ refers to fine particles under 2.5 micrometers (from combustion, vehicle exhaust, and industrial emissions), which can penetrate deep into the lungs and bloodstream, making it a critical public health indicator.

---

## 8. Technology Stack Summary

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons | Responsive, accessible interface |
| **Data Visualization** | Recharts (D3-powered SVG components) | Interactive time-series and distributions |
| **Build & Bundler** | Vite 8, oxfmt | Sub-second HMR and production bundling |
| **Database** | Redis Cloud (Redis 8.6 In-Memory NoSQL) | Telemetry storage, sorted sets, JSON |
| **Backend / API** | Vercel Serverless Functions (Node.js runtime, `ioredis`) | REST API layer with connection pooling |
| **ETL & Ingestion** | Python 3.13, `redis-py`, `csv` module | Data cleaning, sub-index math, pipelining |
| **Deployment** | Vercel Global Edge Network | Global CDN hosting with HTTPS |

---

## 9. Local Installation & Development

### Prerequisites
- Node.js (v20+ recommended)
- pnpm (or npm / yarn)
- Python 3.10+ (for running the ingestion script)

### Step 1: Clone the Repository
```bash
git clone https://github.com/GHPRNV/Air-Quality-Dashboard.git
cd Air-Quality-Dashboard
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```env
REDIS_URL=redis://default:<your-password>@<your-host>:<port>
```

### Step 4: Run Development Server
```bash
pnpm run dev
```
Open your browser at `http://localhost:8443` (or the port specified in terminal).

### Step 5: (Optional) Re-run Data Ingestion
If you ever want to re-seed your Redis Cloud database:
```bash
pip install redis
python upload_to_redis.py
```

---

## 10. Production Deployment to Vercel

1. Import the repository into your **[Vercel Dashboard](https://vercel.com/)**.
2. Framework preset will be auto-detected as **Vite**.
3. In **Environment Variables**, add:
   - `REDIS_URL` = `redis://default:<password>@<host>:<port>`
4. Click **Deploy**. Your app is live at `https://<your-project>.vercel.app`.

---

## Authors & Acknowledgments

- **Developer**: Pranav M ([@GHPRNV](https://github.com/GHPRNV))
- **Repository**: [GHPRNV/Air-Quality-Dashboard](https://github.com/GHPRNV/Air-Quality-Dashboard)
- **Data Source**: Central Pollution Control Board (CPCB) Historical Telemetry Standards
- **License**: MIT License
