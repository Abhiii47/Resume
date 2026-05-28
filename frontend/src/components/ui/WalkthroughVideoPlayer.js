import React, { useState, useEffect, useRef } from "react";

const SCENES = [
  { id: "upload", title: "1. Upload PDF", duration: 4000 },
  { id: "scan", title: "2. Scan & Flag", duration: 4000 },
  { id: "optimize", title: "3. AI Optimize", duration: 4000 },
  { id: "export", title: "4. Download PDF", duration: 4000 },
];

const TOTAL_DURATION = SCENES.reduce((acc, s) => acc + s.duration, 0);

export default function WalkthroughVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedProgressRef = useRef(0);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now() - (pausedProgressRef.current / 100) * TOTAL_DURATION;
      
      const update = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const currentProgress = (elapsed / TOTAL_DURATION) * 100;
        
        if (currentProgress >= 100) {
          setProgress(0);
          startTimeRef.current = Date.now();
        } else {
          setProgress(currentProgress);
        }
        
        timerRef.current = requestAnimationFrame(update);
      };
      
      timerRef.current = requestAnimationFrame(update);
    } else {
      pausedProgressRef.current = progress;
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [isPlaying, progress]);

  // Calculate active scene based on progress
  const getActiveSceneIndex = () => {
    let accumulated = 0;
    const progressMs = (progress / 100) * TOTAL_DURATION;
    for (let i = 0; i < SCENES.length; i++) {
      accumulated += SCENES[i].duration;
      if (progressMs <= accumulated) {
        return i;
      }
    }
    return SCENES.length - 1;
  };

  const activeIndex = getActiveSceneIndex();
  const currentScene = SCENES[activeIndex];

  // Helper to get scene progress (0 to 1) within the current scene
  const getSceneSubProgress = () => {
    const progressMs = (progress / 100) * TOTAL_DURATION;
    let priorDuration = 0;
    for (let i = 0; i < activeIndex; i++) {
      priorDuration += SCENES[i].duration;
    }
    const currentSceneElapsed = progressMs - priorDuration;
    return Math.min(1, Math.max(0, currentSceneElapsed / SCENES[activeIndex].duration));
  };

  const subProgress = getSceneSubProgress();

  const handleTabClick = (index) => {
    let priorDuration = 0;
    for (let i = 0; i < index; i++) {
      priorDuration += SCENES[i].duration;
    }
    // Set to slightly after the scene start to avoid rounding errors
    const targetProgress = ((priorDuration + 50) / TOTAL_DURATION) * 100;
    setProgress(targetProgress);
    pausedProgressRef.current = targetProgress;
    startTimeRef.current = Date.now() - (targetProgress / 100) * TOTAL_DURATION;
  };

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    setProgress(newProgress);
    pausedProgressRef.current = newProgress;
    startTimeRef.current = Date.now() - (newProgress / 100) * TOTAL_DURATION;
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "var(--border-brutal-thick)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-brutal-xl)",
        overflow: "hidden",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      className="video-player-container"
    >
      {/* Window Chrome / Header */}
      <div
        style={{
          background: "var(--bg-surface)",
          borderBottom: "var(--border-brutal)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
        </div>
        <div
          style={{
            flex: 1,
            background: "#fff",
            border: "1px solid var(--border-muted)",
            borderRadius: "var(--radius-sm)",
            fontSize: 11,
            padding: "3px 12px",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            textAlign: "center",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "var(--color-success)" }}>🔒</span>
          smartresume.ai/demo/walkthrough
        </div>
      </div>

      {/* Screen Canvas / View Pane */}
      <div
        style={{
          height: 380,
          background: "var(--bg-page)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
        className="grid-lines"
      >
        {/* SCENE 1: UPLOAD */}
        {currentScene.id === "upload" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              animation: "fade-in 0.3s ease",
            }}
          >
            {/* Dashed Drop Zone */}
            <div
              style={{
                width: "90%",
                maxWidth: 380,
                height: 180,
                border: "3px dashed var(--border-strong)",
                background: "rgba(255, 255, 255, 0.7)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* PDF Document Icon */}
              <div
                style={{
                  fontSize: 48,
                  transform: `translateY(${subProgress < 0.5 ? -100 + subProgress * 200 : 0}px) scale(${subProgress > 0.45 && subProgress < 0.55 ? 1.1 : 1})`,
                  opacity: subProgress < 0.1 ? 0 : 1,
                  transition: "transform 0.1s ease-out",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                📄
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    background: "var(--accent)",
                    color: "#fff",
                    padding: "2px 4px",
                    borderRadius: 2,
                    marginTop: -10,
                    border: "1px solid var(--text-primary)",
                  }}
                >
                  PDF
                </span>
              </div>
              
              <div style={{ fontSize: 13, fontWeight: 800, marginTop: 12, zIndex: 2, color: "var(--text-primary)" }}>
                {subProgress < 0.5 ? "Dragging resume_draft.pdf..." : "File Dropped!"}
              </div>

              {/* Scanning beam after drop */}
              {subProgress >= 0.5 && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 6,
                    background: "linear-gradient(to bottom, transparent, var(--accent), transparent)",
                    boxShadow: "0 0 12px var(--accent)",
                    top: `${(subProgress - 0.5) * 2 * 100}%`,
                    zIndex: 3,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* SCENE 2: SCAN & FLAG */}
        {currentScene.id === "scan" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              animation: "fade-in 0.3s ease",
            }}
          >
            {/* Mock parsed resume sheet */}
            <div
              style={{
                flex: 1,
                background: "#fff",
                border: "var(--border-brutal)",
                boxShadow: "var(--shadow-brutal)",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "relative",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 8 }}>
                <div>
                  <div style={{ height: 10, width: 120, background: "var(--text-primary)", borderRadius: 1, marginBottom: 4 }} />
                  <div style={{ height: 6, width: 180, background: "var(--text-muted)", borderRadius: 1 }} />
                </div>
                <div style={{ height: 16, width: 48, background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 2 }} />
              </div>

              {/* Bullets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-primary)" }} />
                  <div style={{ height: 6, width: "90%", background: "var(--bg-elevated)", borderRadius: 1 }} />
                </div>
                
                {/* Weak bullet flagged */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 6,
                    padding: "6px 8px",
                    background: "rgba(220, 38, 38, 0.05)",
                    border: subProgress > 0.25 ? "1px solid var(--color-error)" : "1px solid transparent",
                    borderRadius: "var(--radius-sm)",
                    position: "relative",
                    transition: "border 0.3s ease",
                  }}
                >
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-primary)", marginTop: 6 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: subProgress > 0.25 ? "var(--color-error)" : "var(--text-secondary)" }}>
                    Helped fix some slow SQL database queries.
                  </span>

                  {/* Warning tooltip */}
                  {subProgress > 0.45 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "115%",
                        left: "10%",
                        background: "#dc2626",
                        color: "#fff",
                        padding: "8px 12px",
                        border: "2px solid #1c1917",
                        boxShadow: "2px 2px 0px #1c1917",
                        fontSize: 10,
                        zIndex: 10,
                        width: 220,
                        animation: "scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    >
                      <div style={{ fontWeight: 800, textTransform: "uppercase", marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                        <span>⚠️ ATS CRITICAL CHECK</span>
                        <span>-15pts</span>
                      </div>
                      <div style={{ fontWeight: 500, opacity: 0.9 }}>
                        Lacks measurable metrics, scope of action, and strong action verbs.
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-primary)" }} />
                  <div style={{ height: 6, width: "85%", background: "var(--bg-elevated)", borderRadius: 1 }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 3: AI OPTIMIZE */}
        {currentScene.id === "optimize" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              animation: "fade-in 0.3s ease",
            }}
          >
            <div
              style={{
                flex: 1,
                background: "#fff",
                border: "var(--border-brutal)",
                boxShadow: "var(--shadow-brutal)",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "relative",
              }}
            >
              {/* Floating Score Box in top right */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: subProgress > 0.6 ? "#dcfce7" : "#fff",
                  border: "2px solid #1c1917",
                  boxShadow: "2px 2px 0px #1c1917",
                  padding: "6px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderRadius: "var(--radius-sm)",
                  zIndex: 8,
                  transition: "background 0.3s ease",
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>ATS SCORE</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: subProgress > 0.6 ? "var(--color-success)" : "var(--accent)" }}>
                  {subProgress < 0.6 ? "48%" : "88%"}
                </span>
              </div>

              {/* Header */}
              <div>
                <div style={{ height: 10, width: 120, background: "var(--text-primary)", borderRadius: 1, marginBottom: 4 }} />
                <div style={{ height: 6, width: 180, background: "var(--text-muted)", borderRadius: 1 }} />
              </div>

              {/* Optimized Bullets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-primary)" }} />
                  <div style={{ height: 6, width: "90%", background: "var(--bg-elevated)", borderRadius: 1 }} />
                </div>
                
                {/* AI rewriting box */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 6,
                    padding: "6px 8px",
                    background: subProgress > 0.6 ? "rgba(22, 163, 74, 0.05)" : "rgba(217, 119, 6, 0.05)",
                    border: subProgress > 0.6 ? "1px solid var(--color-success)" : "1px dashed var(--accent)",
                    borderRadius: "var(--radius-sm)",
                    position: "relative",
                    minHeight: 38,
                  }}
                >
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-primary)", marginTop: 6 }} />
                  
                  {subProgress <= 0.6 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: "var(--accent)" }}> Nova AI Optimizing...</div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        Analyzing indexes & impact parameters...
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, animation: "scale-in 0.2s ease" }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: "var(--color-success)" }}>✓ Optimized Statement</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-success)" }}>
                        Optimized database queries and indexing, reducing page latency by 35%.
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-primary)" }} />
                  <div style={{ height: 6, width: "85%", background: "var(--bg-elevated)", borderRadius: 1 }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 4: DOWNLOAD */}
        {currentScene.id === "export" && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              animation: "fade-in 0.3s ease",
            }}
          >
            {subProgress < 0.5 ? (
              /* Downloading Screen */
              <div
                style={{
                  background: "#fff",
                  border: "var(--border-brutal)",
                  boxShadow: "var(--shadow-brutal)",
                  padding: 24,
                  textAlign: "center",
                  width: "80%",
                  maxWidth: 320,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 24 }}>📥</div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>Exporting ATS-Safe PDF...</div>
                
                {/* Simulated Progress bar */}
                <div className="progress-track" style={{ border: "2px solid #1c1917", height: 12, width: "100%" }}>
                  <div className="progress-fill" style={{ width: `${subProgress * 2 * 100}%` }} />
                </div>
              </div>
            ) : (
              /* Success Screen */
              <div
                style={{
                  background: "#fff",
                  border: "2px solid #1c1917",
                  boxShadow: "var(--shadow-brutal-lg)",
                  padding: 24,
                  textAlign: "center",
                  width: "80%",
                  maxWidth: 320,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  animation: "scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#dcfce7",
                    border: "2px solid var(--color-success)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    color: "var(--color-success)",
                    marginBottom: 4,
                  }}
                >
                  ✓
                </div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>Ready to Apply!</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
                  Your resume was compiled into an ATS-safe layout and downloaded successfully.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline Seeker Bar */}
      <div
        style={{
          height: 6,
          background: "var(--bg-elevated)",
          position: "relative",
          cursor: "pointer",
          borderTop: "1px solid var(--border-subtle)",
        }}
        onClick={handleTimelineClick}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            background: "var(--accent)",
            width: `${progress}%`,
          }}
        />
        {/* Small seek handle */}
        <div
          style={{
            position: "absolute",
            left: `${progress}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 12,
            height: 12,
            background: "#fff",
            border: "2px solid #1c1917",
            borderRadius: "50%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {/* Control Bar (Play/Pause, Step Selectors) */}
      <div
        style={{
          background: "var(--bg-surface)",
          borderTop: "var(--border-brutal)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(p => !p)}
          style={{
            background: "#fff",
            border: "2px solid #1c1917",
            boxShadow: "2px 2px 0px #1c1917",
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            outline: "none",
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = "translate(1px, 1px)";
            e.currentTarget.style.boxShadow = "1px 1px 0px #1c1917";
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "2px 2px 0px #1c1917";
          }}
        >
          <span>{isPlaying ? "⏸ Pause" : "▶ Play"}</span>
        </button>

        {/* Step Tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SCENES.map((scene, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={scene.id}
                onClick={() => handleTabClick(idx)}
                style={{
                  background: isActive ? "var(--accent)" : "#fff",
                  color: isActive ? "#fff" : "var(--text-primary)",
                  border: "2px solid #1c1917",
                  boxShadow: isActive ? "none" : "2px 2px 0px #1c1917",
                  transform: isActive ? "translate(1px, 1px)" : "none",
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm)",
                  outline: "none",
                }}
              >
                {scene.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
