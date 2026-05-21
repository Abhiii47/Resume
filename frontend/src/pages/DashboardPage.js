import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE, getAuthToken, removeAuthToken } from "../utils";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import AnalysisLoader from "../components/AnalysisLoader";

import { UploadCloud, FileText, CheckCircle2, BookOpen, Search, LayoutDashboard, BarChart2 } from "lucide-react";
import AgentChat from "../components/AgentChat";
import ResumeBuilder from "../components/ResumeBuilder";
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
  return <span className={className} style={style}>{display}</span>;
}

/* ── Overview Tab ───────────────────────────────────────────── */
function OverviewTab({ history, setActiveTab, navigate, llmMetrics, llmMetricsLoading, showLlmMetrics = false }) {
  // Normalize: accept both `total_score` (from DB scorer) and `ats_score` (legacy)
  const latestScore = history && history.length > 0
    ? (history[0].score_breakdown?.total_score
       || history[0].score_breakdown?.overall
       || history[0].ats_score
       || 0)
    : 0;
  const analysisCount = history ? history.length : 0;

  const statCards = [
    { label: 'Top ATS Score', value: latestScore, suffix: '/ 100', bg: 'var(--primary)', shadow: '6px 6px 0 #b34500', color: 'var(--foreground)' },
    { label: 'Resumes Analyzed', value: analysisCount, suffix: 'iterations', bg: '#2563EB', shadow: '6px 6px 0 #1a3a8f', color: 'var(--foreground)' },
    { label: 'Active Tracker', value: 6, suffix: 'categories', bg: '#16A34A', shadow: '6px 6px 0 #0d5c2a', color: 'var(--foreground)' },
  ];

  const actionCards = [
    { label: 'Resume Builder', desc: 'Create & Export PDF', icon: FileText, accent: '#2563EB', onClick: () => navigate('/builder') },
    { label: 'Resume Lab', desc: 'Analyze & Fix Flaws', icon: UploadCloud, accent: 'var(--primary)', onClick: () => setActiveTab('workspace') },
    { label: 'Job Tracker', desc: 'Discover & Match', icon: CheckCircle2, accent: '#16A34A', onClick: () => setActiveTab('tracker') },
    { label: 'Learning Hub', desc: 'AI Roadmap & Resources', icon: BookOpen, accent: '#8b5cf6', onClick: () => setActiveTab('resources') },
  ];

  return (
    <div
      className="p-6 md:p-10 flex flex-col min-h-full"
      
    >
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>Agentic Career Hub</p>
        <h2 className="text-5xl font-black uppercase" style={{ color: 'var(--foreground)' }}>Command Center</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="p-6 transition-transform hover:-translate-y-1"
            className="glass-card"
          >
            <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">{card.label}</p>
            <div className="flex items-baseline gap-2">
              <AnimatedScore value={card.value} className="text-6xl font-black" style={{ fontFamily: 'Playfair Display, serif' }} />
              <span className="text-sm font-bold opacity-70">{card.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: 'var(--muted-foreground)' }}>Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {actionCards.map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            className="glass-card p-5 flex flex-col gap-4 cursor-pointer transition-all hover:-translate-y-1 group"
          >
            <div
              className="w-12 h-12 flex items-center justify-center shrink-0"
              style={{ background: card.accent, color: 'var(--foreground)' }}
            >
              <card.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-base uppercase" style={{ color: 'var(--foreground)' }}>{card.label}</h4>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{card.desc}</p>
            </div>
            <div className="text-right text-xs font-black" style={{ color: card.accent }}>Open →</div>
          </div>
        ))}
      </div>

      {showLlmMetrics && (
      <>
      {/* LLM Reliability */}
      <h3 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: 'var(--muted-foreground)' }}>AI Reliability</h3>
      <div className="p-6" className="glass-card">
        {llmMetricsLoading ? (
          <p className="text-sm font-bold animate-pulse" style={{ color: 'var(--primary)' }}>Loading metrics...</p>
        ) : !llmMetrics ? (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No telemetry yet. Trigger a few AI actions first.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {[
                { label: 'Total Calls', value: llmMetrics.total_calls || 0, color: 'var(--foreground)' },
                { label: 'Success Rate', value: `${llmMetrics.success_rate_pct || 0}%`, color: '#16A34A' },
                { label: 'Avg Latency', value: `${llmMetrics.avg_latency_ms || 0}ms`, color: 'var(--primary)' },
              ].map((m, i) => (
                <div key={i} className="p-4" className="glass-card">
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>{m.label}</p>
                  <p className="text-4xl font-black" style={{ color: m.color, fontFamily: 'var(--font-display)' }}>{m.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[{ title: 'By Task', data: llmMetrics.by_task }, { title: 'By Provider', data: llmMetrics.by_provider }].map((section, i) => (
                <div key={i} className="p-4" className="glass-card">
                  <p className="text-xs font-black uppercase tracking-widest mb-4 pb-2" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>{section.title}</p>
                  <div className="space-y-3 max-h-44 overflow-y-auto">
                    {Object.keys(section.data || {}).length === 0 ? (
                      <p className="text-xs" style={{ color: '#444' }}>No data yet</p>
                    ) : Object.entries(section.data).map(([key, data]) => (
                      <div key={key} className="flex justify-between text-xs font-bold" style={{ color: 'var(--foreground)', borderBottom: '1px solid #ccc', paddingBottom: 6 }}>
                        <span className="truncate">{key}</span>
                        <span className="shrink-0 ml-4" style={{ color: 'var(--muted-foreground)' }}>{data.success_rate_pct}% · {data.avg_latency_ms}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
}

/* ── Resume Workspace ────────────────────────────────────────── */
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

  // Normalize score fields: support both old (keyword_match) and new (keywords) keys
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
      max: 35, color: 'var(--primary)'
    },
  ] : [];

  return (
    <div className="flex flex-col lg:flex-row h-full" >
      {/* Left: Upload & Preview */}
      <div
        className="w-full lg:w-1/2 p-6 lg:p-8 flex flex-col"
        style={{ borderRight: '1px solid var(--border)', background: '#fdfbf7' }}
      >
        <h2 className="text-3xl font-black uppercase text-[#111] mb-6" style={{ letterSpacing: '-0.02em' }}>Resume Lab</h2>

        {/* Upload zone */}
        <div
          className="p-6 mb-5 shrink-0"
          className="glass-card"
        >
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3">
            <label
              className="flex-1 cursor-pointer p-4 flex items-center justify-center gap-3 text-sm font-bold transition-all"
              style={{
                border: dragging ? '2px solid hsl(24,100%,50%)' : '2px dashed #333',
                background: dragging ? 'rgba(0,119,255,0.1)' : '#fdfbf7',
                color: 'var(--muted-foreground)',
              }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              <UploadCloud className="w-5 h-5 shrink-0" style={{ color: 'var(--primary)' }} />
              <span style={{ color: file ? '#fff' : '#555' }}>{file ? file.name : 'Drop PDF or click to upload'}</span>
            </label>
            <button
              type="submit" disabled={!file || isAnalyzing}
              className="px-6 py-3 font-black uppercase text-sm transition-all"
              className="modern-btn-primary disabled:opacity-50"
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Timeline selector */}
        {history && history.length > 0 && (
          <div
            className="mb-5 flex items-center justify-between p-3 shrink-0"
            className="glass-card"
          >
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Evolution Timeline</span>
            <select
              value={selectedIndex}
              onChange={e => setSelectedIndex(Number(e.target.value))}
              className="text-xs font-bold p-1 outline-none"
              style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--muted-foreground)', cursor: 'pointer' }}
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
          className="flex-1 overflow-hidden relative"
          style={{ minHeight: 200, border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', background: '#fdfbf7' }}
        >
          {pdfUrl ? (
            <object data={pdfUrl} type="application/pdf" className="w-full h-full" style={{ minHeight: 300 }}>
              <div className="h-full flex flex-col items-center justify-center gap-2 p-4" style={{ color: 'var(--muted-foreground)' }}>
                <FileText className="w-8 h-8" />
                <p className="text-sm font-bold">PDF preview unavailable in this browser.</p>
                <a href="#" onClick={(e) => { e.preventDefault(); const a = document.createElement("a"); a.href = pdfUrl; a.download = "resume.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }} className="text-xs font-black" style={{ color: "var(--primary)" }}>Download PDF</a>
              </div>
            </object>
          ) : selectedAnalysis ? (
            <div className="text-sm whitespace-pre-wrap p-6 overflow-y-auto h-full" style={{ color: 'var(--muted-foreground)' }}>
              {selectedAnalysis.resume_preview || '[ Resume text preview will appear here ]'}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              Upload a PDF to preview it here.
            </div>
          )}
        </div>
      </div>

      {/* Right: Diagnostic */}
      <div
        className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto"
        style={{ background: '#fff' }}
      >
        <h2 className="text-3xl font-black uppercase mb-6" style={{ letterSpacing: '-0.02em', color: 'var(--primary)' }}>Diagnostics & Fixes</h2>

        {!selectedAnalysis ? (
          <div
            className="p-10 text-center font-bold"
            className="glass-card text-muted-foreground"
          >
            Upload a resume to see diagnostic results.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-4">
              {scoreItems.map((s, i) => (
                <div key={i} className="p-4 text-center" style={{ background: '#fdfbf7', border: `2px solid ${s.color}22` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-4xl font-black" style={{ color: s.color, fontFamily: 'Playfair Display, serif' }}>{s.value}<span className="text-base opacity-40">/{s.max}</span></p>
                  {/* mini bar */}
                  <div className="mt-2 h-1" style={{ background: 'var(--secondary)' }}>
                    <div style={{ height: '100%', width: `${(s.value / s.max) * 100}%`, background: s.color, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Flaws & Suggestions */}
            <div className="relative overflow-hidden" className="glass-card">
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: '#ef4444' }} />
              <div className="p-6 pl-7">
                <h3 className="text-base font-black uppercase mb-5 flex items-center gap-2" style={{ color: '#ef4444' }}>
                  <span style={{ width: 8, height: 8, background: '#ef4444', display: 'inline-block' }} />
                  Detected Flaws & AI Fixes
                </h3>
                {selectedAnalysis.gemini_suggestions && selectedAnalysis.gemini_suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {selectedAnalysis.gemini_suggestions.map((s, i) => (
                      <div key={i} className="p-4 text-sm" style={{ background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)' }}>
                        <div className="flex items-start gap-3 mb-3">
                          <span
                            className="text-xs font-black shrink-0 px-1.5 py-0.5"
                            style={{ background: '#ef4444', color: 'var(--foreground)' }}
                          >#{i + 1}</span>
                          <p className="font-medium" style={{ color: 'var(--muted-foreground)' }}>{s}</p>
                        </div>
                        {rewrittenBullets[i] ? (
                          <div className="mt-3 p-3 text-sm" style={{ background: 'rgba(0,119,255,0.06)', borderLeft: '3px solid hsl(24,100%,50%)', color: 'var(--muted-foreground)' }}>
                            <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--primary)' }}>AI Rewrite:</span>
                            {rewrittenBullets[i]}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRewrite(s, i)}
                            disabled={rewritingIndex === i}
                            className="mt-2 text-xs font-black uppercase px-4 py-2 transition-colors"
                            style={{ background: rewritingIndex === i ? '#222' : 'var(--primary)', color: rewritingIndex === i ? '#555' : '#111', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', cursor: rewritingIndex === i ? 'not-allowed' : 'pointer' }}
                          >
                            {rewritingIndex === i ? 'Generating...' : 'Rewrite Bullet →'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>No major flaws detected. Solid resume!</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Job Tracker ────────────────────────────────────────────── */
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
  const STAGE_COLORS = { wishlist: '#6b7280', applied: 'var(--primary)', interview: '#3b82f6', offer: '#22c55e', rejected: '#ef4444' };

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

  const inputStyle = { background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)', padding: '10px 14px', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%' };

  return (
    <div
      className="p-6 md:p-8 h-full flex flex-col"
      style={{ background: 'transparent' }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center mb-6 p-4 shrink-0"
        className="glass-card"
      >
        <h2 className="text-2xl font-black uppercase text-[#111]" style={{ letterSpacing: '-0.02em' }}>Job Tracker</h2>
        <div className="flex gap-3">
          {['discover', 'kanban'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className="px-3 py-2 text-xs font-black uppercase flex items-center gap-1.5 transition-all"
              style={{
                background: activeView === view ? 'var(--primary)' : 'transparent',
                color: activeView === view ? '#111' : '#666',
                border: `2px solid ${activeView === view ? 'var(--primary)' : '#333'}`,
              }}
            >
              {view === 'discover' ? <><Search className="w-3.5 h-3.5" /> Discover</> : <><LayoutDashboard className="w-3.5 h-3.5" /> Pipeline {apps.length > 0 && `(${apps.length})`}</>}
            </button>
          ))}
          <button
            onClick={() => setShowAdd(v => !v)}
            className="px-4 py-2 text-xs font-black uppercase transition-all"
            style={{ background: showAdd ? '#333' : '#fff', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}
          >
            {showAdd ? '✕ Cancel' : '+ Add Job'}
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="p-5 mb-5 flex gap-4 items-end flex-wrap shrink-0"
          className="glass-card"
        >
          <div className="flex-1 min-w-28">
            <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--muted-foreground)' }}>Company</label>
            <input required value={newApp.company} onChange={e => setNewApp({ ...newApp, company: e.target.value })} style={inputStyle} placeholder="e.g. Google" />
          </div>
          <div className="flex-1 min-w-28">
            <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--muted-foreground)' }}>Role</label>
            <input required value={newApp.role} onChange={e => setNewApp({ ...newApp, role: e.target.value })} style={inputStyle} placeholder="e.g. SDE Intern" />
          </div>
          <div className="flex-1 min-w-24">
            <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--muted-foreground)' }}>Stage</label>
            <select value={newApp.stage} onChange={e => setNewApp({ ...newApp, stage: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
              {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <button type="submit" className="px-6 py-2.5 font-black uppercase text-sm" style={{ background: 'var(--primary)', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', height: 42 }}>Save</button>
        </form>
      )}

      {/* Discover View */}
      {activeView === 'discover' && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-3 mb-5">
            <input
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchJobs(jobSearch)}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Search role (e.g. backend engineer, ML engineer)"
            />
            <button onClick={() => fetchJobs(jobSearch)} className="px-6 font-black uppercase text-sm" style={{ background: 'var(--primary)', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Search</button>
          </div>

          {jobsLoading ? (
            <div className="text-center font-bold animate-pulse py-12" style={{ color: 'var(--primary)', background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Fetching live jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center font-bold py-12" style={{ color: '#444', background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>No jobs found — try a different role</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1"
                  className="glass-card"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-black text-base leading-tight text-[#111]">{job.title}</h4>
                      {job.posted && <span className="text-[10px] font-bold shrink-0 px-2 py-0.5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--muted-foreground)' }}>{job.posted}</span>}
                    </div>
                    <p className="text-sm font-bold mt-1" style={{ color: '#3b82f6' }}>{job.company}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{job.location}</p>
                    {job.salary && <p className="text-xs font-black mt-2 inline-block px-2 py-1" style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>💰 {job.salary}</p>}
                  </div>
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.tags.map((t, i) => <span key={i} className="text-[10px] font-bold px-2 py-0.5" style={{ background: 'var(--secondary)', color: '#888', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>{t}</span>)}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto pt-3" style={{ borderTop: '1px dashed #1f1f1f' }}>
                    <button onClick={() => handleMatchResume(job)} className="flex-1 text-xs font-black uppercase py-2 flex items-center justify-center gap-1 transition-colors" style={{ background: 'var(--primary)', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
                      <BarChart2 className="w-3.5 h-3.5" /> AI Match
                    </button>
                    <button onClick={() => saveJobToTracker(job)} className="flex-1 text-xs font-black uppercase py-2 transition-colors" style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '2px solid #333' }}>+ Track</button>
                    {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs font-black uppercase py-2 px-3 transition-colors" style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '2px solid #333' }}>↗</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Career Comms Lab — available in Learning Hub */}
          <div
            className="p-5 mt-5 flex flex-col gap-3"
            style={{ background: '#fdfbf7', border: '2px dashed #2a2a2a' }}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-black text-sm text-[#111]">Career Comms Lab</h4>
              <span className="text-[10px] font-black px-2 py-0.5" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.22)' }}>Connected</span>
            </div>
            <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>Generate cover letters, interview prep, outreach email, language audits, headlines, and keyword heatmaps from your latest analyzed resume.</p>
            <p className="text-xs font-black" style={{ color: '#3b82f6' }}>Available in Learning Hub →</p>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {activeView === 'kanban' && (
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4 pt-1">
          {STAGES.map(status => {
            const colApps = apps.filter(a => a.stage === status || (status === 'applied' && !STAGES.includes(a.stage)));
            return (
              <div key={status} className="w-72 shrink-0 flex flex-col">
                <div
                  className="p-3 mb-3 font-black uppercase text-xs tracking-widest flex justify-between items-center"
                  style={{ background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', borderBottomColor: STAGE_COLORS[status], borderBottomWidth: 4 }}
                >
                  <span style={{ color: STAGE_COLORS[status] }}>{status}</span>
                  <span className="px-2 text-xs" style={{ background: 'var(--secondary)', color: '#888', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>{colApps.length}</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto min-h-32 p-1">
                  {colApps.length === 0 ? (
                    <div className="text-xs font-bold text-center mt-6 py-4" style={{ color: 'var(--foreground)', border: '2px dashed #1f1f1f' }}>Empty</div>
                  ) : colApps.map(app => (
                    <div
                      key={app.id}
                      className="p-4 transition-transform hover:-translate-y-0.5 relative group"
                      className="glass-card"
                    >
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }}
                      >✕</button>
                      <p className="font-black text-base leading-tight pr-6 text-[#111]">{app.company}</p>
                      <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted-foreground)' }}>{app.role}</p>
                      <select
                        value={app.stage}
                        onChange={e => handleStageChange(app.id, e.target.value)}
                        className="w-full text-xs font-bold uppercase outline-none"
                        style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)', padding: '6px 8px', cursor: 'pointer' }}
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
          className="absolute inset-0 z-20 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" style={{ background: '#fdfbf7', border: '2px solid #222', boxShadow: '8px 8px 0 hsl(24,100%,50%)' }}>
            <div className="flex justify-between items-start mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h3 className="text-lg font-black uppercase text-[#111]">{matchModal.title}</h3>
                <p className="text-sm font-bold mt-0.5" style={{ color: '#3b82f6' }}>{matchModal.company}</p>
              </div>
              <button onClick={() => { setMatchModal(null); setMatchResult(null); }} className="text-xs font-black uppercase px-3 py-1.5" style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>✕ Close</button>
            </div>

            {matchLoading && <div className="text-center py-10 font-bold animate-pulse" style={{ color: 'var(--primary)' }}>Analyzing resume fit...</div>}

            {matchResult && !matchResult.error && (
              <div className="space-y-5">
                <div
                  className="flex items-center gap-5 p-4"
                  className="glass-card"
                >
                  <div
                    className="text-5xl font-black"
                    style={{ color: matchResult.match_score >= 70 ? '#22c55e' : matchResult.match_score >= 50 ? 'var(--primary)' : '#ef4444', fontFamily: 'Playfair Display, serif' }}
                  >
                    {matchResult.match_score}%
                  </div>
                  <div>
                    <p className="font-black uppercase text-[#111]">{matchResult.verdict}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{matchResult.one_liner}</p>
                  </div>
                </div>

                {matchResult.missing_keywords?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#ef4444' }}>Missing Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missing_keywords.map((k, i) => <span key={i} className="text-xs font-bold px-2 py-1" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{k}</span>)}
                    </div>
                  </div>
                )}

                {matchResult.resume_tweaks?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>Resume Fixes</p>
                    <div className="space-y-2">
                      {matchResult.resume_tweaks.map((t, i) => (
                        <div key={i} className="p-3 text-sm" style={{ background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)' }}>
                          <span className="text-xs font-black uppercase" style={{ color: 'var(--primary)' }}>{t.section}: </span>{t.action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchResult.strengths?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>Your Strengths</p>
                    <ul className="space-y-1.5">
                      {matchResult.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#888' }}>
                          <span style={{ color: '#22c55e', marginTop: 2 }}>✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button onClick={() => saveJobToTracker(matchModal)} className="w-full py-3 font-black uppercase text-sm flex items-center justify-center gap-2" style={{ background: 'var(--primary)', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
                  <CheckCircle2 className="w-4 h-4" /> Save to My Pipeline
                </button>
              </div>
            )}
            {matchResult?.error && (
              <div className="p-4 text-sm font-bold" style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid #7f1d1d', color: '#fca5a5' }}>{matchResult.error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Resource Hub ─────────────────────────────────────────── */
export default function DashboardPage() {

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('copilot');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [llmMetrics, setLlmMetrics] = useState(null);
  const [llmMetricsLoading, setLlmMetricsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { navigate('/login'); return; }
    initializeDashboard();
  }, [navigate]);

  const initializeDashboard = async () => {
    try {
      const profileRes = await axios.get(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setCurrentUser(profileRes.data || null);
      await fetchHistory();
      if (profileRes.data?.is_admin) {
        await fetchLlmMetrics();
      } else {
        setLlmMetrics(null);
      }
    } catch (err) {
      if (err.response?.status === 401) { removeAuthToken(); navigate('/login'); return; }
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      const data = res.data;
      setHistory(Array.isArray(data) ? data : (data.analyses || []));
    } catch (err) {
      if (err.response?.status === 401) { removeAuthToken(); navigate('/login'); }
    } finally { setLoading(false); }
  };

  const handleLogout = () => { removeAuthToken(); navigate('/login'); };

  const fetchLlmMetrics = async () => {
    setLlmMetricsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/llm-metrics`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setLlmMetrics(res.data || null);
    } catch { setLlmMetrics(null); } finally { setLlmMetricsLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex" >
        <div className="hidden lg:flex" style={{ width: 240, minWidth: 240, background: '#fdfbf7', borderRight: '1px solid var(--border)' }} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-black uppercase tracking-widest mb-3 animate-pulse" style={{ color: 'var(--primary)' }}>Loading your dashboard...</div>
            <div className="flex gap-1.5 justify-center">
              {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  let Content;
  switch (activeTab) {
    case 'overview':
      Content = <OverviewTab history={history} setActiveTab={setActiveTab} navigate={navigate} llmMetrics={currentUser?.is_admin ? llmMetrics : null} llmMetricsLoading={currentUser?.is_admin ? llmMetricsLoading : false} showLlmMetrics={!!currentUser?.is_admin} />;
      break;
    case 'workspace':
      Content = <ResumeWorkspace history={history} fetchHistory={fetchHistory} isAnalyzing={isAnalyzing} setIsAnalyzing={setIsAnalyzing} />;
      break;
    case 'tracker':
      Content = <JobTracker />;
      break;
    case 'resources':
      Content = <ResourceHub />;
      break;
    case 'copilot':
      Content = <AgentChat onAnalysisRefresh={fetchHistory} />;
      break;
    case 'builder':
      Content = <ResumeBuilder />;
      break;
    default:
      Content = <div className="p-6 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>Module in development.</div>;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden" >
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto relative pt-16 lg:pt-0">
          {isAnalyzing && (
            <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}>
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
