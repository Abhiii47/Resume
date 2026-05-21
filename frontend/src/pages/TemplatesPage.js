import React from "react";
import { useNavigate } from "react-router-dom";

const CARD = { background: '#fff', border: '1px solid var(--border)', boxShadow: '4px 4px 0 #000' };

const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic Professional',
    color: 'var(--primary)',
    desc: 'Clean single-column layout. Industry standard for ATS parsing. Best for 1-3 years experience.',
    tags: ['ATS-Safe', 'Single Column', 'Entry Level'],
    sections: ['Summary', 'Experience', 'Education', 'Skills', 'Projects'],
  },
  {
    id: 'modern',
    name: 'Modern Developer',
    color: '#2563EB',
    desc: 'Sidebar layout with skill bars and project highlights. Great for software engineers and designers.',
    tags: ['Visual', 'Two Column', 'Mid Level'],
    sections: ['Profile', 'Tech Stack', 'Experience', 'Projects', 'Education'],
  },
  {
    id: 'minimal',
    name: 'Minimal Impact',
    color: '#16A34A',
    desc: 'Ultra-clean with maximum whitespace. Focuses attention on achievements and metrics. Senior-level.',
    tags: ['ATS-Safe', 'Minimal', 'Senior Level'],
    sections: ['Summary', 'Key Achievements', 'Experience', 'Skills'],
  },
  {
    id: 'executive',
    name: 'Executive Two-Column',
    color: '#8b5cf6',
    desc: 'Balanced two-column with leadership focus. Ideal for team leads, PMs, and managers.',
    tags: ['Leadership', 'Two Column', 'Management'],
    sections: ['Executive Summary', 'Core Competencies', 'Experience', 'Education', 'Certifications'],
  },
];

export default function TemplatesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'hsl(40,30%,92%)' }}>
      <header className="w-full" style={{ background: 'hsl(40,30%,92%)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 flex items-center justify-center font-black text-white text-sm" style={{ background: 'var(--primary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>SR</div>
            <span className="font-black text-lg" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>SmartResume</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-black text-sm uppercase tracking-widest" style={{ color: 'var(--foreground)' }}>
            {['About', 'How it Works', 'Resources'].map(label => (
              <span key={label} onClick={() => navigate(`/${label.toLowerCase().replace(/ /g, '-')}`)} className="cursor-pointer hover:underline">{label}</span>
            ))}
          </div>
          <button onClick={() => navigate('/login')} className="text-sm font-bold px-4 py-2" style={{ color: '#555' }}>Log in</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-4">
          <span style={{ width: 28, height: 2, background: 'var(--primary)', display: 'inline-block' }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Resume Templates</span>
        </div>
        <h1 className="font-display-serif text-5xl mb-4" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
          ATS-Optimized <span className="inline-block px-2" style={{ background: 'var(--primary)', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Templates</span>
        </h1>
        <p className="text-base mb-12" style={{ color: 'var(--muted-foreground)' }}>
          Every template is designed to pass ATS parsers while looking professional. Pick one and start building in our live editor.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="flex flex-col transition-transform hover:-translate-y-1 shadow-soft" style={CARD}>
              {/* Template preview area */}
              <div className="p-8 flex items-center justify-center" style={{ background: 'hsl(40,28%,88%)', borderBottom: '1px solid var(--border)', minHeight: 180 }}>
                <div className="w-full max-w-48">
                  {/* Mini resume mockup */}
                  <div className="p-3" style={{ background: '#fff', border: '1px solid #000' }}>
                    <div className="h-2 w-3/4 mb-2" style={{ background: t.color }} />
                    <div className="h-1 w-full mb-1" style={{ background: '#e5e5e5' }} />
                    <div className="h-1 w-5/6 mb-3" style={{ background: '#e5e5e5' }} />
                    {t.sections.slice(0, 4).map((s, i) => (
                      <div key={i} className="mb-2">
                        <div className="h-1 w-1/3 mb-1" style={{ background: t.color, opacity: 0.6 }} />
                        <div className="h-0.5 w-full mb-0.5" style={{ background: '#f0f0f0' }} />
                        <div className="h-0.5 w-4/5" style={{ background: '#f0f0f0' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-black text-lg uppercase mb-2" style={{ color: 'var(--foreground)' }}>{t.name}</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{t.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {t.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5" style={{ background: 'hsl(40,28%,88%)', color: '#555', border: '1px solid #ccc' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Sections</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {t.sections.map((s, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5" style={{ background: '#fafafa', color: '#555', border: '1px solid #ddd' }}>
                      {s}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/builder')}
                  className="mt-auto w-full py-3 font-black uppercase text-sm text-center shadow-soft-sm transition-transform hover:-translate-y-0.5"
                  style={{ background: t.color, color: t.color === 'var(--primary)' || t.color === '#f59e0b' ? '#111' : '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}
                >
                  Use This Template →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
