import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, updateMetaTags, handleApiError } from "../utils";
import AppLayout from "../components/AppLayout";
import AuthModal from "../components/AuthModal";

/* ─────────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────────── */
function useTilt(strength = 12) {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale(1.03)`;
    el.style.transition = "transform 0.08s ease";
  }, [strength]);
  const onLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)";
      ref.current.style.transition = "transform 0.45s ease";
    }
  }, []);
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

function useMagnetic(distance = 0.35) {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;
    const dx = (e.clientX - cx) * distance;
    const dy = (e.clientY - cy) * distance;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.transition = "transform 0.15s ease";
  }, [distance]);
  const onLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = "translate(0,0)";
      ref.current.style.transition = "transform 0.5s ease";
    }
  }, []);
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

/* Scroll reveal — adds .sr-visible when element enters viewport */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".sr");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("sr-visible");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* Animated counter — counts up from 0 to end when triggered */
function useCounter(end, triggered, duration = 1200) {
  const [val, setVal] = useState("0");
  const rafRef = useRef(null);
  useEffect(() => {
    if (!triggered) return;
    const t0 = performance.now();
    const isFloat = String(end).includes(".");
    const numericEnd = parseFloat(end);
    if (isNaN(numericEnd)) {
      setVal(String(end));
      return;
    }
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = eased * numericEnd;
      setVal(isFloat ? current.toFixed(1) : String(Math.round(current)));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setVal(isFloat ? String(numericEnd.toFixed(1)) : String(numericEnd));
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [triggered, end, duration]);
  return val;
}

/* ─────────────────────────────────────────────────────────────
   ANALYZER MINI PREVIEW (right card)
───────────────────────────────────────────────────────────── */
function AnalyzerPreview({ file, jd, years, result, loading, error, onFileChange, onAnalyze, onSignup }) {
  const MagBtn = ({ children, onClick, className, style, disabled }) => {
    const mag = useMagnetic(0.25);
    return (
      <button
        {...mag}
        onClick={onClick}
        disabled={disabled}
        className={className}
        style={{ ...style, willChange: "transform" }}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 text-xs" style={{ color: "#E5E7EB" }}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-slate-400">
          Live match preview
        </div>
        <div
          className="px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
          style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(148,163,184,0.6)" }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "999px",
              background: "#22C55E",
              boxShadow: "0 0 10px rgba(34,197,94,0.9)",
            }}
          />
          <span>{result ? `${Math.round(result.ats_score)}% match` : "Waiting for scan"}</span>
        </div>
      </div>

      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-1"
        style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(15,23,42,0.8)" }}
      >
        <div
          style={{
            width: `${result ? Math.min(100, Math.max(5, Math.round(result.ats_score))) : 12}%`,
            height: "100%",
            background: "linear-gradient(90deg,#f97316,#22c55e)",
            transition: "width 200ms ease-out",
          }}
        />
      </div>

      <div
        className="grid grid-cols-2 gap-2 text-[10px]"
        style={{ borderRadius: 14, border: "1px solid rgba(148,163,184,0.5)", padding: 6, background: "rgba(15,23,42,0.75)" }}
      >
        <label className="flex flex-col gap-1">
          <span className="uppercase tracking-[0.18em] text-slate-400">Resume PDF</span>
          <button
            type="button"
            onClick={() => document.getElementById("landing-mini-upload")?.click()}
            className="text-left px-2 py-1.5 rounded-md"
            style={{
              background: "rgba(15,23,42,0.9)",
              border: "1px dashed rgba(148,163,184,0.7)",
              color: file ? "#f97316" : "#9CA3AF",
            }}
          >
            {file ? file.name : "Upload PDF"}
          </button>
          <input
            id="landing-mini-upload"
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="uppercase tracking-[0.18em] text-slate-400">Experience</span>
          <input
            type="number"
            min="0"
            value={years}
            onChange={(e) => years !== undefined && onFileChange && null}
            className="w-full px-2 py-1.5 rounded-md bg-slate-950/60 border border-slate-700 text-slate-100"
            placeholder="2 yrs"
            style={{ fontSize: 11 }}
          />
          <span className="text-[9px] text-slate-500">Optional, for context</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-[10px]">
        <span className="uppercase tracking-[0.18em] text-slate-400">JD snippet</span>
        <div
          className="rounded-xl p-2"
          style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(30,64,175,0.8)" }}
        >
          <p className="text-[10px] text-slate-300 line-clamp-4">
            {jd
              ? jd
              : "Paste the job description on the main page to see live keyword and match updates here."}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="mt-1 px-2 py-1.5 rounded-md text-[10px]"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.6)", color: "#fecaca" }}
        >
          {error}
        </div>
      )}

      <MagBtn
        onClick={onAnalyze}
        disabled={loading || !file}
        className="mt-2 w-full text-[11px] font-semibold tracking-[0.18em] uppercase"
        style={{
          padding: "8px 10px",
          borderRadius: 999,
          background: loading || !file ? "#4B5563" : "#F9FAFB",
          color: loading || !file ? "#9CA3AF" : "#020617",
          border: "1px solid rgba(15,23,42,0.9)",
        }}
      >
        {loading ? "Analyzing…" : file ? "Run quick check" : "Attach resume to start"}
      </MagBtn>

      {result && (
        <button
          type="button"
          onClick={onSignup}
          className="mt-2 w-full text-[10px] font-semibold tracking-[0.18em] uppercase border border-slate-600 rounded-full px-3 py-1.5 text-slate-300 hover:bg-slate-800/80 transition"
        >
          View full report on dashboard →
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN LANDING
───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authModal, setAuthModal] = useState({ isOpen: false, view: "login" });

  useScrollReveal();

  useEffect(() => {
    updateMetaTags({
      title: "AI Resume Matcher — Score and optimize your resume for any job",
      description: "Paste a job description, upload your resume, and get an instant match score, keyword gaps, and AI‑powered rewrite suggestions.",
      url: window.location.href,
    });
  }, []);

  const handleGuestAnalyze = async () => {
    if (!file) {
      setError("Drop a PDF first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("jd", jd);
    fd.append("years", years || 0);
    try {
      const { data } = await axios.post(`${API_BASE}/guest-analyze-resume/`, fd);
      setResult(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const openLogin = () => setAuthModal({ isOpen: true, view: "login" });
  const openSignup = () => setAuthModal({ isOpen: true, view: "signup" });

  const leftContent = (
    <>
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        <span>AI‑powered resume matcher</span>
      </div>
      <h1 className="hero-title">
        Match your <span>resume</span> to any job in seconds.
      </h1>
      <p className="hero-subtitle">
        Upload a resume, paste the job description, and get a match score, missing keywords, and AI‑ready bullet suggestions in one funky interface.
      </p>
      <div className="hero-actions">
        <button
          className="btn-primary"
          onClick={() => document.getElementById("landing-mini-upload")?.click()}
        >
          <span>Start matching</span>
          <span>↗</span>
        </button>
        <button className="btn-ghost" onClick={openSignup}>
          <span>Create free account</span>
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-400">
        <span>✓ Built for ATS screening</span>
        <span>✓ Works with PDFs</span>
        <span>✓ No credit card</span>
      </div>
    </>
  );

  const rightContent = (
    <AnalyzerPreview
      file={file}
      jd={jd}
      years={years}
      result={result}
      loading={loading}
      error={error}
      onFileChange={setFile}
      onAnalyze={handleGuestAnalyze}
      onSignup={openSignup}
    />
  );

  return (
    <>
      <AppLayout left={leftContent} right={rightContent} />
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        initialView={authModal.view}
      />
    </>
  );
}
