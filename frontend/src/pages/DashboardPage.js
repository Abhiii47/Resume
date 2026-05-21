import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE, getAuthToken, removeAuthToken } from "../utils";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import AnalysisLoader from "../components/AnalysisLoader";
import { ScoreCardSkeleton, ResumeHistorySkeleton } from "../components/ui/Skeletons";
import { UploadCloud, FileText, CheckCircle2, BookOpen, Search, LayoutDashboard, BarChart2, Zap } from "lucide-react";
import HolisticTracker from "../components/HolisticTracker";
import DSATracker from "../components/DSATracker";
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
    { label: 'Top ATS Score', value: latestScore, suffix: '/ 100', bg: var(--primary), shadow: '6px 6px 0 #b34500', color: 'var(--foreground)' },
    { label: 'Resumes Analyzed', value: analysisCount, suffix: 'iterations', bg: '#2563EB', shadow: '6px 6px 0 #1a3a8f', color: 'var(--foreground)' },
    { label: 'Active Tracker', value: 6, suffix: 'categories', bg: '#16A34A', shadow: '6px 6px 0 #0d5c2a', color: 'var(--foreground)' },
  ];

  const actionCards = [
    { label: 'Resume Builder', desc: 'Create & Export PDF', icon: FileText, accent: '#2563EB', onClick: () => navigate('/builder') },
    { label: 'Resume Lab', desc: 'Analyze & Fix Flaws', icon: UploadCloud, accent: var(--primary), onClick: () => setActiveTab('workspace') },
    { label: 'Job Tracker', desc: 'Discover & Match', icon: CheckCircle2, accent: '#16A34A', onClick: () => setActiveTab('tracker') },
    { label: 'Learning Hub', desc: 'AI Roadmap & Resources', icon: BookOpen, accent: '#8b5cf6', onClick: () => setActiveTab('resources') },
  ];

  return (
    <div
      className="p-6 md:p-10 flex flex-col min-h-full"
      
    >
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: var(--primary) }}>Agentic Career Hub</p>
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
            className="glass-card p-5 flex flex-col gap-4 cursor-pointer transition-all hover:-translate-y-1 group"}
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
          <p className="text-sm font-bold animate-pulse" style={{ color: var(--primary) }}>Loading metrics...</p>
        ) : !llmMetrics ? (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No telemetry yet. Trigger a few AI actions first.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {[
                { label: 'Total Calls', value: llmMetrics.total_calls || 0, color: 'var(--foreground)' },
                { label: 'Success Rate', value: `${llmMetrics.success_rate_pct || 0}%`, color: '#16A34A' },
                { label: 'Avg Latency', value: `${llmMetrics.avg_latency_ms || 0}ms`, color: var(--primary) },
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
      max: 35, color: var(--primary)
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
              <UploadCloud className="w-5 h-5 shrink-0" style={{ color: var(--primary) }} />
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
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: var(--primary) }}>Evolution Timeline</span>
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
                <a href={pdfUrl} download className="text-xs font-black" style={{ color: var(--primary) }}>Download PDF</a>
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
        <h2 className="text-3xl font-black uppercase mb-6" style={{ letterSpacing: '-0.02em', color: var(--primary) }}>Diagnostics & Fixes</h2>

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
                            <span className="text-xs font-black uppercase block mb-1" style={{ color: var(--primary) }}>AI Rewrite:</span>
                            {rewrittenBullets[i]}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRewrite(s, i)}
                            disabled={rewritingIndex === i}
                            className="mt-2 text-xs font-black uppercase px-4 py-2 transition-colors"
                            style={{ background: rewritingIndex === i ? '#222' : var(--primary), color: rewritingIndex === i ? '#555' : '#111', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', cursor: rewritingIndex === i ? 'not-allowed' : 'pointer' }}
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
  const STAGE_COLORS = { wishlist: '#6b7280', applied: var(--primary), interview: '#3b82f6', offer: '#22c55e', rejected: '#ef4444' };

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
                background: activeView === view ? var(--primary) : 'transparent',
                color: activeView === view ? '#111' : '#666',
                border: `2px solid ${activeView === view ? var(--primary) : '#333'}`,
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
          <button type="submit" className="px-6 py-2.5 font-black uppercase text-sm" style={{ background: var(--primary), color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', height: 42 }}>Save</button>
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
            <button onClick={() => fetchJobs(jobSearch)} className="px-6 font-black uppercase text-sm" style={{ background: var(--primary), color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Search</button>
          </div>

          {jobsLoading ? (
            <div className="text-center font-bold animate-pulse py-12" style={{ color: var(--primary), background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Fetching live jobs...</div>
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
                    <button onClick={() => handleMatchResume(job)} className="flex-1 text-xs font-black uppercase py-2 flex items-center justify-center gap-1 transition-colors" style={{ background: var(--primary), color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
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

            {matchLoading && <div className="text-center py-10 font-bold animate-pulse" style={{ color: var(--primary) }}>Analyzing resume fit...</div>}

            {matchResult && !matchResult.error && (
              <div className="space-y-5">
                <div
                  className="flex items-center gap-5 p-4"
                  className="glass-card"
                >
                  <div
                    className="text-5xl font-black"
                    style={{ color: matchResult.match_score >= 70 ? '#22c55e' : matchResult.match_score >= 50 ? var(--primary) : '#ef4444', fontFamily: 'Playfair Display, serif' }}
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
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: var(--primary) }}>Resume Fixes</p>
                    <div className="space-y-2">
                      {matchResult.resume_tweaks.map((t, i) => (
                        <div key={i} className="p-3 text-sm" style={{ background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)' }}>
                          <span className="text-xs font-black uppercase" style={{ color: var(--primary) }}>{t.section}: </span>{t.action}
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

                <button onClick={() => saveJobToTracker(matchModal)} className="w-full py-3 font-black uppercase text-sm flex items-center justify-center gap-2" style={{ background: var(--primary), color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
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
function CareerCommsLab({ onClose }) {
  const [jd, setJd] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [company, setCompany] = useState('');
  const [loadingKey, setLoadingKey] = useState('');
  const [outputs, setOutputs] = useState({});

  const inputStyle = { background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)', padding: '10px 14px', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%' };
  const authHeaders = { Authorization: `Bearer ${getAuthToken()}` };

  const setToolOutput = (key, payload) => {
    setOutputs(prev => ({ ...prev, [key]: payload }));
  };

  const postFormTool = async (key, url, fields = {}, mapResult = (data) => data) => {
    setLoadingKey(key);
    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(field, value);
        }
      });
      const res = await axios.post(url, formData, { headers: authHeaders });
      setToolOutput(key, { value: mapResult(res.data), error: '' });
    } catch (err) {
      setToolOutput(key, { value: null, error: err.response?.data?.detail || 'Request failed.' });
    } finally {
      setLoadingKey('');
    }
  };

  const runLanguageAudit = async () => {
    setLoadingKey('language');
    try {
      const res = await axios.post(`${API_BASE}/comms/language-audit`, null, { headers: authHeaders });
      setToolOutput('language', { value: res.data, error: '' });
    } catch (err) {
      setToolOutput('language', { value: null, error: err.response?.data?.detail || 'Request failed.' });
    } finally {
      setLoadingKey('');
    }
  };

  const renderOutput = (key) => {
    const output = outputs[key];
    if (!output) return null;
    if (output.error) {
      return <div className="mt-3 p-3 text-xs font-bold" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #7f1d1d', color: '#fca5a5' }}>{output.error}</div>;
    }
    const value = output.value;
    if (typeof value === 'string') {
      return <div className="mt-3 p-3 text-sm whitespace-pre-wrap" style={{ background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)' }}>{value}</div>;
    }
    if (Array.isArray(value)) {
      return (
        <div className="mt-3 space-y-2">
          {value.map((item, idx) => (
            <div key={`${key}-${idx}`} className="p-3 text-sm" style={{ background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)' }}>
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="mt-3 p-3 text-sm" style={{ background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)' }}>
        {value?.overall_feedback && <p className="mb-3">{value.overall_feedback}</p>}
        {value?.overall_score !== undefined && <p className="mb-3"><strong>Overall Score:</strong> {value.overall_score}</p>}
        {value?.overall_match_pct !== undefined && <p className="mb-3"><strong>Match:</strong> {value.overall_match_pct}%</p>}
        {value?.action_verb_score !== undefined && <p className="mb-2"><strong>Action Verb Score:</strong> {value.action_verb_score}</p>}
        {value?.quantification_score !== undefined && <p className="mb-2"><strong>Quantification Score:</strong> {value.quantification_score}</p>}
        {value?.headlines && (
          <div className="space-y-2">
            {value.headlines.map((headline, idx) => <div key={idx}>{headline}</div>)}
          </div>
        )}
        {value?.critical_missing && (
          <div className="space-y-2">
            <p><strong>Critical Missing:</strong> {value.critical_missing.join(', ') || 'None'}</p>
            <p><strong>Strong Matches:</strong> {(value.strong_matches || []).join(', ') || 'None'}</p>
          </div>
        )}
        {value?.fixes && (
          <div className="space-y-2">
            {value.fixes.slice(0, 4).map((fix, idx) => (
              <div key={idx}>
                <strong>{fix.original}</strong>
                <div>{fix.rewrite}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const cards = [
    { key: 'cover', title: 'Cover Letter', description: 'Generate a tailored letter from your latest analyzed resume.', action: () => postFormTool('cover', `${API_BASE}/generate-cover-letter`, { jd }, data => data.cover_letter || ''), requiresJd: true },
    { key: 'interview', title: 'Interview Prep', description: 'Create targeted questions and answer angles from the same JD.', action: () => postFormTool('interview', `${API_BASE}/generate-interview-prep`, { jd }, data => data.interview_prep || ''), requiresJd: true },
    { key: 'language', title: 'Language Audit', description: 'Score tone, verbs, and quantification quality across your latest resume.', action: runLanguageAudit },
    { key: 'pitch', title: 'Elevator Pitch', description: 'Generate a crisp intro for networking and interviews.', action: () => postFormTool('pitch', `${API_BASE}/comms/elevator-pitch`, { target_role: targetRole }, data => data.pitch || '') },
    { key: 'headline', title: 'LinkedIn Headlines', description: 'Get 3 headline options tied to your target role.', action: () => postFormTool('headline', `${API_BASE}/comms/linkedin-headline`, { target_role: targetRole }, data => ({ headlines: data.headlines || [] })) },
    { key: 'cold', title: 'Cold Email', description: 'Write a recruiter outreach email grounded in your resume.', action: () => postFormTool('cold', `${API_BASE}/comms/cold-email`, { company, role: targetRole }, data => data.email || ''), requiresCompany: true },
    { key: 'heatmap', title: 'Keyword Heatmap', description: 'See critical missing ATS keywords for a target JD.', action: () => postFormTool('heatmap', `${API_BASE}/resume/keyword-heatmap`, { jd }, data => data), requiresJd: true },
  ];

  return (
    <div className="absolute inset-0 z-10 p-6 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black uppercase" style={{ color: var(--primary) }}>Career Comms Lab</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)', maxWidth: 620 }}>These tools run against your latest analyzed resume, so the writing layer stays connected to your actual resume data.</p>
          </div>
          <button onClick={onClose} className="px-4 py-2 text-xs font-black uppercase" style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Close</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--muted-foreground)' }}>Target Job Description</label>
            <textarea value={jd} onChange={e => setJd(e.target.value)} style={{ ...inputStyle, minHeight: 120 }} placeholder="Paste a target JD here for cover letters, interview prep, and keyword heatmaps." />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--muted-foreground)' }}>Target Role</label>
              <input value={targetRole} onChange={e => setTargetRole(e.target.value)} style={inputStyle} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--muted-foreground)' }}>Company</label>
              <input value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} placeholder="Google, Stripe, etc." />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map(card => {
            const disabled = loadingKey === card.key || (card.requiresJd && !jd.trim()) || (card.requiresCompany && !company.trim());
            return (
              <div key={card.key} className="p-5 flex flex-col" className="glass-card">
                <h4 className="font-black text-sm uppercase text-[#111]">{card.title}</h4>
                <p className="text-xs mt-2 flex-1" style={{ color: 'var(--muted-foreground)' }}>{card.description}</p>
                <button
                  onClick={card.action}
                  disabled={disabled}
                  className="mt-4 py-2 text-xs font-black uppercase"
                  style={{ background: disabled ? '#222' : var(--primary), color: disabled ? '#444' : '#111', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', cursor: disabled ? 'not-allowed' : 'pointer' }}
                >
                  {loadingKey === card.key ? 'Running...' : `Run ${card.title}`}
                </button>
                {renderOutput(card.key)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 'dsa', label: 'DSA', color: var(--primary), resources: [
    { name: 'Striver A2Z', desc: 'The industry-standard A2Z roadmap for SDE roles', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', tag: '450+ problems' },
    { name: 'NeetCode 150', desc: 'Most important LeetCode patterns for FAANG', url: 'https://neetcode.io/practice', tag: '150 curated' },
    { name: 'Love Babbar 450', desc: 'Popular DSA sheet cracked by thousands', url: 'https://450dsa.com', tag: '450 problems' },
    { name: 'Blind 75', desc: 'The original 75 must-do LeetCode problems', url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions', tag: '75 problems' },
    { name: 'GFG Must-Do', desc: 'GeeksforGeeks curated must-do list', url: 'https://www.geeksforgeeks.org/must-do-coding-questions-for-companies-like-amazon-microsoft-adobe/', tag: 'Company-wise' },
    { name: 'Arsh Goyal 280', desc: "FAANG-cracker's handpicked 280 problems", url: 'https://docs.google.com/spreadsheets/d/1MGVBJ8HkRbCnU6EQASjJKCqQE8BWng4qgL0n3vCVOxE', tag: '280 problems' },
  ]},
  { id: 'system_design', label: 'System Design', color: '#3b82f6', resources: [
    { name: 'ByteByteGo', desc: "Alex Xu's system design newsletter & books", url: 'https://bytebytego.com', tag: 'Best for FAANG' },
    { name: 'Gaurav Sen YT', desc: 'Best free system design YouTube series', url: 'https://www.youtube.com/c/GauravSensei', tag: 'Free, YouTube' },
    { name: 'System Design Primer', desc: "GitHub's most starred system design guide", url: 'https://github.com/donnemartin/system-design-primer', tag: 'GitHub, 250k ⭐' },
    { name: 'Grokking SD', desc: "Educative's structured system design course", url: 'https://www.educative.io/courses/grokking-the-system-design-interview', tag: 'Paid, worth it' },
    { name: 'Concept & Coding SD', desc: "Shrayansh Jain's free YT system design", url: 'https://www.youtube.com/@ConceptandCoding', tag: 'Free, Hindi' },
  ]},
  { id: 'cs_fundamentals', label: 'CS Fundamentals', color: '#8b5cf6', resources: [
    { name: 'Love Babbar CS Notes', desc: 'DBMS, OS, CN all-in-one notes for interviews', url: 'https://drive.google.com/drive/folders/1ZgHXxJO6s-UBSbT5aJHhHBX5mGl_JkZH', tag: 'DBMS+OS+CN' },
    { name: 'InterviewBit CS', desc: 'Structured CS theory with interview questions', url: 'https://www.interviewbit.com/courses/programming/', tag: 'Topic-wise' },
    { name: 'GFG OS Notes', desc: 'GeeksforGeeks OS for interviews', url: 'https://www.geeksforgeeks.org/operating-systems/', tag: 'OS' },
    { name: 'Last Minute DBMS', desc: 'Must-know DBMS concepts before interviews', url: 'https://www.geeksforgeeks.org/last-minute-notes-dbms/', tag: 'DBMS' },
    { name: 'CN Interview Qs', desc: 'Top Computer Networks interview questions', url: 'https://www.interviewbit.com/networking-interview-questions/', tag: 'Networking' },
  ]},
  { id: 'behavioral', label: 'Behavioral', color: '#f59e0b', resources: [
    { name: 'Amazon LP Guide', desc: 'All 16 Leadership Principles with STAR stories', url: 'https://www.amazon.jobs/en/principles', tag: 'Amazon' },
    { name: 'STAR Method Bank', desc: 'Template + 50 example behavioral answers', url: 'https://www.themuse.com/advice/star-interview-method', tag: 'Framework' },
    { name: 'Behavioral Prep Sheet', desc: 'Community-made Google/Meta behavioral bank', url: 'https://docs.google.com/spreadsheets/d/12ahNxD79MBiO8h8UjJdjepRpJlbBLYxAoMdmAKrfEsg', tag: 'Google + Meta' },
    { name: 'Tech Interview Handbook', desc: "Yangshun's comprehensive behavioral guide", url: 'https://www.techinterviewhandbook.org/behavioral-interview/', tag: 'Free guide' },
  ]},
  { id: 'faang_sheets', label: 'FAANG Sheets', color: '#22c55e', resources: [
    { name: 'Fraz SDE Sheet', desc: 'By Mohammad Fraz (ex-Microsoft) — 450 problems', url: 'https://docs.google.com/spreadsheets/d/1-wKcV99KtO91dXdPkwmXGTdtyxAfk1mbPXQg81R9sFo', tag: 'Microsoft cracker' },
    { name: 'Siddharth Singh Google', desc: 'By a Google SWE — problem list + tips', url: 'https://docs.google.com/spreadsheets/d/11tevcTIBQsIvRKIZLbSzCeN4mCO6wD4O5meyrAIfSXw', tag: 'Google SWE' },
    { name: 'DSA Cracker Sheet', desc: 'By Aman Dhattarwal — exam + placement focused', url: 'https://docs.google.com/spreadsheets/d/1AVoprCGMBCpXD9DrR1HZj8Y_bGCKMa8VN5rmBcBSMT8', tag: 'Placement' },
    { name: 'Apna College Sheet', desc: 'Shradha + Aman DSA sheet for placements', url: 'https://docs.google.com/spreadsheets/d/1hXserPuxVoWMG9Hs7y8wVdRCJTcj3xMBAEYUOXQ5Xag', tag: '1200+ problems' },
  ]},
  { id: 'projects', label: 'Projects & Dev', color: '#ec4899', resources: [
    { name: 'Roadmap.sh', desc: 'Curated learning paths for every dev role', url: 'https://roadmap.sh', tag: 'Interactive' },
    { name: 'Project Ideas for SDE', desc: '50+ project ideas to add to your resume', url: 'https://github.com/practical-tutorials/project-based-learning', tag: 'GitHub' },
    { name: 'Build Your Own X', desc: 'Build real versions of complex tools from scratch', url: 'https://github.com/codecrafters-io/build-your-own-x', tag: 'Deep Learning' },
    { name: 'GitHub Trending', desc: 'Contribute to trending open-source projects', url: 'https://github.com/trending', tag: 'Open Source' },
    { name: 'DevChallenges', desc: 'Real-world project challenges with designs', url: 'https://devchallenges.io', tag: 'Fullstack' },
  ]},
  { id: 'mock', label: 'Mock Interviews', color: '#f97316', resources: [
    { name: 'Pramp', desc: 'Free peer-to-peer mock technical interviews', url: 'https://www.pramp.com', tag: 'Free, Peer' },
    { name: 'Interviewing.io', desc: 'Anonymous mock interviews with FAANG engineers', url: 'https://interviewing.io', tag: 'FAANG engineers' },
    { name: 'LeetCode Mock', desc: 'Company-specific timed mock contests', url: 'https://leetcode.com/assessment/', tag: 'Company-wise' },
    { name: 'Excalidraw', desc: 'Whiteboard for system design mock sessions', url: 'https://excalidraw.com', tag: 'Whiteboard' },
  ]},
];

function ResourceHub() {
  const [activeCategory, setActiveCategory] = useState('dsa');
  const [showHolisticTracker, setShowHolisticTracker] = useState(false);
  const [showDsaTracker, setShowDsaTracker] = useState(false);
  const [showCommsLab, setShowCommsLab] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!targetRole.trim() || !targetCompany.trim()) return;
    setError(null); setIsGenerating(true);
    try {
      const fd = new FormData();
      fd.append('target_role', targetRole.trim());
      fd.append('target_company', targetCompany.trim());
      const res = await axios.post(`${API_BASE}/roadmap/ai-generate`, fd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setRoadmap(res.data.roadmap);
      setShowForm(false); setShowRoadmap(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate. Upload a resume first.');
    } finally { setIsGenerating(false); }
  };

  const cat = CATEGORIES.find(c => c.id === activeCategory);
  const inputStyle = { background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', color: 'var(--foreground)', padding: '10px 14px', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%' };

  return (
    <div className="p-6 flex flex-col relative" style={{ minHeight: '100%', background: 'transparent' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-3xl font-black uppercase text-[#111]" style={{ letterSpacing: '-0.02em' }}>Learning Hub</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDsaTracker(true)}
            className="px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 transition-all"
            style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '2px solid #2a2a2a' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#777'; }}
          >
            <Zap className="w-3.5 h-3.5" /> DSA Tracker
          </button>
          <button
            onClick={() => setShowHolisticTracker(true)}
            className="px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 transition-all"
            style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '2px solid #2a2a2a' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#777'; }}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Holistic Tracker
          </button>
          <button
            onClick={() => setShowCommsLab(true)}
            className="px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 transition-all"
            style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '2px solid #2a2a2a' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#777'; }}
          >
            <FileText className="w-3.5 h-3.5" /> Career Comms
          </button>
          <button
            onClick={() => { setShowForm(true); setShowRoadmap(false); }}
            className="px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 transition-all"
            style={{ background: var(--primary), color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}
          >
            <BookOpen className="w-3.5 h-3.5" /> AI Roadmap
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 shrink-0">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className="px-3 py-1.5 text-xs font-black uppercase shrink-0 transition-all"
            style={{
              background: activeCategory === c.id ? c.color : 'transparent',
              color: activeCategory === c.id ? '#fff' : '#555',
              border: `2px solid ${activeCategory === c.id ? c.color : '#2a2a2a'}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Resource cards */}
      {cat && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
          {cat.resources.map((r, i) => (
            <a
              key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 group"
              style={{ background: '#fdfbf7', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + '55'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f1f1f'; }}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-black text-sm text-[#111]">{r.name}</h4>
                <span className="text-[10px] font-black px-2 py-0.5 shrink-0 ml-2" style={{ background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}44` }}>{r.tag}</span>
              </div>
              <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>{r.desc}</p>
              <p className="text-xs font-black" style={{ color: cat.color }}>Open ↗</p>
            </a>
          ))}

          {/* Holistic Tracker card */}
          {activeCategory === 'dsa' && (
            <div
              onClick={() => setShowHolisticTracker(true)}
              className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 cursor-pointer"
              style={{ background: '#fdfbf7', border: `2px solid hsl(24,100%,50%)` }}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-black text-sm text-[#111]">Holistic Daily Tracker</h4>
                <span className="text-[10px] font-black px-2 py-0.5" style={{ background: 'rgba(255,102,0,0.15)', color: var(--primary), border: '1px solid rgba(255,102,0,0.3)' }}>Built-in</span>
              </div>
              <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>Track daily progress across 6 categories: DSA, System Design, Projects, CS Core, Behavioral, and Apps.</p>
              <p className="text-xs font-black" style={{ color: var(--primary) }}>Open Tracker →</p>
            </div>
          )}

          {activeCategory === 'dsa' && (
            <div
              onClick={() => setShowDsaTracker(true)}
              className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 cursor-pointer"
              style={{ background: '#fdfbf7', border: '2px solid #3b82f6' }}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-black text-sm text-[#111]">DSA Problem Tracker</h4>
                <span className="text-[10px] font-black px-2 py-0.5" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>Live</span>
              </div>
              <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>Track individual NeetCode and Striver problems with streaks, contribution history, and roadmap alignment.</p>
              <p className="text-xs font-black" style={{ color: '#3b82f6' }}>Open DSA Module â†’</p>
            </div>
          )}

          {/* AI Roadmap card */}
          <div
            onClick={() => { setShowForm(true); setShowRoadmap(false); }}
            className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 cursor-pointer"
            style={{ background: '#fdfbf7', border: '2px dashed #2a2a2a' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,102,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-black text-sm" style={{ color: var(--primary) }}>Your AI Roadmap</h4>
              <span className="text-[10px] font-black px-2 py-0.5" style={{ background: 'rgba(0,119,255,0.1)', color: var(--primary), border: '1px solid rgba(255,102,0,0.2)' }}>AI</span>
            </div>
            <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>
              {roadmap ? `Plan for ${roadmap.role} @ ${roadmap.company} ready.` : '8-week personalized plan based on your resume + target role.'}
            </p>
            <p className="text-xs font-black" style={{ color: var(--primary) }}>{roadmap ? 'View / Regenerate →' : 'Generate My Plan →'}</p>
          </div>
          <div
            onClick={() => setShowCommsLab(true)}
            className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 cursor-pointer"
            style={{ background: '#fdfbf7', border: '2px dashed #2a2a2a' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-black text-sm text-[#111]">Career Comms Lab</h4>
              <span className="text-[10px] font-black px-2 py-0.5" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.22)' }}>Connected</span>
            </div>
            <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>Generate cover letters, interview prep, outreach email, language audits, headlines, and keyword heatmaps from your latest analyzed resume.</p>
            <p className="text-xs font-black" style={{ color: '#3b82f6' }}>Open Writing Tools â†’</p>
          </div>
        </div>
      )}

      {/* DSA Tracker Overlay */}
      {showDsaTracker && (
        <div className="absolute inset-0 z-10 p-6 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
          <div className="max-w-6xl mx-auto flex justify-end mb-4">
            <button onClick={() => setShowDsaTracker(false)} className="px-4 py-2 text-xs font-black uppercase" style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>âœ• Close DSA Tracker</button>
          </div>
          <DSATracker roadmap={roadmap} />
        </div>
      )}

      {/* Holistic Tracker Overlay */}
      {showHolisticTracker && (
        <div className="absolute inset-0 z-10 p-6 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
          <div className="max-w-4xl mx-auto flex justify-end mb-4">
            <button onClick={() => setShowHolisticTracker(false)} className="px-4 py-2 text-xs font-black uppercase" style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>✕ Close Tracker</button>
          </div>
          <HolisticTracker roadmap={roadmap} />
        </div>
      )}

      {/* AI Roadmap Form */}
      {showForm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg p-8" style={{ background: '#fdfbf7', border: '2px solid #222', boxShadow: '8px 8px 0 hsl(24,100%,50%)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase" style={{ color: var(--primary) }}>Generate My Plan</h3>
              <button onClick={() => setShowForm(false)} className="text-xs font-black uppercase px-3 py-1" style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>✕</button>
            </div>
            <p className="text-xs mb-6" style={{ color: 'var(--muted-foreground)' }}>AI analyzes your resume and builds a targeted 8-week roadmap. Upload a resume in Resume Lab first.</p>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--muted-foreground)' }}>Target Role</label>
                <input required value={targetRole} onChange={e => setTargetRole(e.target.value)} style={inputStyle} placeholder="e.g. Software Development Engineer" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--muted-foreground)' }}>Target Company</label>
                <input required value={targetCompany} onChange={e => setTargetCompany(e.target.value)} style={inputStyle} placeholder="e.g. Google, Amazon, Microsoft" />
              </div>
              {error && <div className="p-3 text-xs font-bold" style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid #7f1d1d', color: '#fca5a5' }}>{error}</div>}
              <button type="submit" disabled={isGenerating} className="w-full py-3 font-black uppercase text-sm" style={{ background: isGenerating ? '#222' : var(--primary), color: isGenerating ? '#444' : '#111', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', cursor: isGenerating ? 'not-allowed' : 'pointer' }}>
                {isGenerating ? 'Generating...' : 'Generate My 8-Week Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Roadmap View */}
      {showRoadmap && roadmap && (
        <div className="absolute inset-0 z-10 p-6 flex flex-col overflow-y-auto" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
          <div className="flex justify-between items-start mb-8" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
            <div>
              <h3 className="text-2xl font-black uppercase" style={{ color: var(--primary) }}>{roadmap.role} @ {roadmap.company}</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)', maxWidth: 560 }}>{roadmap.summary}</p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              <button onClick={() => { setShowForm(true); setShowRoadmap(false); }} className="px-4 py-2 text-xs font-black uppercase" style={{ background: var(--primary), color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Regenerate</button>
              <button onClick={() => setShowRoadmap(false)} className="px-4 py-2 text-xs font-black uppercase" style={{ color: 'var(--muted-foreground)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>Close</button>
            </div>
          </div>

          {roadmap.skill_gaps?.length > 0 && (
            <div className="max-w-4xl mx-auto w-full mb-8 p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '2px solid #7f1d1d' }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#ef4444' }}>Skill Gaps</p>
              <div className="flex flex-wrap gap-2">
                {roadmap.skill_gaps.map((g, i) => <span key={i} className="text-xs font-bold px-2 py-1" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{g}</span>)}
              </div>
            </div>
          )}

          <div className="space-y-0 max-w-4xl mx-auto w-full">
            {roadmap.phases?.map((phase, i) => {
              const isLast = i === roadmap.phases.length - 1;
              return (
                <div key={i} className="flex gap-6 group">
                  <div className="w-20 shrink-0 text-right font-black text-xs pt-4" style={{ color: var(--primary) }}>{phase.week_label}</div>
                  <div className="w-5 flex flex-col items-center">
                    <div className="w-5 h-5 border-2 rounded-full mt-4 shrink-0 group-hover:scale-125 transition-transform z-10" style={{ background: var(--primary), borderColor: var(--primary) }} />
                    {!isLast && <div className="w-px flex-1 -mt-1" style={{ background: '#eee' }} />}
                  </div>
                  <div className="flex-1 mb-6 p-5 hover:-translate-y-0.5 transition-transform" className="glass-card">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-lg uppercase text-[#111]">{phase.title}</h4>
                      <span className="text-[10px] font-black px-2 py-0.5 ml-2 shrink-0" style={{ background: 'rgba(255,102,0,0.15)', color: var(--primary) }}>{phase.resource_type}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: var(--primary) }}>Focus: {phase.focus}</p>
                    <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{phase.description}</p>
                    {phase.resource_url && (
                      <a href={phase.resource_url} target="_blank" rel="noopener noreferrer" className="text-xs font-black uppercase px-3 py-1.5 inline-block transition-colors" style={{ border: '2px solid hsl(24,100%,50%)', color: var(--primary) }}
                        onMouseEnter={e => { e.currentTarget.style.background = var(--primary); e.currentTarget.style.color = '#111'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = var(--primary); }}
                      >
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

/* ── Main Dashboard ─────────────────────────────────────────── */
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
            <div className="text-sm font-black uppercase tracking-widest mb-3 animate-pulse" style={{ color: var(--primary) }}>Loading your dashboard...</div>
            <div className="flex gap-1.5 justify-center">
              {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: var(--primary), animationDelay: `${i * 0.15}s` }} />)}
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
