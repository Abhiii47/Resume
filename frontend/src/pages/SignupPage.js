import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, updateMetaTags } from "../utils";

/* ── Cursor Dot ───────────────────────────────────────────── */
function CursorDot() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const pos     = useRef({ x: 0, y: 0 });
  const ring    = useRef({ x: 0, y: 0 });
  const raf     = useRef(null);
  useEffect(() => {
    const move = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", move);
    const tick = () => {
      if (dotRef.current) { dotRef.current.style.left = pos.current.x + "px"; dotRef.current.style.top = pos.current.y + "px"; }
      if (ringRef.current) {
        ring.current.x += (pos.current.x - ring.current.x) * 0.14;
        ring.current.y += (pos.current.y - ring.current.y) * 0.14;
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top  = ring.current.y + "px";
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf.current); };
  }, []);
  return (
    <>
      <div ref={dotRef}  style={{ position:"fixed", pointerEvents:"none", zIndex:9999, width:8,  height:8,  borderRadius:"50%", background:"hsl(24,100%,50%)", transform:"translate(-50%,-50%)", top:0, left:0 }} />
      <div ref={ringRef} style={{ position:"fixed", pointerEvents:"none", zIndex:9998, width:32, height:32, borderRadius:"50%", border:"1.5px solid hsl(24,100%,50%)", transform:"translate(-50%,-50%)", top:0, left:0, opacity:0.5 }} />
    </>
  );
}

/* ── Magnetic Button ──────────────────────────────────────── */
function MagBtn({ children, type, disabled, className, style }) {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current; if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const dx = (e.clientX - left - width  / 2) * 0.3;
    const dy = (e.clientY - top  - height / 2) * 0.3;
    el.style.transform = `translate(${dx}px,${dy}px)`;
    el.style.transition = "transform 0.15s ease";
  }, []);
  const onLeave = useCallback(() => {
    if (ref.current) { ref.current.style.transform = "translate(0,0)"; ref.current.style.transition = "transform 0.5s ease"; }
  }, []);
  return (
    <button ref={ref} type={type} disabled={disabled} className={className} style={{ ...style, willChange: "transform" }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </button>
  );
}

/* ── Left Panel — Feature Checklist ──────────────────────── */
const PERKS = [
  "ATS score in under 60 seconds",
  "Keyword gap analysis vs any job description",
  "One-click AI bullet point rewrites",
  "Job matcher — paste URL, get match %",
  "Full resume history & evolution tracking",
  "8-week AI prep roadmap for your target company",
];

/* ── Password Strength ────────────────────────────────────── */
function strengthLabel(pw) {
  if (!pw) return null;
  if (pw.length < 6) return { label: "Too short", color: "#ef4444", width: "20%" };
  if (pw.length < 8) return { label: "Weak",      color: "#f97316", width: "40%" };
  if (pw.length < 12 && /[^a-zA-Z0-9]/.test(pw)) return { label: "Good", color: "#eab308", width: "65%" };
  if (pw.length >= 12) return { label: "Strong",  color: "#22c55e", width: "100%" };
  return { label: "Fair", color: "#f59e0b", width: "50%" };
}

