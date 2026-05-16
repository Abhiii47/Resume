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
      style={{
        background: "hsl(40,30%,92%)",
        borderBottom: "2px solid #000",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div
            className="w-9 h-9 flex items-center justify-center font-black text-white text-sm shadow-hard-sm"
            style={{ background: "hsl(24,100%,50%)", border: "2px solid #000" }}
          >
            SR
          </div>
          <span className="font-black text-lg" style={{ color: "#111", letterSpacing: "-0.03em" }}>
            SmartResume
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-8 font-black text-sm uppercase tracking-widest" style={{ color: "#111" }}>
          <a href="/#features" className="hover:text-blue-600 transition-colors cursor-pointer">Features</a>
          <button onClick={() => navigate('/resources')} className="hover:text-orange-600 transition-colors uppercase font-black tracking-widest">Resources</button>
          <button onClick={() => navigate('/how-it-works')} className="hover:text-green-600 transition-colors uppercase font-black tracking-widest">How it Works</button>
          <button onClick={() => navigate('/about')} className="hover:text-purple-600 transition-colors uppercase font-black tracking-widest">About Us</button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="text-sm font-bold px-4 py-2"
            style={{ color: "#555" }}
          >
            Log in
          </button>
          <button
            onClick={onSignup}
            className="neu-btn-primary px-5 py-2 text-sm shadow-hard-sm"
          >
            Get Started — free
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── Pain Points horizontal scroll ────────────────────────── */
const PAIN_POINTS = [
  { color: "#2563EB", text: "You apply to 200 jobs and hear back from 3. That's not bad luck." },
  { color: "hsl(24,100%,50%)", text: "Your resume isn't ATS-optimised. Bots reject it before humans see it." },
  { color: "#16A34A", text: "Generic bullet points kill your chances. Recruiters skim in 6 seconds." },
  { color: "#111", text: "You get no feedback. Just silence. We fix that." },
];

/* ── Feature blocks ────────────────────────────────────────── */
const FEATURES = [
  {
    cls: "block-blue",
    num: "01",
    title: "ATS Score",
    body: "We run your resume through the same logic ATS software uses. No fluff — just a real score and why you got it.",
  },
  {
    cls: "block-orange",
    num: "02",
    title: "Keyword Gap",
    body: "Cross-reference every missing keyword from the job description. Stop guessing what recruiters want.",
  },
  {
    cls: "block-green",
    num: "03",
    title: "AI Rewrites",
    body: "Bad bullet point? Click fix. Our AI rewrites it with stronger verbs and actual impact metrics.",
  },
  {
    cls: "block-dark",
    num: "04",
    title: "Job Matcher",
    body: "Paste a job URL. We tell you your match %, what's missing, and what to change. Then you apply.",
  },
];

/* ── How it works steps ────────────────────────────────────── */
const STEPS = [
  { n: "01", title: "Upload your resume", body: "PDF only. We'll be gentle. Mostly." },
  { n: "02", title: "Get a real score", body: "ATS score, keyword density, formatting issues — all of it." },
  { n: "03", title: "Fix what's broken", body: "AI suggestions. One-click rewrites. Then land that interview." },
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
      description:
        "Most resumes get rejected before a human sees them. SmartResume gives you an ATS score, keyword gaps, and AI rewrites — for free.",
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

  const scrollToAnalyzer = () => {
    document.getElementById("guest-analyzer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(0,0%,4%)" }}>
      <Navbar onLogin={openLogin} onSignup={openSignup} />

      {/* HERO — cream */}
      <HeroSection onUploadClick={() => { scrollToAnalyzer(); document.getElementById("resume-upload")?.click(); }} onCheckScoreClick={scrollToAnalyzer} />

      {/* PAIN POINTS — dark bg, horizontal cards */}
      <section style={{ background: "hsl(0,0%,4%)" }} className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(24,100%,50%)" }}>
            Sound familiar?
          </p>
          <h2
            className="font-display-serif text-4xl md:text-5xl text-center mb-12"
            style={{ color: "#fff", letterSpacing: "-0.03em" }}
          >
            The job search is brutal.<br />Your resume shouldn&apos;t make it worse.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PAIN_POINTS.map((p, i) => (
              <div
                key={i}
                className="p-6 shadow-hard"
                style={{ background: p.color, border: "2px solid #000", color: "#fff" }}
              >
                <p className="text-base font-semibold leading-snug" style={{ color: "#fff" }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANALYZER — dark with cream card */}
      <section id="guest-analyzer" style={{ background: "hsl(0,0%,6%)", borderColor: "hsl(0,0%,14%)" }} className="py-20 px-6 border-t-2 border-b-2">
        <div className="max-w-3xl mx-auto">
          <div
            className="p-8 lg:p-12 shadow-hard"
            style={{ background: "#fff", border: "2px solid #000" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#999" }}>
              Free Instant Check
            </p>
            <h2
              className="font-display-serif text-3xl md:text-4xl mb-2"
              style={{ color: "#111", letterSpacing: "-0.03em" }}
            >
              Drop your resume.{" "}
              <span style={{ color: "hsl(24,100%,50%)" }}>We&apos;ll be honest.</span>
            </h2>
            <p className="text-sm mb-8" style={{ color: "#888" }}>
              Your friends tell you it looks great. We won&apos;t.
            </p>

            {/* Upload */}
            <div className="mb-6">
              <label
                className="flex flex-col items-center justify-center w-full h-36 cursor-pointer"
                style={{ border: "2px dashed #000", background: "#fafafa" }}
              >
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
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#555" }}>
                  Paste Job Description (optional)
                </label>
                <textarea rows={4} className="cream-input resize-none" placeholder="Paste the job description here for a better match score..." value={jd} onChange={e => setJd(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#555" }}>
                  Years of Experience
                </label>
                <input type="number" min="0" className="cream-input" placeholder="e.g. 2" value={years} onChange={e => setYears(e.target.value)} />
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 text-sm font-semibold" style={{ background: "#FEE2E2", border: "2px solid #FECACA", color: "#991B1B" }}>
                {error}
              </div>
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
                    <div className="text-6xl font-black" style={{ color: "hsl(24,100%,50%)", fontFamily: "Playfair Display, serif" }}>
                      {Math.round(result.ats_score)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg mb-1" style={{ color: "#111" }}>Scan complete.</p>
                    <p className="text-sm mb-4" style={{ color: "#888" }}>Create a free account to see the full breakdown — keyword gaps, formatting issues, and AI fix suggestions.</p>
                    <button onClick={openSignup} className="neu-btn-primary px-6 py-2.5 text-sm shadow-hard-sm">
                      See Full Report — free →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — dark */}
      <section style={{ background: "hsl(0,0%,4%)" }} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(24,100%,50%)" }}>
            No magic. No BS.
          </p>
          <h2
            className="font-display-serif text-4xl md:text-5xl text-center mb-16"
            style={{ color: "#fff", letterSpacing: "-0.03em" }}
          >
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-8 left-0 w-full h-0.5" style={{ background: "hsl(0,0%,18%)" }} />
            {STEPS.map(s => (
              <div key={s.n} className="brutalist-card p-8 text-center relative z-10">
                <div
                  className="w-14 h-14 flex items-center justify-center mx-auto mb-5 font-black text-xl"
                  style={{ border: "2px solid hsl(24,100%,50%)", color: "hsl(24,100%,50%)", background: "hsl(0,0%,4%)" }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-lg mb-2 uppercase tracking-tight text-white">{s.title}</h3>
                <p className="text-sm" style={{ color: "hsl(0,0%,60%)" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — vibrant colored blocks */}
      <section style={{ background: "hsl(0,0%,6%)" }} className="py-24 px-6" id="features">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(24,100%,50%)" }}>
            What we check
          </p>
          <h2
            className="font-display-serif text-4xl md:text-5xl text-center mb-16"
            style={{ color: "#fff", letterSpacing: "-0.03em" }}
          >
            Everything recruiters<br />judge you on.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div
                key={f.num}
                className={`${f.cls} p-7 shadow-hard transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1`}
                style={{ cursor: "default" }}
              >
                <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">{f.num}</div>
                <h3 className="font-black text-2xl mb-3" style={{ letterSpacing: "-0.03em" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed opacity-90">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={openSignup} className="brutalist-btn brutalist-btn-primary px-10 py-4 text-base">
              Get Full Access — Free →
            </button>
          </div>
        </div>
      </section>

      {/* CONVINCED? — dark with orange headline */}
      <section style={{ background: "#111" }} className="py-24 px-6" id="convinced">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-display-serif text-5xl md:text-7xl mb-6"
            style={{ color: "#fff", letterSpacing: "-0.03em" }}
          >
            Convinced?{" "}
            <span
              className="inline-block px-3 shadow-hard"
              style={{ background: "hsl(24,100%,50%)", color: "#111" }}
            >
              Good.
            </span>
          </h2>
          <p className="text-lg mb-10" style={{ color: "#aaa" }}>
            Try SmartResume — it&apos;s free.
          </p>
          <button
            onClick={openSignup}
            className="px-12 py-5 text-lg font-bold shadow-hard mb-8"
            style={{ background: "#fff", color: "#111", border: "2px solid #fff" }}
          >
            Let&apos;s Go →
          </button>
          <div style={{ borderTop: "1px solid #333" }} className="pt-8 mt-4">
            <p style={{ color: "#666" }}>
              Not convinced?{" "}
              <em style={{ color: "#888" }}>That&apos;s cute.</em>
            </p>
            <p className="text-lg mt-2" style={{ color: "#ccc" }}>
              Try it anyway →{" "}
              <span className="strike" style={{ color: "#666" }}>hate it</span>{" "}
              <span
                className="inline-block px-2"
                style={{ background: "hsl(24,100%,50%)", color: "#111", fontWeight: 700 }}
              >
                love it
              </span>{" "}
              → get hired
            </p>
            <p className="text-xs mt-4" style={{ color: "#555" }}>
              (still free btw — we&apos;re not running a charity, we&apos;re running on vibes)
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "hsl(0,0%,4%)", borderTop: "2px solid hsl(0,0%,14%)" }} className="pt-16 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-9 h-9 flex items-center justify-center font-black text-white text-sm"
                  style={{ background: "hsl(24,100%,50%)", border: "2px solid hsl(0,0%,20%)" }}
                >
                  SR
                </div>
                <span className="font-black text-lg text-white" style={{ letterSpacing: "-0.03em" }}>SmartResume</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: "hsl(0,0%,50%)", lineHeight: 1.7 }}>
                Honest, AI-powered resume feedback. Built for students who want real feedback, not false hope.
              </p>
              <div className="flex gap-4 mt-5">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-white transition-colors" style={{ color: "#666" }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-white transition-colors" style={{ color: "#666" }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Platform</h4>
              <ul className="space-y-3 text-sm" style={{ color: "hsl(0,0%,50%)" }}>
                <li onClick={() => navigate('/how-it-works')} className="hover:text-white cursor-pointer transition-colors">How It Works</li>
                <li onClick={() => navigate('/templates')} className="hover:text-white cursor-pointer transition-colors">Resume Templates</li>
                <li onClick={() => navigate('/resources')} className="hover:text-white cursor-pointer transition-colors">Career Resources</li>
                <li onClick={() => navigate('/about')} className="hover:text-white cursor-pointer transition-colors">About Us</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Legal</h4>
              <ul className="space-y-3 text-sm" style={{ color: "hsl(0,0%,50%)" }}>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: "1px solid hsl(0,0%,14%)" }}>
            <span className="text-xs" style={{ color: "hsl(0,0%,35%)" }}>© 2026 SmartResume. All rights reserved.</span>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={authModal.isOpen} onClose={() => setAuthModal({ ...authModal, isOpen: false })} initialView={authModal.view} />
    </div>
  );
}
