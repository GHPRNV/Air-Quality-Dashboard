import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { number } from "../data/mockData";
import { Card, PageHeader } from "../components/ui";
import { fetchCities, type CityRecord } from "../services/api";

export default function Stations() {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities()
      .then((data) => {
        setCities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load cities:", err);
        setLoading(false);
      });
  }, []);

  const filteredStations = useMemo(() => {
    return cities.filter((row) =>
      `${row.city} ${row.station}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [cities, query]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Network directory"
        title="Monitoring hubs & stations"
        description="Coverage and summary statistics across all 10 monitored hubs in Redis Cloud."
      />
      <Card>
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input
              placeholder="Search station or city"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <span>
            {loading ? <Loader2 size={16} className="animate-spin text-teal-400" /> : `${filteredStations.length} hubs active`}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Station / Hub</th>
                <th>City</th>
                <th>Valid Records</th>
                <th>Avg AQI</th>
                <th>Avg PM2.5</th>
                <th>Avg PM10</th>
                <th>Avg NO₂</th>
                <th>Latest Observation</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredStations.map((row) => (
                <tr key={row.city}>
                  <td>
                    <strong>{row.station}</strong>
                  </td>
                  <td>{row.city}</td>
                  <td>{row.count.toLocaleString()}</td>
                  <td>{number(row.avgAqi)}</td>
                  <td>{number(row.avgPm25)} µg/m³</td>
                  <td>{number(row.avgPm10)} µg/m³</td>
                  <td>{number(row.avgNo2)} µg/m³</td>
                  <td>{row.latestDate}</td>
                  <td>
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
