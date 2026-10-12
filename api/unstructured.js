import { getRedis } from "./_redis.js";

export default async function handler(req, res) {
  try {
    const redis = getRedis();

    const url = new URL(req.url, `http://${req.headers?.host || "localhost"}`);
    const filter = url.searchParams.get("filter") || "all"; // all | crit | warn | info
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);

    // 1. Fetch Big Data metrics hash
    const metricsRaw = await redis.hgetall("aqi:unstructured:metrics");

    // 2. Fetch logs based on filter
    let logKey = "aqi:unstructured:logs";
    if (filter === "crit") logKey = "aqi:unstructured:logs:crit";
    else if (filter === "warn") logKey = "aqi:unstructured:logs:warn";

    const totalLogsInKey = await redis.llen(logKey);
    const rawLogs = await redis.lrange(logKey, 0, Math.min(limit * 2, 500) - 1);

    // Apply client-side search query if present
    let filteredLogs = rawLogs;
    if (search) {
      filteredLogs = rawLogs.filter((l) => l.toLowerCase().includes(search));
    }
    filteredLogs = filteredLogs.slice(0, limit);

    // 3. Fetch Unstructured Environmental Bulletins
    const rawBulletins = await redis.lrange("aqi:unstructured:bulletins", 0, -1);
    const bulletins = rawBulletins.map((b) => JSON.parse(b));

    // 4. Fetch Unstructured Citizen Incidents
    const rawIncidents = await redis.lrange("aqi:unstructured:incidents", 0, -1);
    const incidents = rawIncidents.map((inc) => JSON.parse(inc));

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        metrics: metricsRaw,
        filter,
        totalLogsInKey,
        returnedLogsCount: filteredLogs.length,
        logs: filteredLogs,
        bulletins,
        incidents,
      })
    );
  } catch (error) {
    console.error("API /unstructured error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message || "Failed to query unstructured stream" }));
  }
}
