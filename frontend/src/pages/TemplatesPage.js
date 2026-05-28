import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useScrollReveal } from "../utils";

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic Professional",
    color: "#d97706",
    desc: "Clean single-column layout. Industry standard for ATS parsing. Best for 1-3 years experience.",
    tags: ["ATS-Safe", "Single Column", "Entry Level"],
    sections: ["Summary", "Experience", "Education", "Skills", "Projects"],
  },
  {
    id: "modern",
    name: "Modern Developer",
    color: "#0284c7",
    desc: "Sidebar layout with skill bars and project highlights. Great for software engineers and designers.",
    tags: ["Visual", "Two Column", "Mid Level"],
    sections: ["Profile", "Tech Stack", "Experience", "Projects", "Education"],
  },
  {
    id: "minimal",
    name: "Minimal Impact",
    color: "#16a34a",
    desc: "Ultra-clean with maximum whitespace. Focuses attention on achievements and metrics. Senior-level.",
    tags: ["ATS-Safe", "Minimal", "Senior Level"],
    sections: ["Summary", "Key Achievements", "Experience", "Skills"],
  },
  {
    id: "executive",
    name: "Executive Two-Column",
    color: "#7c3aed",
    desc: "Balanced two-column with leadership focus. Ideal for team leads, PMs, and managers.",
    tags: ["Leadership", "Two Column", "Management"],
    sections: ["Executive Summary", "Core Competencies", "Experience", "Education", "Certifications"],
  },
  {
    id: "creative",
    name: "Creative Designer",
    color: "#ec4899",
    desc: "Vibrant visual layout with custom colors, header accent bars, and split columns. Perfect for designers and creative developers.",
    tags: ["Creative", "Split Columns", "Visual Focus"],
    sections: ["Summary", "Experience", "Projects", "Skills Stack", "Education"],
  },
  {
    id: "academic",
    name: "Academic Researcher",
    color: "#0f766e",
    desc: "Elegant traditional serif CV layout with wide margins and clear list styles, ideal for scholars, researchers, and writers.",
    tags: ["CV Style", "Academic", "Clean Serif"],
    sections: ["Summary", "Education", "Academic Experience", "Publications", "Expertise"],
  },
  {
    id: "startup",
    name: "Startup Specialist",
    color: "#ea580c",
    desc: "Fast-track tech-focused layout highlighting technical skill grids at the top, using chevron bullet indicators and high-impact compact formatting.",
    tags: ["Tech Focus", "Compact", "High Impact"],
    sections: ["Skills Grid", "Fast-track Summary", "Employment", "Tech Projects", "Education"],
  },
];

function ResumePreviewMock({ template }) {
  return (
    <div style={{
      background: "#fff",
      border: "var(--border-brutal)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-brutal)",
      padding: 16,
      minHeight: 160,
    }}>
      {/* Name bar */}
      <div style={{ height: 8, width: "60%", background: template.color, borderRadius: 2, marginBottom: 6 }} />
      <div style={{ height: 4, width: "40%", background: "var(--bg-elevated)", borderRadius: 2, marginBottom: 16 }} />
      {/* Sections */}
      {template.sections.slice(0, 4).map((s, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ height: 4, width: "30%", background: template.color, opacity: 0.5, borderRadius: 2, marginBottom: 4 }} />
          <div style={{ height: 3, width: "100%", background: "var(--bg-surface)", borderRadius: 2, marginBottom: 3 }} />
          <div style={{ height: 3, width: "80%", background: "var(--bg-surface)", borderRadius: 2 }} />
        </div>
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  useScrollReveal();

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }} className="grid-lines">
      <Navbar />

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <div className="section-label" style={{ marginBottom: 12 }}><span className="section-label-text">Resume Templates</span></div>
          <h1 className="text-display" style={{ marginBottom: 16 }}>
            ATS-optimized <span className="highlight-accent" style={{ color: "#fff", border: "none", boxShadow: "none", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>templates</span>.
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 520, fontWeight: 500 }}>
            Every template is designed to pass ATS parsers while looking professional.
            Pick one and start building in our live editor.
          </p>
        </div>

        {/* Templates grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }} id="templates-grid">
          {TEMPLATES.map((t, i) => (
            <div
              key={t.id}
              className="card sr"
              style={{ overflow: "hidden" }}
            >
              {/* Preview area */}
              <div style={{
                padding: "28px 28px 20px",
                background: "var(--bg-surface)",
                borderBottom: "var(--border-brutal)",
              }}>
                <ResumePreviewMock template={t} />
              </div>

              {/* Info */}
              <div style={{ padding: "24px 28px 28px" }}>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: 17, color: "var(--text-primary)", marginBottom: 8,
                }}>{t.name}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 16 }}>
                  {t.desc}
                </p>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {t.tags.map((tag, j) => (
                    <span key={j} style={{
                      padding: "3px 10px",
                      background: "var(--accent-light)",
                      border: "1px solid rgba(22, 78, 59, 0.15)",
                      borderRadius: "12px",
                      fontSize: 11, fontWeight: 600,
                      color: "var(--accent)",
                    }}>{tag}</span>
                  ))}
                </div>

                {/* Sections */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8,
                  }}>Includes sections</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {t.sections.map((s, j) => (
                      <span key={j} style={{
                        padding: "2px 8px",
                        background: "var(--bg-page)",
                        border: "1px solid rgba(15, 23, 42, 0.08)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 11, color: "var(--text-secondary)",
                        fontWeight: 500,
                      }}>{s}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/builder?template=${t.id}`)}
                  className="btn btn-primary"
                  id={`template-${t.id}-btn`}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Use This Template →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #templates-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
