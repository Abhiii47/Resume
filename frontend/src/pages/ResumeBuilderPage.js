import React from "react";
import { useNavigate } from "react-router-dom";
import ResumeBuilder from "../components/ResumeBuilder";

export default function ResumeBuilderPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "var(--bg-surface)", height: "100vh", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        height: 52,
        background: "#fff",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
      }}>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn btn-ghost btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}
        >
          ← Back to Dashboard
        </button>
        <div className="divider" style={{ width: 1, height: 24, margin: "0 4px" }} />
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
          color: "var(--text-primary)",
        }}>Resume Builder</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {["✓ Live preview", "✓ ATS-ready", "✓ Export PDF"].map(t => (
            <span key={t} style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>
      <ResumeBuilder />
    </div>
  );
}
