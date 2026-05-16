import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE, getAuthToken, removeAuthToken } from "../utils";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import AnalysisLoader from "../components/AnalysisLoader";
import { ScoreCardSkeleton, ResumeHistorySkeleton } from "../components/ui/Skeletons";
import { UploadCloud, FileText, CheckCircle2, BookOpen, Search, LayoutDashboard, BarChart2 } from "lucide-react";
import HolisticTracker from "../components/HolisticTracker";
import MentorChat from "../components/MentorChat";
import { toast, confirm, ToastContainer } from "../components/ui/Toast";

/* ── Animated Score Number ─────────────────────────────────── */
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

/* ── Overview Dashboard ─────────────────────────────────── */

function OverviewTab({ history, setActiveTab, navigate, llmMetrics, llmMetricsLoading }) {
  const latestScore = history && history.length > 0 
    ? (history[0].score_breakdown?.total_score || history[0].ats_score || 0) 
    : 0;
  const analysisCount = history ? history.length : 0;

  return (
    <div className="p-6 md:p-10 animate-fade-in flex flex-col h-full bg-background" style={{ backgroundImage: "linear-gradient(to right, hsl(0,0%,10%) 1px, transparent 1px), linear-gradient(to bottom, hsl(0,0%,10%) 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
      <div className="mb-10 flex justify-between items-end">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(24,100%,50%)" }}>
            Agentic Career Hub
          </p>
          <h2 className="text-5xl font-black uppercase tracking-tight text-foreground" style={{ letterSpacing: "-0.03em" }}>Command Center</h2>
        </div>
      </div>

      {/* High Level Stats - NEUBRUTALIST COLORED CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 transition-transform hover:-translate-y-1 hover:-translate-x-1 shadow-hard" style={{ background: "hsl(24,100%,50%)", border: "3px solid #000", color: "#111" }}>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Top ATS Score</p>
          <div className="flex items-baseline gap-2">
            <AnimatedScore value={latestScore} className="text-6xl font-black font-display-serif" />
            <span className="text-sm font-bold opacity-80">/ 100</span>
          </div>
        </div>

        <div className="p-6 transition-transform hover:-translate-y-1 hover:-translate-x-1 shadow-hard" style={{ background: "#2563EB", border: "3px solid #000", color: "#fff" }}>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Resumes Analyzed</p>
          <div className="flex items-baseline gap-2">
            <AnimatedScore value={analysisCount} className="text-6xl font-black font-display-serif" />
            <span className="text-sm font-bold opacity-80">iterations</span>
          </div>
        </div>

        <div className="p-6 transition-transform hover:-translate-y-1 hover:-translate-x-1 shadow-hard" style={{ background: "#16A34A", border: "3px solid #000", color: "#fff" }}>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Active Tracker</p>
          <div className="flex items-baseline gap-2">
            <AnimatedScore value={6} className="text-6xl font-black font-display-serif" />
            <span className="text-sm font-bold opacity-80">categories</span>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-black uppercase mb-6 text-foreground tracking-tight">Quick Actions</h3>

      {/* Action Cards - HIGH CONTRAST WHITE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div 
          onClick={() => navigate('/builder')}
          className="bg-white p-6 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 shadow-hard transition-all cursor-pointer flex flex-col items-start gap-4"
          style={{ color: "#111" }}
        >
          <div className="w-14 h-14 bg-black text-white flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-xl uppercase">Resume Builder</h4>
            <p className="text-sm text-gray-600 mt-1 font-medium">Create & Export PDF</p>
          </div>
          <div className="mt-auto pt-4 w-full text-right text-sm font-bold text-blue-600 hover:underline">Open →</div>
        </div>

        <div 
          onClick={() => setActiveTab('workspace')}
          className="bg-white p-6 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 shadow-hard transition-all cursor-pointer flex flex-col items-start gap-4"
          style={{ color: "#111" }}
        >
          <div className="w-14 h-14 bg-black text-white flex items-center justify-center shrink-0">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-xl uppercase">Resume Lab</h4>
            <p className="text-sm text-gray-600 mt-1 font-medium">Analyze & Fix Flaws</p>
          </div>
          <div className="mt-auto pt-4 w-full text-right text-sm font-bold text-orange-600 hover:underline">Open →</div>
        </div>

        <div 
          onClick={() => setActiveTab('tracker')}
          className="bg-white p-6 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 shadow-hard transition-all cursor-pointer flex flex-col items-start gap-4"
          style={{ color: "#111" }}
        >
          <div className="w-14 h-14 bg-black text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-xl uppercase">Job Tracker</h4>
            <p className="text-sm text-gray-600 mt-1 font-medium">Discover & Match</p>
          </div>
          <div className="mt-auto pt-4 w-full text-right text-sm font-bold text-green-600 hover:underline">Open →</div>
        </div>

        <div 
          onClick={() => setActiveTab('resources')}
          className="bg-white p-6 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 shadow-hard transition-all cursor-pointer flex flex-col items-start gap-4"
          style={{ color: "#111" }}
        >
           <div className="w-14 h-14 bg-black text-white flex items-center justify-center shrink-0">
             <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-xl uppercase">Learning Hub</h4>
            <p className="text-sm text-gray-600 mt-1 font-medium">AI Roadmap & Heatmap</p>
          </div>
          <div className="mt-auto pt-4 w-full text-right text-sm font-bold text-purple-600 hover:underline">Open →</div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-black uppercase mb-6 text-foreground tracking-tight">AI Reliability</h3>
        <div className="bg-white p-6 md:p-8 border-[3px] border-black shadow-hard" style={{ color: "#111" }}>
          {llmMetricsLoading ? (
            <p className="text-sm font-bold animate-pulse text-orange-600">[ LOADING LLM METRICS... ]</p>
          ) : !llmMetrics ? (
            <p className="text-sm font-medium text-gray-600">No telemetry yet. Trigger a few AI actions first.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-gray-50 border-[3px] border-black shadow-hard-sm">
                  <p className="text-xs font-bold uppercase text-gray-500 mb-1">Total Calls</p>
                  <p className="text-4xl font-black font-display-serif">{llmMetrics.total_calls || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 border-[3px] border-black shadow-hard-sm">
                  <p className="text-xs font-bold uppercase text-gray-500 mb-1">Success Rate</p>
                  <p className="text-4xl font-black font-display-serif text-green-600">{llmMetrics.success_rate_pct || 0}%</p>
                </div>
                <div className="p-4 bg-gray-50 border-[3px] border-black shadow-hard-sm">
                  <p className="text-xs font-bold uppercase text-gray-500 mb-1">Avg Latency</p>
                  <p className="text-4xl font-black font-display-serif">{llmMetrics.avg_latency_ms || 0}ms</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 bg-white border-[3px] border-black">
                  <p className="text-sm font-black uppercase mb-4 text-black border-b-2 border-black pb-2">By Task</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {Object.keys(llmMetrics.by_task || {}).length === 0 ? (
                      <p className="text-sm font-medium text-gray-500">No task data</p>
                    ) : (
                      Object.entries(llmMetrics.by_task).map(([task, data]) => (
                        <div key={task} className="text-sm font-bold flex justify-between gap-4 border-b border-gray-200 pb-2 last:border-0">
                          <span className="truncate text-gray-800">{task}</span>
                          <span className="shrink-0 text-gray-600">{data.success_rate_pct}% • {data.avg_latency_ms}ms</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="p-5 bg-white border-[3px] border-black">
                  <p className="text-sm font-black uppercase mb-4 text-black border-b-2 border-black pb-2">By Provider</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {Object.keys(llmMetrics.by_provider || {}).length === 0 ? (
                      <p className="text-sm font-medium text-gray-500">No provider data</p>
                    ) : (
                      Object.entries(llmMetrics.by_provider).map(([provider, data]) => (
                        <div key={provider} className="text-sm font-bold flex justify-between gap-4 border-b border-gray-200 pb-2 last:border-0">
                          <span className="uppercase text-gray-800">{provider}</span>
                          <span className="shrink-0 text-gray-600">{data.success_rate_pct}% • {data.avg_latency_ms}ms</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tab Components (Shells for now) ───────────────────────── */

function ResumeWorkspace({ history, fetchHistory, isAnalyzing, setIsAnalyzing }) {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null); // blob URL for PDF viewer
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rewritingIndex, setRewritingIndex] = useState(null);
  const [rewrittenBullets, setRewrittenBullets] = useState({});

  const handleRewrite = async (flawText, index) => {
    setRewritingIndex(index);
    try {
      const formData = new FormData();
      formData.append("flaw", flawText);
      const res = await axios.post(`${API_BASE}/analyze/rewrite`, formData, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setRewrittenBullets(prev => ({...prev, [index]: res.data.rewritten_bullet}));
    } catch (err) {
      toast.error("Failed to rewrite bullet. Try again.");
    } finally {
      setRewritingIndex(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE}/analyze-resume/`, formData, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      await fetchHistory();
      setSelectedIndex(0); // Reset to latest
    } catch (err) {
      toast.error("Analysis failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsAnalyzing(false);
      setFile(null);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    // Create a blob URL for PDF preview
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(f));
  };

  const selectedAnalysis = history && history.length > 0 ? history[selectedIndex] : null;

  return (
    <div className="flex flex-col lg:flex-row h-full animate-fade-in">
      {/* Left Pane: Upload & Preview */}
      <div className="w-full lg:w-1/2 p-6 lg:p-8 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black flex flex-col bg-gray-50">
        <h2 className="text-4xl font-black uppercase mb-6 tracking-tight text-black">Resume Lab</h2>
        
        <div className="bg-white border-[3px] border-black shadow-hard p-6 mb-6 shrink-0">
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-4">
            <label className="flex-1 cursor-pointer border-[3px] border-dashed border-gray-300 bg-gray-50 hover:border-black hover:bg-gray-100 transition-colors p-4 flex items-center justify-center gap-3 font-bold text-sm text-black">
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              <UploadCloud className="w-6 h-6 text-orange-600 shrink-0" />
              <span className="truncate">{file ? file.name : "Drop PDF or Click to Upload"}</span>
            </label>
            <button type="submit" disabled={!file || isAnalyzing} className="neu-btn-primary px-8 py-3 sm:py-0 text-sm">
              Analyze
            </button>
          </form>
        </div>

        {history && history.length > 0 && (
          <div className="mb-6 flex items-center justify-between bg-white p-3 border-[3px] border-black shadow-hard-sm">
            <span className="text-xs font-black uppercase tracking-widest text-orange-600">Evolution Timeline</span>
            <select 
              value={selectedIndex} 
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="bg-gray-50 border-2 border-black text-xs font-bold p-1 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer text-black"
            >
              {history.map((item, idx) => (
                <option key={item.id} value={idx}>
                  Iteration {history.length - idx} • Score: {item.score_breakdown?.total_score || item.ats_score || 0} • {new Date(item.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* PDF Viewer or text preview */}
        <div className="flex-1 border-[3px] border-black bg-white overflow-hidden relative shadow-hard" style={{ minHeight: '200px' }}>
          {pdfUrl ? (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ minHeight: '300px' }}
            >
              <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-500 font-bold text-sm p-4">
                <FileText className="w-8 h-8" />
                <p>PDF preview not supported in this browser.</p>
                <a href={pdfUrl} download className="text-blue-600 underline text-xs">Download PDF</a>
              </div>
            </object>
          ) : selectedAnalysis ? (
            <div className="text-sm font-medium whitespace-pre-wrap text-black p-6 overflow-y-auto h-full">
              {selectedAnalysis.resume_preview || "[ Resume text preview will appear here ]"}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 font-bold text-sm">
              Upload a PDF to preview it here.
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Diagnostic & AI Flaw Detector */}
      <div className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto bg-white" style={{ backgroundImage: "linear-gradient(to right, #f3f4f6 1px, transparent 1px), linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
        <h2 className="text-4xl font-black uppercase mb-6 tracking-tight" style={{ color: "hsl(24,100%,50%)" }}>Diagnostic & Fixes</h2>
        
        {!selectedAnalysis ? (
          <div className="bg-white border-[3px] border-black p-10 text-center text-gray-500 font-bold shadow-hard">
            Awaiting resume upload for analysis.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white border-[3px] border-black text-center shadow-hard-sm">
                <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Keywords</p>
                <p className="text-4xl font-black text-black font-display-serif">{selectedAnalysis.score_breakdown?.keyword_match || 0}/35</p>
              </div>
              <div className="p-4 bg-white border-[3px] border-black text-center shadow-hard-sm">
                <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Format</p>
                <p className="text-4xl font-black text-black font-display-serif">{selectedAnalysis.score_breakdown?.format_readability || 0}/30</p>
              </div>
              <div className="p-4 bg-white border-[3px] border-black text-center shadow-hard-sm" style={{ borderColor: "hsl(24,100%,50%)" }}>
                <p className="text-xs text-orange-600 uppercase font-black tracking-widest mb-1">Impact</p>
                <p className="text-4xl font-black font-display-serif" style={{ color: "hsl(24,100%,50%)" }}>{selectedAnalysis.score_breakdown?.impact_metrics || 0}/35</p>
              </div>
            </div>

            {/* Flaws & AI Suggestions */}
            <div className="bg-white border-[3px] border-black p-6 shadow-hard relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
              <h3 className="text-xl font-black uppercase mb-6 text-red-600 flex items-center gap-3 pl-4">
                <span className="w-3 h-3 bg-red-600 inline-block border-[2px] border-black"></span>
                Detected Flaws & AI Fixes
              </h3>
              
              {selectedAnalysis.gemini_suggestions && selectedAnalysis.gemini_suggestions.length > 0 ? (
                <div className="space-y-5 pl-4">
                  {selectedAnalysis.gemini_suggestions.map((s, i) => (
                    <div key={i} className="p-4 bg-gray-50 border-[3px] border-black text-sm text-black">
                      <p className="font-black mb-2 text-red-600">Issue {i+1}:</p>
                      <p className="font-medium">{s}</p>
                      {rewrittenBullets[i] ? (
                        <div className="mt-4 p-4 bg-orange-50 border-l-[4px] border-orange-500 text-black text-sm">
                          <strong className="text-orange-600 font-black uppercase">AI Rewrite:</strong> <br/>
                          <span className="font-medium mt-1 inline-block">{rewrittenBullets[i]}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleRewrite(s, i)}
                          disabled={rewritingIndex === i}
                          className="mt-4 text-xs font-black uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-orange-600 disabled:opacity-50 transition-colors border-2 border-black"
                        >
                          {rewritingIndex === i ? "GENERATING..." : "REWRITE BULLET →"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-gray-500 pl-4">No major flaws detected.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobTracker() {
  const [apps, setApps] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newApp, setNewApp] = useState({ company: "", role: "", stage: "wishlist", notes: "" });

  // Job discovery
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState("software engineer");
  const [matchModal, setMatchModal] = useState(null); // job object
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [activeView, setActiveView] = useState("discover"); // "discover" | "kanban"

  const STAGES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];

  useEffect(() => { fetchApps(); fetchJobs(); }, []);

  const fetchJobs = async (role) => {
    setJobsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/jobs/discover`, {
        params: { role: role || jobSearch },
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setJobs(res.data.jobs || []);
    } catch { setJobs([]); }
    finally { setJobsLoading(false); }
  };

  const handleMatchResume = async (job) => {
    setMatchModal(job);
    setMatchResult(null);
    setMatchLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/jobs/match-resume`, {
        job_title: job.title,
        company: job.company,
        job_description: job.description_snippet,
      }, { headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" } });
      setMatchResult(res.data);
    } catch (err) {
      setMatchResult({ error: err.response?.data?.detail || "Analyze your resume in Resume Lab first." });
    }
    setMatchLoading(false);
  };

  const saveJobToTracker = async (job) => {
    try {
      const fd = new FormData();
      fd.append("company", job.company);
      fd.append("role", job.title);
      fd.append("job_url", job.url || "");
      await axios.post(`${API_BASE}/applications`, fd, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      fetchApps();
      toast.success(`"${job.title}" at ${job.company} saved to your pipeline!`);
    } catch { toast.error("Failed to save job. Try again."); }
  };

  const fetchApps = async () => {
    try {
      const res = await axios.get(`${API_BASE}/applications`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setApps(res.data);
    } catch {}
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("company", newApp.company);
      fd.append("role", newApp.role);
      const res = await axios.post(`${API_BASE}/applications`, fd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (newApp.stage !== 'applied') {
        const pd = new FormData(); pd.append("stage", newApp.stage);
        await axios.patch(`${API_BASE}/applications/${res.data.id}`, pd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      }
      setShowAdd(false); setNewApp({ company: "", role: "", stage: "wishlist", notes: "" }); fetchApps();
    } catch { toast.error("Failed to add application. Try again."); }
  };

  const handleStageChange = async (appId, newStage) => {
    try {
      const fd = new FormData(); fd.append("stage", newStage);
      await axios.patch(`${API_BASE}/applications/${appId}`, fd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      fetchApps();
    } catch {}
  };

  const handleDelete = async (appId) => {
    const ok = await confirm("Delete this application? This can't be undone.", "Delete", "Keep it");
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE}/applications/${appId}`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      fetchApps();
    } catch {}
  };

  const STAGE_COLORS = { wishlist: "#6b7280", applied: "var(--primary)", interview: "#3b82f6", offer: "#22c55e", rejected: "#ef4444" };

  return (
    <div className="p-6 md:p-10 h-full flex flex-col animate-fade-in relative overflow-hidden bg-background" style={{ backgroundImage: "linear-gradient(to right, hsl(0,0%,10%) 1px, transparent 1px), linear-gradient(to bottom, hsl(0,0%,10%) 1px, transparent 1px)", backgroundSize: "40px 40px" }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0 bg-white p-4 border-[3px] border-black shadow-hard">
        <h2 className="text-3xl font-black uppercase text-black">Job Tracker</h2>
        <div className="flex gap-4">
          <button onClick={() => setActiveView("discover")} className={`px-4 py-2 text-xs font-black uppercase border-[2px] transition-colors inline-flex items-center gap-2 ${activeView === "discover" ? "bg-black text-white border-black" : "border-black text-black hover:bg-gray-100"}`}>
            <Search className="w-4 h-4" /> Discover Jobs
          </button>
          <button onClick={() => setActiveView("kanban")} className={`px-4 py-2 text-xs font-black uppercase border-[2px] transition-colors inline-flex items-center gap-2 ${activeView === "kanban" ? "bg-black text-white border-black" : "border-black text-black hover:bg-gray-100"}`}>
            <LayoutDashboard className="w-4 h-4" /> My Pipeline {apps.length > 0 && `(${apps.length})`}
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="neu-btn-primary py-2 px-6 text-sm">
            {showAdd ? "✕ CANCEL" : "+ ADD JOB"}
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 border-[3px] border-black shadow-hard mb-6 flex gap-4 items-end flex-shrink-0 flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="text-xs font-black uppercase block mb-2 text-black">Company</label>
            <input required value={newApp.company} onChange={e => setNewApp({...newApp, company: e.target.value})} className="cream-input" placeholder="e.g. Google" />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-xs font-black uppercase block mb-2 text-black">Role</label>
            <input required value={newApp.role} onChange={e => setNewApp({...newApp, role: e.target.value})} className="cream-input" placeholder="e.g. SDE Intern" />
          </div>
          <div className="flex-1 min-w-28">
            <label className="text-xs font-black uppercase block mb-2 text-black">Stage</label>
            <select value={newApp.stage} onChange={e => setNewApp({...newApp, stage: e.target.value})} className="cream-input cursor-pointer">
              {STAGES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <button type="submit" className="neu-btn-primary py-3 px-8 text-sm h-[46px]">SAVE</button>
        </form>
      )}

      {/* ── Discover View ─────────────────────────────── */}
      {activeView === "discover" && (
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="flex gap-4 mb-6">
            <input
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchJobs(jobSearch)}
              className="cream-input flex-1"
              placeholder="Search role (e.g. backend engineer, ML engineer)"
            />
            <button onClick={() => fetchJobs(jobSearch)} className="neu-btn-primary px-8">SEARCH</button>
          </div>

          {jobsLoading ? (
            <div className="text-center font-bold text-orange-600 animate-pulse py-12 bg-white border-[3px] border-black shadow-hard">[ FETCHING LIVE JOBS... ]</div>
          ) : jobs.length === 0 ? (
            <div className="text-center font-bold text-gray-500 py-12 bg-white border-[3px] border-black shadow-hard">No jobs found — try a different role</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-6 border-[3px] border-black shadow-hard flex flex-col gap-4 hover:-translate-y-1 hover:-translate-x-1 transition-transform">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-black text-lg leading-tight text-black">{job.title}</h4>
                      {job.posted && <span className="text-xs font-bold text-gray-500 shrink-0 border-[2px] border-gray-300 px-2 py-0.5">{job.posted}</span>}
                    </div>
                    <p className="text-sm text-blue-600 font-bold mt-1">{job.company}</p>
                    <p className="text-xs text-gray-600 font-medium mt-1">{job.location}</p>
                    {job.salary && <p className="text-xs text-green-600 font-black mt-2 bg-green-50 inline-block px-2 py-1 border-2 border-green-200">💰 {job.salary}</p>}
                  </div>
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.tags.map((t, i) => (
                        <span key={i} className="text-xs font-bold bg-gray-100 text-black px-2 py-1 border-[2px] border-black">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto pt-4 border-t-[2px] border-dashed border-gray-300">
                    <button onClick={() => handleMatchResume(job)} className="flex-1 text-xs font-black uppercase py-2 bg-orange-500 text-white border-[2px] border-black hover:bg-black transition-colors inline-flex items-center justify-center gap-1">
                      <BarChart2 className="w-4 h-4" /> AI Match
                    </button>
                    <button onClick={() => saveJobToTracker(job)} className="flex-1 text-xs font-black uppercase py-2 bg-white text-black border-[2px] border-black hover:bg-gray-100 transition-colors">
                      + Track
                    </button>
                    {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs font-black uppercase py-2 px-3 bg-white text-black border-[2px] border-black hover:bg-gray-100 transition-colors">↗</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Kanban View ────────────────────────────────── */}
      {activeView === "kanban" && (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 pt-2">
          {STAGES.map(status => {
            const colApps = apps.filter(a => a.stage === status || (status === 'applied' && !STAGES.includes(a.stage)));
            return (
              <div key={status} className="w-80 shrink-0 flex flex-col">
                <div className="bg-white border-[3px] border-black shadow-hard p-4 mb-4 font-black uppercase tracking-widest text-sm flex justify-between items-center" style={{ borderBottomColor: STAGE_COLORS[status], borderBottomWidth: "6px" }}>
                  <span style={{ color: STAGE_COLORS[status] }}>{status}</span>
                  <span className="bg-gray-100 text-black px-2 border-[2px] border-black">{colApps.length}</span>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto min-h-40 p-2">
                  {colApps.length === 0 ? (
                    <div className="text-xs font-bold text-gray-400 text-center mt-8 bg-white/50 border-[2px] border-dashed border-gray-400 p-4">Empty Dropzone</div>
                  ) : colApps.map(app => (
                    <div key={app.id} className="bg-white border-[3px] border-black p-4 shadow-hard hover:-translate-y-1 hover:-translate-x-1 transition-transform relative group">
                      <button onClick={() => handleDelete(app.id)} className="absolute top-2 right-2 text-red-600 bg-red-100 border-[2px] border-red-600 w-6 h-6 flex items-center justify-center font-black opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
                      <p className="font-black text-lg leading-tight pr-6 text-black">{app.company}</p>
                      <p className="text-sm font-bold text-gray-600 mb-3">{app.role}</p>
                      <select value={app.stage} onChange={e => handleStageChange(app.id, e.target.value)} className="w-full bg-gray-50 border-[2px] border-black text-xs font-bold p-2 uppercase cursor-pointer text-black">
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

      {/* ── AI Resume Match Modal ──────────────────────── */}
      {matchModal && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-20 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card border-2 border-primary w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black uppercase">{matchModal.title}</h3>
                <p className="text-sm text-primary font-bold">{matchModal.company}</p>
              </div>
              <button onClick={() => { setMatchModal(null); setMatchResult(null); }} className="font-mono text-muted-foreground hover:text-foreground text-sm">[ ✕ Close ]</button>
            </div>

            {matchLoading && <div className="text-center py-10 font-mono text-primary animate-pulse">[ ANALYZING RESUME FIT... ]</div>}

            {matchResult && !matchResult.error && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border-2 border-border">
                  <div className="text-4xl font-black" style={{ color: matchResult.match_score >= 70 ? "#22c55e" : matchResult.match_score >= 50 ? "var(--primary)" : "#ef4444" }}>
                    {matchResult.match_score}%
                  </div>
                  <div>
                    <p className="font-bold uppercase">{matchResult.verdict}</p>
                    <p className="text-sm text-muted-foreground">{matchResult.one_liner}</p>
                  </div>
                </div>
                {matchResult.missing_keywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-mono uppercase font-bold text-destructive mb-2">Missing Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.missing_keywords.map((k, i) => <span key={i} className="text-xs bg-destructive/10 text-destructive border border-destructive px-2 py-0.5 font-mono">{k}</span>)}
                    </div>
                  </div>
                )}
                {matchResult.resume_tweaks?.length > 0 && (
                  <div>
                    <p className="text-xs font-mono uppercase font-bold text-primary mb-2">Resume Fixes</p>
                    <div className="space-y-2">
                      {matchResult.resume_tweaks.map((t, i) => (
                        <div key={i} className="p-3 border border-border text-sm">
                          <span className="font-mono text-xs text-primary font-bold uppercase">{t.section}: </span>{t.action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {matchResult.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-mono uppercase font-bold text-green-400 mb-2">Your Strengths</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                      {matchResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                <button onClick={() => saveJobToTracker(matchModal)} className="w-full brutalist-button py-2 text-sm inline-flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Save to My Pipeline</button>
              </div>
            )}
            {matchResult?.error && <div className="p-4 border-2 border-destructive text-destructive text-sm font-mono">{matchResult.error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}


const CATEGORIES = [
  {
    id: "dsa", label: "DSA", color: "var(--primary)", badge: "bg-primary text-primary-foreground",
    resources: [
      { name: "Striver A2Z", desc: "The industry-standard A2Z roadmap for SDE roles", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", tag: "450+ problems" },
      { name: "NeetCode 150", desc: "Most important LeetCode patterns for FAANG", url: "https://neetcode.io/practice", tag: "150 curated" },
      { name: "Love Babbar 450", desc: "Popular DSA sheet cracked by thousands", url: "https://450dsa.com", tag: "450 problems" },
      { name: "Blind 75", desc: "The original 75 must-do LeetCode problems", url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions", tag: "75 problems" },
      { name: "GFG Must-Do", desc: "GeeksforGeeks curated must-do list", url: "https://www.geeksforgeeks.org/must-do-coding-questions-for-companies-like-amazon-microsoft-adobe/", tag: "Company-wise" },
      { name: "Arsh Goyal 280", desc: "FAANG-cracker's handpicked 280 problems", url: "https://docs.google.com/spreadsheets/d/1MGVBJ8HkRbCnU6EQASjJKCqQE8BWng4qgL0n3vCVOxE", tag: "280 problems" },
    ]
  },
  {
    id: "system_design", label: "System Design", color: "#3b82f6", badge: "bg-blue-500 text-white",
    resources: [
      { name: "ByteByteGo", desc: "Alex Xu's system design newsletter & books", url: "https://bytebytego.com", tag: "Best for FAANG" },
      { name: "Gaurav Sen YT", desc: "Best free system design YouTube series", url: "https://www.youtube.com/c/GauravSensei", tag: "Free, YouTube" },
      { name: "System Design Primer", desc: "GitHub's most starred system design guide", url: "https://github.com/donnemartin/system-design-primer", tag: "GitHub, 250k ⭐" },
      { name: "Grokking SD", desc: "Educative's structured system design course", url: "https://www.educative.io/courses/grokking-the-system-design-interview", tag: "Paid, worth it" },
      { name: "Concept & Coding SD", desc: "Shrayansh Jain's free YT system design", url: "https://www.youtube.com/@ConceptandCoding", tag: "Free, Hindi" },
    ]
  },
  {
    id: "cs_fundamentals", label: "CS Fundamentals", color: "#8b5cf6", badge: "bg-purple-500 text-white",
    resources: [
      { name: "Love Babbar CS Notes", desc: "DBMS, OS, CN all-in-one notes for interviews", url: "https://drive.google.com/drive/folders/1ZgHXxJO6s-UBSbT5aJHhHBX5mGl_JkZH", tag: "DBMS+OS+CN" },
      { name: "InterviewBit CS", desc: "Structured CS theory with interview questions", url: "https://www.interviewbit.com/courses/programming/", tag: "Topic-wise" },
      { name: "GFG OS Notes", desc: "GeeksforGeeks OS for interviews", url: "https://www.geeksforgeeks.org/operating-systems/", tag: "OS" },
      { name: "Last Minute DBMS", desc: "Must-know DBMS concepts before interviews", url: "https://www.geeksforgeeks.org/last-minute-notes-dbms/", tag: "DBMS" },
      { name: "CN Interview Qs", desc: "Top Computer Networks interview questions", url: "https://www.interviewbit.com/networking-interview-questions/", tag: "Networking" },
    ]
  },
  {
    id: "behavioral", label: "Behavioral", color: "#f59e0b", badge: "bg-yellow-500 text-black",
    resources: [
      { name: "Amazon LP Guide", desc: "All 16 Leadership Principles with STAR stories", url: "https://www.amazon.jobs/en/principles", tag: "Amazon" },
      { name: "STAR Method Bank", desc: "Template + 50 example behavioral answers", url: "https://www.themuse.com/advice/star-interview-method", tag: "Framework" },
      { name: "Behavioral Prep Sheet", desc: "Community-made Google/Meta behavioral bank", url: "https://docs.google.com/spreadsheets/d/12ahNxD79MBiO8h8UjJdjepRpJlbBLYxAoMdmAKrfEsg", tag: "Google + Meta" },
      { name: "Tech Interview Handbook", desc: "Yangshun's comprehensive behavioral guide", url: "https://www.techinterviewhandbook.org/behavioral-interview/", tag: "Free guide" },
    ]
  },
  {
    id: "faang_sheets", label: "FAANG Sheets", color: "#22c55e", badge: "bg-green-500 text-white",
    resources: [
      { name: "Fraz SDE Sheet", desc: "By Mohammad Fraz (ex-Microsoft) — 450 problems", url: "https://docs.google.com/spreadsheets/d/1-wKcV99KtO91dXdPkwmXGTdtyxAfk1mbPXQg81R9sFo", tag: "Microsoft cracker" },
      { name: "Siddharth Singh Google", desc: "By a Google SWE — problem list + tips", url: "https://docs.google.com/spreadsheets/d/11tevcTIBQsIvRKIZLbSzCeN4mCO6wD4O5meyrAIfSXw", tag: "Google SWE" },
      { name: "DSA Cracker Sheet", desc: "By Aman Dhattarwal — exam + placement focused", url: "https://docs.google.com/spreadsheets/d/1AVoprCGMBCpXD9DrR1HZj8Y_bGCKMa8VN5rmBcBSMT8", tag: "Placement" },
      { name: "Apna College Sheet", desc: "Shradha + Aman DSA sheet for placements", url: "https://docs.google.com/spreadsheets/d/1hXserPuxVoWMG9Hs7y8wVdRCJTcj3xMBAEYUOXQ5Xag", tag: "1200+ problems" },
    ]
  },
  {
    id: "projects", label: "Projects & Dev", color: "#ec4899", badge: "bg-pink-500 text-white",
    resources: [
      { name: "Roadmap.sh", desc: "Curated learning paths for every dev role", url: "https://roadmap.sh", tag: "Interactive" },
      { name: "Project Ideas for SDE", desc: "50+ project ideas to add to your resume", url: "https://github.com/practical-tutorials/project-based-learning", tag: "GitHub" },
      { name: "Build Your Own X", desc: "Build real versions of complex tools from scratch", url: "https://github.com/codecrafters-io/build-your-own-x", tag: "Deep Learning" },
      { name: "GitHub Trending", desc: "Contribute to trending open-source projects", url: "https://github.com/trending", tag: "Open Source" },
      { name: "DevChallenges", desc: "Real-world project challenges with designs", url: "https://devchallenges.io", tag: "Fullstack" },
    ]
  },
  {
    id: "mock", label: "Mock Interviews", color: "#f97316", badge: "bg-orange-500 text-white",
    resources: [
      { name: "Pramp", desc: "Free peer-to-peer mock technical interviews", url: "https://www.pramp.com", tag: "Free, Peer" },
      { name: "Interviewing.io", desc: "Anonymous mock interviews with engineers from FAANG", url: "https://interviewing.io", tag: "FAANG engineers" },
      { name: "LeetCode Mock", desc: "Company-specific timed mock contests", url: "https://leetcode.com/assessment/", tag: "Company-wise" },
      { name: "Excalidraw", desc: "Whiteboard for system design mock sessions", url: "https://excalidraw.com", tag: "Whiteboard" },
    ]
  },
];

const RESOURCE_TYPE_COLORS = {
  "DSA": "text-primary border-primary hover:bg-primary hover:text-primary-foreground",
  "System Design": "text-accent border-accent hover:bg-accent hover:text-accent-foreground",
  "Project": "text-green-500 border-green-500 hover:bg-green-500 hover:text-white",
  "Behavioral": "text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black",
  "Language": "text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white",
};

const RESOURCE_TYPE_BADGE_COLORS = {
  "DSA": "bg-primary text-primary-foreground",
  "System Design": "bg-accent text-accent-foreground",
  "Project": "bg-green-500 text-white",
  "Behavioral": "bg-yellow-500 text-black",
  "Language": "bg-purple-400 text-white",
};

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
      setError(err.response?.data?.detail || "Failed to generate. Upload a resume first.");
    } finally { setIsGenerating(false); }
  };

  const cat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="p-6 animate-fade-in relative flex flex-col" style={{ minHeight: "100%" }}>
      <div className="flex justify-between items-start mb-6 flex-shrink-0">
        <h2 className="text-3xl font-black uppercase">Learning Hub</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowHolisticTracker(true)} className="px-4 py-2 text-xs font-mono uppercase border-2 border-border hover:border-primary transition-colors inline-flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Holistic Tracker
          </button>
          <button onClick={() => { setShowForm(true); setShowRoadmap(false); }} className="brutalist-button px-4 py-2 text-xs inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> AI Roadmap
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 flex-shrink-0">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className="px-3 py-1.5 text-xs font-mono uppercase border-2 shrink-0 transition-all"
            style={activeCategory === c.id
              ? { background: c.color, color: "#fff", borderColor: c.color }
              : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Resource cards */}
      {cat && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
          {cat.resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="brutalist-card bg-card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform cursor-pointer group">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-base">{r.name}</h4>
                <span className={`text-xs font-mono px-2 py-0.5 shrink-0 ml-2 ${cat.badge}`}>{r.tag}</span>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{r.desc}</p>
              <p className="text-xs font-mono font-bold group-hover:underline" style={{ color: cat.color }}>Open ↗</p>
            </a>
          ))}

          {/* Special NeetCode tracker card for DSA category */}
          {activeCategory === "dsa" && (
            <div onClick={() => setShowHolisticTracker(true)}
              className="brutalist-card bg-card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform cursor-pointer group border-2 border-primary">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-base">Holistic Daily Tracker</h4>
                <span className="text-xs font-mono px-2 py-0.5 bg-primary text-primary-foreground">Built-in</span>
              </div>
              <p className="text-sm text-muted-foreground flex-1">Track your daily progress across 6 categories: DSA, System Design, Projects, CS Core, Behavioral, and Apps.</p>
              <p className="text-xs font-mono font-bold text-primary group-hover:underline">Open Tracker →</p>
            </div>
          )}

          {/* AI Roadmap card always visible */}
          <div onClick={() => { setShowForm(true); setShowRoadmap(false); }}
            className="brutalist-card bg-card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform cursor-pointer group border-2 border-dashed border-primary/50">
            <div className="flex justify-between items-start">
              <h4 className="font-black text-base text-primary">Your AI Roadmap</h4>
              <span className="text-xs font-mono px-2 py-0.5 bg-primary/10 text-primary border border-primary">AI</span>
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              {roadmap ? `Plan for ${roadmap.role} @ ${roadmap.company} ready.` : "Personalized 8-week plan based on your resume + target role."}
            </p>
            <p className="text-xs font-mono font-bold text-primary group-hover:underline">
              {roadmap ? "View / Regenerate →" : "Generate My Plan →"}
            </p>
          </div>
        </div>
      )}

      {/* Holistic Tracker Overlay */}
      {showHolisticTracker && (
        <div className="absolute inset-0 bg-background/96 backdrop-blur-sm z-10 p-6 animate-fade-in overflow-y-auto">
          <div className="max-w-4xl mx-auto flex justify-end mb-4">
            <button onClick={() => setShowHolisticTracker(false)} className="text-muted-foreground hover:text-foreground font-mono text-sm border-2 border-border px-4 py-2">[ ✕ Close Tracker ]</button>
          </div>
          <HolisticTracker roadmap={roadmap} />
        </div>
      )}

      {/* AI Roadmap Form */}
      {showForm && (
        <div className="absolute inset-0 bg-background/96 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in p-6">
          <div className="brutalist-card bg-card border-2 border-primary p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase text-primary">Generate My Plan</h3>
              <button onClick={() => setShowForm(false)} className="font-mono text-sm text-muted-foreground">[ ✕ ]</button>
            </div>
            <p className="text-sm text-muted-foreground mb-6 font-mono">AI analyzes your resume and builds a targeted 8-week roadmap. Upload a resume first.</p>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold uppercase block mb-2">Target Role</label>
                <input required value={targetRole} onChange={e => setTargetRole(e.target.value)} className="brutalist-input w-full py-3 px-4 text-sm" placeholder="e.g. Software Development Engineer" />
              </div>
              <div>
                <label className="text-xs font-mono font-bold uppercase block mb-2">Target Company</label>
                <input required value={targetCompany} onChange={e => setTargetCompany(e.target.value)} className="brutalist-input w-full py-3 px-4 text-sm" placeholder="e.g. Google, Amazon, Microsoft" />
              </div>
              {error && <div className="p-3 bg-destructive/10 border-2 border-destructive text-destructive text-sm font-mono">{error}</div>}
              <button type="submit" disabled={isGenerating} className="brutalist-button w-full py-3 disabled:opacity-50">
                {isGenerating ? "[ GENERATING... ]" : "[ GENERATE MY 8-WEEK PLAN ]"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Generated Roadmap */}
      {showRoadmap && roadmap && (
        <div className="absolute inset-0 bg-background/96 backdrop-blur-sm z-10 p-6 flex flex-col animate-fade-in overflow-y-auto">
          <div className="flex justify-between items-start mb-6 border-b-2 border-border pb-4">
            <div>
              <h3 className="text-2xl font-black uppercase text-primary">
                {roadmap.role} @ {roadmap.company}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 font-mono max-w-2xl">{roadmap.summary}</p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              <button onClick={() => { setShowForm(true); setShowRoadmap(false); }} className="brutalist-button px-4 py-2 text-xs">Regenerate</button>
              <button onClick={() => setShowRoadmap(false)} className="px-4 py-2 text-xs font-mono uppercase border-2 border-border text-muted-foreground hover:border-foreground transition-colors">[ Close ]</button>
            </div>
          </div>
          {roadmap.skill_gaps?.length > 0 && (
            <div className="max-w-4xl mx-auto w-full mb-8 p-4 bg-destructive/10 border-2 border-destructive">
              <p className="text-xs font-mono font-bold uppercase text-destructive mb-2">Skill Gaps</p>
              <div className="flex flex-wrap gap-2">
                {roadmap.skill_gaps.map((g, i) => <span key={i} className="text-xs font-mono bg-destructive/20 text-destructive px-2 py-1 border border-destructive">{g}</span>)}
              </div>
            </div>
          )}
          <div className="space-y-0 max-w-4xl mx-auto w-full">
            {roadmap.phases?.map((phase, i) => {
              const isLast = i === roadmap.phases.length - 1;
              return (
                <div key={i} className="flex gap-6 group">
                  <div className="w-24 shrink-0 text-right font-mono font-bold text-primary uppercase pt-4 text-sm">{phase.week_label}</div>
                  <div className="w-6 flex flex-col items-center">
                    <div className="w-6 h-6 bg-primary border-2 border-primary rounded-full group-hover:scale-125 transition-transform z-10 mt-4 shrink-0" />
                    {!isLast && <div className="w-0.5 bg-border flex-1 -mt-1" />}
                  </div>
                  <div className="brutalist-card bg-card p-6 flex-1 mb-8 hover:-translate-y-1 transition-transform">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-xl uppercase">{phase.title}</h4>
                      <span className="text-xs font-mono px-2 py-1 bg-primary text-primary-foreground ml-2 shrink-0">{phase.resource_type}</span>
                    </div>
                    <p className="text-xs font-mono text-primary uppercase tracking-wide mb-3">Focus: {phase.focus}</p>
                    <p className="text-muted-foreground mb-4 text-sm">{phase.description}</p>
                    {phase.resource_url && (
                      <a href={phase.resource_url} target="_blank" rel="noopener noreferrer"
                        className="inline-block border-2 border-primary text-primary px-3 py-1 text-xs font-mono font-bold uppercase hover:bg-primary hover:text-primary-foreground transition-colors">
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







function SparklesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}



/* ── Main Dashboard ─────────────────────────────────────── */

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [llmMetrics, setLlmMetrics] = useState(null);
  const [llmMetricsLoading, setLlmMetricsLoading] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchHistory();
    fetchLlmMetrics();
  }, [navigate]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      // Backend returns { analyses: [...] } shape
      const data = res.data;
      setHistory(Array.isArray(data) ? data : (data.analyses || []));
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
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setLlmMetrics(res.data || null);
    } catch (err) {
      if (err.response?.status !== 401) {
        setLlmMetrics(null);
      }
    } finally {
      setLlmMetricsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex h-screen">
          {/* Sidebar skeleton */}
          <div className="hidden lg:flex flex-col" style={{ width: '260px', minWidth: '260px' }}>
            <div className="h-full bg-card border-r-2 border-border" />
          </div>
          {/* Content skeleton */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-primary text-sm animate-pulse mb-2">[ BOOTING DASHBOARD_V2 ]</div>
              <div className="flex gap-1 justify-center">
                {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the correct tab content
  let Content;
  switch(activeTab) {
    case "overview":
      Content = (
        <OverviewTab
          history={history}
          setActiveTab={setActiveTab}
          navigate={navigate}
          llmMetrics={llmMetrics}
          llmMetricsLoading={llmMetricsLoading}
        />
      );
      break;
    case "workspace":
      Content = <ResumeWorkspace history={history} fetchHistory={fetchHistory} isAnalyzing={isAnalyzing} setIsAnalyzing={setIsAnalyzing} />;
      break;
    case "tracker":
      Content = <JobTracker />;
      break;
    case "resources":
      Content = <ResourceHub />;
      break;
    case "copilot":
      Content = <MentorChat />;
      break;
    case "builder":
      Content = <ResumeBuilder />;
      break;
    default:
      Content = <div className="p-6 font-mono text-muted-foreground">Module in development.</div>;
  }

  return (
    <>
      <div className="flex h-screen bg-background overflow-hidden font-sans">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        
        {/* Main content — add left padding on mobile for hamburger button */}
        <main className="flex-1 overflow-y-auto relative pt-16 lg:pt-0">
          {isAnalyzing && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
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
