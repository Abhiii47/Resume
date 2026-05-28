import React, { useState } from "react";
import api from "../lib/api";
import { BarChart2, BookOpen } from "lucide-react";
import HolisticTracker from "./HolisticTracker";

const CATEGORIES = [
  {
    id: "dsa", label: "DSA", color: "var(--accent)", badge: "badge-amber",
    resources: [
      { name: "Striver A2Z", desc: "The industry-standard A2Z roadmap for SDE roles", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", tag: "450+ problems" },
      { name: "NeetCode 150", desc: "Most important LeetCode patterns for FAANG", url: "https://neetcode.io/practice", tag: "150 curated" },
      { name: "Love Babbar 450", desc: "Popular DSA sheet cracked by thousands", url: "https://450dsa.com", tag: "450 problems" },
      { name: "Blind 75", desc: "The original 75 must-do LeetCode problems", url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions", tag: "75 problems" },
    ]
  },
  {
    id: "system_design", label: "System Design", color: "#0284c7", badge: "badge-blue",
    resources: [
      { name: "ByteByteGo", desc: "Alex Xu's system design newsletter & books", url: "https://bytebytego.com", tag: "Best for FAANG" },
      { name: "Gaurav Sen YT", desc: "Best free system design YouTube series", url: "https://www.youtube.com/c/GauravSensei", tag: "Free" },
      { name: "System Design Primer", desc: "GitHub's most starred system design guide", url: "https://github.com/donnemartin/system-design-primer", tag: "250k ⭐" },
    ]
  },
  {
    id: "cs_fundamentals", label: "CS Fundamentals", color: "#7c3aed", badge: "badge-amber",
    resources: [
      { name: "Love Babbar CS Notes", desc: "DBMS, OS, CN all-in-one notes for interviews", url: "https://drive.google.com/drive/folders/1ZgHXxJO6s-UBSbT5aJHhHBX5mGl_JkZH", tag: "DBMS+OS+CN" },
      { name: "InterviewBit CS", desc: "Structured CS theory with interview questions", url: "https://www.interviewbit.com/courses/programming/", tag: "Topic-wise" },
      { name: "GFG OS Notes", desc: "GeeksforGeeks OS for interviews", url: "https://www.geeksforgeeks.org/operating-systems/", tag: "OS" },
    ]
  },
  {
    id: "behavioral", label: "Behavioral", color: "#b45309", badge: "badge-amber",
    resources: [
      { name: "Amazon LP Guide", desc: "All 16 Leadership Principles with STAR stories", url: "https://www.amazon.jobs/en/principles", tag: "Amazon" },
      { name: "STAR Method Bank", desc: "Template + 50 example behavioral answers", url: "https://www.themuse.com/advice/star-interview-method", tag: "Framework" },
      { name: "Tech Interview Handbook", desc: "Yangshun's comprehensive behavioral guide", url: "https://www.techinterviewhandbook.org/behavioral-interview/", tag: "Free" },
    ]
  },
  {
    id: "projects", label: "Projects & Dev", color: "#db2777", badge: "badge-blue",
    resources: [
      { name: "Roadmap.sh", desc: "Curated learning paths for every dev role", url: "https://roadmap.sh", tag: "Interactive" },
      { name: "Build Your Own X", desc: "Build real versions of complex tools from scratch", url: "https://github.com/codecrafters-io/build-your-own-x", tag: "GitHub" },
      { name: "DevChallenges", desc: "Real-world project challenges with designs", url: "https://devchallenges.io", tag: "Fullstack" },
    ]
  },
  {
    id: "mock", label: "Mock Interviews", color: "#16a34a", badge: "badge-green",
    resources: [
      { name: "Pramp", desc: "Free peer-to-peer mock technical interviews", url: "https://www.pramp.com", tag: "Free" },
      { name: "Interviewing.io", desc: "Anonymous mock interviews with engineers from FAANG", url: "https://interviewing.io", tag: "FAANG" },
      { name: "LeetCode Mock", desc: "Company-specific timed mock contests", url: "https://leetcode.com/assessment/", tag: "Timed" },
    ]
  },
];

export default function ResourceHub() {
  const [activeCategory, setActiveCategory] = useState("dsa");
  const [showHolisticTracker, setShowHolisticTracker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!targetRole.trim() || !targetCompany.trim()) return;
    setError(null); setIsGenerating(true);
    try {
      const fd = new FormData();
      fd.append("target_role", targetRole.trim());
      fd.append("target_company", targetCompany.trim());
      const res = await api.post('/roadmap/ai-generate', fd);
      setRoadmap(res.data.roadmap);
      setShowForm(false); setShowRoadmap(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate. Upload a resume first in Resume Lab.");
    } finally { setIsGenerating(false); }
  };

  const cat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div style={{ background: "var(--bg-surface)", minHeight: "100%", padding: "32px 28px" }} className="learning-hub-container">
      {/* Header card */}
      <div className="card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Learning Hub</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowHolisticTracker(true)} className="btn btn-secondary btn-sm">
            <BarChart2 className="w-3.5 h-3.5 inline mr-1" /> Holistic Tracker
          </button>
          <button onClick={() => { setShowForm(true); setShowRoadmap(false); }} className="btn btn-primary btn-sm">
            <BookOpen className="w-3.5 h-3.5 inline mr-1" /> AI Roadmap
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className="btn btn-secondary btn-sm"
            style={{
              background: activeCategory === c.id ? c.color : "#fff",
              color: activeCategory === c.id ? "#fff" : "var(--text-secondary)",
              borderColor: activeCategory === c.id ? c.color : "var(--border-muted)"
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Resource cards grid */}
      {cat && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {cat.resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="card" style={{ padding: 20, textDecoration: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>{r.name}</h4>
                <span className="badge badge-amber" style={{ fontSize: 9, padding: "2px 6px", flexShrink: 0 }}>{r.tag}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, flex: 1 }}>{r.desc}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>Open ↗</p>
            </a>
          ))}

          {/* Holistic Daily Tracker Card */}
          {activeCategory === "dsa" && (
            <div onClick={() => setShowHolisticTracker(true)} className="card" style={{ padding: 20, border: "2px border-brutal", borderColor: "var(--accent)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>Holistic Daily Tracker</h4>
                <span className="badge badge-green" style={{ fontSize: 9, padding: "2px 6px" }}>Built-in</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, flex: 1 }}>Track your daily progress across 6 categories: DSA, System Design, Projects, CS Core, Behavioral, and Apps.</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>Open Tracker →</p>
            </div>
          )}

          {/* AI Roadmap card */}
          <div onClick={() => { setShowForm(true); setShowRoadmap(false); }} className="card" style={{ padding: 20, border: "2px dashed var(--accent)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--accent)" }}>Your AI Roadmap</h4>
              <span className="badge badge-amber" style={{ fontSize: 9, padding: "2px 6px" }}>AI</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, flex: 1 }}>
              {roadmap ? `Plan for ${roadmap.role} @ ${roadmap.company} ready.` : "Personalized 8-week plan based on your resume + target role."}
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
              {roadmap ? "View / Regenerate →" : "Generate My Plan →"}
            </p>
          </div>
        </div>
      )}

      {/* Holistic Tracker Overlay */}
      {showHolisticTracker && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(255,253,247,0.98)", padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={() => setShowHolisticTracker(false)} className="btn btn-secondary btn-sm">✕ Close Tracker</button>
          </div>
          <HolisticTracker roadmap={roadmap} />
        </div>
      )}

      {/* AI Roadmap Form */}
      {showForm && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,253,247,0.95)", padding: 24 }}>
          <div className="card" style={{ maxWidth: 440, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>Generate My Plan</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800, color: "var(--text-muted)" }}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>AI analyzes your resume and builds a targeted 8-week roadmap. Upload a resume first in Resume Lab.</p>
            <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="input-label">Target Role</label>
                <input required value={targetRole} onChange={e => setTargetRole(e.target.value)} className="input-field" placeholder="e.g. Software Development Engineer" />
              </div>
              <div>
                <label className="input-label">Target Company</label>
                <input required value={targetCompany} onChange={e => setTargetCompany(e.target.value)} className="input-field" placeholder="e.g. Google, Amazon, Microsoft" />
              </div>
              {error && <div className="alert alert-error" style={{ fontSize: 12, border: "var(--border-brutal)" }}>{error}</div>}
              <button type="submit" disabled={isGenerating} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", height: 42 }}>
                {isGenerating ? "Generating..." : "Generate 8-Week Plan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Generated Roadmap */}
      {showRoadmap && roadmap && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(255,253,247,0.98)", padding: 24, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid var(--border-muted)", paddingBottom: 14 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--accent)" }}>{roadmap.role} @ {roadmap.company}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, maxWidth: 560 }}>{roadmap.summary}</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button onClick={() => { setShowForm(true); setShowRoadmap(false); }} className="btn btn-primary btn-sm">Regenerate</button>
              <button onClick={() => setShowRoadmap(false)} className="btn btn-secondary btn-sm">Close</button>
            </div>
          </div>
          {roadmap.skill_gaps?.length > 0 && (
            <div className="card-surface" style={{ padding: 14, marginBottom: 24, border: "2px solid var(--color-error)", background: "rgba(220,38,38,0.04)" }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--color-error)", marginBottom: 8, letterSpacing: "0.1em" }}>Skill Gaps</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {roadmap.skill_gaps.map((g, i) => <span key={i} className="badge badge-amber" style={{ background: "rgba(220,38,38,0.06)", color: "var(--color-error)", borderColor: "rgba(220,38,38,0.15)", textTransform: "none", fontSize: 10, padding: "3px 8px" }}>{g}</span>)}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 800, margin: "0 auto", width: "100%" }}>
            {roadmap.phases?.map((phase, i) => {
              const isLast = i === roadmap.phases.length - 1;
              return (
                <div key={i} style={{ display: "flex", gap: 16 }}>
                  <div style={{ width: 80, flexShrink: 0, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent)", fontSize: 12, paddingTop: 18 }}>{phase.week_label}</div>
                  <div style={{ width: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 14, height: 14, background: "var(--accent)", border: "var(--border-brutal)", borderRadius: "50%", marginTop: 18, flexShrink: 0 }} />
                    {!isLast && <div style={{ width: 2, background: "var(--border-muted)", flex: 1 }} />}
                  </div>
                  <div className="card" style={{ padding: 20, flex: 1, marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>{phase.title}</h4>
                      <span className="badge badge-blue" style={{ fontSize: 9, padding: "2px 6px" }}>{phase.resource_type}</span>
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", marginBottom: 8, letterSpacing: "0.08em" }}>Focus: {phase.focus}</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>{phase.description}</p>
                    {phase.resource_url && (
                      <a href={phase.resource_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                        {phase.resource_label} ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
