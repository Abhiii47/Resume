import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, updateMetaTags, handleApiError } from "../utils";
import HeroSection from "../components/HeroSection";
import AuthModal from "../components/AuthModal";

/* ── Navbar ────────────────────────────────────────────────── */
function Navbar({ onLogin, onSignup }) {
  const navigate = useNavigate();
  return (
    <header
      className="fixed top-0 w-full z-50"
      style={{ background: "hsl(40,30%,92%)", borderBottom: "2px solid #000" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div
            className="w-9 h-9 flex items-center justify-center font-black text-white text-sm shadow-hard-sm"
            style={{ background: "hsl(24,100%,50%)", border: "2px solid #000" }}
          >
            SR
          </div>
          <span className="font-black text-lg" style={{ color: "#111", letterSpacing: "-0.03em" }}>SmartResume</span>
        </div>
        <div className="hidden lg:flex items-center gap-8 font-black text-sm uppercase tracking-widest" style={{ color: "#111" }}>
          <a href="/#features" className="hover:text-orange-600 transition-colors cursor-pointer">Features</a>
          <button onClick={() => navigate('/resources')} className="hover:text-orange-600 transition-colors uppercase font-black tracking-widest">Resources</button>
          <button onClick={() => navigate('/how-it-works')} className="hover:text-orange-600 transition-colors uppercase font-black tracking-widest">How it Works</button>
          <button onClick={() => navigate('/about')} className="hover:text-orange-600 transition-colors uppercase font-black tracking-widest">About</button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="text-sm font-bold px-4 py-2" style={{ color: "#555" }}>Log in</button>
          <button onClick={onSignup} className="neu-btn-primary px-5 py-2 text-sm shadow-hard-sm">Get Started — free</button>
        </div>
      </div>
    </header>
  );
}

/* ── Ticker Strip ──────────────────────────────────────────── */
const TICKER_ITEMS = [
  "ATS bots are rejecting you right now",
  "6 seconds. That's all recruiters give your resume.",
  "12,000+ resumes improved",
  "Generic bullet points = instant reject",
  "AI rewrites that actually sound like you",
  "Match score for every job you apply to",
  "Your resume is not fine. It's costing you interviews.",
  "Built for SDE roles, FAANG, campus placements",
];

function TickerStrip() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden py-2.5 border-y-2 border-black" style={{ background: "hsl(24,100%,50%)" }}>
      <div className="flex animate-marquee whitespace-nowrap" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} className="text-xs font-black text-black uppercase tracking-widest" style={{ marginLeft: "2.5rem", marginRight: "2.5rem" }}>
            {item}
            <span style={{ marginLeft: "1.5rem", opacity: 0.4 }}>
              <svg display="inline" width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ verticalAlign: "middle" }}>
                <path d="M4 0L5 3H8L5.5 4.8L6.5 8L4 6L1.5 8L2.5 4.8L0 3H3Z" fill="#111"/>
              </svg>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Section Label ────────────────────────────────────────── */
function SectionLabel({ children, dark = false }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <span style={{ display: "inline-block", width: 28, height: 2, background: dark ? "#555" : "hsl(24,100%,50%)" }} />
      <span
        className="text-xs font-black uppercase tracking-widest"
        style={{ color: dark ? "#888" : "hsl(24,100%,50%)" }}
      >
        {children}
      </span>
      <span style={{ display: "inline-block", width: 28, height: 2, background: dark ? "#555" : "hsl(24,100%,50%)" }} />
    </div>
  );
}