/* ── Main ─────────────────────────────────────────────────── */
export default function SignupPage() {
  const [email, setEmail]       = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => { updateMetaTags({ title: "Sign Up — SmartResume" }); }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("username", username);
      formData.append("password", password);
      await axios.post(`${API_BASE}/signup`, formData);
      navigate("/login", { state: { message: "Account created! Log in to get started." } });
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(Array.isArray(d) ? (d[0]?.msg || "Signup failed") : (typeof d === "string" ? d : "Signup failed."));
    } finally { setLoading(false); }
  };

  const strength = strengthLabel(password);

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      <CursorDot />

      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[480px] shrink-0 relative overflow-hidden"
        style={{ background: "#111", borderRight: "2px solid #1f1f1f" }}
      >
        {/* grid bg */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 flex items-center justify-center font-black text-white text-sm" style={{ background: "hsl(24,100%,50%)", border: "2px solid #333" }}>SR</div>
          <span className="font-black text-lg text-white" style={{ letterSpacing: "-0.03em" }}>SmartResume</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#555" }}>— what you get, free</p>
          <h2 className="font-black text-4xl text-white mb-8" style={{ letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            Everything you need<br />
            <span style={{ color: "hsl(24,100%,50%)" }}>to stop getting rejected.</span>
          </h2>
          <ul className="space-y-3">
            {PERKS.map((perk, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-medium" style={{ color: "#aaa" }}>
                <span className="mt-0.5 shrink-0" style={{ color: "hsl(24,100%,50%)", fontSize: 18, lineHeight: 1 }}>✓</span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom note */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: "#333" }}>No credit card. No free trial that expires.<br />Just free. Because we were students once too.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 flex items-center justify-center font-black text-white text-sm" style={{ background: "hsl(24,100%,50%)", border: "2px solid #333" }}>SR</div>
            <span className="font-black text-lg text-white" style={{ letterSpacing: "-0.03em" }}>SmartResume</span>
          </div>

          {/* Card */}
          <div className="relative p-8 lg:p-10" style={{ background: "#111", border: "2px solid #222", boxShadow: "6px 6px 0px 0px hsl(24,100%,50%)" }}>
            {/* Corner accents */}
            <div style={{ position:"absolute", top:-2, left:-2, width:14, height:14, borderTop:"2px solid hsl(24,100%,50%)", borderLeft:"2px solid hsl(24,100%,50%)" }} />
            <div style={{ position:"absolute", bottom:-2, right:-2, width:14, height:14, borderBottom:"2px solid hsl(24,100%,50%)", borderRight:"2px solid hsl(24,100%,50%)" }} />

            <div className="mb-8" style={{ borderBottom: "1px solid #1f1f1f", paddingBottom: "1.5rem" }}>
              <h1 className="text-3xl font-black text-white mb-1" style={{ letterSpacing: "-0.03em" }}>Create your account.</h1>
              <p className="text-sm" style={{ color: "#666" }}>Free forever. No gotchas.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#555" }}>Username</label>
                <input
                  value={username} onChange={e => setUsername(e.target.value)}
                  required autoComplete="username"
                  placeholder="e.g. abhishek_dev"
                  className="w-full px-4 py-3 text-sm font-medium outline-none transition-all"
                  style={{ background: "#0a0a0a", border: "2px solid #2a2a2a", color: "#fff", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "hsl(24,100%,50%)"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#555" }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm font-medium outline-none transition-all"
                  style={{ background: "#0a0a0a", border: "2px solid #2a2a2a", color: "#fff", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "hsl(24,100%,50%)"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#555" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete="new-password"
                    placeholder="min. 6 characters"
                    className="w-full px-4 py-3 pr-12 text-sm font-medium outline-none transition-all"
                    style={{ background: "#0a0a0a", border: "2px solid #2a2a2a", color: "#fff", fontFamily: "inherit" }}
                    onFocus={e => e.target.style.borderColor = "hsl(24,100%,50%)"}
                    onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase"
                    style={{ color: "#444", cursor: "none" }}
                  >{showPw ? "hide" : "show"}</button>
                </div>
                {/* Strength bar */}
                {strength && (
                  <div className="mt-2">
                    <div style={{ height: 3, background: "#1f1f1f", marginBottom: 4 }}>
                      <div style={{ height: 3, width: strength.width, background: strength.color, transition: "all 0.3s ease" }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm font-bold" style={{ background: "#1f0000", border: "2px solid #7f1d1d", color: "#fca5a5" }}>
                  <span style={{ color: "#ef4444" }}>✕</span> {error}
                </div>
              )}

              <MagBtn
                type="submit" disabled={loading}
                className="w-full py-4 text-base font-black uppercase tracking-widest mt-2"
                style={{ background: loading ? "#333" : "hsl(24,100%,50%)", color: "#111", border: "2px solid #000", boxShadow: "4px 4px 0px 0px #000", cursor: loading ? "not-allowed" : "none" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border border-border shadow-[4px_4px_0_#000] border-t-transparent animate-spin inline-block" />
                    Creating account...
                  </span>
                ) : "Create Free Account →"}
              </MagBtn>
            </form>

            <div className="mt-8 pt-6 text-center" style={{ borderTop: "1px solid #1f1f1f" }}>
              <p className="text-sm" style={{ color: "#555" }}>
                Already have an account?{" "}
                <button onClick={() => navigate("/login")} className="font-black" style={{ color: "hsl(24,100%,50%)", cursor: "none" }}>Log in →</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
