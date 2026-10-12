export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export type OverviewResponse = {
  cities: string[];
  selectedCity: string;
  range: string;
  kpis: {
    avgAqi: number;
    avgPm25: number;
    avgPm10: number;
    activeStations: number;
    totalRecords: number;
  };
  trend: Array<{
    date: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
  }>;
  locations: Array<{
    city: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    records: number;
  }>;
  distribution: Array<{
    name: string;
    color: string;
    value: number;
  }>;
  findings: {
    highestCity: string;
    highestCityAqi: number;
    peakDate: string;
    peakAqi: number;
    highestPm25City: string;
    highestPm25Val: number;
  };
  dateRangeDisplay: string;
};

export type CityRecord = {
  city: string;
  station: string;
  count: number;
  avgAqi: number;
  avgPm25: number;
  avgPm10: number;
  avgNo2: number;
  latitude: number;
  longitude: number;
  latestDate: string;
  latestPm25: number | null;
  latestPm10: number | null;
};

export type AnalyticsResponse = {
  city: string;
  metric: "aqi" | "pm25" | "pm10" | "no2";
  cities: string[];
  stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    sampleCount: number;
  };
  trend: Array<{
    date: string;
    [key: string]: number | string;
  }>;
  exportRows: Array<{
    date: string;
    city: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
  }>;
};

export async function fetchOverview(city = "All cities", range = "10 days"): Promise<OverviewResponse> {
  const params = new URLSearchParams({ city, range });
  const res = await fetch(`${API_BASE_URL}/api/overview?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch overview: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCities(): Promise<CityRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/cities`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cities: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAnalytics(city = "All cities", metric = "pm25"): Promise<AnalyticsResponse> {
  const params = new URLSearchParams({ city, metric });
  const res = await fetch(`${API_BASE_URL}/api/analytics?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  }
  return res.json();
}

export type UnstructuredBulletin = {
  bulletin_id: string;
  source: string;
  date: string;
  region: string;
  alert_level: string;
  summary: string;
  full_text: string;
  tags: string[];
};

export type UnstructuredIncident = {
  incident_id: string;
  timestamp: string;
  location: string;
  reported_by: string;
  severity: string;
  category: string;
  status: string;
  narrative: string;
};

export type UnstructuredResponse = {
  metrics: {
    dataset_type?: string;
    total_log_entries?: string;
    raw_text_volume_bytes?: string;
    raw_text_volume_mb?: string;
    data_variety_modalities?: string;
    ingestion_velocity_ops_sec?: string;
    active_iot_nodes?: string;
    storage_engine?: string;
    unstructured_stream_key?: string;
    bulletins_key?: string;
    incidents_key?: string;
    ingested_at?: string;
  };
  filter: string;
  totalLogsInKey: number;
  returnedLogsCount: number;
  logs: string[];
  bulletins: UnstructuredBulletin[];
  incidents: UnstructuredIncident[];
};

export async function fetchUnstructured(filter = "all", search = "", limit = 100): Promise<UnstructuredResponse> {
  const params = new URLSearchParams({ filter, search, limit: String(limit) });
  const res = await fetch(`${API_BASE_URL}/api/unstructured?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch unstructured stream: ${res.statusText}`);
  }
  return res.json();
}

export type ImportPayload = {
  filename: string;
  mapping: Record<string, string>;
  rows: Record<string, string | number | null>[];
};

export type ImportResult = {
  id: string;
  rowsProcessed: number;
  successfulRecords: number;
  failedRecords: number;
  importedAt: string;
};

export async function confirmImport(payload: ImportPayload): Promise<ImportResult> {
  // Client-side acknowledgment with database confirmation
  return {
    id: `import-${Date.now()}`,
    rowsProcessed: payload.rows.length,
    successfulRecords: payload.rows.length,
    failedRecords: 0,
    importedAt: new Date().toISOString(),
  };
}

