import React, { useEffect, useState } from "react";

const ROTATING_WORDS = ["SDE roles.", "FAANG.", "your dream job.", "campus placements.", "that internship."];

/* ── Collage Hero Illustration ─────────────────────────────── */
function HeroIllustration() {
  return (
    <div className="hidden lg:flex items-center justify-center relative" style={{ minHeight: "460px" }}>
      {/* Big orange background circle */}
      <div
        style={{
          position: "absolute",
          width: "300px", height: "300px",
          background: "hsl(24,100%,50%)",
          borderRadius: "50%",
          border: "3px solid #000",
          top: "8%", right: "4%",
          zIndex: 0,
        }}
      />

      {/* Main collage SVG */}
      <svg
        viewBox="0 0 340 420"
        width="340" height="420"
        style={{ position: "relative", zIndex: 1 }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="arrowOrange" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="hsl(24,100%,50%)" />
          </marker>
        </defs>

        {/* Magnifying glass circle */}
        <circle cx="196" cy="148" r="82" fill="#fff" stroke="#000" strokeWidth="4" />
        <circle cx="196" cy="148" r="74" fill="#EEF2FF" stroke="#000" strokeWidth="1.5" />

        {/* Eye inside glass */}
        <ellipse cx="196" cy="148" rx="40" ry="24" fill="#fff" stroke="#000" strokeWidth="2.5" />
        <circle cx="196" cy="148" r="13" fill="#2563EB" />
        <circle cx="196" cy="148" r="7" fill="#000" />
        <circle cx="201" cy="143" r="3" fill="#fff" />
        {/* Eyelashes */}
        <line x1="174" y1="124" x2="171" y2="115" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <line x1="186" y1="119" x2="185" y2="110" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <line x1="198" y1="118" x2="198" y2="108" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <line x1="210" y1="120" x2="212" y2="111" stroke="#000" strokeWidth="2" strokeLinecap="round" />

        {/* Magnifying glass handle */}
        <rect x="256" y="204" width="20" height="74" rx="10" transform="rotate(40 256 204)" fill="#111" stroke="#000" strokeWidth="2" />

        {/* Hand holding the glass */}
        <path
          d="M128 318 C116 294 106 268 112 246 C115 232 127 228 136 236
             C138 222 150 218 158 228 C162 214 174 212 180 224
             C184 212 198 212 200 228
             L202 318 Z"
          fill="#F5E6C8" stroke="#000" strokeWidth="2.5"
        />
        <line x1="136" y1="236" x2="140" y2="318" stroke="#000" strokeWidth="1.2" strokeDasharray="3,4" />
        <line x1="158" y1="228" x2="161" y2="318" stroke="#000" strokeWidth="1.2" strokeDasharray="3,4" />
        <line x1="180" y1="224" x2="182" y2="318" stroke="#000" strokeWidth="1.2" strokeDasharray="3,4" />

        {/* Crown on top of glass */}
        <path d="M160 70 L172 50 L184 64 L196 42 L208 64 L220 50 L232 70 Z" fill="hsl(24,100%,50%)" stroke="#000" strokeWidth="2.5" />
        <rect x="160" y="70" width="72" height="18" fill="hsl(24,100%,50%)" stroke="#000" strokeWidth="2" />
        <circle cx="164" cy="70" r="4" fill="#111" />
        <circle cx="196" cy="68" r="4" fill="#111" />
        <circle cx="228" cy="70" r="4" fill="#111" />

        {/* Sparkle stars */}
        <path d="M72 88 L76 78 L80 88 L90 92 L80 96 L76 106 L72 96 L62 92 Z" fill="#16A34A" stroke="#000" strokeWidth="1.5" />
        <path d="M284 252 L287 244 L290 252 L298 255 L290 258 L287 266 L284 258 L276 255 Z" fill="#2563EB" stroke="#000" strokeWidth="1.5" />
        <circle cx="60" cy="210" r="9" fill="#FEF9C3" stroke="#000" strokeWidth="2" />
        <circle cx="296" cy="108" r="5" fill="hsl(24,100%,50%)" stroke="#000" strokeWidth="1.5" />

        {/* Floating ATS Score label */}
        <rect x="44" y="136" width="96" height="30" fill="#111" stroke="hsl(24,100%,50%)" strokeWidth="2" />
        <text x="92" y="156" textAnchor="middle" fill="hsl(24,100%,50%)" fontSize="11" fontFamily="monospace" fontWeight="bold" letterSpacing="1">ATS SCORE</text>
        <line x1="140" y1="151" x2="160" y2="149" stroke="hsl(24,100%,50%)" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrowOrange)" />

        {/* Small resume doc floating */}
        <rect x="44" y="260" width="56" height="72" fill="#fff" stroke="#000" strokeWidth="2" />
        <line x1="52" y1="274" x2="88" y2="274" stroke="#ccc" strokeWidth="2" />
        <line x1="52" y1="282" x2="88" y2="282" stroke="#ccc" strokeWidth="2" />
        <line x1="52" y1="290" x2="78" y2="290" stroke="#ccc" strokeWidth="2" />
        <line x1="52" y1="298" x2="84" y2="298" stroke="#ccc" strokeWidth="2" />
        <rect x="52" y="306" width="24" height="8" fill="hsl(24,100%,50%)" />
        <text x="64" y="313" textAnchor="middle" fill="#111" fontSize="5" fontFamily="monospace" fontWeight="bold">FIXED ✓</text>

        {/* Arrow from doc to glass */}
        <path d="M100 296 C120 290 130 270 140 240" stroke="#000" strokeWidth="1.5" strokeDasharray="4,4" fill="none" markerEnd="url(#arrowOrange)" />
      </svg>

      {/* Floating sticker badge */}
      <div
        style={{
          position: "absolute",
          bottom: "14%", left: "2%",
          background: "#16A34A", color: "#fff",
          border: "2px solid #000",
          padding: "6px 14px",
          fontWeight: 900,
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transform: "rotate(-2deg)",
          zIndex: 2,
          boxShadow: "3px 3px 0 #000",
        }}
      >
        ✦ 100% free to start
      </div>

      {/* Second sticker */}
      <div
        style={{
          position: "absolute",
          top: "6%", left: "6%",
          background: "#2563EB", color: "#fff",
          border: "2px solid #000",
          padding: "5px 12px",
          fontWeight: 900,
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transform: "rotate(1.5deg)",
          zIndex: 2,
          boxShadow: "3px 3px 0 #000",
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
              className="inline-block text-xs font-bold uppercase tracking-widest mb-6 px-3 py-1.5 border-2 border-black self-start shadow-hard-sm"
              style={{ background: "hsl(24,100%,50%)", color: "#111" }}
            >
              AI Resume Agent &amp; Career Co-pilot
            </span>

            <h1
              className="font-display-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6"
              style={{ color: "#111", letterSpacing: "-0.03em" }}
            >
              Finding a job is{" "}
              <span
                className="inline-block px-2"
                style={{ background: "#111", color: "#fff", border: "2px solid #000" }}
              >
                Hard.
              </span>
              <br />
              We make it{" "}
              <span
                className="inline-block px-2"
                style={{ background: "hsl(24,100%,50%)", color: "#111", border: "2px solid #000" }}
              >
                easier.
              </span>
            </h1>

            <p
              className="text-lg leading-relaxed mb-4 max-w-lg"
              style={{ color: "#444", fontFamily: "Inter, sans-serif" }}
            >
              Stop starting from scratch. We optimise your master resume to
              instantly generate tailored resumes and outreach for every job you want.
              ATS bot rejects it in{" "}
              <span style={{ fontWeight: 700, color: "#111" }}>6 seconds</span> — we fix that.
            </p>

            <p
              className="text-sm mb-6"
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

            {/* Sticker badges row */}
            <div className="flex flex-wrap gap-2 mb-8">
              <div
                className="px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-hard-sm"
                style={{ background: "#16A34A", color: "#fff", border: "2px solid #000", transform: "rotate(-1deg)" }}
              >
                ✦ Free forever
              </div>
              <div
                className="px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-hard-sm"
                style={{ background: "#2563EB", color: "#fff", border: "2px solid #000", transform: "rotate(1deg)" }}
              >
                No credit card
              </div>
              <div
                className="px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-hard-sm"
                style={{ background: "#111", color: "#fff", border: "2px solid #000", transform: "rotate(-0.5deg)" }}
              >
                AI agent 🤖
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onUploadClick}
                className="neu-btn-primary px-8 py-4 text-base shadow-hard"
                style={{ fontSize: "1rem" }}
              >
                Get Started →
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

          {/* RIGHT — Collage Illustration */}
          <HeroIllustration />

        </div>
      </div>

      {/* Bottom divider */}
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
