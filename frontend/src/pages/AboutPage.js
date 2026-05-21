import React from "react";
import { useNavigate } from "react-router-dom";

const CARD = { background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft), 4px 4px 0 #000' };

export default function AboutPage() {
  const navigate = useNavigate();

  const features = [
    { label: 'Hybrid AI Engine', desc: 'Heuristic analysis + LLM deep evaluation in a single batched call. 7-dimension scoring with human-readable reasoning.', color: 'var(--primary)' },
    { label: 'Privacy First', desc: 'Your resume text is analyzed in-memory and stored securely. We never share your data with third parties.', color: '#2563EB' },
    { label: 'Real-Time Jobs', desc: 'Adzuna-powered job discovery across 10+ countries. AI resume-to-job matching with gap analysis.', color: '#16A34A' },
    { label: 'Personalized Roadmaps', desc: 'AI generates 8-week learning plans tailored to your resume gaps, target role, and dream company.', color: '#8b5cf6' },
    { label: 'GitHub Integration', desc: 'Cross-reference your resume claims with real GitHub activity. Surface hidden skills you forgot to list.', color: '#ec4899' },
    { label: 'Alex — AI Mentor', desc: 'An agentic career coach that knows your score, streak, and pipeline. Proactive, data-driven advice.', color: '#f59e0b' },
  ];

  const stats = [
    { value: '7', label: 'Scoring Dimensions' },
    { value: '10+', label: 'Countries (Jobs)' },
    { value: '1', label: 'LLM Call Per Analysis' },
    { value: '50+', label: 'Skills Detected' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'hsl(40,30%,92%)' }}>
      {/* Nav */}
      <header className="w-full" style={{ background: 'hsl(40,30%,92%)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 flex items-center justify-center font-black text-white text-sm" style={{ background: 'var(--primary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>SR</div>
            <span className="font-black text-lg" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>SmartResume</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-black text-sm uppercase tracking-widest" style={{ color: 'var(--foreground)' }}>
            {['How it Works', 'Resources', 'Templates'].map(label => (
              <span key={label} onClick={() => navigate(`/${label.toLowerCase().replace(/ /g, '-')}`)} className="cursor-pointer hover:underline">{label}</span>
            ))}
          </div>
          <button onClick={() => navigate('/login')} className="text-sm font-bold px-4 py-2" style={{ color: '#555' }}>Log in</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="flex items-center gap-3 mb-4">
          <span style={{ width: 28, height: 2, background: 'var(--primary)', display: 'inline-block' }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>About the Platform</span>
        </div>
        <h1 className="font-display-serif text-5xl md:text-6xl mb-6" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
          We Don't Guess.<br />We <span className="inline-block px-2" style={{ background: 'var(--primary)', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Diagnose.</span>
        </h1>
        <p className="text-lg mb-16 max-w-2xl" style={{ color: '#555', lineHeight: 1.7 }}>
          Traditional resume tools give you a number. SmartResume gives you a 7-dimension diagnostic report
          with exact fixes, AI-powered rewrites, and a personalized roadmap to land your target role.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s, i) => (
            <div key={i} className="p-5 text-center shadow-soft" style={CARD}>
              <p className="text-4xl font-black mb-1" style={{ color: 'var(--primary)', fontFamily: 'Playfair Display, serif' }}>{s.value}</p>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#888' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="flex items-center gap-3 mb-6">
          <span style={{ width: 28, height: 2, background: 'var(--primary)', display: 'inline-block' }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>What Powers SmartResume</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {features.map((f, i) => (
            <div key={i} className="p-6 shadow-soft transition-transform hover:-translate-y-1" style={CARD}>
              <div className="w-10 h-10 flex items-center justify-center mb-4 shadow-soft-sm" style={{ background: f.color, border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
                <span className="text-white font-black text-sm">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-black text-base uppercase mb-2" style={{ color: 'var(--foreground)' }}>{f.label}</h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="p-8 shadow-soft" style={{ ...CARD, borderColor: 'var(--primary)' }}>
          <h2 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--primary)' }}>Tech Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm" style={{ color: '#555' }}>
            <div>
              <p className="font-black mb-2" style={{ color: 'var(--foreground)' }}>Frontend</p>
              <p>React 18 · TailwindCSS v4 · Framer Motion · GSAP · Recharts · Lucide Icons</p>
            </div>
            <div>
              <p className="font-black mb-2" style={{ color: 'var(--foreground)' }}>Backend</p>
              <p>FastAPI · SQLAlchemy · Neon PostgreSQL · Groq (Llama 3.3) · Google Gemini · Adzuna API</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <button onClick={() => navigate("/signup")} className="modern-btn-primary px-10 py-4 text-base shadow-soft">
            Start Analyzing — Free →
          </button>
        </div>
      </div>
    </div>
  );
}
