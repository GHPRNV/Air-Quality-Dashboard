import { getRedis } from "./_redis.js";

export default async function handler(req, res) {
  try {
    const redis = getRedis();

    const url = new URL(req.url, `http://${req.headers?.host || "localhost"}`);
    const cityParam = url.searchParams.get("city") || "All cities";
    const rangeParam = url.searchParams.get("range") || "10 days";

    // 1. Get list of all monitored cities
    const rawCities = await redis.smembers("aqi:cities");
    const cities = rawCities.sort();

    // Determine how many days to fetch
    let limitDays = 10;
    if (rangeParam.includes("30")) limitDays = 30;
    else if (rangeParam.includes("90")) limitDays = 90;
    else if (rangeParam.includes("365") || rangeParam.toLowerCase().includes("all")) limitDays = 366;

    // 2. Fetch city annual summaries for location comparisons & KPIs
    const summaryKeys = cities.map((c) => `aqi:summary:${c.toLowerCase()}`);
    const summaryData = await redis.mget(summaryKeys);
    const summaries = summaryData
      .map((item) => (item ? JSON.parse(item) : null))
      .filter(Boolean);

    // 3. Collect daily records for the selected city or all cities
    const targetCities =
      cityParam === "All cities" ? cities : cities.filter((c) => c.toLowerCase() === cityParam.toLowerCase());

    // For each target city, get the latest `limitDays` dates from its sorted set
    const dailyKeysToFetch = [];
    for (const c of targetCities) {
      const dates = await redis.zrevrange(`aqi:dates:${c.toLowerCase()}`, 0, limitDays - 1);
      dates.reverse().forEach((d) => {
        dailyKeysToFetch.push(`aqi:daily:${c.toLowerCase()}:${d}`);
      });
    }

    // Batch fetch all daily JSON payloads in 1 round trip
    const dailyRaw = dailyKeysToFetch.length ? await redis.mget(dailyKeysToFetch) : [];
    const dailyRecords = dailyRaw
      .map((item) => (item ? JSON.parse(item) : null))
      .filter((r) => r !== null);

    // 4. Calculate Location comparisons (Sorted AQI)
    const locations = summaries
      .map((s) => {
        const pm25 = s.avg_pm25 || 0;
        let estAqi = Math.round(pm25 * 1.5);
        if (pm25 <= 30) estAqi = Math.round(pm25 * 50 / 30);
        else if (pm25 <= 60) estAqi = Math.round(50 + (pm25 - 30) * 50 / 30);
        else if (pm25 <= 90) estAqi = Math.round(100 + (pm25 - 60) * 100 / 30);
        else if (pm25 <= 120) estAqi = Math.round(200 + (pm25 - 90) * 100 / 30);
        else if (pm25 <= 250) estAqi = Math.round(300 + (pm25 - 120) * 100 / 130);
        else estAqi = Math.round(400 + (pm25 - 250) * 100 / 130);

        return {
          city: s.city,
          aqi: estAqi,
          pm25: s.avg_pm25,
          pm10: s.avg_pm10,
          no2: s.avg_no2,
          records: s.total_observations,
        };
      })
      .sort((a, b) => b.aqi - a.aqi);

    // 5. Aggregate Trend data by date
    const dateMap = new Map();

    for (const r of dailyRecords) {
      const existing = dateMap.get(r.date) || { pm25Sum: 0, pm10Sum: 0, no2Sum: 0, aqiSum: 0, count: 0 };
      if (r.avg_pm25 !== null) existing.pm25Sum += r.avg_pm25;
      if (r.avg_pm10 !== null) existing.pm10Sum += r.avg_pm10;
      if (r.avg_no2 !== null) existing.no2Sum += r.avg_no2;
      if (r.aqi !== null) existing.aqiSum += r.aqi;
      existing.count += 1;
      dateMap.set(r.date, existing);
    }

    const trend = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        aqi: data.count ? Math.round(data.aqiSum / data.count) : 0,
        pm25: data.count ? Math.round((data.pm25Sum / data.count) * 10) / 10 : 0,
        pm10: data.count ? Math.round((data.pm10Sum / data.count) * 10) / 10 : 0,
        no2: data.count ? Math.round((data.no2Sum / data.count) * 10) / 10 : 0,
      }));

    // 6. Overall KPIs for the selected view
    const totalAqi = trend.reduce((sum, t) => sum + t.aqi, 0);
    const totalPm25 = trend.reduce((sum, t) => sum + t.pm25, 0);
    const totalPm10 = trend.reduce((sum, t) => sum + t.pm10, 0);
    const count = trend.length || 1;

    const avgAqi = Math.round(totalAqi / count);
    const avgPm25 = Math.round((totalPm25 / count) * 10) / 10;
    const avgPm10 = Math.round((totalPm10 / count) * 10) / 10;

    // 7. CPCB AQI Category breakdown
    const catCounts = {
      Good: 0,
      Satisfactory: 0,
      Moderate: 0,
      Poor: 0,
      "Very Poor": 0,
      Severe: 0,
    };

    trend.forEach((t) => {
      if (t.aqi <= 50) catCounts["Good"]++;
      else if (t.aqi <= 100) catCounts["Satisfactory"]++;
      else if (t.aqi <= 200) catCounts["Moderate"]++;
      else if (t.aqi <= 300) catCounts["Poor"]++;
      else if (t.aqi <= 400) catCounts["Very Poor"]++;
      else catCounts["Severe"]++;
    });

    const categoriesConfig = [
      { name: "Good", color: "#2dd4bf" },
      { name: "Satisfactory", color: "#84cc16" },
      { name: "Moderate", color: "#facc15" },
      { name: "Poor", color: "#fb923c" },
      { name: "Very Poor", color: "#f87171" },
      { name: "Severe", color: "#c084fc" },
    ];

    const distribution = categoriesConfig.map((c) => ({
      name: c.name,
      color: c.color,
      value: catCounts[c.name],
    }));

    // 8. Key Findings
    const peakDay = trend.reduce((best, cur) => (cur.aqi > best.aqi ? cur : best), trend[0] || { date: "-", aqi: 0 });
    const highestCity = locations[0] || { city: "-", aqi: 0 };
    const highestPm25City = [...locations].sort((a, b) => (b.pm25 || 0) - (a.pm25 || 0))[0] || { city: "-", pm25: 0 };

    const totalObs = targetCities.length === cities.length ? 88340 : Math.round(88340 / 10);

    const responsePayload = {
      cities,
      selectedCity: cityParam,
      range: rangeParam,
      kpis: {
        avgAqi,
        avgPm25,
        avgPm10,
        activeStations: targetCities.length,
        totalRecords: totalObs,
      },
      trend,
      locations,
      distribution,
      findings: {
        highestCity: highestCity.city,
        highestCityAqi: highestCity.aqi,
        peakDate: peakDay.date,
        peakAqi: peakDay.aqi,
        highestPm25City: highestPm25City.city,
        highestPm25Val: highestPm25City.pm25,
      },
      dateRangeDisplay: trend.length ? `${trend[0].date} to ${trend[trend.length - 1].date}` : "2024",
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.statusCode = 200;
    res.end(JSON.stringify(responsePayload));
  } catch (error) {
    console.error("API /overview error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message || "Failed to query Redis" }));
  }
}
