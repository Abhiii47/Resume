import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../lib/api";
import { setAuthToken, updateMetaTags } from "../utils";

/* ── Rotating Stats ─────────────────────────────────────────────── */
const STATS = [
  { value: "6s", text: <>Average recruiter scan time. <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>Make it count.</span></> },
  { value: "75%", text: <>Of resumes are <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>rejected by ATS bots</span> before a human sees them.</> },
  { value: "87%", text: <>Of SmartResume users pass ATS after <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>fixing their score.</span></> },
  { value: "<60s", text: <>To get your first honest ATS score. <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>No card. Just results.</span></> },
  { value: "200+", text: <>Applications sent, zero callbacks. <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>It's the resume.</span></> },
];

function RotatingStat() {
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVis(false);
      setTimeout(() => { setIdx(i => (i + 1) % STATS.length); setVis(true); }, 350);
    }, 4000);
    return () => clearInterval(t);
  }, []);
  const s = STATS[idx];
  return (
    <div style={{ opacity: vis ? 1 : 0, transition: "opacity 0.35s ease", minHeight: 110 }}>
      <div style={{
        fontFamily: "var(--font-serif)",
        fontSize: "4.5rem", fontWeight: 800, lineHeight: 1,
        color: "var(--accent-dark)", marginBottom: 12,
        fontStyle: "italic",
      }}>{s.value}</div>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: 280 }}>
        {s.text}
      </p>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    updateMetaTags({ title: "Log in — SmartResume" });
    if (location.state?.message) setSuccess(location.state.message);
  }, [location.state]);

  const handleLogin = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      const { data } = await api.post("/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setAuthToken(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Wrong email or password.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page grid-lines">
      {/* Background blobs */}
      <div className="auth-bg-blob auth-bg-blob-1" />
      <div className="auth-bg-blob auth-bg-blob-2" />

      {/* Left panel (hidden on mobile) */}
      <div style={{
        width: 460, flexShrink: 0,
        background: "var(--bg-surface)",
        borderRight: "var(--border-brutal-thick)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "40px 48px",
        position: "relative", overflow: "hidden",
      }} className="auth-left-panel">
        {/* Subtle dot grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(28,25,23,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div className="nav-logo-icon">SR</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            SmartResume
          </span>
        </div>

        {/* Rotating stat */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--text-muted)",
            marginBottom: 24,
          }}>— Did you know</div>
          <RotatingStat />
        </div>

        {/* Testimonial */}
        <div style={{
          position: "relative", zIndex: 1,
          background: "#fff",
          border: "var(--border-brutal)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-brutal)",
          padding: "20px 22px",
        }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, fontStyle: "italic", marginBottom: 12, fontFamily: "var(--font-serif)" }}>
            "Went from 0 callbacks to 3 interviews in 2 weeks after fixing my ATS score."
          </p>
          <p style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-dark)" }}>— Priya R., 3rd year CSE</p>
        </div>
      </div>

      {/* Right panel (form) */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px 24px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, cursor: "pointer" }} className="auth-mobile-logo" onClick={() => navigate("/")}>
            <div className="nav-logo-icon">SR</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--text-primary)" }}>SmartResume</span>
          </div>

          <div className="auth-card">
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: "1.75rem", letterSpacing: "-0.03em",
                color: "var(--text-primary)", marginBottom: 6,
              }}>Welcome back.</h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Your resume score is waiting for you.</p>
            </div>

            {success && (
              <div className="alert alert-success" style={{ marginBottom: 20 }}>
                {success}
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div style={{ marginBottom: 18 }}>
                <label className="input-label">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="input-field"
                    style={{ paddingRight: 64 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                      letterSpacing: "0.05em", textTransform: "uppercase",
                    }}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", height: 46, fontSize: 15 }}
              >
                {loading ? (
                  <><div className="loading-dots" style={{ transform: "scale(0.6)" }}>
                    <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
                  </div> Logging in…</>
                ) : "Log In →"}
              </button>
            </form>

            <div className="divider" style={{ margin: "24px 0 20px" }} />

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              No account?{" "}
              <button
                onClick={() => navigate("/signup")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--accent)", fontWeight: 700, fontSize: 13,
                  fontFamily: "var(--font-body)",
                }}
              >
                Create one free →
              </button>
            </p>
            <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
              No credit card. No trial. Just free.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-left-panel { display: flex; }
        .auth-mobile-logo { display: none; }
        @media (max-width: 900px) {
          .auth-left-panel { display: none !important; }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
