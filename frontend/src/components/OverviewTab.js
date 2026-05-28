import React from "react";

/* ── Animated Score Number ──────────────────────────────────────── */
function AnimatedScore({ value, className, style }) {
  return (
    <span className={className} style={style}>
      {value}
    </span>
  );
}

/* ── Overview Tab — Warm Pearl ────────────────────────────────── */
export default function OverviewTab({
  history,
  setActiveTab,
  navigate,
  llmMetrics,
  llmMetricsLoading,
  showLlmMetrics = false,
}) {
  const latestScore =
    history && history.length > 0
      ? history[0].score_breakdown?.total_score ||
        history[0].score_breakdown?.overall ||
        history[0].ats_score || 0
      : 0;
  const analysisCount = history ? history.length : 0;

  const statCards = [
    { label: "Top ATS Score",      value: latestScore,    suffix: "/ 100", color: "var(--accent)",         bg: "var(--accent-light)" },
    { label: "Resumes Analyzed",   value: analysisCount,  suffix: " runs", color: "#0284c7",               bg: "#dbeafe" },
    { label: "Tracker Categories", value: 6,              suffix: " active", color: "var(--color-success)", bg: "#dcfce7" },
  ];

  const actionCards = [
    { label: "Resume Builder", desc: "Create & export ATS-ready PDFs",      icon: "📄", color: "#0284c7",               onClick: () => navigate("/builder") },
    { label: "Resume Lab",     desc: "Analyze ATS fit and fix every flaw",  icon: "📊", color: "var(--accent)",         onClick: () => setActiveTab("workspace") },
    { label: "Job Tracker",    desc: "Kanban board for your applications",   icon: "🗂️", color: "var(--color-success)",  onClick: () => setActiveTab("tracker") },
    { label: "AI Copilot",     desc: "Chat with your agentic career team",  icon: "🤖", color: "#7c3aed",               onClick: () => setActiveTab("copilot") },
  ];

  return (
    <div style={{ background: "var(--bg-surface)", minHeight: "100%", padding: "32px 28px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--color-success)",
              boxShadow: "0 0 8px rgba(22,163,74,0.7)",
              display: "inline-block",
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Agentic career hub
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            letterSpacing: "-0.03em", color: "var(--text-primary)",
            lineHeight: 1.2, marginBottom: 8,
          }}>
            Dashboard <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>·</span> Your career command center.
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 500 }}>
            Track your resume score, manage applications, and get AI coaching — all from one place.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }} className="dashboard-stats">
          {statCards.map(card => (
            <div key={card.label} className="stat-card">
              <div className="stat-label">{card.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <AnimatedScore
                  value={card.value}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "2.4rem", fontWeight: 700, color: card.color, lineHeight: 1 }}
                />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{card.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Cards Bento Grid */}
        <div style={{ marginBottom: 8 }}>
          <div className="section-label" style={{ marginBottom: 16 }}>
            <span className="section-label-text">Quick Actions</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="dashboard-actions">
            {actionCards.map(card => (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className="card-premium"
                id={`action-${card.label.toLowerCase().replace(/ /g, '-')}`}
                style={{
                  padding: "20px 18px",
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <div style={{
                  width: 40, height: 40,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-page)",
                  border: "var(--border-brutal)",
                  boxShadow: "2px 2px 0 var(--text-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, marginBottom: 14,
                }}>
                  {card.icon}
                </div>
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: 14, color: "var(--text-primary)", marginBottom: 4,
                }}>{card.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, fontWeight: 500 }}>{card.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* LLM Metrics (admin only) */}
        {showLlmMetrics && (
          <div style={{
            marginTop: 24,
            background: "#fff",
            border: "var(--border-brutal)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-brutal)",
            padding: "20px 24px",
          }}>
            <div className="section-label" style={{ marginBottom: 16 }}>
              <span className="section-label-text">AI Reliability Metrics</span>
            </div>
            {llmMetricsLoading ? (
              <p style={{ fontSize: 13, color: "var(--accent-dark)", fontWeight: 800 }}>Loading metrics…</p>
            ) : !llmMetrics ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>No telemetry yet. Trigger a few AI actions first.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Total Calls",    value: llmMetrics.total_calls || 0,         color: "var(--text-primary)" },
                  { label: "Success Rate",   value: `${llmMetrics.success_rate_pct || 0}%`, color: "var(--color-success)" },
                  { label: "Avg Latency",   value: `${llmMetrics.avg_latency_ms || 0}ms`,  color: "var(--color-info)" },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-stats { grid-template-columns: 1fr !important; }
          .dashboard-actions { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .dashboard-actions { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
