import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE, getAuthToken } from "../utils";

const CATEGORIES = [
  { id: "dsa", label: "DSA", icon: "💻", color: "hsl(var(--accent-500))" },
  { id: "system_design", label: "System Design", icon: "🏗️", color: "#3b82f6" },
  { id: "cs_fundamentals", label: "CS Core", icon: "📚", color: "#8b5cf6" },
  { id: "behavioral", label: "Behavioral", icon: "🤝", color: "#f59e0b" },
  { id: "projects", label: "Projects", icon: "🚀", color: "#ec4899" },
  { id: "applications", label: "Applications", icon: "📋", color: "#22c55e" }
];

export default function HolisticTracker({ roadmap }) {
  const [trackerData, setTrackerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [logNote, setLogNote] = useState("");

  const fetchTrackerData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tracker/weekly`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setTrackerData(res.data);
    } catch (err) {
      console.error("Failed to load tracker", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, []);

  const handleLog = async (categoryId, e) => {
    e?.preventDefault();
    setLogging(categoryId);
    try {
      await axios.post(`${API_BASE}/tracker/log`, {
        category: categoryId,
        count: 1,
        note: logNote
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" }
      });
      setLogNote("");
      await fetchTrackerData();
    } catch (err) /* eslint-disable-line no-unused-vars */ {
      alert("Failed to log activity");
    } finally {
      setLogging(false);
    }
  };

  if (loading) return <div className="text-center font-mono p-8 text-primary animate-pulse">[ LOADING TRACKER... ]</div>;

  // Generate last 30 days for heatmap
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="bg-background max-w-5xl mx-auto border-2 border-border p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-border">
        <h2 className="text-3xl font-black uppercase">Daily Command Center</h2>
        <div className="text-xs font-mono text-muted-foreground uppercase">
          Track holistic progress
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {CATEGORIES.map(cat => {
          const streak = trackerData?.streaks?.[cat.id] || 0;
          const totalLogs = trackerData?.by_category?.[cat.id] || 0;
          return (
            <div key={cat.id} className="bg-card border-2 border-border p-4 hover:-translate-y-1 transition-transform relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: cat.color }}></div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-lg uppercase tracking-tight">{cat.icon} {cat.label}</h3>
                <div className="text-right">
                  <p className="text-2xl font-black leading-none" style={{ color: streak > 0 ? cat.color : 'inherit' }}>{streak}🔥</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">Day Streak</p>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">Total Logs</p>
                  <p className="font-bold">{totalLogs}</p>
                </div>
                <button 
                  onClick={() => handleLog(cat.id)}
                  disabled={logging === cat.id}
                  className="px-4 py-2 text-xs font-mono font-bold uppercase transition-colors"
                  style={{ 
                    border: `2px solid ${cat.color}`, 
                    color: cat.color,
                    background: 'transparent'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = cat.color; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = cat.color; }}
                >
                  {logging === cat.id ? "[ LOGGING ]" : "+ LOG WORK"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border-2 border-border p-6 mb-8">
        <h3 className="font-black uppercase mb-4 tracking-widest text-sm">30-Day Activity Heatmap</h3>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {days.map(dayStr => {
            const dayData = trackerData?.calendar?.[dayStr] || {};
            const totalActivity = Object.values(dayData).reduce((a, b) => a + b, 0);
            
            let bgClass = "bg-muted";
            if (totalActivity === 1) bgClass = "bg-primary/30";
            if (totalActivity === 2) bgClass = "bg-primary/60";
            if (totalActivity >= 3) bgClass = "bg-primary";
            
            const isToday = dayStr === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={dayStr} 
                className={`w-8 h-8 flex-shrink-0 ${bgClass} border ${isToday ? 'border-foreground border-2' : 'border-border/50'} relative group`}
                title={`${dayStr}: ${totalActivity} activities`}
              >
                {/* Tooltip */}
                {totalActivity > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-foreground text-background text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <p className="font-bold mb-1 border-b border-background/20 pb-1">{dayStr}</p>
                    {Object.entries(dayData).map(([catId, count]) => {
                      const catName = CATEGORIES.find(c => c.id === catId)?.label || catId;
                      return <p key={catId}>{catName}: {count}</p>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 items-center justify-end mt-2 text-xs font-mono text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 bg-muted border border-border"></div>
          <div className="w-3 h-3 bg-primary/30 border border-border"></div>
          <div className="w-3 h-3 bg-primary/60 border border-border"></div>
          <div className="w-3 h-3 bg-primary border border-border"></div>
          <span>More</span>
        </div>
      </div>
      
      {roadmap && (
        <div className="bg-primary/10 border-2 border-primary p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-black uppercase text-primary tracking-widest text-sm">Active AI Roadmap Focus</h3>
            <span className="text-xs font-mono font-bold uppercase bg-primary text-primary-foreground px-2 py-1">In Progress</span>
          </div>
          <p className="text-sm font-mono leading-relaxed mb-4">{roadmap.summary}</p>
          <div className="flex flex-wrap gap-2">
            {roadmap.phases?.slice(0, 2).map((phase, i) => (
              <span key={i} className="text-xs border border-primary text-primary px-3 py-1 font-mono uppercase bg-background">
                {phase.week_label}: {phase.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
