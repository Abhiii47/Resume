import React, { useRef, useEffect, useState } from "react";

const ROTATING_WORDS = ["SDE roles.", "FAANG.", "your dream job.", "campus placements.", "that internship."];

const HeroSection = ({ onUploadClick, onCheckScoreClick }) => {
  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % ROTATING_WORDS.length);
        setFade(true);
      }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{ backgroundColor: "hsl(40,30%,92%)" }}
      className="relative min-h-[92vh] flex flex-col cream-grid-bg overflow-hidden pt-20"
    >
      {/* Floating decorative squares */}
      <div className="absolute top-10 right-12 w-16 h-16 block-orange shadow-hard rotate-2 opacity-80 hidden lg:block" />
      <div className="absolute bottom-24 left-8 w-10 h-10 block-blue shadow-hard rotate-neg opacity-70 hidden lg:block" />
      <div className="absolute top-1/3 right-1/4 w-8 h-8 block-green shadow-hard-sm rotate-1 opacity-60 hidden xl:block" />

      {/* Main hero content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex-1 flex items-center w-full py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

          {/* LEFT — Copy */}
          <div className="flex flex-col">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-6 px-3 py-1.5 border-2 border-black self-start"
              style={{ background: "hsl(24,100%,50%)", color: "#111" }}
            >
              AI-Powered Resume Checker
            </span>

            <h1
              className="font-display-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6"
              style={{ color: "#111", letterSpacing: "-0.03em" }}
            >
              Your resume<br />
              <span style={{ color: "hsl(24,100%,50%)" }}>is probably bad.</span><br />
              Let&apos;s fix it.
            </h1>

            <p
              className="text-lg leading-relaxed mb-4 max-w-lg"
              style={{ color: "#444", fontFamily: "Inter, sans-serif" }}
            >
              Most resumes get rejected in{" "}
              <span style={{ fontWeight: 700, color: "#111" }}>6 seconds</span> by an ATS
              bot — before a human ever sees them. We tell you exactly why, and
              how to fix it.
            </p>

            <p
              className="text-sm mb-10"
              style={{ color: "#888", fontFamily: "Inter, sans-serif" }}
            >
              Built for{" "}
              <span
                style={{
                  transition: "opacity 0.3s",
                  opacity: fade ? 1 : 0,
                  display: "inline-block",
                  fontWeight: 700,
                  color: "#111",
                  minWidth: "160px",
                }}
              >
                {ROTATING_WORDS[wordIdx]}
              </span>
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onUploadClick}
                className="neu-btn-primary px-8 py-4 text-base shadow-hard"
                style={{ fontSize: "1rem" }}
              >
                Check My Resume — it&apos;s free
                <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={onCheckScoreClick}
                className="neu-btn-outline px-8 py-4 text-base"
                style={{ fontSize: "1rem" }}
              >
                See ATS Score
              </button>
            </div>

            {/* Social proof row */}
            <div className="flex items-center gap-6 mt-10 pt-8" style={{ borderTop: "2px solid #ccc" }}>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#111", fontFamily: "Playfair Display, serif" }}>12K+</div>
                <div className="text-xs" style={{ color: "#888" }}>Resumes Analyzed</div>
              </div>
              <div style={{ width: "2px", height: "36px", background: "#ccc" }} />
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#111", fontFamily: "Playfair Display, serif" }}>4.8★</div>
                <div className="text-xs" style={{ color: "#888" }}>Avg. Rating</div>
              </div>
              <div style={{ width: "2px", height: "36px", background: "#ccc" }} />
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#111", fontFamily: "Playfair Display, serif" }}>100%</div>
                <div className="text-xs" style={{ color: "#888" }}>Free to Start</div>
              </div>
            </div>
          </div>

          {/* RIGHT — Fake product card */}
          <div className="hidden lg:block">
            <div
              className="cream-card-block p-6 shadow-hard-lg"
              style={{ border: "2px solid #000", background: "#fff" }}
            >
              {/* Score header */}
              <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "2px solid #e5e7eb" }}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#999" }}>ATS Score</div>
                  <div className="text-5xl font-black mt-1" style={{ color: "hsl(24,100%,50%)", fontFamily: "Playfair Display, serif" }}>73</div>
                </div>
                <div
                  className="px-4 py-2 text-sm font-bold shadow-hard-sm"
                  style={{ background: "#FEF9C3", border: "2px solid #000", color: "#111" }}
                >
                  Needs Work
                </div>
              </div>

              {/* Score bars */}
              <div className="space-y-4 mb-5">
                {[
                  { label: "Keyword Match", val: 68, color: "hsl(24,100%,50%)" },
                  { label: "Formatting", val: 85, color: "#16A34A" },
                  { label: "Impact Metrics", val: 55, color: "#2563EB" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-bold mb-1" style={{ color: "#555" }}>
                      <span>{item.label}</span>
                      <span style={{ color: "#111" }}>{item.val}%</span>
                    </div>
                    <div className="h-3" style={{ background: "#eee", border: "1.5px solid #ccc" }}>
                      <div
                        className="h-full"
                        style={{ width: `${item.val}%`, background: item.color, transition: "width 1s ease" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Issue chips */}
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#999" }}>Top Issues Found</div>
                <div className="flex flex-wrap gap-2">
                  {["Missing keywords", "Weak action verbs", "No metrics", "ATS formatting"].map(t => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 font-semibold"
                      style={{ background: "#FEE2E2", border: "1.5px solid #FECACA", color: "#991B1B" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="w-full mt-5 py-3 text-sm font-bold shadow-hard-sm"
                style={{ background: "#111", color: "#fff", border: "2px solid #000" }}
              >
                Fix All Issues →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom wave/divider into dark section */}
      <div
        className="w-full h-8 relative z-10"
        style={{ background: "hsl(0,0%,4%)", marginTop: "auto" }}
      >
        <div
          className="absolute -top-4 left-0 w-full h-4"
          style={{ background: "hsl(40,30%,92%)", clipPath: "polygon(0 0, 100% 0, 100% 0%, 0 100%)" }}
        />
      </div>
    </section>
  );
};

export default HeroSection;
