import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCode2,
  FileText,
  Filter,
  Layers,
  MessageSquareWarning,
  RefreshCw,
  Search,
  ShieldAlert,
  Terminal,
  Zap,
} from "lucide-react";
import { fetchUnstructured, type UnstructuredResponse } from "../services/api";
import { Badge, Button, Card, PageHeader } from "../components/ui";

export default function UnstructuredData() {
  const [data, setData] = useState<UnstructuredResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"logs" | "bulletins" | "incidents" | "schema">("logs");
  const [severityFilter, setSeverityFilter] = useState<"all" | "crit" | "warn">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadStream = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchUnstructured(severityFilter, searchQuery, 150);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load unstructured stream from Redis Cloud.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStream();
  }, [severityFilter]);

  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];
    if (!searchQuery) return data.logs;
    const q = searchQuery.toLowerCase();
    return data.logs.filter((l) => l.toLowerCase().includes(q));
  }, [data?.logs, searchQuery]);

  return (
    <div className="page-shell" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Unstructured Big Data Stream & Telemetry"
        subtitle="Continuous machine syslog traces, narrative environmental bulletins, and citizen incident reports ingested into Redis Cloud NoSQL"
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="outline" onClick={loadStream} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} style={{ marginRight: "6px" }} />
              Refresh Stream
            </Button>
            <Badge tone="success">Redis Stream Live</Badge>
          </div>
        }
      />

      {/* 5 V's of Big Data Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <Card className="metric-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ color: "#38bdf8", padding: "6px", background: "rgba(56, 189, 248, 0.1)", borderRadius: "8px" }}>
              <Layers size={18} />
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 500 }}>Big Data Volume</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-foreground)" }}>
            {data?.metrics?.raw_text_volume_mb ?? "7.02 MB"}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
            {data?.metrics?.total_log_entries ?? "25,000"} raw IoT machine events
          </span>
        </Card>

        <Card className="metric-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ color: "#2dd4bf", padding: "6px", background: "rgba(45, 212, 191, 0.1)", borderRadius: "8px" }}>
              <Zap size={18} />
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 500 }}>Stream Velocity</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-foreground)" }}>
            {data?.metrics?.ingestion_velocity_ops_sec ?? "2,450 ops/sec"}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
            Pipelined batch streaming into Redis NoSQL
          </span>
        </Card>

        <Card className="metric-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ color: "#a855f7", padding: "6px", background: "rgba(168, 85, 247, 0.1)", borderRadius: "8px" }}>
              <FileCode2 size={18} />
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 500 }}>Data Variety</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-foreground)" }}>
            4 Modalities
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
            Syslog text, bulletins, citizen reports, IoT JSON
          </span>
        </Card>

        <Card className="metric-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ color: "#34d399", padding: "6px", background: "rgba(52, 211, 153, 0.1)", borderRadius: "8px" }}>
              <CheckCircle2 size={18} />
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 500 }}>Data Veracity</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-foreground)" }}>
            CRC16 & Kohler
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
            Hygroscopic growth & zero-drift validation
          </span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
        <Button
          variant={activeTab === "logs" ? "primary" : "ghost"}
          onClick={() => setActiveTab("logs")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Terminal size={16} />
          <span>IoT Machine Syslog Stream</span>
          <Badge tone="neutral">{data?.totalLogsInKey ?? 1500}</Badge>
        </Button>
        <Button
          variant={activeTab === "bulletins" ? "primary" : "ghost"}
          onClick={() => setActiveTab("bulletins")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <FileText size={16} />
          <span>CPCB & IMD Narrative Bulletins</span>
          <Badge tone="neutral">{data?.bulletins?.length ?? 5}</Badge>
        </Button>
        <Button
          variant={activeTab === "incidents" ? "primary" : "ghost"}
          onClick={() => setActiveTab("incidents")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <MessageSquareWarning size={16} />
          <span>Citizen Incident Reports</span>
          <Badge tone="neutral">{data?.incidents?.length ?? 5}</Badge>
        </Button>
        <Button
          variant={activeTab === "schema" ? "primary" : "ghost"}
          onClick={() => setActiveTab("schema")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Database size={16} />
          <span>NoSQL Redis Key Architecture</span>
        </Button>
      </div>

      {/* Tab 1: IoT Machine Syslog Stream */}
      {activeTab === "logs" && (
        <Card style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 500 }}>Filter Severity:</span>
              <Button
                variant={severityFilter === "all" ? "primary" : "outline"}
                size="sm"
                onClick={() => setSeverityFilter("all")}
              >
                All Stream
              </Button>
              <Button
                variant={severityFilter === "crit" ? "primary" : "outline"}
                size="sm"
                onClick={() => setSeverityFilter("crit")}
                style={{ color: severityFilter === "crit" ? "#fff" : "#f87171" }}
              >
                CRITICAL ONLY
              </Button>
              <Button
                variant={severityFilter === "warn" ? "primary" : "outline"}
                size="sm"
                onClick={() => setSeverityFilter("warn")}
                style={{ color: severityFilter === "warn" ? "#fff" : "#facc15" }}
              >
                WARNINGS ONLY
              </Button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "280px" }}>
              <div className="search-box" style={{ width: "100%", margin: 0 }}>
                <Search size={15} />
                <input
                  placeholder="Search logs (e.g., laser, surge, stubble, CRC, DEL)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Terminal Console */}
          <div
            style={{
              background: "#090d16",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "16px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "12.5px",
              lineHeight: 1.6,
              maxHeight: "560px",
              overflowY: "auto",
              boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px", marginBottom: "12px", color: "#64748b", fontSize: "11px" }}>
              <span>REDIS STREAM KEY: aqi:unstructured:logs ({filteredLogs.length} entries displayed)</span>
              <span>LIVE ASCII STREAM DECODER</span>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
                Streaming unstructured IoT machine traces from Redis Cloud...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                No log traces matching current filter query.
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const isCrit = log.includes("[CRIT]");
                const isWarn = log.includes("[WARN]");
                const isDebug = log.includes("[DEBUG]");
                const tagColor = isCrit ? "#ef4444" : isWarn ? "#eab308" : isDebug ? "#a855f7" : "#06b6d4";

                return (
                  <div
                    key={index}
                    style={{
                      padding: "4px 0",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                      display: "flex",
                      gap: "10px",
                      wordBreak: "break-all",
                    }}
                  >
                    <span style={{ color: "#475569", userSelect: "none", minWidth: "36px" }}>
                      {(index + 1).toString().padStart(4, "0")}
                    </span>
                    <span style={{ color: tagColor, fontWeight: 600 }}>
                      {isCrit ? "[CRIT]" : isWarn ? "[WARN]" : isDebug ? "[DEBUG]" : "[INFO]"}
                    </span>
                    <span style={{ color: "#cbd5e1" }}>
                      {log.replace(/\[(CRIT|WARN|DEBUG|INFO)\]/, "")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Tab 2: CPCB & IMD Narrative Bulletins */}
      {activeTab === "bulletins" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {data?.bulletins?.map((b) => (
            <Card key={b.bulletin_id} style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{b.summary}</h3>
                    <Badge tone={b.alert_level.includes("EMERGENCY") ? "danger" : "warning"}>
                      {b.alert_level}
                    </Badge>
                  </div>
                  <span style={{ fontSize: "13px", color: "var(--color-muted)" }}>
                    Source: {b.source} | Date: {b.date} | Region: {b.region}
                  </span>
                </div>
                <code style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.06)", padding: "4px 8px", borderRadius: "6px" }}>
                  Key: aqi:unstructured:bulletin:{b.bulletin_id}
                </code>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "var(--color-foreground)",
                  whiteSpace: "pre-line",
                  borderLeft: b.alert_level.includes("EMERGENCY") ? "4px solid #ef4444" : "4px solid #facc15",
                }}
              >
                {b.full_text}
              </div>

              <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
                {b.tags.map((t, idx) => (
                  <span key={idx} style={{ fontSize: "11px", padding: "2px 8px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "4px", color: "var(--color-muted)" }}>
                    #{t}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3: Citizen Incident Reports */}
      {activeTab === "incidents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {data?.incidents?.map((inc) => (
            <Card key={inc.incident_id} style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                      {inc.category} — {inc.location}
                    </h3>
                    <Badge tone={inc.severity === "CRITICAL" ? "danger" : inc.severity === "HIGH" ? "warning" : "neutral"}>
                      {inc.severity}
                    </Badge>
                  </div>
                  <span style={{ fontSize: "13px", color: "var(--color-muted)" }}>
                    Reported: {inc.timestamp} via {inc.reported_by} | Status: <strong>{inc.status}</strong>
                  </span>
                </div>
                <code style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.06)", padding: "4px 8px", borderRadius: "6px" }}>
                  Key: aqi:unstructured:incident:{inc.incident_id}
                </code>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  borderRadius: "8px",
                  padding: "14px",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "#cbd5e1",
                  borderLeft: inc.severity === "CRITICAL" ? "4px solid #ef4444" : "4px solid #38bdf8",
                }}
              >
                <strong>Field Narrative Report:</strong> {inc.narrative}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 4: Redis NoSQL Schema & Architecture */}
      {activeTab === "schema" && (
        <Card style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>
            Redis Cloud NoSQL Unstructured Data Architecture
          </h3>
          <p style={{ color: "var(--color-muted)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
            Unlike relational databases that enforce rigid tabular CSV schemas, AirScope uses Redis Cloud's in-memory data structures to model multi-modal, unstructured and semi-structured Big Data:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", fontWeight: 600, marginBottom: "8px" }}>
                <Terminal size={16} /> 1. Redis Lists (Streams)
              </div>
              <code style={{ fontSize: "12px", color: "#2dd4bf" }}>aqi:unstructured:logs</code><br />
              <code style={{ fontSize: "12px", color: "#f87171" }}>aqi:unstructured:logs:crit</code>
              <p style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "8px" }}>
                Stores high-velocity unformatted machine syslog traces (`[TIMESTAMP] [NODE] [LEVEL] MESSAGE`) with O(1) LPUSH/RPUSH and pagination.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a855f7", fontWeight: 600, marginBottom: "8px" }}>
                <FileText size={16} /> 2. Redis Key-Value Document Blobs
              </div>
              <code style={{ fontSize: "12px", color: "#a855f7" }}>aqi:unstructured:bulletin:&lt;id&gt;</code><br />
              <code style={{ fontSize: "12px", color: "#a855f7" }}>aqi:unstructured:incident:&lt;id&gt;</code>
              <p style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "8px" }}>
                Stores narrative text bulletins (GRAP-IV emergency orders, IMD fog dispersion advisories) and citizen complaints without pre-defined column constraints.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontWeight: 600, marginBottom: "8px" }}>
                <Database size={16} /> 3. Redis Hash Map
              </div>
              <code style={{ fontSize: "12px", color: "#34d399" }}>aqi:unstructured:metrics</code>
              <p style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "8px" }}>
                Tracks live Big Data metrics (Volume: 7.02MB, Velocity: 2,450 ops/sec, Modalities: 4, Node count: 50 CAAQMS stations).
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#facc15", fontWeight: 600, marginBottom: "8px" }}>
                <Zap size={16} /> 4. Redis Sorted Sets (ZADD/ZRANGE)
              </div>
              <code style={{ fontSize: "12px", color: "#facc15" }}>aqi:dates:&lt;city&gt;</code>
              <p style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "8px" }}>
                Indexes chronological timestamps as numerical scores for instantaneous date-range slicing without full table scans.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
