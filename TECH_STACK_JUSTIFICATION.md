# Big Data Technologies Justification & Architecture Rationale

## Academic Review Document
**Course**: Big Data Technologies & Advanced Data Analytics  
**Project**: AirScope — Air Quality Intelligence Platform  
**Repository**: [https://github.com/GHPRNV/Air-Quality-Dashboard](https://github.com/GHPRNV/Air-Quality-Dashboard)  

---

## 1. Keyword Usage Matrix

| Keyword | Used in Project? | Technical Role & Implementation Evidence |
| :--- | :---: | :--- |
| **Big Data** | **YES** | Handled high-velocity telemetry (**88,340 hourly observations** across 10 metropolitan hubs), batch pipeline ingestion at **1,901 operations/sec**, and memory compression to overcome cloud RAM limits. |
| **Data Analytics** | **YES** | Implemented parametric statistical modeling (**Mean, Median, Variance, Standard Deviation, Min, Max**), regional pollution rankings, and the official **CPCB National Air Quality Index (NAQI)** breakpoint algorithm. |
| **Hadoop** | **NO** | Replaced with **Redis Cloud (NoSQL In-Memory Database)** to achieve sub-millisecond retrieval rather than disk-bound MapReduce batch processing. |
| **HDFS** | **NO** | Replaced with **Redis In-Memory Key-Value & Sorted Sets (`ZSET`)** instead of the Hadoop Distributed File System. |
| **Apache Spark / PySpark** | **NO** | Replaced with a lightweight **Python Ingestion Pipeline (`upload_to_redis.py`)** and **Vercel Serverless Node.js Microservices** rather than maintaining an idle distributed Spark cluster. |

---

## 2. Architectural Comparison: Redis Cloud vs. Hadoop/Spark

```
+---------------------------------------------------------------------------------------------------+
| COMPARISON DIMENSION    | APACHE HADOOP / SPARK (BATCH LAYER)   | REDIS CLOUD (SPEED / SERVING LAYER)     |
+-------------------------+---------------------------------------+-----------------------------------------+
| Primary Storage Medium  | Hard Disk Drives / SSDs (HDFS)        | In-Memory RAM (High-Density RAM)        |
| Query Latency           | 15 to 45 seconds (JVM/Cluster spin-up)| 1.8 to 3.2 milliseconds (Sub-millisecond)|
| Target Workload         | Offline historical batch analytics    | Real-Time Operational Telemetry Serving |
| Resource Cost           | High (Requires multi-node cluster VMs)| Free-Tier Serverless / Elastic Instance |
| Client Interactivity    | Asynchronous batch exports            | Sub-second interactive dashboard charts |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. How to Answer Your Teacher / Examiner (Model Viva Script)

### Question:
> *"Why did you use Redis Cloud instead of Apache Hadoop, HDFS, or Apache Spark / PySpark?"*

### Your Model Answer:
> *"Sir/Madam, **Apache Hadoop/HDFS and Apache Spark are distributed batch-processing frameworks** designed for multi-terabyte to petabyte offline transformations on distributed disk clusters. They introduce high initialization latency—often taking 15 to 30 seconds just to spin up a JVM cluster context, schedule executors, or execute a MapReduce job.*
>
> *In contrast, our project is an **interactive, operational real-time dashboard** where users select cities and date ranges and expect instant updates.*
>
> *According to standard **Big Data Lambda and Kappa architectures**, operational dashboards rely on an **In-Memory Speed/Serving Layer**. By selecting **Redis Cloud**, we store our 88,340 telemetry observations in RAM, utilizing **Sorted Sets ($O(\log N + M)$ range retrieval)** and **Hierarchical JSON Buckets**. This provides **sub-millisecond (< 3 ms) query responses**, which is impossible with disk-based Hadoop or batch Spark jobs."*

---

## 4. Summary of Actual Tech Keywords Used in This Project

- **Big Data Engineering**: Ingestion velocity ($1,901\text{ ops/sec}$), volume ($88,340\text{ hourly records}$), and memory compression ($63\%$ reduction).
- **Data Analytics**: Parametric statistics ($\mu, \text{median}, \sigma^2, \sigma, \text{min}, \text{max}$) and time-series aggregation.
- **In-Memory Computing**: Zero-disk RAM data retrieval with $<3\text{ ms}$ latency.
- **Redis Cloud NoSQL**: Managed database utilizing Strings, JSON documents, Sets, and Sorted Sets (`ZSET`).
- **Time-Series Telemetry**: Continuous environmental IoT sensor measurements across 10 metropolitan hubs for 2024.
- **CPCB NAQI Algorithm**: Mathematical linear interpolation sub-index modeling per Central Pollution Control Board standards.
- **Serverless Architecture**: On-demand Node.js microservices deployed on Vercel Edge Network (`/api/overview`, `/api/cities`, `/api/analytics`).
- **Interactive Visualization**: React 19, TypeScript, Tailwind CSS v4, and Recharts.

---

## 5. Cross-References
- **Project Report**: [REPORT.md](./REPORT.md) (Complete academic report with CO-PO mapping and results)
- **Evaluation Rubric & Viva Guide**: [README.md](./README.md) (100-mark evaluation matrix and script)
- **Preprocessing Notebook**: [Air_Quality_Preprocessing.ipynb](./Air_Quality_Preprocessing.ipynb) (Cell-by-cell data cleaning and CPCB formulas)
