import React, { useState } from "react";
import api from "../lib/api";
import { toast } from "./ui/Toast";
import { UploadCloud, FileText } from "lucide-react";

/* ── Animated Score Number Helper ───────────────────────────────── */
function AnimatedScore({ value, className, style }) {
  return (
    <span className={className} style={style}>
      {value}
    </span>
  );
}

export default function ResumeWorkspace({ history, fetchHistory, isAnalyzing, setIsAnalyzing }) {
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
      const res = await api.post('/analyze/rewrite', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
      await api.post('/analyze-resume/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
    <div style={{ display: "flex", flexDirection: selectedAnalysis ? "row" : "column", alignItems: selectedAnalysis ? "stretch" : "center", justifyContent: selectedAnalysis ? "flex-start" : "center", height: "100%", background: "var(--bg-surface)", padding: selectedAnalysis ? 0 : "40px 20px" }} className="workspace-container">
      {/* Left: Upload & Preview (Centered if no analysis) */}
      <div
        style={{ width: selectedAnalysis ? "50%" : "100%", maxWidth: selectedAnalysis ? "none" : 640, padding: selectedAnalysis ? "32px 28px" : 0, display: "flex", flexDirection: "column", borderRight: selectedAnalysis ? "var(--border-brutal)" : "none", margin: selectedAnalysis ? 0 : "0 auto" }}
        className="workspace-left"
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 24, textAlign: selectedAnalysis ? "left" : "center" }}>Resume Lab</h2>

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
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 20, color: 'var(--text-secondary)' }}>
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

      {/* Right: Diagnostic (Only show if analyzed) */}
      {selectedAnalysis && (
        <div
          style={{ width: "50%", padding: "32px 28px", overflowY: "auto", background: "#fff" }}
          className="workspace-right"
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--accent)", letterSpacing: "-0.02em", marginBottom: 24 }}>Diagnostics & Fixes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Score Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {scoreItems.map((s, i) => (
                <div key={i} className="card-surface p-4 text-center" style={{ border: "var(--border-brutal)", borderRadius: "var(--radius-sm)" }}>
                  <p className="text-label" style={{ color: s.color, fontSize: 10 }}>{s.label}</p>
                  <p style={{ fontSize: "2.2rem", fontWeight: 800, color: s.color, fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: 1.1, margin: "6px 0" }}>{s.value}<span style={{ fontSize: "0.9rem", fontWeight: 500, opacity: 0.5 }}>/{s.max}</span></p>
                  {/* mini bar */}
                  <div className="progress-track" style={{ height: 5, background: "var(--bg-elevated)" }}>
                    <div style={{ height: '100%', width: `${(s.value / s.max) * 100}%`, background: s.color, borderRadius: "var(--radius-full)", transition: "none" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed AI Report / Flaws & Suggestions */}
            {selectedAnalysis.full_report && selectedAnalysis.full_report.overall_verdict ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Overall Verdict */}
                <div className="card-surface" style={{ padding: 20, borderLeft: "4px solid var(--accent)", borderRadius: "var(--radius-md)", background: "#f8fafc" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Overall Verdict</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    {selectedAnalysis.full_report.overall_verdict}
                  </p>
                </div>

                {/* Strengths */}
                {selectedAnalysis.full_report.strengths && selectedAnalysis.full_report.strengths.length > 0 && (
                  <div className="card-surface" style={{ padding: 20, borderLeft: "4px solid var(--color-success)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-success)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, background: "var(--color-success)", borderRadius: "50%" }} />
                      What's Good (Strengths)
                    </h3>
                    <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 8, color: "var(--text-secondary)", fontSize: 13.5 }}>
                      {selectedAnalysis.full_report.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section Breakdown */}
                {selectedAnalysis.full_report.reasoning && (
                  <div className="card" style={{ borderLeft: "4px solid var(--color-warning)", overflow: "hidden", background: "#fff" }}>
                    <div style={{ padding: 20 }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--color-warning)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, background: "var(--color-warning)", borderRadius: "50%" }} />
                        Detailed Section Review
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {Object.entries(selectedAnalysis.full_report.reasoning).map(([key, reason]) => {
                          const score = selectedAnalysis.full_report.scores ? selectedAnalysis.full_report.scores[key] : null;
                          return (
                            <div key={key} style={{ padding: 16, background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", textTransform: "capitalize" }}>{key.replace('_', ' ')}</span>
                                {score !== null && (
                                  <span style={{ fontSize: 12, fontWeight: 700, color: score >= 8 ? 'var(--color-success)' : score >= 5 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                                    Score: {score}/10
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{reason}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Actionable Fixes (Rewrite Tool) */}
                {selectedAnalysis.gemini_suggestions && selectedAnalysis.gemini_suggestions.length > 0 && (
                  <div className="card" style={{ borderLeft: "4px solid var(--color-error)", overflow: "hidden", background: "#fff" }}>
                    <div style={{ padding: 20 }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--color-error)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, background: "var(--color-error)", borderRadius: "50%" }} />
                        Top Actionable Fixes
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {selectedAnalysis.gemini_suggestions.map((s, i) => (
                          <details key={i} className="card-surface group" style={{ border: "1px solid var(--border-muted)", borderRadius: "var(--radius-sm)", overflow: "hidden", cursor: "pointer", background: "#fdfdfd" }}>
                            <summary style={{ padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start", listStyle: "none", outline: "none", userSelect: "none" }}>
                              <span
                                style={{
                                  background: "rgba(220,38,38,0.1)", color: "var(--color-error)",
                                  fontSize: 10, fontWeight: 800, padding: "2px 6px",
                                  borderRadius: "var(--radius-sm)", flexShrink: 0, border: "1px solid rgba(220,38,38,0.2)"
                                }}
                              >#{i + 1}</span>
                              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {s}
                              </span>
                              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>▼</span>
                            </summary>
                            <div style={{ padding: "0 16px 16px", borderTop: "1px dashed var(--border-muted)", marginTop: 4, paddingTop: 12 }}>
                              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>{s}</p>
                              {rewrittenBullets[i] ? (
                                <div style={{ padding: 12, background: "var(--bg-elevated)", borderLeft: "3px solid var(--accent)", color: "var(--text-primary)", fontSize: 13, borderRadius: "var(--radius-sm)" }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>AI Rewrite:</span>
                                  {rewrittenBullets[i]}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.preventDefault(); handleRewrite(s, i); }}
                                  disabled={rewritingIndex === i}
                                  className="btn btn-secondary btn-sm"
                                >
                                  {rewritingIndex === i ? 'Generating...' : 'Rewrite Bullet →'}
                                </button>
                              )}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ borderLeft: "4px solid var(--color-error)", overflow: "hidden", background: "#fff" }}>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--color-error)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, background: "var(--color-error)", borderRadius: "50%" }} />
                    Detected Flaws & AI Fixes
                  </h3>
                  {selectedAnalysis.gemini_suggestions && selectedAnalysis.gemini_suggestions.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {selectedAnalysis.gemini_suggestions.map((s, i) => (
                        <details key={i} className="card-surface group" style={{ border: "1px solid var(--border-muted)", borderRadius: "var(--radius-sm)", overflow: "hidden", cursor: "pointer", background: "#fdfdfd" }}>
                          <summary style={{ padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start", listStyle: "none", outline: "none", userSelect: "none" }}>
                            <span
                              style={{
                                background: "rgba(220,38,38,0.1)", color: "var(--color-error)",
                                fontSize: 10, fontWeight: 800, padding: "2px 6px",
                                borderRadius: "var(--radius-sm)", flexShrink: 0, border: "1px solid rgba(220,38,38,0.2)"
                              }}
                            >#{i + 1}</span>
                            <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {s}
                            </span>
                            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>▼</span>
                          </summary>
                          <div style={{ padding: "0 16px 16px", borderTop: "1px dashed var(--border-muted)", marginTop: 4, paddingTop: 12 }}>
                            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>{s}</p>
                            {rewrittenBullets[i] ? (
                              <div style={{ padding: 12, background: "var(--bg-elevated)", borderLeft: "3px solid var(--accent)", color: "var(--text-primary)", fontSize: 13, borderRadius: "var(--radius-sm)" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>AI Rewrite:</span>
                                {rewrittenBullets[i]}
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.preventDefault(); handleRewrite(s, i); }}
                                disabled={rewritingIndex === i}
                                className="btn btn-secondary btn-sm"
                              >
                                {rewritingIndex === i ? 'Generating...' : 'Rewrite Bullet →'}
                              </button>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-success)' }}>✓ No major flaws detected. Solid resume!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
