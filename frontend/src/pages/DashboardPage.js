import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE, getAuthToken, removeAuthToken } from "../utils";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import AnalysisLoader from "../components/AnalysisLoader";

import { UploadCloud, FileText, CheckCircle2, BookOpen, Search, LayoutDashboard, BarChart2 } from "lucide-react";
import AgentChat from "../components/AgentChat";
import ResumeBuilder from "../components/ResumeBuilder";
import HolisticTracker from "../components/HolisticTracker";
import { toast, confirm, ToastContainer } from "../components/ui/Toast";

/* ── Animated Score Number ──────────────────────────────────────── */
function AnimatedScore({ value, className, style }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 900;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);
  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}

/* ── Overview Tab — Warm Pearl ────────────────────────────────── */
function OverviewTab({ history, setActiveTab, navigate, llmMetrics, llmMetricsLoading, showLlmMetrics = false }) {
  const latestScore =
    history && history.length > 0
      ? history[0].score_breakdown?.total_score ||
        history[0].score_breakdown?.overall ||
        history[0].ats_score || 0
      : 0;
  const analysisCount = history ? history.length : 0;

  const statCards = [
    { label: "Top ATS Score",      value: latestScore,    suffix: "/ 100", color: "var(--accent)",         bg: "var(--accent-light)" },
    { label: "Resumes Analyzed",   value: analysisCount,  suffix: " runs", color: "#0284c7",               bg: "#dbeafe" },
    { label: "Tracker Categories", value: 6,              suffix: " active", color: "var(--color-success)", bg: "#dcfce7" },
  ];

  const actionCards = [
    { label: "Resume Builder", desc: "Create & export ATS-ready PDFs",      icon: "📄", color: "#0284c7",               onClick: () => navigate("/builder") },
    { label: "Resume Lab",     desc: "Analyze ATS fit and fix every flaw",  icon: "📊", color: "var(--accent)",         onClick: () => setActiveTab("workspace") },
    { label: "Job Tracker",    desc: "Kanban board for your applications",   icon: "🗂️", color: "var(--color-success)",  onClick: () => setActiveTab("tracker") },
    { label: "AI Copilot",     desc: "Chat with your agentic career team",  icon: "🤖", color: "#7c3aed",               onClick: () => setActiveTab("copilot") },
  ];

  return (
    <div style={{ background: "var(--bg-surface)", minHeight: "100%", padding: "32px 28px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--color-success)",
              boxShadow: "0 0 8px rgba(22,163,74,0.7)",
              display: "inline-block",
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Agentic career hub
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            letterSpacing: "-0.03em", color: "var(--text-primary)",
            lineHeight: 1.2, marginBottom: 8,
          }}>
            Dashboard <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>·</span> Your career command center.
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 500 }}>
            Track your resume score, manage applications, and get AI coaching — all from one place.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }} className="dashboard-stats">
          {statCards.map(card => (
            <div key={card.label} className="stat-card">
              <div className="stat-label">{card.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <AnimatedScore
                  value={card.value}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "2.4rem", fontWeight: 700, color: card.color, lineHeight: 1 }}
                />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{card.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Cards Bento Grid */}
        <div style={{ marginBottom: 8 }}>
          <div className="section-label" style={{ marginBottom: 16 }}>
            <span className="section-label-text">Quick Actions</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="dashboard-actions">
            {actionCards.map(card => (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className="card-premium"
                id={`action-${card.label.toLowerCase().replace(/ /g, '-')}`}
                style={{
                  padding: "20px 18px",
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <div style={{
                  width: 40, height: 40,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-page)",
                  border: "var(--border-brutal)",
                  boxShadow: "2px 2px 0 var(--text-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, marginBottom: 14,
                }}>
                  {card.icon}
                </div>
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: 14, color: "var(--text-primary)", marginBottom: 4,
                }}>{card.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, fontWeight: 500 }}>{card.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* LLM Metrics (admin only) */}
        {showLlmMetrics && (
          <div style={{
            marginTop: 24,
            background: "#fff",
            border: "var(--border-brutal)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-brutal)",
            padding: "20px 24px",
          }}>
            <div className="section-label" style={{ marginBottom: 16 }}>
              <span className="section-label-text">AI Reliability Metrics</span>
            </div>
            {llmMetricsLoading ? (
              <p style={{ fontSize: 13, color: "var(--accent-dark)", fontWeight: 800 }}>Loading metrics…</p>
            ) : !llmMetrics ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>No telemetry yet. Trigger a few AI actions first.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Total Calls",    value: llmMetrics.total_calls || 0,         color: "var(--text-primary)" },
                  { label: "Success Rate",   value: `${llmMetrics.success_rate_pct || 0}%`, color: "var(--color-success)" },
                  { label: "Avg Latency",   value: `${llmMetrics.avg_latency_ms || 0}ms`,  color: "var(--color-info)" },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-stats { grid-template-columns: 1fr !important; }
          .dashboard-actions { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .dashboard-actions { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

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

/* ── Resume Workspace ─────────────────────────────────────────────────── */
function ResumeWorkspace({ history, fetchHistory, isAnalyzing, setIsAnalyzing }) {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rewritingIndex, setRewritingIndex] = useState(null);
  const [rewrittenBullets, setRewrittenBullets] = useState({});
  const [dragging, setDragging] = useState(false);

  const handleFileSet = (f) => {
    if (!f) return;
    setFile(f);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(f));
  };

  const handleFileChange = (e) => handleFileSet(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') handleFileSet(f);
    else toast.error('Please drop a PDF file.');
  };

  const handleRewrite = async (flawText, index) => {
    setRewritingIndex(index);
    try {
      const formData = new FormData();
      formData.append('flaw', flawText);
      const res = await axios.post(`${API_BASE}/analyze/rewrite`, formData, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setRewrittenBullets(prev => ({ ...prev, [index]: res.data.rewritten_bullet }));
    } catch { toast.error('Failed to rewrite. Try again.'); }
    finally { setRewritingIndex(null); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_BASE}/analyze-resume/`, formData, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      await fetchHistory();
      setSelectedIndex(0);
    } catch (err) {
      toast.error('Analysis failed: ' + (err.response?.data?.detail || err.message));
    } finally { setIsAnalyzing(false); setFile(null); }
  };

  const selectedAnalysis = history && history.length > 0 ? history[selectedIndex] : null;

  const scoreItems = selectedAnalysis ? [
    {
      label: 'Keywords',
      value: selectedAnalysis.score_breakdown?.keyword_match
          || selectedAnalysis.score_breakdown?.keywords
          || 0,
      max: 35, color: '#3b82f6'
    },
    {
      label: 'Format',
      value: selectedAnalysis.score_breakdown?.format_readability
          || selectedAnalysis.score_breakdown?.format
          || 0,
      max: 30, color: '#8b5cf6'
    },
    {
      label: 'Impact',
      value: selectedAnalysis.score_breakdown?.impact_metrics
          || selectedAnalysis.score_breakdown?.impact
          || 0,
      max: 35, color: 'var(--accent)'
    },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%", background: "var(--bg-surface)" }} className="workspace-container">
      {/* Left: Upload & Preview */}
      <div
        style={{ width: "50%", padding: "32px 28px", display: "flex", flexDirection: "column", borderRight: "var(--border-brutal)" }}
        className="workspace-left"
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 24 }}>Resume Lab</h2>

        {/* Upload zone */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <form onSubmit={handleUpload} style={{ display: "flex", gap: 12 }}>
            <label
              style={{
                flex: 1, cursor: "pointer", padding: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 13, fontWeight: 700,
                border: dragging ? '2px solid var(--accent)' : '2px dashed var(--border-muted)',
                background: dragging ? 'var(--accent-glow)' : 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                borderRadius: "var(--radius-sm)"
              }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />
              <UploadCloud className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span>{file ? file.name : 'Drop PDF or click to upload'}</span>
            </label>
            <button
              type="submit" disabled={!file || isAnalyzing}
              className="btn btn-primary"
              style={{ padding: "0 24px" }}
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Timeline selector */}
        {history && history.length > 0 && (
          <div className="card" style={{ padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>Evolution Timeline</span>
            <select
              value={selectedIndex}
              onChange={e => setSelectedIndex(Number(e.target.value))}
              className="input-field"
              style={{ width: "auto", padding: "6px 12px", fontSize: 12, height: "auto" }}
            >
              {history.map((item, idx) => (
                <option key={item.id} value={idx}>
                  Iteration {history.length - idx} · Score: {item.score_breakdown?.total_score || item.ats_score || 0} · {new Date(item.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* PDF Viewer */}
        <div
          style={{ flex: 1, minHeight: 200, border: 'var(--border-brutal)', boxShadow: 'var(--shadow-brutal)', background: '#fff', borderRadius: "var(--radius-sm)", overflow: "hidden" }}
        >
          {pdfUrl ? (
            <object data={pdfUrl} type="application/pdf" style={{ width: "100%", height: "100%", minHeight: 300 }}>
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifycontent: "center", gap: 10, padding: 20, color: 'var(--text-secondary)' }}>
                <FileText className="w-8 h-8" />
                <p style={{ fontSize: 13, fontWeight: 700 }}>PDF preview unavailable in this browser.</p>
                <a href="#" onClick={(e) => { e.preventDefault(); const a = document.createElement("a"); a.href = pdfUrl; a.download = "resume.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }} className="btn btn-secondary btn-sm">Download PDF</a>
              </div>
            </object>
          ) : selectedAnalysis ? (
            <div style={{ fontSize: 13, whiteSpace: "pre-wrap", padding: 24, overflowY: "auto", height: "100%", color: 'var(--text-secondary)' }}>
              {selectedAnalysis.resume_preview || '[ Resume text preview will appear here ]'}
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
              Upload a PDF to preview it here.
            </div>
          )}
        </div>
      </div>

      {/* Right: Diagnostic */}
      <div
        style={{ width: "50%", padding: "32px 28px", overflowY: "auto", background: "#fff" }}
        className="workspace-right"
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--accent)", letterSpacing: "-0.02em", marginBottom: 24 }}>Diagnostics & Fixes</h2>

        {!selectedAnalysis ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>
            Upload a resume to see diagnostic results.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Score Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {scoreItems.map((s, i) => (
                <div key={i} className="card-surface p-4 text-center" style={{ border: "var(--border-brutal)", borderRadius: "var(--radius-sm)" }}>
                  <p className="text-label" style={{ color: s.color, fontSize: 10 }}>{s.label}</p>
                  <p style={{ fontSize: "2.2rem", fontWeight: 800, color: s.color, fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: 1.1, margin: "6px 0" }}>{s.value}<span style={{ fontSize: "0.9rem", fontWeight: 500, opacity: 0.5 }}>/{s.max}</span></p>
                  {/* mini bar */}
                  <div className="progress-track" style={{ height: 5, background: "var(--bg-elevated)" }}>
                    <div style={{ height: '100%', width: `${(s.value / s.max) * 100}%`, background: s.color, borderRadius: "var(--radius-full)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Flaws & Suggestions */}
            <div className="card" style={{ borderLeft: "6px solid var(--color-error)", overflow: "hidden" }}>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--color-error)", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: "var(--color-error)", borderRadius: "50%" }} />
                  Detected Flaws & AI Fixes
                </h3>
                {selectedAnalysis.gemini_suggestions && selectedAnalysis.gemini_suggestions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {selectedAnalysis.gemini_suggestions.map((s, i) => (
                      <div key={i} className="card-surface" style={{ padding: 16, border: "var(--border-brutal)" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                          <span
                            style={{
                              background: "var(--color-error)", color: "#fff",
                              fontSize: 10, fontWeight: 800, padding: "2px 6px",
                              borderRadius: "var(--radius-sm)", flexShrink: 0
                            }}
                          >#{i + 1}</span>
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, fontWeight: 500 }}>{s}</p>
                        </div>
                        {rewrittenBullets[i] ? (
                          <div style={{ padding: 12, background: "var(--accent-glow)", borderLeft: "3px solid var(--accent)", color: "var(--text-primary)", fontSize: 13, borderRadius: "var(--radius-sm)" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>AI Rewrite:</span>
                            {rewrittenBullets[i]}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRewrite(s, i)}
                            disabled={rewritingIndex === i}
                            className="btn btn-secondary btn-sm"
                          >
                            {rewritingIndex === i ? 'Generating...' : 'Rewrite Bullet →'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>No major flaws detected. Solid resume!</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Job Tracker ──────────────────────────────────────────────────────── */
function JobTracker() {
  const [apps, setApps] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newApp, setNewApp] = useState({ company: '', role: '', stage: 'wishlist', notes: '' });
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('software engineer');
  const [matchModal, setMatchModal] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [activeView, setActiveView] = useState('discover');

  const STAGES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];
  const STAGE_COLORS = { wishlist: '#57534e', applied: 'var(--accent)', interview: '#0284c7', offer: 'var(--color-success)', rejected: 'var(--color-error)' };

  useEffect(() => { fetchApps(); fetchJobs(); }, []);

  const fetchJobs = async (role) => {
    setJobsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/jobs/discover`, { params: { role: role || jobSearch }, headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setJobs(res.data.jobs || []);
    } catch { setJobs([]); } finally { setJobsLoading(false); }
  };

  const handleMatchResume = async (job) => {
    setMatchModal(job); setMatchResult(null); setMatchLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/jobs/match-resume`, { job_title: job.title, company: job.company, job_description: job.description_snippet }, { headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } });
      setMatchResult(res.data);
    } catch (err) { setMatchResult({ error: err.response?.data?.detail || 'Analyze your resume in Resume Lab first.' }); }
    setMatchLoading(false);
  };

  const saveJobToTracker = async (job) => {
    try {
      const fd = new FormData();
      fd.append('company', job.company); fd.append('role', job.title); fd.append('job_url', job.url || '');
      await axios.post(`${API_BASE}/applications`, fd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      fetchApps(); toast.success(`"${job.title}" at ${job.company} saved!`);
    } catch { toast.error('Failed to save job.'); }
  };

  const fetchApps = async () => {
    try {
      const res = await axios.get(`${API_BASE}/applications`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setApps(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('company', newApp.company); fd.append('role', newApp.role);
      const res = await axios.post(`${API_BASE}/applications`, fd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (newApp.stage !== 'applied') {
        const pd = new FormData(); pd.append('stage', newApp.stage);
        await axios.patch(`${API_BASE}/applications/${res.data.id}`, pd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      }
      setShowAdd(false); setNewApp({ company: '', role: '', stage: 'wishlist', notes: '' }); fetchApps();
    } catch { toast.error('Failed to add application.'); }
  };

  const handleStageChange = async (appId, newStage) => {
    try {
      const fd = new FormData(); fd.append('stage', newStage);
      await axios.patch(`${API_BASE}/applications/${appId}`, fd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      fetchApps();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (appId) => {
    const ok = await confirm('Delete this application?', 'Delete', 'Keep it');
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE}/applications/${appId}`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      fetchApps();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ background: "var(--bg-surface)", minHeight: "100%", padding: "32px 28px" }} className="job-tracker-container">
      {/* Header card */}
      <div className="card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Job Tracker</h2>
        <div style={{ display: "flex", gap: 10 }}>
          {['discover', 'kanban'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className="btn btn-secondary btn-sm"
              style={{
                background: activeView === view ? 'var(--accent)' : '#fff',
                color: activeView === view ? '#fff' : 'var(--text-secondary)',
                borderColor: activeView === view ? 'var(--accent)' : 'var(--border-muted)'
              }}
            >
              {view === 'discover' ? <><Search className="w-3.5 h-3.5 inline mr-1" /> Discover</> : <><LayoutDashboard className="w-3.5 h-3.5 inline mr-1" /> Pipeline {apps.length > 0 && `(${apps.length})`}</>}
            </button>
          ))}
          <button
            onClick={() => setShowAdd(v => !v)}
            className="btn btn-primary btn-sm"
          >
            {showAdd ? 'Cancel' : '+ Add Job'}
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="card" style={{ padding: 20, marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label className="input-label" style={{ fontSize: 10 }}>Company</label>
            <input required value={newApp.company} onChange={e => setNewApp({ ...newApp, company: e.target.value })} className="input-field" placeholder="e.g. Google" />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label className="input-label" style={{ fontSize: 10 }}>Role</label>
            <input required value={newApp.role} onChange={e => setNewApp({ ...newApp, role: e.target.value })} className="input-field" placeholder="e.g. SDE Intern" />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className="input-label" style={{ fontSize: 10 }}>Stage</label>
            <select value={newApp.stage} onChange={e => setNewApp({ ...newApp, stage: e.target.value })} className="input-field" style={{ cursor: 'pointer' }}>
              {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: 42 }}>Save</button>
        </form>
      )}

      {/* Discover View */}
      {activeView === 'discover' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchJobs(jobSearch)}
              className="input-field"
              placeholder="Search role (e.g. backend engineer, ML engineer)"
              style={{ flex: 1 }}
            />
            <button onClick={() => fetchJobs(jobSearch)} className="btn btn-primary" style={{ padding: "0 28px" }}>Search</button>
          </div>

          {jobsLoading ? (
            <div className="card text-center" style={{ padding: 40, fontWeight: 700, color: "var(--accent)" }}>Fetching live jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="card text-center" style={{ padding: 40, fontWeight: 700, color: "var(--text-secondary)" }}>No jobs found — try a different role</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }} className="discover-grid">
              {jobs.map(job => (
                <div key={job.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>{job.title}</h4>
                      {job.posted && <span className="badge badge-amber" style={{ padding: "2px 6px", fontSize: 9, flexShrink: 0 }}>{job.posted}</span>}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>{job.company}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{job.location}</p>
                    {job.salary && <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-success)", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)", padding: "2px 6px", display: "inline-block", marginTop: 8 }}>💵 {job.salary}</p>}
                  </div>
                  {job.tags && job.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {job.tags.slice(0, 3).map((t, i) => <span key={i} className="badge badge-blue" style={{ fontSize: 9, padding: "2px 6px" }}>{t}</span>)}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px dashed var(--border-muted)" }}>
                    <button onClick={() => handleMatchResume(job)} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                      <BarChart2 className="w-3.5 h-3.5 inline mr-1" /> AI Match
                    </button>
                    <button onClick={() => saveJobToTracker(job)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>+ Track</button>
                    {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: "0 10px", justifyContent: "center" }}>↗</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kanban View */}
      {activeView === 'kanban' && (
        <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 16 }} className="kanban-pipeline">
          {STAGES.map(status => {
            const colApps = apps.filter(a => a.stage === status || (status === 'applied' && !STAGES.includes(a.stage)));
            return (
              <div key={status} style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column" }} className="kanban-col">
                <div
                  className="card-surface"
                  style={{
                    padding: "10px 14px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderLeft: `4px solid ${STAGE_COLORS[status]}`,
                    borderBottom: "var(--border-brutal)",
                    borderRight: "var(--border-brutal)",
                    borderTop: "var(--border-brutal)",
                    borderRadius: "var(--radius-sm)"
                  }}
                >
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: STAGE_COLORS[status] }}>{status}</span>
                  <span className="badge badge-amber" style={{ padding: "2px 6px", fontSize: 10 }}>{colApps.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", minHeight: 200 }} className="kanban-cards">
                  {colApps.length === 0 ? (
                    <div style={{ textAlign: "center", fontSize: 12, padding: "24px 0", color: "var(--text-muted)", border: "2px dashed var(--border-muted)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>Empty</div>
                  ) : colApps.map(app => (
                    <div key={app.id} className="card group" style={{ padding: 14, position: "relative" }}>
                      <button
                        onClick={() => handleDelete(app.id)}
                        style={{
                          position: "absolute", top: 8, right: 8, width: 20, height: 20,
                          background: "rgba(220,38,38,0.1)", color: "var(--color-error)",
                          border: "1px solid rgba(220,38,38,0.2)", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, borderRadius: 2
                        }}
                      >✕</button>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--text-primary)", paddingRight: 16 }}>{app.company}</p>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 12, fontWeight: 500 }}>{app.role}</p>
                      <select
                        value={app.stage}
                        onChange={e => handleStageChange(app.id, e.target.value)}
                        className="input-field"
                        style={{ padding: "4px 8px", fontSize: 11, height: "auto", cursor: "pointer" }}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Match Modal */}
      {matchModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(28,25,23,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-card" style={{ maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid var(--border-muted)", paddingBottom: 14 }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>{matchModal.title}</h3>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginTop: 2 }}>{matchModal.company}</p>
              </div>
              <button onClick={() => { setMatchModal(null); setMatchResult(null); }} className="btn btn-secondary btn-sm" style={{ padding: "4px 10px" }}>✕ Close</button>
            </div>

            {matchLoading && <div className="text-center py-8 font-bold animate-pulse" style={{ color: "var(--accent)" }}>Analyzing resume fit...</div>}

            {matchResult && !matchResult.error && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div className="card-surface" style={{ padding: 16, display: "flex", alignItems: "center", gap: 18, border: "var(--border-brutal)" }}>
                  <div
                    style={{ fontSize: "2.8rem", fontWeight: 800, color: matchResult.match_score >= 70 ? 'var(--color-success)' : matchResult.match_score >= 50 ? 'var(--accent)' : 'var(--color-error)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', lineHeight: 1 }}
                  >
                    {matchResult.match_score}%
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)" }}>{matchResult.verdict}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{matchResult.one_liner}</p>
                  </div>
                </div>

                {matchResult.missing_keywords?.length > 0 && (
                  <div>
                    <p className="input-label" style={{ color: "var(--color-error)", fontSize: 10 }}>Missing Keywords</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {matchResult.missing_keywords.map((k, i) => <span key={i} className="badge badge-amber" style={{ background: "rgba(220,38,38,0.06)", color: "var(--color-error)", borderColor: "rgba(220,38,38,0.15)", textTransform: "none", fontSize: 10, padding: "3px 8px" }}>{k}</span>)}
                    </div>
                  </div>
                )}

                {matchResult.resume_tweaks?.length > 0 && (
                  <div>
                    <p className="input-label" style={{ color: "var(--accent)", fontSize: 10 }}>Resume Fixes</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {matchResult.resume_tweaks.map((t, i) => (
                        <div key={i} className="card-surface" style={{ padding: 12, border: "var(--border-brutal)" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--accent)", marginRight: 6 }}>{t.section}: </span>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchResult.strengths?.length > 0 && (
                  <div>
                    <p className="input-label" style={{ color: "var(--color-success)", fontSize: 10 }}>Your Strengths</p>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                      {matchResult.strengths.map((s, i) => (
                        <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ color: 'var(--color-success)' }}>✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button onClick={() => saveJobToTracker(matchModal)} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <CheckCircle2 className="w-4 h-4 inline mr-1" /> Save to My Pipeline
                </button>
              </div>
            )}
            {matchResult?.error && (
              <div className="alert alert-error" style={{ fontSize: 13, border: "var(--border-brutal)" }}>{matchResult.error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Resource Hub (Learning Hub) ──────────────────────────────────────── */
function ResourceHub() {
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
      const res = await axios.post(`${API_BASE}/roadmap/ai-generate`, fd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
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
                  <div style={{ width: 80, flexShrink: 0, textalign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent)", fontSize: 12, paddingTop: 18 }}>{phase.week_label}</div>
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

/* ── Dashboard root ─────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("copilot");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [llmMetrics, setLlmMetrics] = useState(null);
  const [llmMetricsLoading, setLlmMetricsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    initializeDashboard();
  }, [navigate]);

  const initializeDashboard = async () => {
    try {
      const profileRes = await axios.get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setCurrentUser(profileRes.data || null);
      await fetchHistory();
      if (profileRes.data?.is_admin) {
        await fetchLlmMetrics();
      } else {
        setLlmMetrics(null);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        removeAuthToken();
        navigate("/login");
        return;
      }
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = res.data;
      setHistory(Array.isArray(data) ? data : data.analyses || []);
    } catch (err) {
      if (err.response?.status === 401) {
        removeAuthToken();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    navigate("/login");
  };

  const fetchLlmMetrics = async () => {
    setLlmMetricsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/llm-metrics`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setLlmMetrics(res.data || null);
    } catch {
      setLlmMetrics(null);
    } finally {
      setLlmMetricsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "var(--bg-surface)" }}>
        <div style={{ width: 248, background: "#fff", borderRight: "1px solid var(--border-subtle)" }} className="hidden-mobile" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: 14, letterSpacing: "0.15em", textTransform: "uppercase",
              color: "var(--accent)", marginBottom: 20,
            }}>Loading your dashboard</div>
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  let Content;
  switch (activeTab) {
    case "overview":
      Content = (
        <OverviewTab
          history={history}
          setActiveTab={setActiveTab}
          navigate={navigate}
          llmMetrics={currentUser?.is_admin ? llmMetrics : null}
          llmMetricsLoading={currentUser?.is_admin ? llmMetricsLoading : false}
          showLlmMetrics={!!currentUser?.is_admin}
        />
      );
      break;
    case "workspace":
      Content = (
        <ResumeWorkspace
          history={history}
          fetchHistory={fetchHistory}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
        />
      );
      break;
    case "tracker":
      Content = <JobTracker />;
      break;
    case "resources":
      Content = <ResourceHub />;
      break;
    case "copilot":
      Content = <AgentChat onAnalysisRefresh={fetchHistory} />;
      break;
    case "builder":
      Content = <ResumeBuilder />;
      break;
    default:
      Content = (
        <div style={{ padding: 40, fontSize: 14, color: "var(--text-muted)" }}>
          Module in development.
        </div>
      );
  }

  return (
    <>
      <div className="dashboard-layout">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
        <main className="dashboard-main" style={{ paddingTop: 0 }}>
          {isAnalyzing && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,253,247,0.85)",
              backdropFilter: "blur(6px)",
            }}>
              <AnalysisLoader />
            </div>
          )}
          {Content}
        </main>
      </div>
      <ToastContainer />
    </>
  );
}
