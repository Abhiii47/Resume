import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CARD = { background: '#fff', border: '1px solid var(--border)', boxShadow: '4px 4px 0 #000' };

const CATEGORIES = [
  { id: 'dsa', label: 'DSA', color: 'var(--primary)', resources: [
    { name: 'Striver A2Z', desc: 'Industry-standard A2Z roadmap for SDE roles', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', tag: '450+ problems' },
    { name: 'NeetCode 150', desc: 'Most important LeetCode patterns for FAANG', url: 'https://neetcode.io/practice', tag: '150 curated' },
    { name: 'Love Babbar 450', desc: 'Popular DSA sheet cracked by thousands', url: 'https://450dsa.com', tag: '450 problems' },
    { name: 'Blind 75', desc: 'The original 75 must-do LeetCode problems', url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions', tag: '75 problems' },
  ]},
  { id: 'system_design', label: 'System Design', color: '#2563EB', resources: [
    { name: 'ByteByteGo', desc: "Alex Xu's system design newsletter & books", url: 'https://bytebytego.com', tag: 'Best for FAANG' },
    { name: 'Gaurav Sen YT', desc: 'Best free system design YouTube series', url: 'https://www.youtube.com/c/GauravSensei', tag: 'Free' },
    { name: 'System Design Primer', desc: "GitHub's most starred system design guide", url: 'https://github.com/donnemartin/system-design-primer', tag: '250k ⭐' },
  ]},
  { id: 'cs_fundamentals', label: 'CS Fundamentals', color: '#8b5cf6', resources: [
    { name: 'Love Babbar CS Notes', desc: 'DBMS, OS, CN all-in-one notes for interviews', url: 'https://drive.google.com/drive/folders/1ZgHXxJO6s-UBSbT5aJHhHBX5mGl_JkZH', tag: 'DBMS+OS+CN' },
    { name: 'InterviewBit CS', desc: 'Structured CS theory with interview questions', url: 'https://www.interviewbit.com/courses/programming/', tag: 'Topic-wise' },
    { name: 'GFG OS Notes', desc: 'GeeksforGeeks OS for interviews', url: 'https://www.geeksforgeeks.org/operating-systems/', tag: 'OS' },
  ]},
  { id: 'behavioral', label: 'Behavioral', color: '#f59e0b', resources: [
    { name: 'Amazon LP Guide', desc: 'All 16 Leadership Principles with STAR stories', url: 'https://www.amazon.jobs/en/principles', tag: 'Amazon' },
    { name: 'STAR Method Bank', desc: 'Template + 50 example behavioral answers', url: 'https://www.themuse.com/advice/star-interview-method', tag: 'Framework' },
    { name: 'Tech Interview Handbook', desc: "Yangshun's comprehensive behavioral guide", url: 'https://www.techinterviewhandbook.org/behavioral-interview/', tag: 'Free' },
  ]},
  { id: 'projects', label: 'Projects & Dev', color: '#ec4899', resources: [
    { name: 'Roadmap.sh', desc: 'Curated learning paths for every dev role', url: 'https://roadmap.sh', tag: 'Interactive' },
    { name: 'Build Your Own X', desc: 'Build real versions of complex tools from scratch', url: 'https://github.com/codecrafters-io/build-your-own-x', tag: 'GitHub' },
    { name: 'DevChallenges', desc: 'Real-world project challenges with designs', url: 'https://devchallenges.io', tag: 'Fullstack' },
  ]},
  { id: 'mock', label: 'Mock Interviews', color: '#16A34A', resources: [
    { name: 'Pramp', desc: 'Free peer-to-peer mock technical interviews', url: 'https://www.pramp.com', tag: 'Free' },
    { name: 'Interviewing.io', desc: 'Anonymous mock interviews with FAANG engineers', url: 'https://interviewing.io', tag: 'FAANG' },
    { name: 'LeetCode Mock', desc: 'Company-specific timed mock contests', url: 'https://leetcode.com/assessment/', tag: 'Timed' },
  ]},
  { id: 'faang', label: 'FAANG Sheets', color: 'var(--foreground)', resources: [
    { name: 'Fraz SDE Sheet', desc: 'By Mohammad Fraz (ex-Microsoft) — 450 problems', url: 'https://docs.google.com/spreadsheets/d/1-wKcV99KtO91dXdPkwmXGTdtyxAfk1mbPXQg81R9sFo', tag: 'Microsoft' },
    { name: 'Arsh Goyal 280', desc: "FAANG-cracker's handpicked 280 problems", url: 'https://docs.google.com/spreadsheets/d/1MGVBJ8HkRbCnU6EQASjJKCqQE8BWng4qgL0n3vCVOxE', tag: '280 problems' },
  ]},
];

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState('dsa');
  const cat = CATEGORIES.find(c => c.id === active);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(40,30%,92%)' }}>
      <header className="w-full" style={{ background: 'hsl(40,30%,92%)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 flex items-center justify-center font-black text-white text-sm" style={{ background: 'var(--primary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>SR</div>
            <span className="font-black text-lg" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>SmartResume</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-black text-sm uppercase tracking-widest" style={{ color: 'var(--foreground)' }}>
            {['About', 'How it Works', 'Templates'].map(label => (
              <span key={label} onClick={() => navigate(`/${label.toLowerCase().replace(/ /g, '-')}`)} className="cursor-pointer hover:underline">{label}</span>
            ))}
          </div>
          <button onClick={() => navigate('/login')} className="text-sm font-bold px-4 py-2" style={{ color: '#555' }}>Log in</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-4">
          <span style={{ width: 28, height: 2, background: 'var(--primary)', display: 'inline-block' }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Career Resources</span>
        </div>
        <h1 className="font-display-serif text-5xl mb-4" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
          Resource <span className="inline-block px-2" style={{ background: 'var(--primary)', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Hub</span>
        </h1>
        <p className="text-base mb-10" style={{ color: 'var(--muted-foreground)' }}>
          Curated, battle-tested resources used by engineers who cracked FAANG.
        </p>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className="px-4 py-2 text-xs font-black uppercase transition-all shadow-soft-sm"
              style={{
                background: active === c.id ? c.color : '#fff',
                color: active === c.id ? (c.color === '#111' || c.color === '#8b5cf6' || c.color === '#2563EB' || c.color === '#16A34A' || c.color === '#ec4899' ? '#fff' : '#111') : '#555',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Resources grid */}
        {cat && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cat.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                className="p-5 flex flex-col gap-2 transition-transform hover:-translate-y-1 group shadow-soft" style={CARD}>
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-base group-hover:underline" style={{ color: 'var(--foreground)' }}>{r.name}</h3>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>↗</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{r.desc}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 self-start mt-auto shadow-soft-sm" style={{ background: cat.color, color: cat.color === '#111' || cat.color === '#8b5cf6' || cat.color === '#2563EB' || cat.color === '#16A34A' || cat.color === '#ec4899' ? '#fff' : '#111', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
                  {r.tag}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="text-center mt-16">
          <button onClick={() => navigate("/signup")} className="modern-btn-primary px-10 py-4 text-base shadow-soft">
            Start Your Journey →
          </button>
        </div>
      </div>
    </div>
  );
}
