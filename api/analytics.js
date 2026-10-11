import { getRedis } from "./_redis.js";

export default async function handler(req, res) {
  try {
    const redis = getRedis();

    const url = new URL(req.url, `http://${req.headers?.host || "localhost"}`);
    const cityParam = url.searchParams.get("city") || "All cities";
    const metricParam = url.searchParams.get("metric") || "pm25";

    const rawCities = await redis.smembers("aqi:cities");
    const cities = rawCities.sort();

    const targetCities =
      cityParam === "All cities" ? cities : cities.filter((c) => c.toLowerCase() === cityParam.toLowerCase());

    // Fetch the 60 most recent days for analytics
    const dailyKeys = [];
    for (const c of targetCities) {
      const dates = await redis.zrevrange(`aqi:dates:${c.toLowerCase()}`, 0, 59);
      dates.reverse().forEach((d) => {
        dailyKeys.push(`aqi:daily:${c.toLowerCase()}:${d}`);
      });
    }

    const dailyRaw = dailyKeys.length ? await redis.mget(dailyKeys) : [];
    const dailyRecords = dailyRaw
      .map((item) => (item ? JSON.parse(item) : null))
      .filter(Boolean);

    // Group values by date
    const dateMap = new Map();
    const allValues = [];
    const exportRows = [];

    for (const r of dailyRecords) {
      let val = null;
      if (metricParam === "pm25") val = r.avg_pm25;
      else if (metricParam === "pm10") val = r.avg_pm10;
      else if (metricParam === "no2") val = r.avg_no2;
      else if (metricParam === "aqi") val = r.aqi;

      if (val !== null && val !== undefined) {
        allValues.push(val);
        const existing = dateMap.get(r.date) || [];
        existing.push(val);
        dateMap.set(r.date, existing);
      }

      exportRows.push({
        date: r.date,
        city: r.city,
        aqi: r.aqi,
        pm25: r.avg_pm25,
        pm10: r.avg_pm10,
        no2: r.avg_no2,
      });
    }

    allValues.sort((a, b) => a - b);

    const count = allValues.length || 1;
    const mean = Math.round((allValues.reduce((a, b) => a + b, 0) / count) * 10) / 10;
    const median = allValues.length ? allValues[Math.floor(allValues.length / 2)] : 0;
    const min = allValues.length ? allValues[0] : 0;
    const max = allValues.length ? allValues[allValues.length - 1] : 0;
    const variance = allValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

    const trend = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        [metricParam]: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      }));

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        city: cityParam,
        metric: metricParam,
        cities,
        stats: {
          mean,
          median,
          min,
          max,
          stdDev,
          sampleCount: allValues.length,
        },
        trend,
        exportRows,
      })
    );
  } catch (error) {
    console.error("API /analytics error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message || "Failed to query analytics" }));
  }
}
