import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { updateMetaTags } from "../utils";

/* ── Password Strength ──────────────────────────────────────────── */
function getStrength(pw) {
  if (!pw) return null;
  if (pw.length < 6) return { label: "Too short", color: "#dc2626", pct: "20%" };
  if (pw.length < 8) return { label: "Weak", color: "#f97316", pct: "40%" };
  if (pw.length < 12 && /[^a-zA-Z0-9]/.test(pw)) return { label: "Good", color: "#eab308", pct: "65%" };
  if (pw.length >= 12) return { label: "Strong", color: "#16a34a", pct: "100%" };
  return { label: "Fair", color: "#f59e0b", pct: "50%" };
}

const PERKS = [
  { icon: "🎯", text: <>ATS score in <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>under 60 seconds</span></> },
  { icon: "🔑", text: <>Keyword <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>gap analysis</span> vs any job</> },
  { icon: "✍️", text: <>One-click AI bullet point <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>rewrites</span></> },
  { icon: "🗂️", text: <>Job tracker with <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>AI matching</span></> },
  { icon: "📈", text: <>Resume evolution <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>timeline tracking</span></> },
  { icon: "🤖", text: <>8-week AI prep <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600 }}>career roadmap</span></> },
];

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { updateMetaTags({ title: "Sign Up — SmartResume" }); }, []);

  const handleSignup = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("username", username);
      fd.append("password", password);
      await api.post("/signup", fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate("/login", { state: { message: "Account created! Log in to get started." } });
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(Array.isArray(d) ? (d[0]?.msg || "Signup failed") : (typeof d === "string" ? d : "Signup failed."));
    } finally { setLoading(false); }
  };

  const strength = getStrength(password);

  return (
    <div className="auth-page grid-lines">
      <div className="auth-bg-blob auth-bg-blob-1" />
      <div className="auth-bg-blob auth-bg-blob-2" />

      {/* Left panel */}
      <div style={{
        width: 460, flexShrink: 0,
        background: "var(--bg-surface)",
        borderRight: "var(--border-brutal-thick)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "40px 48px",
        position: "relative", overflow: "hidden",
      }} className="auth-left-panel">
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

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--text-muted)",
            marginBottom: 20,
          }}>— What you get, free</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "2.2rem", letterSpacing: "-0.04em", lineHeight: 1.1,
            color: "var(--text-primary)", marginBottom: 28,
          }}>
            Everything you need <span className="highlight-accent rotate-right-1" style={{ margin: "4px 0", display: "inline-block", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>to stop getting rejected.</span>
          </h2>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {PERKS.map((perk, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--text-secondary)" }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "var(--radius-sm)",
                  background: "var(--accent-light)",
                  border: "var(--border-brutal)",
                  boxShadow: "2px 2px 0px var(--text-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, flexShrink: 0,
                }}>{perk.icon}</span>
                {perk.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom note */}
        <p style={{ position: "relative", zIndex: 1, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          No credit card. No free trial that expires.<br />
          Just free. Because we were students once too.
        </p>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px 24px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, cursor: "pointer" }} className="auth-mobile-logo" onClick={() => navigate("/")}>
            <div className="nav-logo-icon">SR</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--text-primary)" }}>SmartResume</span>
          </div>

          <div className="auth-card">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: "1.75rem", letterSpacing: "-0.03em",
                color: "var(--text-primary)", marginBottom: 6,
              }}>Create your account.</h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Free forever. No gotchas.</p>
            </div>

            <form onSubmit={handleSignup}>
              {/* Username */}
              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Username</label>
                <input
                  id="signup-username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="e.g. abhishek_dev"
                  className="input-field"
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Email</label>
                <input
                  id="signup-email"
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
                <label className="input-label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="signup-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="min. 6 characters"
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
                  >{showPw ? "Hide" : "Show"}</button>
                </div>
                {/* Strength bar */}
                {strength && (
                  <div style={{ marginTop: 8 }}>
                    <div className="progress-track" style={{ height: 4, background: "var(--bg-elevated)" }}>
                      <div style={{
                        height: "100%", width: strength.pct,
                        background: strength.color,
                        borderRadius: "var(--radius-full)",
                        transition: "all 0.3s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: strength.color, marginTop: 4, display: "block" }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <input
                  type="checkbox"
                  id="signup-terms"
                  required
                  style={{ marginTop: 3, cursor: "pointer", width: 16, height: 16, accentColor: "var(--accent)" }}
                />
                <label htmlFor="signup-terms" style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4, cursor: "pointer" }}>
                  I agree to the <a href="/terms" target="_blank" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "underline" }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "underline" }}>Privacy Policy</a>.
                </label>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <button
                id="signup-submit-btn"
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", height: 46, fontSize: 15 }}
              >
                {loading ? (
                  <><div className="loading-dots" style={{ transform: "scale(0.6)" }}>
                    <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
                  </div> Creating account…</>
                ) : "Create Free Account →"}
              </button>
            </form>

            <div className="divider" style={{ margin: "24px 0 20px" }} />

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--accent)", fontWeight: 700, fontSize: 13,
                  fontFamily: "var(--font-body)",
                }}
              >
                Log in →
              </button>
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
