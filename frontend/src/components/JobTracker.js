import React, { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { toast, confirm } from "./ui/Toast";
import { Search, LayoutDashboard, BarChart2, CheckCircle2, GripVertical } from "lucide-react";

export default function JobTracker() {
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

  // DnD state
  const dragAppId = useRef(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const STAGES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];
  const STAGE_COLORS = {
    wishlist: '#57534e',
    applied: 'var(--accent)',
    interview: '#0284c7',
    offer: 'var(--color-success)',
    rejected: 'var(--color-error)',
  };
  const STAGE_BG = {
    wishlist: '#fafaf9',
    applied: '#fffbeb',
    interview: '#eff6ff',
    offer: '#f0fdf4',
    rejected: '#fef2f2',
  };

  useEffect(() => { fetchApps(); fetchJobs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJobs = async (role) => {
    setJobsLoading(true);
    try {
      const res = await api.get('/jobs/discover', { params: { role: role || jobSearch } });
      setJobs(res.data.jobs || []);
    } catch { setJobs([]); } finally { setJobsLoading(false); }
  };

  const handleMatchResume = async (job) => {
    setMatchModal(job); setMatchResult(null); setMatchLoading(true);
    try {
      const res = await api.post('/jobs/match-resume', {
        job_title: job.title,
        company: job.company,
        job_description: job.description_snippet,
      });
      setMatchResult(res.data);
    } catch (err) {
      setMatchResult({ error: err.response?.data?.detail || 'Analyze your resume in Resume Lab first.' });
    }
    setMatchLoading(false);
  };

  const saveJobToTracker = async (job) => {
    try {
      const fd = new FormData();
      fd.append('company', job.company);
      fd.append('role', job.title);
      fd.append('job_url', job.url || '');
      await api.post('/applications', fd);
      fetchApps();
      toast.success(`"${job.title}" at ${job.company} saved!`);
    } catch { toast.error('Failed to save job.'); }
  };

  const fetchApps = async () => {
    try {
      const res = await api.get('/applications');
      setApps(res.data);
    } catch (e) { console.error(e); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('company', newApp.company);
      fd.append('role', newApp.role);
      const res = await api.post('/applications', fd);
      if (newApp.stage !== 'applied') {
        const pd = new FormData(); pd.append('stage', newApp.stage);
        await api.patch(`/applications/${res.data.id}`, pd);
      }
      setShowAdd(false);
      setNewApp({ company: '', role: '', stage: 'wishlist', notes: '' });
      fetchApps();
    } catch { toast.error('Failed to add application.'); }
  };

  const handleDelete = async (appId) => {
    const ok = await confirm('Delete this application?', 'Delete', 'Keep it');
    if (!ok) return;
    try {
      await api.delete(`/applications/${appId}`);
      fetchApps();
    } catch (e) { console.error(e); }
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────────

  const handleDragStart = (e, appId) => {
    dragAppId.current = appId;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { e.target.style.opacity = '0.4'; }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    dragAppId.current = null;
    setDragOverStage(null);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const appId = dragAppId.current;
    if (!appId) return;
    const app = apps.find(a => a.id === appId);
    if (!app || app.stage === targetStage) return;

    // Optimistic update — instant visual feedback
    setApps(prev => prev.map(a => a.id === appId ? { ...a, stage: targetStage } : a));

    try {
      const fd = new FormData();
      fd.append('stage', targetStage);
      await api.patch(`/applications/${appId}`, fd);
      toast.success(`Moved to ${targetStage}`);
    } catch {
      toast.error('Failed to move card — reverting.');
      fetchApps();
    }
  };

  return (
    <div style={{ background: "var(--bg-surface)", minHeight: "100%", padding: "32px 28px" }} className="job-tracker-container">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Job Tracker
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          {['discover', 'kanban'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className="btn btn-secondary btn-sm"
              style={{
                background: activeView === view ? 'var(--accent)' : '#fff',
                color: activeView === view ? '#fff' : 'var(--text-secondary)',
                borderColor: activeView === view ? 'var(--accent)' : 'var(--border-muted)',
              }}
            >
              {view === 'discover'
                ? <><Search className="w-3.5 h-3.5 inline mr-1" />Discover</>
                : <><LayoutDashboard className="w-3.5 h-3.5 inline mr-1" />Pipeline {apps.length > 0 && `(${apps.length})`}</>}
            </button>
          ))}
          <button onClick={() => setShowAdd(v => !v)} className="btn btn-primary btn-sm">
            {showAdd ? 'Cancel' : '+ Add Job'}
          </button>
        </div>
      </div>

      {/* ── Quick Add Form ─────────────────────────────────────── */}
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

      {/* ── Discover View ─────────────────────────────────────── */}
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
                      <BarChart2 className="w-3.5 h-3.5 inline mr-1" />AI Match
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

      {/* ── Kanban Pipeline View (Drag & Drop) ─────────────────── */}
      {activeView === 'kanban' && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>
            <GripVertical size={14} />
            <span>Drag cards between columns to update their stage</span>
          </div>

          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }} className="kanban-pipeline">
            {STAGES.map(stage => {
              const colApps = apps.filter(a => a.stage === stage || (stage === 'applied' && !STAGES.includes(a.stage)));
              const isOver = dragOverStage === stage;

              return (
                <div
                  key={stage}
                  style={{ width: 265, flexShrink: 0, display: "flex", flexDirection: "column" }}
                  onDragOver={e => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, stage)}
                >
                  {/* Column header */}
                  <div style={{
                    padding: "10px 14px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: `2px solid ${isOver ? STAGE_COLORS[stage] : 'var(--border-muted)'}`,
                    borderLeft: `4px solid ${STAGE_COLORS[stage]}`,
                    borderRadius: "var(--radius-sm)",
                    background: isOver ? STAGE_BG[stage] : '#fff',
                    transition: 'all 0.15s ease',
                    boxShadow: isOver ? `0 0 0 2px ${STAGE_COLORS[stage]}33` : 'none',
                  }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: STAGE_COLORS[stage] }}>
                      {stage}
                    </span>
                    <span className="badge badge-amber" style={{ padding: "2px 6px", fontSize: 10 }}>{colApps.length}</span>
                  </div>

                  {/* Drop zone */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    minHeight: 200,
                    padding: isOver ? '6px' : '0',
                    border: isOver ? `2px dashed ${STAGE_COLORS[stage]}` : '2px dashed transparent',
                    borderRadius: "var(--radius-sm)",
                    background: isOver ? `${STAGE_COLORS[stage]}08` : 'transparent',
                    transition: 'all 0.15s ease',
                  }}>
                    {colApps.length === 0 ? (
                      <div style={{
                        textAlign: "center",
                        fontSize: 12,
                        padding: "28px 0",
                        color: isOver ? STAGE_COLORS[stage] : "var(--text-muted)",
                        border: `2px dashed ${isOver ? STAGE_COLORS[stage] : 'var(--border-muted)'}`,
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}>
                        {isOver ? '📥 Drop here' : 'Empty'}
                      </div>
                    ) : colApps.map(app => (
                      <div
                        key={app.id}
                        className="card"
                        draggable
                        onDragStart={e => handleDragStart(e, app.id)}
                        onDragEnd={handleDragEnd}
                        style={{
                          padding: 14,
                          position: "relative",
                          cursor: "grab",
                          userSelect: "none",
                          transition: "box-shadow 0.15s, transform 0.1s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.boxShadow = "3px 3px 0 var(--text-primary)";
                          e.currentTarget.style.transform = "translate(-1px, -1px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = "";
                          e.currentTarget.style.transform = "";
                        }}
                      >
                        {/* Drag handle icon */}
                        <div style={{ position: "absolute", top: 10, left: 8, color: "var(--text-muted)", opacity: 0.45 }}>
                          <GripVertical size={13} />
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(app.id)}
                          style={{
                            position: "absolute", top: 8, right: 8,
                            width: 20, height: 20,
                            background: "rgba(220,38,38,0.08)", color: "var(--color-error)",
                            border: "1px solid rgba(220,38,38,0.18)", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 800, borderRadius: 2,
                          }}
                        >✕</button>

                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--text-primary)", paddingLeft: 16, paddingRight: 20 }}>
                          {app.company}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10, fontWeight: 500, paddingLeft: 16 }}>
                          {app.role}
                        </p>

                        {/* Stage pill */}
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 8px",
                          background: `${STAGE_COLORS[app.stage]}15`,
                          border: `1px solid ${STAGE_COLORS[app.stage]}40`,
                          borderRadius: 3, marginLeft: 16,
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: STAGE_COLORS[app.stage] }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: STAGE_COLORS[app.stage], textTransform: 'capitalize' }}>
                            {app.stage}
                          </span>
                        </div>

                        {app.date_applied && (
                          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, paddingLeft: 16, fontWeight: 500 }}>
                            Applied: {new Date(app.date_applied).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AI Match Modal ─────────────────────────────────────── */}
      {matchModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(28,25,23,0.45)", backdropFilter: "blur(4px)" }}>
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
                  <div style={{ fontSize: "2.8rem", fontWeight: 800, color: matchResult.match_score >= 70 ? 'var(--color-success)' : matchResult.match_score >= 50 ? 'var(--accent)' : 'var(--color-error)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', lineHeight: 1 }}>
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
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />Save to My Pipeline
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
