import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useScrollReveal } from "../utils";

const FEATURES = [
  { icon: "🎯", label: "Hybrid AI Engine", desc: "Heuristic analysis + LLM deep evaluation in a single batched call. 7-dimension scoring with human-readable reasoning.", color: "#d97706" },
  { icon: "🔒", label: "Privacy First", desc: "Your resume text is analyzed in-memory and stored securely. We never share your data with third parties.", color: "#0284c7" },
  { icon: "🌐", label: "Real-Time Jobs", desc: "Adzuna-powered job discovery across 10+ countries. AI resume-to-job matching with gap analysis.", color: "#16a34a" },
  { icon: "🗺️", label: "Personalized Roadmaps", desc: "AI generates 8-week learning plans tailored to your resume gaps, target role, and dream company.", color: "#7c3aed" },
  { icon: "⚡", label: "GitHub Integration", desc: "Cross-reference your resume claims with real GitHub activity. Surface hidden skills you forgot to list.", color: "#db2777" },
  { icon: "🤖", label: "Alex — AI Mentor", desc: "An agentic career coach that knows your score, streak, and pipeline. Proactive, data-driven advice.", color: "#b45309" },
];

const STATS = [
  { value: "7",   label: "Scoring Dimensions" },
  { value: "10+", label: "Countries (Jobs)" },
  { value: "1",   label: "LLM Call Per Analysis" },
  { value: "50+", label: "Skills Detected" },
];

export default function AboutPage() {
  const navigate = useNavigate();
  useScrollReveal();

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }} className="grid-lines">
      <Navbar />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <div className="section-label sr"><span className="section-label-text">About the Platform</span></div>
          <h1 className="text-display sr" style={{ marginBottom: 20, maxWidth: 680 }}>
            We don't guess. <span className="highlight-accent rotate-right-1" style={{ display: "inline-block", color: "#fff", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>We diagnose.</span>
          </h1>
          <p className="sr" style={{ fontSize: 17, color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 560, marginBottom: 48 }}>
            Traditional resume tools give you a number. SmartResume gives you a 7-dimension diagnostic report
            with exact fixes, AI-powered rewrites, and a personalized roadmap to land your target role.
          </p>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} id="about-stats">
            {STATS.map((s, i) => (
              <div key={s.label} className={`card sr sr-delay-${i + 1}`} style={{ padding: "24px 20px", textAlign: "center" }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "2.4rem", fontWeight: 700,
                  color: "var(--accent)", marginBottom: 6, lineHeight: 1,
                }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div style={{ marginBottom: 64 }}>
          <div className="section-label sr"><span className="section-label-text">What Powers SmartResume</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 24 }} id="about-features">
            {FEATURES.map((f, i) => (
              <div key={f.label} className={`card-premium sr sr-delay-${(i % 3) + 1}`} style={{ padding: "28px" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--radius-md)",
                  background: "var(--accent-light)",
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, marginBottom: 16,
                  color: "var(--accent)",
                }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--text-primary)" }}>
                  {f.label}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="card sr" style={{ padding: "32px 36px", marginBottom: 32 }}>
          <div className="section-label" style={{ marginBottom: 20 }}><span className="section-label-text">Tech Stack</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} id="tech-stack">
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 8 }}>
                Frontend
              </div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                React 18 · TailwindCSS · Framer Motion · GSAP · Recharts · Lucide Icons
              </p>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 8 }}>
                Backend
              </div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                FastAPI · SQLAlchemy · Neon PostgreSQL · Groq (Llama 3.3) · Google Gemini · Adzuna API
              </p>
            </div>
          </div>
        </div>

        {/* Credits & Inspiration */}
        <div className="card sr" style={{ padding: "32px 36px", marginBottom: 64, borderStyle: "dashed" }}>
          <div className="section-label" style={{ marginBottom: 20 }}><span className="section-label-text">Credits & Inspiration</span></div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            SmartResume's high-contrast neobrutalist design system is inspired by <a href="https://github.com/nutlope/resumefyi" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "underline" }}>ResumeFyi</a>, an outstanding open-source project. We are deeply grateful to their creators and the open-source community for making beautiful design patterns and architectures accessible to everyone.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/signup")}
            id="about-cta-btn"
          >
            Start Analyzing — Free →
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #about-stats { grid-template-columns: repeat(2, 1fr) !important; }
          #about-features { grid-template-columns: 1fr !important; }
          #tech-stack { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
