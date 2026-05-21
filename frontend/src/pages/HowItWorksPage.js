import React from "react";
import { useNavigate } from "react-router-dom";

const CARD = { background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', boxShadow: '4px 4px 0 #000' };

export default function HowItWorksPage() {
  const navigate = useNavigate();

  const steps = [
    { num: '01', title: 'Upload Your Resume', desc: 'Drop any PDF resume. Our parser extracts all text, skills, sections, and formatting signals in milliseconds using pdfminer.', color: var(--primary) },
    { num: '02', title: 'Heuristic Pre-Scan', desc: 'Free, instant analysis: keyword matching against the JD, section detection, bullet counting, action verb scoring, and quantification metrics. Zero API cost.', color: '#2563EB' },
    { num: '03', title: 'AI Deep Evaluation', desc: 'One single LLM call (Groq or Gemini) evaluates impact, relevance, and writing quality. Returns 7-dimension scores with reasoning and 5 prioritized fixes.', color: '#8b5cf6' },
    { num: '04', title: 'Full Diagnostic Report', desc: 'You get: score breakdown with explanations, keyword heatmap, AI bullet rewrites, interview questions, and a cover letter draft — all in one report.', color: '#16A34A' },
    { num: '05', title: 'Iterate & Improve', desc: 'Fix the issues, re-upload, and watch your score climb. Track progress over time with the Evolution Timeline. Alex the AI mentor coaches you through it.', color: '#f59e0b' },
  ];

  const faqs = [
    { q: 'How is the score calculated?', a: 'We use a weighted composite of 7 dimensions: Keywords (20%), Impact (20%), Relevance (20%), Quantification (15%), Formatting (10%), Action Verbs (10%), and Length (5%). Each dimension gets a separate score and reasoning explanation.' },
    { q: 'Is my resume data safe?', a: 'Yes. Resume text is processed in-memory, stored in your private database record, and never shared with third parties.' },
    { q: 'How many API calls does one analysis use?', a: 'Exactly one. We batch the entire evaluation into a single LLM call. The heuristic pre-scan is free with zero API usage.' },
    { q: 'Can I use it without a job description?', a: 'Yes. Without a JD, we evaluate against a general professional standard. Adding a specific JD unlocks targeted keyword gap analysis.' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'hsl(40,30%,92%)' }}>
      {/* Nav */}
      <header className="w-full" style={{ background: 'hsl(40,30%,92%)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 flex items-center justify-center font-black text-white text-sm" style={{ background: var(--primary), border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>SR</div>
            <span className="font-black text-lg" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>SmartResume</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-black text-sm uppercase tracking-widest" style={{ color: 'var(--foreground)' }}>
            {['About', 'Resources', 'Templates'].map(label => (
              <span key={label} onClick={() => navigate(`/${label.toLowerCase()}`)} className="cursor-pointer hover:underline">{label}</span>
            ))}
          </div>
          <button onClick={() => navigate('/login')} className="text-sm font-bold px-4 py-2" style={{ color: '#555' }}>Log in</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-4">
          <span style={{ width: 28, height: 2, background: var(--primary), display: 'inline-block' }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: var(--primary) }}>How It Works</span>
        </div>
        <h1 className="font-display-serif text-5xl md:text-6xl mb-6" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
          5 Steps to a<br /><span className="inline-block px-2" style={{ background: var(--primary), color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Perfect Resume</span>
        </h1>
        <p className="text-lg mb-16 max-w-2xl" style={{ color: '#555' }}>
          From PDF upload to a complete diagnostic report — here's exactly what happens under the hood.
        </p>

        {/* Steps */}
        <div className="space-y-5 mb-20">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 p-6 shadow-soft transition-transform hover:-translate-y-0.5" style={CARD}>
              <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 flex items-center justify-center font-black text-lg shadow-soft-sm" style={{ background: step.color, color: step.color === var(--primary) || step.color === '#f59e0b' ? '#111' : '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
                  {step.num}
                </div>
                {i < steps.length - 1 && <div className="w-0.5 flex-1 mt-2" style={{ background: '#ccc' }} />}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg uppercase mb-1" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="flex items-center gap-3 mb-6">
          <span style={{ width: 28, height: 2, background: var(--primary), display: 'inline-block' }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: var(--primary) }}>Frequently Asked</span>
        </div>
        <div className="space-y-4 mb-16">
          {faqs.map((faq, i) => (
            <div key={i} className="p-5 shadow-soft" style={CARD}>
              <p className="font-black text-sm uppercase mb-2" style={{ color: 'var(--foreground)' }}>{faq.q}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => navigate("/signup")} className="modern-btn-primary px-10 py-4 text-base shadow-soft">
            Try It Free →
          </button>
        </div>
      </div>
    </div>
  );
}
