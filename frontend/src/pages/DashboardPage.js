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
  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}

/* ── Overview Tab (funky shell inside content) ─────────────────── */
function OverviewTab({ history, setActiveTab, navigate, llmMetrics, llmMetricsLoading, showLlmMetrics = false }) {
  const latestScore =
    history && history.length > 0
      ? history[0].score_breakdown?.total_score ||
        history[0].score_breakdown?.overall ||
        history[0].ats_score ||
        0
      : 0;
  const analysisCount = history ? history.length : 0;

  const statCards = [
    {
      label: "Top ATS Score",
      value: latestScore,
      suffix: "/ 100",
      color: "#f97316",
    },
    {
      label: "Resumes Analyzed",
      value: analysisCount,
      suffix: " runs",
      color: "#38bdf8",
    },
    {
      label: "Tracker Categories",
      value: 6,
      suffix: " active",
      color: "#22c55e",
    },
  ];

  const actionCards = [
    {
      label: "Open Resume Builder",
      desc: "Refine layout and export clean PDFs",
      icon: FileText,
      accent: "#38bdf8",
      onClick: () => navigate("/builder"),
    },
    {
      label: "Run Resume Lab",
      desc: "Analyze ATS fit and fix flaws",
      icon: UploadCloud,
      accent: "#f97316",
      onClick: () => setActiveTab("workspace"),
    },
    {
      label: "Job Tracker",
      desc: "Manage applications like a kanban",
      icon: CheckCircle2,
      accent: "#22c55e",
      onClick: () => setActiveTab("tracker"),
    },
    {
      label: "AI Copilot",
      desc: "Chat with an agentic career assistant",
      icon: BookOpen,
      accent: "#a855f7",
      onClick: () => setActiveTab("copilot"),
    },
  ];

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "radial-gradient(circle at top left, #111827 0, #020617 45%, #000 100%)",
        padding: "24px",
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] uppercase text-slate-400">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "999px",
                background: "#22c55e",
                boxShadow: "0 0 18px rgba(34,197,94,0.9)",
              }}
            />
            Agentic career hub
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50">
            <span className="text-slate-300">Dashboard ·</span> Command center for your
            resume, jobs, and AI copilot.
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            See how your resume has evolved, jump into AI analysis, and manage job
            applications from one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((card, i) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40"
            >
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">
                {card.label}
              </p>
              <div className="flex items-baseline gap-1">
                <AnimatedScore
                  value={card.value}
                  className="text-3xl font-semibold"
                  style={{ color: card.color, fontFamily: "monospace" }}
                />
                <span className="text-xs text-slate-500">{card.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left flex flex-col gap-3 hover:-translate-y-1 hover:border-slate-700 transition-transform duration-150"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${card.accent}22`, color: card.accent }}
              >
                <card.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">
                  Quick action
                </p>
                <h3 className="text-sm font-semibold text-slate-50">
                  {card.label}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {showLlmMetrics && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-3">
              {llmMetricsLoading ? (
                <p className="text-[11px] font-semibold text-amber-400">
                  Loading AI reliability metrics…
                </p>
              ) : !llmMetrics ? (
                <p className="text-[11px] text-slate-500">
                  No telemetry yet. Trigger a few AI actions first.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Total calls
                    </p>
                    <p className="text-xl font-semibold text-slate-50">
                      {llmMetrics.total_calls || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Success rate
                    </p>
                    <p className="text-xl font-semibold text-emerald-400">
                      {llmMetrics.success_rate_pct || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Avg latency
                    </p>
                    <p className="text-xl font-semibold text-sky-400">
                      {llmMetrics.avg_latency_ms || 0}ms
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Resume Workspace, JobTracker, etc. (unchanged structure) ─── */
// ... existing ResumeWorkspace and JobTracker code left as-is ...

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
      <div className="min-h-screen flex">
        <div
          className="hidden lg:flex"
          style={{ width: 240, minWidth: 240, background: "#020617" }}
        />
        <div className="flex-1 flex items-center justify-center bg-slate-950">
          <div className="text-center">
            <div
              className="text-sm font-black uppercase tracking-widest mb-3 animate-pulse"
              style={{ color: "#f97316" }}
            >
              Loading your dashboard...
            </div>
            <div className="flex gap-1.5 justify-center">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: "#f97316",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
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
        <div className="p-6 text-sm font-bold" style={{ color: "#64748b" }}>
          Module in development.
        </div>
      );
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-slate-950">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto relative pt-16 lg:pt-0">
          {isAnalyzing && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center"
              style={{
                background: "rgba(15,23,42,0.92)",
                backdropFilter: "blur(4px)",
              }}
            >
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
