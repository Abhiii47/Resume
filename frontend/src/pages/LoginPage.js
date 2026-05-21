import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE, setAuthToken, updateMetaTags } from "../utils";

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

/* ── Rotating Truths (left panel) ─────────────────────────── */
const TRUTHS = [
  { stat: "6s",    copy: "That's how long a recruiter looks at your resume. Make them stop." },
  { stat: "75%",   copy: "Of resumes never reach a human. An ATS bot kills them first." },
  { stat: "200+",  copy: "Applications sent. 3 replies. It's not the market — it's the resume." },
  { stat: "87%",   copy: "Of SmartResume users pass ATS after fixing their score." },
  { stat: "< 60s", copy: "To get your first honest resume score. No credit card. No BS." },
];

function RotatingTruth() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % TRUTHS.length); setVisible(true); }, 400);
    }, 3600);
    return () => clearInterval(interval);
  }, []);
  const t = TRUTHS[idx];
  return (
    <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease", minHeight: 100 }}>
      <div className="text-7xl font-black mb-3" style={{ color: "hsl(24,100%,50%)", fontFamily: "Playfair Display, serif", letterSpacing: "-0.04em" }}>
        {t.stat}
      </div>
      <p className="text-base font-semibold leading-snug" style={{ color: "#ccc", maxWidth: 280 }}>{t.copy}</p>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    updateMetaTags({ title: "Log in — SmartResume" });
    if (location.state?.message) setSuccess(location.state.message);
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      const { data } = await axios.post(`${API_BASE}/login`, params, {
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
          <div
            className="w-10 h-10 flex items-center justify-center font-black text-white text-sm"
            style={{ background: "hsl(24,100%,50%)", border: "2px solid #333" }}
          >SR</div>
          <span className="font-black text-lg text-white" style={{ letterSpacing: "-0.03em" }}>SmartResume</span>
        </div>

        {/* Rotating truth */}
        <div className="relative z-10">
          <div className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: "#555" }}>
            — did you know
          </div>
          <RotatingTruth />
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10 p-5" style={{ border: "1px solid #222", background: "#0d0d0d" }}>
          <p className="text-sm font-semibold leading-relaxed" style={{ color: "#888" }}>
            &ldquo;Went from 0 callbacks to 3 interviews in 2 weeks after fixing my ATS score.&rdquo;
          </p>
          <p className="text-xs font-black mt-2" style={{ color: "hsl(24,100%,50%)" }}>— 3rd year CSE, NIT Trichy</p>
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
              <h1 className="text-3xl font-black text-white mb-1" style={{ letterSpacing: "-0.03em" }}>Welcome back.</h1>
              <p className="text-sm" style={{ color: "#666" }}>Your resume score is waiting for you.</p>
            </div>

            {success && (
              <div className="mb-6 px-4 py-3 text-sm font-bold" style={{ background: "#052e16", border: "2px solid #16a34a", color: "#4ade80" }}>
                {success}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
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
                    required autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 text-sm font-medium outline-none transition-all"
                    style={{ background: "#0a0a0a", border: "2px solid #2a2a2a", color: "#fff", fontFamily: "inherit" }}
                    onFocus={e => e.target.style.borderColor = "hsl(24,100%,50%)"}
                    onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase"
                    style={{ color: "#444", cursor: "none" }}
                  >
                    {showPw ? "hide" : "show"}
                  </button>
                </div>
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
                    <span className="w-4 h-4 border border-border shadow-soft border-t-transparent animate-spin inline-block" />
                    Logging in...
                  </span>
                ) : "Log In →"}
              </MagBtn>
            </form>

            <div className="mt-8 pt-6 text-center" style={{ borderTop: "1px solid #1f1f1f" }}>
              <p className="text-sm" style={{ color: "#555" }}>
                No account?{" "}
                <button onClick={() => navigate("/signup")} className="font-black" style={{ color: "hsl(24,100%,50%)", cursor: "none" }}>Create one free →</button>
              </p>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "#333" }}>No credit card. No trial expiry. Just free.</p>
        </div>
      </div>
    </div>
  );
}