/* ── Pain Points ───────────────────────────────────────────── */
const PAIN_POINTS = [
  {
    color: "#2563EB",
    label: "The silence is loud",
    text: "200 applications. 3 replies. That's not bad luck — that's a broken resume.",
    svg: (
      <svg viewBox="0 0 80 60" width="80" height="60" fill="none">
        <rect x="8" y="30" width="44" height="26" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
        <rect x="14" y="22" width="44" height="26" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5" />
        <rect x="20" y="14" width="44" height="26" fill="white" fillOpacity="0.4" stroke="white" strokeWidth="1.5" />
        <circle cx="58" cy="10" r="10" fill="#FF4444" stroke="white" strokeWidth="1.5" />
        <line x1="53" y1="5" x2="63" y2="15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="63" y1="5" x2="53" y2="15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="26" y1="22" x2="52" y2="22" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="26" y1="27" x2="46" y2="27" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
      </svg>
    ),
  },
  {
    color: "hsl(24,100%,50%)",
    label: "Bot says no",
    text: "Your resume isn't ATS-optimised. A bot rejects it before any human ever sees it.",
    svg: (
      <svg viewBox="0 0 80 60" width="80" height="60" fill="none">
        <rect x="18" y="10" width="44" height="36" rx="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
        <rect x="26" y="20" width="10" height="8" rx="1" fill="white" fillOpacity="0.8" />
        <rect x="44" y="20" width="10" height="8" rx="1" fill="white" fillOpacity="0.8" />
        <rect x="29" y="22" width="4" height="4" fill="#111" />
        <rect x="47" y="22" width="4" height="4" fill="#111" />
        <line x1="40" y1="10" x2="40" y2="2" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="1" r="3" fill="white" />
        <line x1="28" y1="36" x2="52" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <rect x="10" y="50" width="60" height="9" fill="white" fillOpacity="0.3" />
        <text x="40" y="57" textAnchor="middle" fill="white" fontSize="6" fontFamily="monospace" fontWeight="bold" letterSpacing="1">REJECTED</text>
      </svg>
    ),
  },
  {
    color: "#16A34A",
    label: "6 seconds. Gone.",
    text: "Generic bullet points kill your shot. Recruiters decide in 6 seconds flat.",
    svg: (
      <svg viewBox="0 0 80 60" width="80" height="60" fill="none">
        <circle cx="40" cy="34" r="22" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
        <circle cx="40" cy="34" r="2" fill="white" />
        <line x1="40" y1="34" x2="40" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="40" y1="34" x2="52" y2="38" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <rect x="36" y="8" width="8" height="5" rx="2" fill="white" stroke="white" strokeWidth="1" />
        <text x="40" y="40" textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" fontWeight="bold">6s</text>
      </svg>
    ),
  },
  {
    color: "#1a1a1a",
    label: "Ghosted. Again.",
    text: "No feedback. No reason. Just silence. We tell you exactly what went wrong.",
    svg: (
      <svg viewBox="0 0 80 60" width="80" height="60" fill="none">
        <path d="M20 55 L20 28 C20 16 32 8 40 8 C48 8 60 16 60 28 L60 55 L52 48 L44 55 L36 48 L28 55 Z"
          fill="white" fillOpacity="0.12" stroke="white" strokeWidth="1.5" />
        <circle cx="33" cy="30" r="4" fill="white" fillOpacity="0.8" />
        <circle cx="47" cy="30" r="4" fill="white" fillOpacity="0.8" />
        <circle cx="34" cy="31" r="2" fill="#1a1a1a" />
        <circle cx="48" cy="31" r="2" fill="#1a1a1a" />
        <rect x="25" y="44" width="30" height="12" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1" />
        <polyline points="25,44 40,52 55,44" stroke="white" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
];

/* ── Feature blocks ────────────────────────────────────────── */
const FEATURES = [
  {
    cls: "block-blue",
    num: "01",
    title: "ATS Score",
    body: "We run your resume through the same logic ATS software uses. No fluff — just a real score and exactly why you got it.",
    svg: (
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
        <rect x="4" y="4" width="40" height="40" stroke="white" strokeWidth="2" fillOpacity="0" />
        <path d="M12 36 L12 28 L20 28 L20 36" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 36 L20 20 L28 20 L28 36" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 36 L28 14 L36 14 L36 36" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="36" x2="40" y2="36" stroke="white" strokeWidth="2" />
      </svg>
    ),
  },
  {
    cls: "block-orange",
    num: "02",
    title: "Keyword Gap",
    body: "Cross-reference every missing keyword from the job description. Stop guessing what recruiters want to see.",
    svg: (
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
        <circle cx="20" cy="20" r="12" stroke="#111" strokeWidth="2" />
        <line x1="29" y1="29" x2="42" y2="42" stroke="#111" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="20" x2="26" y2="20" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="14" x2="20" y2="26" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    cls: "block-green",
    num: "03",
    title: "AI Rewrites",
    body: "Bad bullet point? One click. Our AI rewrites it with stronger verbs and actual impact metrics that get noticed.",
    svg: (
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
        <rect x="6" y="8" width="28" height="36" stroke="white" strokeWidth="2" />
        <line x1="12" y1="18" x2="28" y2="18" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="12" y1="24" x2="24" y2="24" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
        <path d="M30 28 L36 22 L42 28 L36 34 Z" fill="white" stroke="white" strokeWidth="1" />
        <line x1="36" y1="22" x2="36" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    cls: "block-dark",
    num: "04",
    title: "Job Matcher",
    body: "Paste a job URL. Get your match %, what's missing, what to change. Then apply with confidence.",
    svg: (
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
        <circle cx="16" cy="24" r="10" stroke="hsl(24,100%,50%)" strokeWidth="2" />
        <circle cx="32" cy="24" r="10" stroke="hsl(24,100%,50%)" strokeWidth="2" />
        <path d="M22 18 C26 20 26 28 22 30" fill="hsl(24,100%,50%)" fillOpacity="0.25" stroke="hsl(24,100%,50%)" strokeWidth="1" />
        <text x="24" y="44" textAnchor="middle" fill="hsl(24,100%,50%)" fontSize="7" fontFamily="monospace" fontWeight="bold">MATCH %</text>
      </svg>
    ),
  },
];

/* ── Steps ───────────────────────────────────────────────── */
const STEPS = [
  {
    n: "01", title: "Upload your resume", body: "PDF only. We'll be gentle. Mostly.",
    svg: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <rect x="8" y="4" width="32" height="40" stroke="#111" strokeWidth="2" />
        <polyline points="16,20 24,12 32,20" stroke="hsl(24,100%,50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="24" y1="12" x2="24" y2="32" stroke="hsl(24,100%,50%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="14" y1="36" x2="34" y2="36" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "02", title: "Get a real score", body: "ATS score, keyword density, formatting issues — all of it.",
    svg: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <circle cx="24" cy="24" r="18" stroke="#111" strokeWidth="2" />
        <path d="M24 24 L24 10" stroke="hsl(24,100%,50%)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 24 L34 30" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="2.5" fill="hsl(24,100%,50%)" />
      </svg>
    ),
  },
  {
    n: "03", title: "Fix what's broken", body: "AI suggestions. One-click rewrites. Then land that interview.",
    svg: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <path d="M10 38 L16 32 L28 20 L34 26 L22 38 L10 38 Z" stroke="#111" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <path d="M28 20 L34 14 L38 18 L34 26 Z" fill="hsl(24,100%,50%)" stroke="hsl(24,100%,50%)" strokeWidth="1" />
        <circle cx="16" cy="32" r="2" fill="hsl(24,100%,50%)" />
      </svg>
    ),
  },
];

/* ── Main ──────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authModal, setAuthModal] = useState({ isOpen: false, view: "login" });

  useEffect(() => {
    updateMetaTags({
      title: "SmartResume — Is your resume actually good? Find out.",
      description: "Most resumes get rejected before a human sees them. SmartResume gives you an ATS score, keyword gaps, and AI rewrites — for free.",
      url: window.location.href,
    });
  }, []);

  const handleGuestAnalyze = async () => {
    if (!file) { setError("Drop a PDF first."); return; }
    setLoading(true); setError(""); setResult(null);
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
  const scrollToAnalyzer = () => document.getElementById("guest-analyzer")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(40,30%,92%)" }}>
      <Navbar onLogin={openLogin} onSignup={openSignup} />

      {/* TICKER */}
      <div className="pt-[57px]">
        <TickerStrip />
      </div>

      {/* HERO */}
      <HeroSection
        onUploadClick={() => { scrollToAnalyzer(); document.getElementById("resume-upload")?.click(); }}
        onCheckScoreClick={scrollToAnalyzer}
      />

      {/* PAIN POINTS — cream with grid */}
      <section
        style={{
          background: "hsl(40,28%,88%)",
          borderTop: "2px solid #000",
          borderBottom: "2px solid #000",
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        className="py-20 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <SectionLabel>okay, be honest with yourself</SectionLabel>
          <h2 className="font-display-serif text-4xl md:text-5xl text-center mb-12" style={{ color: "#111", letterSpacing: "-0.03em" }}>
            The{" "}
            <span style={{ textDecoration: "line-through", opacity: 0.35 }}>joy</span>{" "}
            <span className="inline-block px-2 shadow-hard" style={{ background: "hsl(24,100%,50%)", color: "#111", border: "2px solid #000" }}>pain</span>
            {" "}of job hunting.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="p-6 shadow-hard flex flex-col gap-3" style={{ background: p.color, border: "2px solid #000" }}>
                <div>{p.svg}</div>
                <div className="text-xs font-mono uppercase tracking-widest text-white" style={{ opacity: 0.6 }}>{p.label}</div>
                <p className="text-base font-semibold leading-snug text-white">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STRIKETHROUGH TRANSITION — white */}
      <section style={{ background: "#fff", borderBottom: "2px solid #000" }} className="py-20 px-6 text-center">
        <SectionLabel>introducing</SectionLabel>
        <h2 className="font-display-serif text-5xl md:text-7xl mb-6" style={{ color: "#111", letterSpacing: "-0.03em" }}>
          <span style={{ textDecoration: "line-through", opacity: 0.25, fontStyle: "italic" }}>Manually Editing</span>
          <br />
          <span className="inline-block px-4 py-1 shadow-hard" style={{ background: "hsl(24,100%,50%)", color: "#111", border: "2px solid #000" }}>
            AI Automation!!
          </span>
        </h2>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "#666" }}>
          Introducing{" "}
          <span className="inline-block px-3 py-0.5 font-black shadow-hard-sm" style={{ background: "#111", color: "#fff", border: "2px solid #000" }}>SmartResume</span>
          {" "}— your AI career co-pilot that does the grind for you.
        </p>
      </section>

      {/* ANALYZER — cream-light */}
      <section
        id="guest-analyzer"
        style={{
          background: "hsl(40,30%,92%)",
          borderBottom: "2px solid #000",
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        className="py-20 px-6"
      >
        <div className="max-w-3xl mx-auto">
          <SectionLabel>free instant check</SectionLabel>
          <div className="p-8 lg:p-12 shadow-hard" style={{ background: "#fff", border: "2px solid #000" }}>
            <h2 className="font-display-serif text-3xl md:text-4xl mb-2" style={{ color: "#111", letterSpacing: "-0.03em" }}>
              Drop your resume.{" "}
              <span style={{ color: "hsl(24,100%,50%)" }}>We&apos;ll be honest.</span>
            </h2>
            <p className="text-sm mb-8" style={{ color: "#888" }}>Your friends tell you it looks great. We won&apos;t.</p>

            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-36 cursor-pointer" style={{ border: "2px dashed #000", background: "#fafafa" }}>
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#888" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-bold text-sm" style={{ color: file ? "hsl(24,100%,50%)" : "#555" }}>
                  {file ? file.name : "Click to upload your resume (PDF)"}
                </p>
                <p className="text-xs mt-1" style={{ color: "#aaa" }}>Max 10MB</p>
                <input id="resume-upload" type="file" className="hidden" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#555" }}>Paste Job Description (optional)</label>
                <textarea rows={4} className="cream-input resize-none" placeholder="Paste the job description here for a better match score..." value={jd} onChange={e => setJd(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#555" }}>Years of Experience</label>
                <input type="number" min="0" className="cream-input" placeholder="e.g. 2" value={years} onChange={e => setYears(e.target.value)} />
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 text-sm font-semibold" style={{ background: "#FEE2E2", border: "2px solid #FECACA", color: "#991B1B" }}>{error}</div>
            )}

            <button
              onClick={handleGuestAnalyze}
              disabled={loading || !file}
              className="w-full py-4 text-base font-bold shadow-hard"
              style={{ background: loading || !file ? "#999" : "#111", color: "#fff", border: "2px solid #000", cursor: loading || !file ? "not-allowed" : "pointer" }}
            >
              {loading ? "Analyzing..." : "Check My Score →"}
            </button>

            {result && (
              <div className="mt-8 pt-6" style={{ borderTop: "2px solid #e5e7eb" }}>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#999" }}>Your ATS Score</div>
                    <div className="text-6xl font-black" style={{ color: "hsl(24,100%,50%)", fontFamily: "Playfair Display, serif" }}>{Math.round(result.ats_score)}</div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg mb-1" style={{ color: "#111" }}>Scan complete.</p>
                    <p className="text-sm mb-4" style={{ color: "#888" }}>Create a free account to see the full breakdown — keyword gaps, formatting issues, and AI fix suggestions.</p>
                    <button onClick={openSignup} className="neu-btn-primary px-6 py-2.5 text-sm shadow-hard-sm">See Full Report — free →</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — white */}
      <section style={{ background: "#fff", borderBottom: "2px solid #000" }} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>no vibes. just the actual process.</SectionLabel>
          <h2 className="font-display-serif text-4xl md:text-5xl text-center mb-16" style={{ color: "#111", letterSpacing: "-0.03em" }}>
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-0 w-full h-0.5" style={{ background: "#e5e7eb" }} />
            {STEPS.map(s => (
              <div key={s.n} className="cream-card-block p-8 text-center relative z-10">
                <div className="flex justify-center mb-4">{s.svg}</div>
                <div
                  className="w-12 h-12 flex items-center justify-center mx-auto mb-4 font-black text-lg"
                  style={{ border: "2px solid hsl(24,100%,50%)", color: "hsl(24,100%,50%)", background: "#fff" }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-base mb-2 uppercase tracking-tight" style={{ color: "#111" }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "#777" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — cream with grid */}
      <section
        id="features"
        style={{
          background: "hsl(40,28%,88%)",
          borderBottom: "2px solid #000",
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        className="py-24 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <SectionLabel>what we check</SectionLabel>
          <h2 className="font-display-serif text-4xl md:text-5xl text-center mb-3" style={{ color: "#111", letterSpacing: "-0.03em" }}>
            Features <span style={{ color: "#aaa", fontSize: "0.55em", fontStyle: "italic", fontWeight: 400 }}>...of course...</span>
          </h2>
          <p className="text-center text-sm mb-16" style={{ color: "#888" }}>
            Because no product is complete without a buzzword-filled feature list. Here&apos;s ours. You&apos;re welcome.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.num} className={`${f.cls} p-7 shadow-hard transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1`}>
                <div className="mb-4">{f.svg}</div>
                <div className="text-xs font-bold uppercase tracking-widest mb-3 opacity-50">{f.num}</div>
                <h3 className="font-black text-2xl mb-3" style={{ letterSpacing: "-0.03em" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed opacity-90">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={openSignup} className="neu-btn-primary px-10 py-4 text-base shadow-hard">Get Full Access — Free →</button>
          </div>
        </div>
      </section>

      {/* STATS STRIP — orange */}
      <section style={{ background: "hsl(24,100%,50%)", borderBottom: "2px solid #000" }} className="py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "12K+", label: "Resumes analyzed",
              svg: <svg viewBox="0 0 32 32" width="28" height="28" fill="none"><rect x="4" y="4" width="24" height="30" stroke="#111" strokeWidth="2" /><line x1="9" y1="12" x2="23" y2="12" stroke="#111" strokeWidth="1.5" /><line x1="9" y1="17" x2="23" y2="17" stroke="#111" strokeWidth="1.5" /><line x1="9" y1="22" x2="18" y2="22" stroke="#111" strokeWidth="1.5" /></svg>
            },
            { num: "3.2x", label: "More callbacks",
              svg: <svg viewBox="0 0 32 32" width="28" height="28" fill="none"><path d="M6 26 C8 18 14 10 26 6" stroke="#111" strokeWidth="2.5" strokeLinecap="round" /><polyline points="20,6 26,6 26,12" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            },
            { num: "87%", label: "ATS pass rate after fix",
              svg: <svg viewBox="0 0 32 32" width="28" height="28" fill="none"><circle cx="16" cy="16" r="12" stroke="#111" strokeWidth="2" /><polyline points="10,16 14,20 22,12" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            },
            { num: "< 60s", label: "To your first score",
              svg: <svg viewBox="0 0 32 32" width="28" height="28" fill="none"><circle cx="16" cy="18" r="11" stroke="#111" strokeWidth="2" /><line x1="16" y1="18" x2="16" y2="10" stroke="#111" strokeWidth="2" strokeLinecap="round" /><line x1="16" y1="18" x2="21" y2="21" stroke="#111" strokeWidth="2" strokeLinecap="round" /><rect x="12" y="4" width="8" height="3" rx="1" fill="#111" /></svg>
            },
          ].map(stat => (
            <div key={stat.label}>
              <div className="flex justify-center mb-2">{stat.svg}</div>
              <div className="text-4xl font-black text-black" style={{ fontFamily: "Playfair Display, serif" }}>{stat.num}</div>
              <div className="text-xs font-bold text-black uppercase tracking-wide mt-1" style={{ opacity: 0.65 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONVINCED — dark (only this section intentionally dark) */}
      <section style={{ background: "#111" }} className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display-serif text-5xl md:text-7xl mb-6" style={{ color: "#fff", letterSpacing: "-0.03em" }}>
            Convinced?{" "}
            <span className="inline-block px-3 shadow-hard" style={{ background: "hsl(24,100%,50%)", color: "#111" }}>Good.</span>
          </h2>
          <p className="text-lg mb-4" style={{ color: "#aaa" }}>
            Try SmartResume —{" "}
            <span className="inline-block px-2 font-bold" style={{ background: "hsl(24,100%,50%)", color: "#111", border: "1px solid #000" }}>it&apos;s free</span>
          </p>
          <button
            onClick={openSignup}
            className="px-12 py-5 text-lg font-bold shadow-hard mb-8"
            style={{ background: "#fff", color: "#111", border: "2px solid #fff" }}
          >
            LET&apos;S GO →
          </button>
          <div style={{ borderTop: "1px solid #333" }} className="pt-8 mt-4">
            <p style={{ color: "#666" }}>Not convinced? <em style={{ color: "#888" }}>That&apos;s cute.</em></p>
            <p className="text-lg mt-2" style={{ color: "#ccc" }}>
              Try it anyway →{" "}
              <span className="strike" style={{ color: "#666" }}>hate it</span>{" "}
              <span className="inline-block px-2" style={{ background: "hsl(24,100%,50%)", color: "#111", fontWeight: 700 }}>love it</span>
              {" "}→ get hired
            </p>
            <p className="text-xs mt-4" style={{ color: "#555" }}>(still free btw — we&apos;re not running a charity, we&apos;re running on vibes)</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0a0a0a", borderTop: "2px solid #1a1a1a" }} className="pt-16 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 flex items-center justify-center font-black text-white text-sm" style={{ background: "hsl(24,100%,50%)", border: "2px solid #333" }}>SR</div>
                <span className="font-black text-lg text-white" style={{ letterSpacing: "-0.03em" }}>SmartResume</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: "#666", lineHeight: 1.7 }}>Honest, AI-powered resume feedback. Built for students who want real feedback, not false hope.</p>
              <div className="flex gap-4 mt-5">
                <a href="https://github.com/Abhiii47/Resume" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" style={{ color: "#555" }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Platform</h4>
              <ul className="space-y-3 text-sm" style={{ color: "#555" }}>
                <li onClick={() => navigate('/how-it-works')} className="hover:text-white cursor-pointer transition-colors">How It Works</li>
                <li onClick={() => navigate('/templates')} className="hover:text-white cursor-pointer transition-colors">Resume Templates</li>
                <li onClick={() => navigate('/resources')} className="hover:text-white cursor-pointer transition-colors">Career Resources</li>
                <li onClick={() => navigate('/about')} className="hover:text-white cursor-pointer transition-colors">About Us</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Legal</h4>
              <ul className="space-y-3 text-sm" style={{ color: "#555" }}>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: "1px solid #1a1a1a" }}>
            <span className="text-xs" style={{ color: "#444" }}>© 2026 SmartResume. All rights reserved.</span>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authModal.isOpen} onClose={() => setAuthModal({ ...authModal, isOpen: false })} initialView={authModal.view} />
    </div>
  );
}
