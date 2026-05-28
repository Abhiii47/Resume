import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { getAuthToken, removeAuthToken } from "../utils";
import Sidebar from "../components/ui/Sidebar";
import AnalysisLoader from "../components/AnalysisLoader";
import AgentChat from "../components/AgentChat";
import ResumeBuilder from "../components/ResumeBuilder";
import ProfileTab from "../components/ProfileTab";
import SettingsTab from "../components/SettingsTab";
import OverviewTab from "../components/OverviewTab";
import ResumeWorkspace from "../components/ResumeWorkspace";
import JobTracker from "../components/JobTracker";
import ResourceHub from "../components/ResourceHub";
import { ToastContainer } from "../components/ui/Toast";

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
      const profileRes = await api.get("/me");
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
      const res = await api.get("/history");
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
      const res = await api.get("/admin/llm-metrics");
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
    case "profile":
      Content = <ProfileTab />;
      break;
    case "settings":
      Content = <SettingsTab />;
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
