import React, { useState, useEffect } from "react";

const AGENTS = [
  {
    id: "nova",
    name: "Nova",
    role: "Orchestrator",
    x: 200, y: 50,
    icon: "🧠",
    color: "#f97316",
    logs: [
      "[Nova] Classifying intent: full resume review requested...",
      "[Nova] Strategy: parallel execution — 3 independent agents",
      "[Nova] Dispatching Maya, Max & Alex simultaneously ⚡",
      "[Nova] All agents running in parallel — streaming results...",
    ],
  },
  {
    id: "maya",
    name: "Maya",
    role: "Resume Analyst",
    x: 70, y: 185,
    icon: "🔍",
    color: "#3b82f6",
    logs: [
      "[Maya] Running score_resume tool...",
      "[Maya] ATS Score: 62/100 — below threshold",
      "[Maya] Flagged: weak action verbs in 4 bullets",
      "[Maya] Missing keywords: Docker, CI/CD, Redis",
    ],
  },
  {
    id: "max",
    name: "Max",
    role: "Content Writer",
    x: 200, y: 185,
    icon: "✍️",
    color: "#7c3aed",
    logs: [
      "[Max] Analyzing bullet point structure...",
      "[Max] Rewrote: 'helped build API' → 'Architected REST API serving 50K req/day'",
      "[Max] Rewrote: 'worked on database' → 'Optimized PostgreSQL queries, 40% latency drop'",
      "[Max] Cover letter generated — tailored to JD keywords",
    ],
  },
  {
    id: "alex",
    name: "Alex",
    role: "Career Coach",
    x: 330, y: 185,
    icon: "🧭",
    color: "#f59e0b",
    logs: [
      "[Alex] Analyzing career trajectory & skill gaps...",
      "[Alex] Target role: Senior Backend Engineer",
      "[Alex] Roadmap: Docker → Kubernetes → System Design",
      "[Alex] Interview prep: 8 STAR questions generated",
    ],
  },
];

// Which step triggers parallel mode (all 3 sub-agents active)
const PARALLEL_STEPS = new Set([1, 2, 3]);

