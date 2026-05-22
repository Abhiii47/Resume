import React, { useEffect, useState, useRef } from "react";

const ROTATING_WORDS = ["SDE roles.", "FAANG.", "your dream job.", "campus placements.", "that internship."];
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&";

/* ─── Text Scramble Hook ───────────────────────────────────── */
function useScramble(finalText, trigger, duration = 900) {
  const [display, setDisplay] = useState(finalText);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    const len = finalText.length;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const revealCount = Math.floor(progress * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        if (finalText[i] === " ") { out += " "; continue; }
        if (i < revealCount) { out += finalText[i]; }
        else { out += CHARS[Math.floor(Math.random() * CHARS.length)]; }
      }
      setDisplay(out);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(finalText);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, finalText, duration]);

  return display;
}

/* ── Collage Hero Illustration ─────────────────────────────── */
function HeroIllustration() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="hidden lg:flex items-center justify-center relative" style={{ minHeight: "460px" }}>
      {/* Big orange background circle — scales in */}
      <div
        style={{
          position: "absolute",
          width: "300px", height: "300px",
          background: "hsl(24,100%,50%)",
          borderRadius: "50%",
          border: "3px solid #000",
          top: "8%", right: "4%",
          zIndex: 0,
          transform: mounted ? "scale(1)" : "scale(0)",
          transition: "transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />

      {/* Main collage SVG — fades up */}
      <svg
        viewBox="0 0 340 420"
        width="340" height="420"
        style={{
          position: "relative", zIndex: 1,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(32px) scale(0.96)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease",
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="arrowOrange" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="hsl(24,100%,50%)" />
          </marker>
        </defs>
        <circle cx="196" cy="148" r="82" fill="#fff" stroke="#000" strokeWidth="4" />
        <circle cx="196" cy="148" r="74" fill="#EEF2FF" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="196" cy="148" rx="40" ry="24" fill="#fff" stroke="#000" strokeWidth="2.5" />
        <circle cx="196" cy="148" r="13" fill="#2563EB" />
        <circle cx="196" cy="148" r="7" fill="#000" />
        <circle cx="201" cy="143" r="3" fill="#fff" />
        <line x1="174" y1="124" x2="171" y2="115" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <line x1="186" y1="119" x2="185" y2="110" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <line x1="198" y1="118" x2="198" y2="108" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <line x1="210" y1="120" x2="212" y2="111" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <rect x="256" y="204" width="20" height="74" rx="10" transform="rotate(40 256 204)" fill="#111" stroke="#000" strokeWidth="2" />
        <path d="M128 318 C116 294 106 268 112 246 C115 232 127 228 136 236 C138 222 150 218 158 228 C162 214 174 212 180 224 C184 212 198 212 200 228 L202 318 Z" fill="#F5E6C8" stroke="#000" strokeWidth="2.5" />
        <line x1="136" y1="236" x2="140" y2="318" stroke="#000" strokeWidth="1.2" strokeDasharray="3,4" />
        <line x1="158" y1="228" x2="161" y2="318" stroke="#000" strokeWidth="1.2" strokeDasharray="3,4" />
        <line x1="180" y1="224" x2="182" y2="318" stroke="#000" strokeWidth="1.2" strokeDasharray="3,4" />
        <path d="M160 70 L172 50 L184 64 L196 42 L208 64 L220 50 L232 70 Z" fill="hsl(24,100%,50%)" stroke="#000" strokeWidth="2.5" />
        <rect x="160" y="70" width="72" height="18" fill="hsl(24,100%,50%)" stroke="#000" strokeWidth="2" />
        <circle cx="164" cy="70" r="4" fill="#111" />
        <circle cx="196" cy="68" r="4" fill="#111" />
        <circle cx="228" cy="70" r="4" fill="#111" />
        <path d="M72 88 L76 78 L80 88 L90 92 L80 96 L76 106 L72 96 L62 92 Z" fill="#16A34A" stroke="#000" strokeWidth="1.5" />
        <path d="M284 252 L287 244 L290 252 L298 255 L290 258 L287 266 L284 258 L276 255 Z" fill="#2563EB" stroke="#000" strokeWidth="1.5" />
        <circle cx="60" cy="210" r="9" fill="#FEF9C3" stroke="#000" strokeWidth="2" />
        <circle cx="296" cy="108" r="5" fill="hsl(24,100%,50%)" stroke="#000" strokeWidth="1.5" />
        <rect x="44" y="136" width="96" height="30" fill="#111" stroke="hsl(24,100%,50%)" strokeWidth="2" />
        <text x="92" y="156" textAnchor="middle" fill="hsl(24,100%,50%)" fontSize="11" fontFamily="monospace" fontWeight="bold" letterSpacing="1">ATS SCORE</text>
        <line x1="140" y1="151" x2="160" y2="149" stroke="hsl(24,100%,50%)" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrowOrange)" />
        <rect x="44" y="260" width="56" height="72" fill="#fff" stroke="#000" strokeWidth="2" />
        <line x1="52" y1="274" x2="88" y2="274" stroke="#ccc" strokeWidth="2" />
        <line x1="52" y1="282" x2="88" y2="282" stroke="#ccc" strokeWidth="2" />
        <line x1="52" y1="290" x2="78" y2="290" stroke="#ccc" strokeWidth="2" />
        <line x1="52" y1="298" x2="84" y2="298" stroke="#ccc" strokeWidth="2" />
        <rect x="52" y="306" width="24" height="8" fill="hsl(24,100%,50%)" />
        <text x="64" y="313" textAnchor="middle" fill="#111" fontSize="5" fontFamily="monospace" fontWeight="bold">FIXED ✓</text>
        <path d="M100 296 C120 290 130 270 140 240" stroke="#000" strokeWidth="1.5" strokeDasharray="4,4" fill="none" markerEnd="url(#arrowOrange)" />
      </svg>

      {/* Floating stickers — staggered entrance */}
      <div
        style={{
          position: "absolute", bottom: "14%", left: "2%",
          background: "#16A34A", color: "#fff",
          border: "2px solid #000",
          padding: "6px 14px",
          fontWeight: 900, fontSize: "11px",
          letterSpacing: "0.08em", textTransform: "uppercase",
          transform: mounted ? "rotate(-2deg) translateY(0)" : "rotate(-2deg) translateY(20px)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s, opacity 0.4s ease 0.5s",
          zIndex: 2, boxShadow: "3px 3px 0 #000",
        }}
      >
        ✦ 100% free to start
      </div>
      <div
        style={{
          position: "absolute", top: "6%", left: "6%",
          background: "#2563EB", color: "#fff",
          border: "2px solid #000",
          padding: "5px 12px",
          fontWeight: 900, fontSize: "10px",
          letterSpacing: "0.08em", textTransform: "uppercase",
          transform: mounted ? "rotate(1.5deg) translateY(0)" : "rotate(1.5deg) translateY(-20px)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.65s, opacity 0.4s ease 0.65s",
          zIndex: 2, boxShadow: "3px 3px 0 #000",
        }}
      >
        AI-powered 🤖
      </div>
    </div>
  );
}

const HeroSection = ({ onUploadClick, onCheckScoreClick }) => {
  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [mounted, setMounted] = useState(false);
  const scrambled1 = useScramble("BUILD", mounted, 700);
  const scrambled2 = useScramble("JOB-READY", mounted, 900);

  useEffect(() => {
    // Trigger entrance after first paint
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

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
      className="relative min-h-[92vh] flex flex-col mesh-bg overflow-hidden pt-20"
    >
      {/* Floating decorative squares — entrance pop */}
      <div
        className="absolute top-10 right-12 w-16 h-16 bg-primary text-primary-foreground shadow-[4px_4px_0_#000] hidden lg:block"
        style={{
          transform: mounted ? "rotate(2deg) scale(1)" : "rotate(2deg) scale(0)",
          opacity: mounted ? 0.8 : 0,
          transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s, opacity 0.4s ease 0.2s",
        }}
      />
      <div
        className="absolute bottom-24 left-8 w-10 h-10 bg-blue-500 text-white shadow-[4px_4px_0_#000] hidden lg:block"
        style={{
          transform: mounted ? "rotate(-4deg) scale(1)" : "rotate(-4deg) scale(0)",
          opacity: mounted ? 0.7 : 0,
          transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.35s, opacity 0.4s ease 0.35s",
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-8 h-8 bg-green-500 text-white shadow-[2px_2px_0_#000] hidden xl:block"
        style={{
          transform: mounted ? "rotate(1deg) scale(1)" : "rotate(1deg) scale(0)",
          opacity: mounted ? 0.6 : 0,
          transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.45s, opacity 0.4s ease 0.45s",
        }}
      />

      {/* Main hero content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex-1 flex items-center w-full py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

          {/* LEFT — Copy */}
          <div className="flex flex-col">
            {/* Badge — slides down */}
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-6 px-3 py-1.5 border border-border shadow-[4px_4px_0_#000] self-start shadow-[2px_2px_0_#000]"
              style={{
                background: "hsl(24,100%,50%)", color: "#111",
                transform: mounted ? "translateY(0)" : "translateY(-16px)",
                opacity: mounted ? 1 : 0,
                transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease",
              }}
            >
              AI Resume Agent &amp; Career Co-pilot
            </span>

            {/* H1 — scramble effect on first two words */}
            <h1
              className="font-display-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6"
              style={{
                color: "#111", letterSpacing: "-0.03em",
                transform: mounted ? "translateY(0)" : "translateY(24px)",
                opacity: mounted ? 1 : 0,
                transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s, opacity 0.5s ease 0.1s",
              }}
            >
              <span style={{ fontFamily: "monospace", letterSpacing: "0.04em" }}>{scrambled1}</span>
              {" "}
              <span
                className="inline-block px-2"
                style={{ background: "#111", color: "#fff", border: "2px solid #000", fontFamily: "monospace", letterSpacing: "0.04em" }}
              >
                {scrambled2}
              </span>
              <br />
              <span
                className="inline-block px-2"
                style={{
                  background: "hsl(24,100%,50%)", color: "#111", border: "2px solid #000",
                  transform: mounted ? "translateX(0)" : "translateX(-32px)",
                  opacity: mounted ? 1 : 0,
                  transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s, opacity 0.5s ease 0.4s",
                  display: "inline-block",
                }}
              >
                RESUMES.
              </span>
            </h1>

            {/* Sub-copy — fades up */}
            <p
              className="text-lg leading-relaxed mb-4 max-w-lg"
              style={{
                color: "#444", fontFamily: "Inter, sans-serif",
                transform: mounted ? "translateY(0)" : "translateY(20px)",
                opacity: mounted ? 1 : 0,
                transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s, opacity 0.5s ease 0.3s",
              }}
            >
              Stop starting from scratch. We optimise your master resume to instantly generate tailored
              resumes and outreach for every job you want. ATS bot rejects it in{" "}
              <span style={{ fontWeight: 700, color: "#111" }}>6 seconds</span> — we fix that.
            </p>

            <p
              className="text-sm mb-6"
              style={{
                color: "#888", fontFamily: "Inter, sans-serif",
                transform: mounted ? "translateY(0)" : "translateY(16px)",
                opacity: mounted ? 1 : 0,
                transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.38s, opacity 0.5s ease 0.38s",
              }}
            >
              Built for{" "}
              <span
                style={{
                  transition: "opacity 0.3s",
                  opacity: fade ? 1 : 0,
                  display: "inline-block",
                  fontWeight: 700, color: "#111",
                  minWidth: "160px",
                }}
              >
                {ROTATING_WORDS[wordIdx]}
              </span>
            </p>

            {/* Sticker badges — pop in with stagger */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { text: "✦ Free forever",  bg: "#16A34A", delay: "0.42s", rot: "-1deg" },
                { text: "No credit card",   bg: "#2563EB", delay: "0.50s", rot: "1deg" },
                { text: "AI agent 🤖",      bg: "#111",    delay: "0.58s", rot: "-0.5deg" },
              ].map((b) => (
                <div
                  key={b.text}
                  className="px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_#000]"
                  style={{
                    background: b.bg, color: "#fff", border: "2px solid #000",
                    transform: mounted
                      ? `rotate(${b.rot}) scale(1)`
                      : `rotate(${b.rot}) scale(0.5)`,
                    opacity: mounted ? 1 : 0,
                    transition: `transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${b.delay}, opacity 0.3s ease ${b.delay}`,
                  }}
                >
                  {b.text}
                </div>
              ))}
            </div>

            {/* CTAs — slide up */}
            <div
              className="flex flex-wrap gap-4"
              style={{
                transform: mounted ? "translateY(0)" : "translateY(20px)",
                opacity: mounted ? 1 : 0,
                transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s, opacity 0.5s ease 0.5s",
              }}
            >
              <button onClick={onUploadClick} className="brutal-btn px-8 py-4 text-base shadow-[4px_4px_0_#000]" style={{ fontSize: "1rem" }}>
                [ UPLOAD_RESUME ] →
              </button>
              <button onClick={onCheckScoreClick} className="brutal-btn-white px-8 py-4 text-base" style={{ fontSize: "1rem" }}>
                &gt; CHECK_ATS_SCORE
              </button>
            </div>

            {/* Social proof — fades in last */}
            <div
              className="flex items-center gap-6 mt-10 pt-8"
              style={{
                borderTop: "2px solid #ccc",
                transform: mounted ? "translateY(0)" : "translateY(16px)",
                opacity: mounted ? 1 : 0,
                transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.65s, opacity 0.5s ease 0.65s",
              }}
            >
              {[
                { num: "12K+",  label: "Resumes Analyzed" },
                { num: "4.8★",  label: "Avg. Rating" },
                { num: "100%",  label: "Free to Start" },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div style={{ width: "2px", height: "36px", background: "#ccc" }} />}
                  <div className="text-center">
                    <div className="text-2xl font-black" style={{ color: "#111", fontFamily: "Playfair Display, serif" }}>{s.num}</div>
                    <div className="text-xs" style={{ color: "#888" }}>{s.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* RIGHT — Collage Illustration */}
          <HeroIllustration />
        </div>
      </div>

      {/* Bottom divider */}
      <div className="w-full h-8 relative z-10" style={{ background: "hsl(0,0%,4%)", marginTop: "auto" }}>
        <div className="absolute -top-4 left-0 w-full h-4" style={{ background: "hsl(40,30%,92%)", clipPath: "polygon(0 0, 100% 0, 100% 0%, 0 100%)" }} />
      </div>
    </section>
  );
};

export default HeroSection;
