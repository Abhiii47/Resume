import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { updateMetaTags, handleApiError } from "../utils";
import AuthModal from "../components/AuthModal";
import Navbar from "../components/Navbar";
import WalkthroughVideoPlayer from "../components/ui/WalkthroughVideoPlayer";
import AgentShowcase from "../components/ui/AgentShowcase";
import { motion } from "framer-motion";


// Trigger watcher rebuild
/* ── Scroll Reveal ─────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".sr");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("sr-visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.08 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Animated Counter ──────────────────────────────────────────── */
function Counter({ end, suffix = "", triggered }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!triggered) return;
    const t0 = performance.now();
    const dur = 1400;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * parseFloat(end)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [triggered, end]);
  return <span className="text-mono">{val}{suffix}</span>;
}

/* ── Features Data ─────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "🎯",
    title: "ATS Score Engine",
    desc: "Get a 7-dimension ATS score in seconds. Keyword gap analysis, impact scoring, and formatting grade — all in one report.",
    color: "#d97706",
    size: "large",
  },
  {
    icon: "🤖",
    title: "AI Copilot",
    desc: "Nova, your agentic career AI, proactively surfaces insights, rewrites bullets, and coaches you through interviews.",
    color: "#b45309",
    size: "normal",
  },
  {
    icon: "📄",
    title: "Resume Builder",
    desc: "ATS-optimized templates with live preview and one-click PDF export.",
    color: "#0284c7",
    size: "normal",
  },
  {
    icon: "🗂️",
    title: "Job Tracker",
    desc: "Kanban-style application tracker with AI job matching and gap analysis per role.",
    color: "#16a34a",
    size: "normal",
  },
  {
    icon: "📈",
    title: "Progress Tracking",
    desc: "Watch your resume score evolve with the evolution timeline across every revision.",
    color: "#7c3aed",
    size: "normal",
  },
  {
    icon: "🎓",
    title: "Learning Hub",
    desc: "Curated DSA, system design, and behavioral resources used by FAANG-ready engineers.",
    color: "#db2777",
    size: "normal",
  },
];

const STATS = [
  { label: "Resumes Scored", value: 2400, suffix: "+" },
  { label: "Avg ATS Score Lift", value: 38, suffix: " pts" },
  { label: "Premium Templates", value: 7, suffix: "" },
  { label: "Uptime", value: 99.9, suffix: "%" },
];

const TESTIMONIALS = [
  {
    quote: "The ATS score engine helped me realize my resume was lacking measurable impact metrics. The feedback was spot on.",
    name: "Beta Tester A.",
    role: "Software Engineering Student",
    avatar: "A",
    color: "#d97706",
  },
  {
    quote: "Nova AI rewrote my bullet points beautifully. The UI is clean and the job tracker Kanban board keeps me organized.",
    name: "Beta Tester B.",
    role: "Recent CS Graduate",
    avatar: "B",
    color: "#0284c7",
  },
  {
    quote: "I loved being able to see the AI's thought process in the Trace Log. It really helps you understand what recruiters look for.",
    name: "Beta Tester C.",
    role: "Backend Developer",
    avatar: "C",
    color: "#16a34a",
  },
];

const FAQS = [
  {
    q: "How does the ATS Score Engine evaluate my resume?",
    a: "Our engine parses your PDF resume and evaluates it against industry criteria across 7 core dimensions: keyword density, action verb strength, measurable impact metrics, layout density, section completeness, word count, and margin formatting. By pasting a job description, it dynamically maps keyword gaps and calculates your role match score."
  },
  {
    q: "Can I choose different templates in the Resume Builder?",
    a: "Yes! We support 7 premium, professionally-designed templates tailored for different career stages and industries: Classic Professional, Modern Developer, Minimal Impact, Executive Two-Column, Creative Designer, Academic Researcher, and Startup Specialist. All styles are optimized for standard parser readability."
  },
  {
    q: "What is the AI Copilot Nova and the Trace log?",
    a: "SmartResume includes a multi-agent AI system powered by LLMs (Groq & Gemini). Nova (the coordinator agent) can delegate work to specialized subagents like the Bullet Coder or the Interview Coach. The Trace Log displays the behind-the-scenes reasoning steps, letting you see exactly how the AI structures its decisions."
  },
  {
    q: "How does the Kanban Job Tracker link to my resumes?",
    a: "For every job application card you add to your Kanban board, you can paste its specific job description. Our AI analyzes the job description against your resume, calculates a custom ATS match score, and lists the top 3 keyword fixes. You can then trigger the builder to auto-tailor a copy of your resume for that exact job."
  },
  {
    q: "Is my data stored securely?",
    a: "Absolutely. All resume contents and profile data are stored in a secure PostgreSQL database associated with your JWT user session. We do not sell your personal data or share your resume text with third parties. AI processing is performed over secure, authenticated API tunnels."
  }
];

/* ── Resume Preview Card ────────────────────────────────────────── */
function ResumePreview({ file, jd, result, loading, error, onFileChange, onAnalyze, onSignup }) {
  return (
    <div style={{
      background: "#fff",
      border: "var(--border-brutal)",
      borderRadius: "var(--radius-sm)",
      padding: "28px",
      boxShadow: "var(--shadow-brutal-lg)",
      width: "100%",
      maxWidth: 400,
      transform: "rotate(1deg)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>
            <span className="section-label-text">Live ATS Check</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>Upload resume for a free score</p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px",
          background: result ? "#dcfce7" : "var(--bg-surface)",
          border: "var(--border-brutal)",
          boxShadow: "2px 2px 0 var(--text-primary)",
          borderRadius: "var(--radius-sm)",
          fontSize: 11, fontWeight: 700,
          color: "var(--text-primary)",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: result ? "#16a34a" : "#a8a29e",
            boxShadow: result ? "0 0 8px rgba(22,163,74,0.6)" : "none",
          }} />
          {result ? `${Math.round(result.ats_score)}% match` : "Waiting"}
        </div>
      </div>

      {/* Score bar */}
      <div className="progress-track" style={{ marginBottom: 20, border: "var(--border-brutal)", height: 12 }}>
        <div className="progress-fill" style={{ width: `${result ? Math.min(100, result.ats_score) : 8}%`, borderRight: result ? "2px solid #1c1917" : "none" }} />
      </div>

      {/* Upload button */}
      <div style={{ marginBottom: 14 }}>
        <label className="input-label">Resume PDF</label>
        <button
          type="button"
          onClick={() => document.getElementById("landing-upload")?.click()}
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "var(--bg-surface)",
            border: "var(--border-brutal)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "2px 2px 0 var(--text-primary)",
            color: "var(--text-primary)",
            fontSize: 13, fontWeight: 700,
            cursor: "pointer",
            textAlign: "left",
            display: "flex", alignItems: "center", gap: 8,
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translate(1px, 1px)";
            e.currentTarget.style.boxShadow = "1px 1px 0 var(--text-primary)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translate(0, 0)";
            e.currentTarget.style.boxShadow = "2px 2px 0 var(--text-primary)";
          }}
        >
          <span>{file ? "✓" : "📎"}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file ? file.name : "Drop your PDF here"}
          </span>
        </button>
        <input
          id="landing-upload"
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={e => onFileChange(e.target.files?.[0] || null)}
        />
      </div>

      {/* JD snippet */}
      <div style={{ marginBottom: 18 }}>
        <label className="input-label">Job Description (optional)</label>
        <textarea
          value={jd}
          onChange={e => onFileChange(e.target.value, "jd")}
          placeholder="Paste job description to see keyword match..."
          rows={3}
          className="input-field"
          style={{ resize: "none", fontSize: 12 }}
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 14, fontSize: 12, border: "var(--border-brutal)" }}>{error}</div>
      )}

      {/* CTA */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={onAnalyze}
        disabled={loading || !file}
        id="landing-analyze-btn"
      >
        {loading ? (
          <><div className="loading-dots" style={{ scale: 0.7 }}><div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" /></div> Analyzing…</>
        ) : file ? "Run Free ATS Check →" : "Upload PDF to Start"}
      </button>

      {result && (
        <button
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
          onClick={onSignup}
        >
          View Full Report on Dashboard →
        </button>
      )}

      {/* Trust signals */}
      <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "center", flexWrap: "wrap" }}>
        {["No signup needed", "PDF only", "Free forever"].map(t => (
          <span key={t} style={{
            fontSize: 10, fontWeight: 800, color: "var(--text-primary)",
            background: "var(--accent-light)",
            border: "var(--border-brutal)",
            boxShadow: "1px 1px 0 var(--text-primary)",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            display: "flex", alignItems: "center", gap: 4
          }}>
            ✓ {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main Landing ───────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authModal, setAuthModal] = useState({ isOpen: false, view: "signup" });
  const [statsTriggered, setStatsTriggered] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState("builder");
  const [activeFaqIndex, setActiveFaqIndex] = useState(0);
  const statsRef = useRef(null);
  const stickerConstraintsRef = useRef(null);


  useScrollReveal();

  useEffect(() => {
    updateMetaTags({
      title: "SmartResume — AI Resume Matcher & ATS Score Checker",
      description: "Upload your resume, paste the job description, and get an instant ATS match score, keyword gaps, and AI‑powered rewrite suggestions.",
      url: window.location.href,
    });
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsTriggered(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(statsRef.current);
    return () => io.disconnect();
  }, []);

  const handleFileChange = (val, type) => {
    if (type === "jd") setJd(val);
    else setFile(val);
  };

  const handleAnalyze = async () => {
    if (!file) { setError("Please upload a PDF first."); return; }
    setLoading(true); setError(""); setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("jd", jd);
    fd.append("years", 0);
    try {
      const { data } = await api.post("/guest-analyze-resume/", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-page">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="grid-lines" style={{ padding: "80px 0 96px", position: "relative", borderBottom: "var(--border-brutal)", overflow: "hidden" }}>
        {/* Animated gradient blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div className="hero-blob-1" style={{
            position: "absolute", top: "-15%", right: "-5%",
            width: "50vw", height: "50vw", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(217,119,6,0.09) 0%, transparent 65%)",
          }} />
          <div className="hero-blob-2" style={{
            position: "absolute", top: "35%", right: "10%",
            width: "28vw", height: "28vw", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(2,132,199,0.06) 0%, transparent 65%)",
          }} />
          <div className="hero-blob-3" style={{
            position: "absolute", bottom: "-15%", left: "-8%",
            width: "38vw", height: "38vw", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,83,9,0.07) 0%, transparent 65%)",
          }} />
        </div>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "center",
          }} className="hero-grid">

            {/* Left copy */}
            <div style={{ position: "relative" }} ref={stickerConstraintsRef}>
              {/* Floating stickers */}
              <motion.div
                drag
                dragConstraints={stickerConstraintsRef}
                dragElastic={0.1}
                whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                className="float-sticker-l shadow-[2px_2px_0_#1c1917] hidden xl:flex"
                style={{
                  position: "absolute", top: -25, left: 20,
                  background: "var(--color-warning)", border: "var(--border-brutal)",
                  padding: "4px 10px", fontSize: 11, fontWeight: 800,
                  textTransform: "uppercase", zIndex: 5,
                  cursor: "grab",
                }}
              >
                100% Free
              </motion.div>
              <motion.div
                drag
                dragConstraints={stickerConstraintsRef}
                dragElastic={0.1}
                whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                className="float-sticker-r shadow-[2px_2px_0_#1c1917] hidden xl:flex"
                style={{
                  position: "absolute", top: -15, right: 40,
                  background: "var(--color-info)", color: "#fff", border: "var(--border-brutal)",
                  padding: "4px 10px", fontSize: 11, fontWeight: 800,
                  textTransform: "uppercase", zIndex: 5,
                  cursor: "grab",
                }}
              >
                NO Gotchas
              </motion.div>

              <div className="badge badge-amber" style={{ marginBottom: 24 }} id="hero-badge">
                <span className="badge-dot pulse" style={{ background: "var(--accent)" }} />
                ⚡ Placement-Ready Resume Audits
              </div>

              <h1 className="text-display" style={{ marginBottom: 20, fontSize: "clamp(1.9rem, 4.8vw, 3.2rem)", lineHeight: 1.15 }}>
                {/* Word stagger reveal */}
                {["Beat", "the"].map((word, i) => (
                  <span key={i} className="hero-word" style={{ "--index": i }}>{word}&nbsp;</span>
                ))}
                <span className="hero-word highlight-black rotate-left-1" style={{ "--index": 2, display: "inline-block", margin: "0 4px", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "400" }}>scanner.</span>
                <br />
                {["Land", "the"].map((word, i) => (
                  <span key={i} className="hero-word" style={{ "--index": i + 3 }}>{word}&nbsp;</span>
                ))}
                <span className="hero-word highlight-accent rotate-right-1" style={{ "--index": 5, display: "inline-block", margin: "0 4px", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>interview.</span>
              </h1>

              <p style={{
                fontSize: 16, lineHeight: 1.7,
                color: "var(--text-secondary)",
                maxWidth: 480, marginBottom: 36,
                fontWeight: 500,
              }}>
                Stop sending resumes into the ATS black hole. SmartResume scores your PDF across 7 recruiter dimensions, flags missing keywords, and optimizes your bullet points in seconds.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => document.getElementById("landing-upload")?.click()}
                  id="hero-cta-btn"
                >
                  Check My Resume Free ↗
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => navigate("/how-it-works")}
                  id="hero-secondary-btn"
                >
                  See How It Works
                </button>
              </div>

              {/* Social proof row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex" }}>
                  {["#d97706", "#0284c7", "#16a34a", "#7c3aed"].map((c, i) => (
                    <div key={i} style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: c, border: "var(--border-brutal)",
                      marginLeft: i > 0 ? -12 : 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: "#fff",
                      boxShadow: "1px 1px 0 var(--text-primary)",
                      zIndex: 10 - i,
                    }}>
                      {["P", "A", "S", "R"][i]}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>2,400+ job seekers</strong> boosted their ATS score this month
                </p>
              </div>
            </div>

            {/* Right: Resume Preview */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ResumePreview
                file={file}
                jd={jd}
                result={result}
                loading={loading}
                error={error}
                onFileChange={handleFileChange}
                onAnalyze={handleAnalyze}
                onSignup={() => setAuthModal({ isOpen: true, view: "signup" })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────── */}
      <section ref={statsRef} style={{
        background: "var(--bg-surface)",
        padding: "56px 0",
        borderTop: "var(--border-brutal)",
        borderBottom: "var(--border-brutal)",
      }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 32,
          }} className="stats-grid">
            {STATS.map((stat, i) => (
              <div key={stat.label} className={`sr sr-delay-${i + 1}`} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "2.8rem", fontWeight: 800,
                  color: "var(--accent-dark)", lineHeight: 1, marginBottom: 8,
                }}>
                  <Counter end={stat.value} suffix={stat.suffix} triggered={statsTriggered} />
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Simulated Video Section ─────────────────────────────── */}
      <section className="section" style={{ borderBottom: "var(--border-brutal)", background: "var(--bg-page)" }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="section-label sr"><span className="section-label-text">Interactive Demo</span></div>
          <h2 className="text-heading sr" style={{ marginBottom: 12, textAlign: "center" }}>
            See SmartResume in Action
          </h2>
          <p className="sr" style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 36, maxWidth: 580, marginLeft: "auto", marginRight: "auto", textAlign: "center", lineHeight: 1.7 }}>
            Watch how our automated pipeline drops, sweeps, rewrites, and exports your optimized resume in real-time.
          </p>
          <div className="sr" style={{ marginTop: 24 }}>
            <WalkthroughVideoPlayer />
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid & Detailed Interactive Showcase ─────────────────────────────── */}
      <section className="section" style={{ borderBottom: "var(--border-brutal)" }}>
        <div className="container">
          <div className="section-label sr"><span className="section-label-text">Interactive Showcase</span></div>
          <h2 className="text-heading sr" style={{ marginBottom: 12 }}>
            A complete career intelligence platform
          </h2>
          <p className="sr" style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 36, maxWidth: 540, lineHeight: 1.7 }}>
            SmartResume provides an all-in-one suite of tools to optimize, build, track, and prepare. Select a tab below to see how it works under the hood.
          </p>

          {/* Tab Selector */}
          <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }} className="sr">
            {[
              { id: "builder", label: "📄 Resume Lab & Editor", color: "var(--accent)" },
              { id: "copilot", label: "🤖 Nova AI Copilot", color: "#7c3aed" },
              { id: "tracker", label: "🗂️ Kanban Job Tracker", color: "#16a34a" },
              { id: "learning", label: "🎓 Learning Hub", color: "#db2777" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveShowcaseTab(t.id)}
                className="btn btn-secondary"
                style={{
                  background: activeShowcaseTab === t.id ? t.color : "#fff",
                  color: activeShowcaseTab === t.id ? "#fff" : "var(--text-primary)",
                  boxShadow: activeShowcaseTab === t.id ? "none" : "var(--shadow-brutal)",
                  transform: activeShowcaseTab === t.id ? "translate(2px, 2px)" : "none",
                  fontWeight: 800,
                  fontSize: 13,
                  padding: "10px 18px",
                  borderRadius: "var(--radius-sm)"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "40% 60%",
            gap: 40,
            background: "var(--accent-light)",
            border: "var(--border-brutal-thick)",
            boxShadow: "var(--shadow-brutal-xl)",
            padding: 32,
            minHeight: 380,
            borderRadius: "0px"
          }} id="showcase-container" className="sr">

            {/* Left side details */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {activeShowcaseTab === "builder" && (
                <div>
                  <span className="badge badge-amber" style={{ marginBottom: 12 }}>Design & ATS-Safe</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, marginBottom: 12 }}>Resume Lab Live Builder</h3>
                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 18 }}>
                    Create multiple resumes using our custom-engineered live parser. No visual lag, instant PDF downloading, and standard formatting alignments.
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0, fontSize: 13, fontWeight: 700 }}>
                    <li>✓ 7 ATS-Optimized Templates preloaded</li>
                    <li>✓ Dynamic density adjusting (Classic vs Compact)</li>
                    <li>✓ Single-click PDF print page layout formatting</li>
                    <li>✓ Client-side Auto-Format casing and bullets tool</li>
                  </ul>
                </div>
              )}
              {activeShowcaseTab === "copilot" && (
                <div>
                  <span className="badge badge-amber" style={{ marginBottom: 12, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #7c3aed" }}>Agentic Reasoning</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, marginBottom: 12 }}>Nova AI Copilot & Trace Log</h3>
                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 18 }}>
                    Meet your career agent group. Nova organizes specialized subagents to scan your resume, rewrite bullets for maximum action verbs, and trace agent steps.
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0, fontSize: 13, fontWeight: 700 }}>
                    <li>✓ Nova-coordinator schedules subagent operations</li>
                    <li>✓ Step-by-step developer Trace Log dashboard</li>
                    <li>✓ Instant bullet metric rewrites using LLMs</li>
                    <li>✓ Context-aware interview Q&A prep chatbot</li>
                  </ul>
                </div>
              )}
              {activeShowcaseTab === "tracker" && (
                <div>
                  <span className="badge badge-amber" style={{ marginBottom: 12, background: "#f0fdf4", color: "#16a34a", border: "1px solid #16a34a" }}>Job Pipeline</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, marginBottom: 12 }}>Kanban Job Tracking System</h3>
                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 18 }}>
                    Track all applications in a sleek board. Paste target job descriptions to run matching, identify keyword gaps, and check target ATS score checks.
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0, fontSize: 13, fontWeight: 700 }}>
                    <li>✓ Drag-and-drop column stages (Applied, Technical)</li>
                    <li>✓ Specific job description ATS matcher calculations</li>
                    <li>✓ Target role keyword gap reports</li>
                    <li>✓ Single-click resume tailoring integration</li>
                  </ul>
                </div>
              )}
              {activeShowcaseTab === "learning" && (
                <div>
                  <span className="badge badge-amber" style={{ marginBottom: 12, background: "#fdf2f8", color: "#db2777", border: "1px solid #db2777" }}>Academic Prep</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, marginBottom: 12 }}>Learning Hub & Roadmaps</h3>
                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 18 }}>
                    Prepare for technical assessments with curated resources. Log solved DSA questions, study system design templates, and practice behavior answers.
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0, fontSize: 13, fontWeight: 700 }}>
                    <li>✓ Dynamic category filter tabs</li>
                    <li>✓ DSA curriculum tracking checkpoints</li>
                    <li>✓ System design architectural blueprints</li>
                    <li>✓ Star method behavioral mock frameworks</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Right side mock visual */}
            <div style={{
              background: "#fff",
              border: "var(--border-brutal)",
              boxShadow: "var(--shadow-brutal)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              borderRadius: "0px",
              overflow: "hidden",
              minHeight: 320
            }}>
              {activeShowcaseTab === "builder" && (
                <div style={{ display: "flex", flex: 1, gap: 14 }}>
                  {/* Mock editor inputs */}
                  <div style={{ width: "45%", borderRight: "1px solid var(--border-muted)", paddingRight: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>Workspace inputs</div>
                    <div style={{ background: "var(--bg-surface)", height: 8, width: "70%", borderRadius: 2 }} />
                    <div style={{ border: "1px solid #ccc", padding: 6, borderRadius: 2, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ height: 4, width: "30%", background: "#aaa", borderRadius: 1 }} />
                      <div style={{ height: 8, width: "90%", background: "#eaeaea", borderRadius: 1 }} />
                    </div>
                    <div style={{ border: "1px solid #ccc", padding: 6, borderRadius: 2, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ height: 4, width: "40%", background: "#aaa", borderRadius: 1 }} />
                      <div style={{ height: 16, width: "100%", background: "#eaeaea", borderRadius: 1 }} />
                    </div>
                  </div>
                  {/* Mock A4 sheet */}
                  <div style={{ width: "55%", display: "flex", flexDirection: "column", gap: 10, paddingLeft: 6 }}>
                    <div style={{ height: 4, background: "var(--accent)", width: "100%" }} />
                    <div style={{ height: 10, width: "50%", background: "#000", borderRadius: 1 }} />
                    <div style={{ height: 4, width: "70%", background: "#aaa", borderRadius: 1, marginBottom: 8 }} />
                    <div style={{ height: 2, width: "100%", background: "#ccc" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ height: 4, width: "90%", background: "#eaeaea" }} />
                      <div style={{ height: 4, width: "80%", background: "#eaeaea" }} />
                    </div>
                  </div>
                </div>
              )}
              {activeShowcaseTab === "copilot" && (
                <AgentShowcase />
              )}              {activeShowcaseTab === "tracker" && (
                <div style={{ display: "flex", flex: 1, gap: 10 }}>
                  {[
                    { title: "Applied", company: "Google", role: "L4 Swe", score: "88%" },
                    { title: "Technical", company: "Stripe", role: "frontend", score: "94%" },
                    { title: "Offer", company: "Vercel", role: "UI Eng", score: "91%" }
                  ].map((col, idx) => (
                    <div key={idx} style={{ width: "33.3%", background: "var(--bg-surface)", border: "1px solid var(--border-muted)", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>{col.title}</div>
                      <div style={{ background: "#fff", border: "1px solid #ccc", padding: 6, display: "flex", flexDirection: "column", gap: 4, boxShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}>
                        <div style={{ fontSize: 10, fontWeight: 800 }}>{col.company}</div>
                        <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>{col.role}</div>
                        <span style={{ alignSelf: "flex-start", background: "#dcfce7", color: "#16a34a", padding: "1px 4px", fontSize: 8, fontWeight: 700, borderRadius: 2 }}>{col.score} match</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeShowcaseTab === "learning" && (
                <div style={{ display: "flex", flex: 1, gap: 14 }}>
                  {/* Curated list */}
                  <div style={{ width: "55%", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>DSA Track List</div>
                    {[
                      { q: "Two Sum", status: "✓ Solved", bg: "#dcfce7", border: "#86efac", text: "#16a34a" },
                      { q: "Merge Intervals", status: "✓ Solved", bg: "#dcfce7", border: "#86efac", text: "#16a34a" },
                      { q: "Design TinyURL", status: "⏳ Pending", bg: "var(--bg-surface)", border: "#ccc", text: "#aaa" }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${item.border}`, padding: "6px 8px", background: item.bg, fontSize: 10, fontWeight: 700 }}>
                        <span>{item.q}</span>
                        <span style={{ color: item.text, fontSize: 9 }}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                  {/* Performance stats */}
                  <div style={{ width: "45%", border: "1px solid var(--border-muted)", padding: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", border: "6px solid #db2777", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#db2777" }}>
                      66%
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>Prep complete</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section style={{ background: "var(--bg-surface)", padding: "96px 0", borderBottom: "var(--border-brutal)" }}>
        <div className="container">
          <div className="section-label sr"><span className="section-label-text">Process</span></div>
          <h2 className="text-display sr" style={{ marginBottom: 48, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            The resume game is <span className="line-through decoration-4">fair.</span> It&apos;s <span className="highlight-accent -rotate-1" style={{ margin: "0 6px", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>rigged.</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }} id="steps-grid">
            {[
              { num: "01", title: "The Spray-and-Pray Trap", desc: "Blasting the same generic PDF to 80 companies and getting zero callbacks. Your resume never made it past the automated scanner — no human ever saw it.", icon: "🎯" },
              { num: "02", title: "The Keyword Blind Spot", desc: "Your experience is real, but the ATS can't read it. You wrote 'developed features' when the filter scanned for 'React', 'REST API', and 'CI/CD'. One missed term, rejected.", icon: "🔍" },
              { num: "03", title: "The Placement Season Crunch", desc: "Watching batchmates get shortlisted while you keep tweaking fonts and margins. The issue was never design — it was an outdated resume strategy.", icon: "📅" },
            ].map((step, i) => (
              <div key={step.num} className="card sr" style={{ padding: "32px 28px", background: "#fff" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 20,
                }}>
                  <div style={{
                    width: 36, height: 36,
                    border: "var(--border-brutal)",
                    background: "var(--color-warning)",
                    color: "var(--text-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "2px 2px 0 var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.1rem", fontWeight: 800,
                    borderRadius: "var(--radius-sm)"
                  }}>{step.num}</div>
                  <span style={{ fontSize: 32 }}>{step.icon}</span>
                </div>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17,
                  marginBottom: 10, color: "var(--text-primary)",
                }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <section className="section" style={{ borderBottom: "var(--border-brutal)" }}>
        <div className="container">
          <div className="section-label sr"><span className="section-label-text">What Students Say</span></div>
          <h2 className="text-heading sr" style={{ marginBottom: 40 }}>
            Real results from real students
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} id="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card sr" style={{ padding: "28px", background: "#fff" }}>
                <div style={{
                  fontSize: 32, lineHeight: 1,
                  color: "var(--accent)", marginBottom: 16,
                  fontFamily: "Georgia, serif",
                }}>"</div>
                <p style={{
                  fontSize: 14, lineHeight: 1.75,
                  color: "var(--text-secondary)", marginBottom: 24,
                  fontStyle: "italic",
                }}>
                  {t.quote}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: t.color,
                    border: "var(--border-brutal)",
                    boxShadow: "1px 1px 0 var(--text-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, color: "#fff",
                    flexShrink: 0,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ───────────────────────────────────────── */}
      <section className="section" style={{ borderBottom: "var(--border-brutal)", background: "var(--bg-surface)" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-label sr"><span className="section-label-text">Learn More</span></div>
          <h2 className="text-heading sr" style={{ marginBottom: 40, textAlign: "center" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="card sr"
                  style={{
                    background: "#fff",
                    padding: "20px 24px",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                  onClick={() => setActiveFaqIndex(isOpen ? -1 : idx)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 15,
                      color: "var(--text-primary)",
                      margin: 0
                    }}>
                      {faq.q}
                    </h3>
                    <span style={{
                      fontSize: 18,
                      fontWeight: 800,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 150ms"
                    }}>
                      +
                    </span>
                  </div>
                  {isOpen && (
                    <div style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid var(--border-muted)",
                      fontSize: 13.5,
                      color: "var(--text-secondary)",
                      lineHeight: 1.65
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────── */}
      <section style={{ padding: "96px 0", position: "relative", overflow: "hidden", background: "var(--bg-page)" }}>
        {/* Floating shapes */}
        <div style={{
          position: "absolute", top: 40, left: "10%",
          width: 80, height: 80, background: "var(--color-warning)",
          border: "var(--border-brutal)", rotate: "12deg",
          boxShadow: "var(--shadow-brutal)", pointerEvents: "none"
        }} className="hidden md:block" />
        <div style={{
          position: "absolute", bottom: 40, right: "12%",
          width: 90, height: 90, background: "var(--accent-light)",
          border: "var(--border-brutal)", rotate: "-15deg",
          boxShadow: "var(--shadow-brutal)", pointerEvents: "none"
        }} className="hidden md:block" />

        <div className="container">
          <div style={{
            background: "var(--text-primary)",
            border: "var(--border-brutal-thick)",
            boxShadow: "var(--shadow-brutal-lg)",
            padding: "60px 40px",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}>
            <h2 className="text-display" style={{ color: "#fff", marginBottom: 24, fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              <span className="highlight-warning rotate-left-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>Convinced?</span>
            </h2>
            <p style={{
              fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              color: "#fff",
              marginBottom: 32,
            }}>
              Try SmartResume — <span className="highlight-accent rotate-right-1" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>it's free</span>
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setAuthModal({ isOpen: true, view: "signup" })}
                id="bottom-cta-btn"
                style={{ background: "#fff", color: "var(--text-primary)" }}
              >
                Let's Go! ↗
              </button>
            </div>

            <div style={{ height: 1, background: "rgba(255,253,247,0.15)", margin: "28px auto", maxWidth: 400 }} />

            <p style={{ fontSize: 16, color: "rgba(255,253,247,0.8)", fontWeight: 500, marginBottom: 12 }}>
              Not convinced? <span style={{ fontStyle: "italic" }}>That's cute.</span>
            </p>
            <p style={{ fontSize: 20, fontFamily: "var(--font-display)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>
              Try it anyway → <span className="line-through" style={{ opacity: 0.5, marginRight: 8 }}>hate it</span> <span className="highlight-warning rotate-right-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>love it</span> → get convinced
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,253,247,0.6)", fontWeight: 500 }}>
              (still free btw... we're running on vibes ✨)
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{
        background: "var(--bg-page)",
        borderTop: "var(--border-brutal-thick)",
        padding: "48px 0 32px",
      }}>
        <div className="container" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
            <div className="nav-logo-icon" style={{ width: 32, height: 32, fontSize: 12, boxShadow: "1px 1px 0 var(--text-primary)" }}>SR</div>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: 16, color: "var(--text-primary)",
            }}>SmartResume</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["About", "/about"], ["How it Works", "/how-it-works"], ["Templates", "/templates"], ["Resources", "/resources"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([label, path]) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  fontSize: 14, color: "var(--text-secondary)",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontWeight: 700,
                  transition: "color 150ms",
                }}
                onMouseEnter={e => e.target.style.color = "var(--accent)"}
                onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}
              >{label}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            © 2026 SmartResume. Built for students.
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal(s => ({ ...s, isOpen: false }))}
        initialView={authModal.view}
      />

      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          #features-grid { grid-template-columns: 1fr !important; }
          #steps-grid { grid-template-columns: 1fr !important; }
          #testimonials-grid { grid-template-columns: 1fr !important; }
          #showcase-container { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