export default function AgentShowcase() {
  const [phase, setPhase] = useState("nova");     // "nova" | "parallel" | "done"
  const [logLines, setLogLines] = useState(AGENTS[0].logs);
  const [activeAgents, setActiveAgents] = useState(new Set(["nova"]));
  const [tick, setTick] = useState(0);          // drives log cycling in parallel

  // Phase timeline: nova → parallel (all 3 fire) → done → restart
  useEffect(() => {
    let timeout;

    if (phase === "nova") {
      setActiveAgents(new Set(["nova"]));
      setLogLines(AGENTS[0].logs);
      timeout = setTimeout(() => setPhase("parallel"), 3500);

    } else if (phase === "parallel") {
      setActiveAgents(new Set(["maya", "max", "alex"]));
      setTick(0);
      timeout = setTimeout(() => setPhase("done"), 6000);

    } else if (phase === "done") {
      setActiveAgents(new Set(["nova", "maya", "max", "alex"]));
      setLogLines([
        "[Nova] All 3 agents completed in parallel ✅",
        "[Nova] Maya: ATS 62 → 78 after rewrites",
        "[Nova] Max: 3 bullets rewritten + cover letter",
        "[Nova] Alex: Roadmap + 8 interview questions ready",
      ]);
      timeout = setTimeout(() => setPhase("nova"), 4000);
    }

    return () => clearTimeout(timeout);
  }, [phase]);

  // In parallel phase, cycle logs across all 3 agents
  useEffect(() => {
    if (phase !== "parallel") return;
    const allLogs = [
      ...AGENTS[1].logs.map(l => ({ text: l, agentId: "maya" })),
      ...AGENTS[2].logs.map(l => ({ text: l, agentId: "max" })),
      ...AGENTS[3].logs.map(l => ({ text: l, agentId: "alex" })),
    ];
    // Interleave: maya[0], max[0], alex[0], maya[1], ...
    const interleaved = [];
    for (let i = 0; i < 4; i++) {
      ["maya", "max", "alex"].forEach(id => {
        const agent = AGENTS.find(a => a.id === id);
        if (agent.logs[i]) interleaved.push({ text: agent.logs[i], agentId: id });
      });
    }

    const interval = setInterval(() => {
      setTick(prev => {
        const next = prev + 1;
        const slice = interleaved.slice(Math.max(0, next - 4), next);
        setLogLines(slice.map(l => l.text));
        return next;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [phase]);

  const isParallel = phase === "parallel";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>

      {/* ── Graph Canvas ── */}
      <div
        style={{
          background: "#fffdf9",
          border: "1px solid var(--border-muted)",
          height: 200,
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--radius-sm)",
        }}
        className="grid-lines"
      >
        <svg
          viewBox="0 0 400 250"
          style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 1 }}
        >
          {/* ── Connection lines ── */}
          {[
            { path: "M 200 50 L 70 185", target: "maya" },
            { path: "M 200 50 L 200 185", target: "max" },
            { path: "M 200 50 L 330 185", target: "alex" },
          ].map(({ path, target }) => {
            const active = activeAgents.has(target);
            return (
              <React.Fragment key={target}>
                <path
                  d={path}
                  stroke={active ? (isParallel ? "#f97316" : "var(--accent)") : "var(--border-muted)"}
                  strokeWidth={active ? 2.5 : 1.5}
                  strokeDasharray={active ? "none" : "4 4"}
                  fill="none"
                  style={{ transition: "stroke 0.35s, stroke-width 0.35s" }}
                />
                {/* Animated signal dot — shown for every active agent in parallel */}
                {active && (
                  <circle
                    r="4"
                    fill={isParallel ? "#f97316" : "var(--accent)"}
                    filter={`drop-shadow(0 0 4px ${isParallel ? "#f97316" : "var(--accent)"})`}
                  >
                    <animateMotion
                      dur={isParallel ? "1.1s" : "1.5s"}
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                )}
              </React.Fragment>
            );
          })}

          {/* ── Parallel badge in SVG ── */}
          {isParallel && (
            <g>
              <rect x="145" y="112" width="110" height="20" rx="4"
                fill="#f97316" opacity="0.95" />
              <text x="200" y="126" textAnchor="middle"
                fill="#fff" fontSize="9" fontWeight="800"
                fontFamily="monospace" letterSpacing="0.08em">
                ⚡ PARALLEL EXECUTION
              </text>
            </g>
          )}
        </svg>

        {/* ── Agent nodes ── */}
        {AGENTS.map((agent) => {
          const isActive = activeAgents.has(agent.id);
          const showParallelGlow = isParallel && agent.id !== "nova";

          return (
            <div
              key={agent.id}
              style={{
                position: "absolute",
                left: `${(agent.x / 400) * 100}%`,
                top: `${(agent.y / 250) * 100}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: agent.id === "nova" ? 46 : 38,
                  height: agent.id === "nova" ? 46 : 38,
                  borderRadius: "50%",
                  background: isActive ? agent.color : "#fff",
                  border: `2px solid ${isActive ? agent.color : "#1c1917"}`,
                  boxShadow: showParallelGlow
                    ? `0 0 0 3px ${agent.color}40, 0 0 16px ${agent.color}80`
                    : isActive
                      ? `0 0 12px ${agent.color}60`
                      : "2px 2px 0px #1c1917",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: agent.id === "nova" ? 20 : 15,
                  color: isActive ? "#fff" : "#000",
                  transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: isActive ? "scale(1.12)" : "scale(1)",
                }}
              >
                {agent.icon}
              </div>

              <div
                style={{
                  background: isActive ? agent.color : "#fff",
                  border: `1px solid ${isActive ? agent.color : "#1c1917"}`,
                  boxShadow: "1px 1px 0px #1c1917",
                  padding: "1px 5px",
                  fontSize: 7.5,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  marginTop: 5,
                  borderRadius: 2,
                  color: isActive ? "#fff" : "#000",
                  transition: "all 0.35s",
                }}
              >
                {agent.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Console Log Readout ── */}
      <div
        style={{
          background: "#1c1917",
          border: "1px solid #1c1917",
          padding: "10px 14px",
          fontFamily: "var(--font-mono)",
          color: "#fff",
          fontSize: 10.5,
          minHeight: 110,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflowY: "hidden",
          borderRadius: "var(--radius-sm)",
        }}
      >
        {/* Console header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 6, marginBottom: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isParallel ? (
              // Show 3 colored dots for parallel mode
              <>
                {["maya", "max", "alex"].map(id => {
                  const ag = AGENTS.find(a => a.id === id);
                  return (
                    <span
                      key={id}
                      style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: ag.color,
                        boxShadow: `0 0 6px ${ag.color}`,
                        animation: "agentPulse 1.2s ease-in-out infinite",
                        animationDelay: id === "maya" ? "0s" : id === "max" ? "0.3s" : "0.6s",
                      }}
                    />
                  );
                })}
                <span style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", color: "#f97316" }}>
                  ⚡ 3 Agents Running in Parallel
                </span>
              </>
            ) : (
              <>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: phase === "done" ? "#4ade80" : "#f97316",
                  boxShadow: `0 0 8px ${phase === "done" ? "#4ade80" : "#f97316"}`,
                }} />
                <span style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em", color: "#a8a29e" }}>
                  {phase === "done" ? "All Agents Completed ✅" : "Nova — Orchestrating"}
                </span>
              </>
            )}
          </div>
          <span style={{ fontSize: 9, color: "#a8a29e" }}>
            {isParallel ? "PARALLEL MODE" : "STABLE CONNECTION"}
          </span>
        </div>

        {/* Log lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {logLines.map((log, i) => {
            const isError = log.includes("Error") || log.includes("Flagged") || log.includes("Missing");
            const isSuccess = log.includes("✅") || log.includes("→") || log.includes("ready") || log.includes("generated");
            const isMaya = log.includes("[Maya]");
            const isMax = log.includes("[Max]");
            const isAlex = log.includes("[Alex]");
            let color = "#fff";
            if (isError) color = "#f87171";
            else if (isSuccess) color = "#4ade80";
            else if (isMaya) color = "#60a5fa";
            else if (isMax) color = "#c4b5fd";
            else if (isAlex) color = "#fbbf24";

            return (
              <div
                key={`${phase}-${i}-${log.slice(0, 20)}`}
                style={{
                  opacity: 0,
                  animation: `fade-in 0.2s forwards ${i * 0.15}s`,
                  color,
                }}
              >
                &gt; {log}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes agentPulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes fade-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
