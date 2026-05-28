import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE, getAuthToken } from "../utils";
import api from "../lib/api";
import AgentMessage from "./ui/AgentMessage";
import TraceViewer from "./ui/TraceViewer";

const TEAM = [
  { name: "Nova",  role: "Orchestrator",   emoji: "🧠", color: "#f97316" },
  { name: "Maya",  role: "Resume Analyst", emoji: "🔍", color: "var(--color-info)" },
  { name: "Max",   role: "Content Writer", emoji: "✍️",  color: "#7c3aed" },
  { name: "Scout", role: "Job Scout",      emoji: "🎯", color: "var(--color-success)" },
  { name: "Alex",  role: "Career Coach",   emoji: "🧭", color: "var(--color-warning)" },
];

const QUICK_ACTIONS = [
  { label: "Full Resume Review", emoji: "🔍", color: "var(--color-info)",    msg: "Review my resume — do a full analysis with improvements and career advice" },
  { label: "Job Hunt",           emoji: "🎯", color: "var(--color-success)", msg: "Find me matching jobs based on my skills and help me apply" },
  { label: "Interview Prep",     emoji: "🎙️", color: "var(--accent)",        msg: "Prepare me for interviews — find my weak areas and give me practice questions" },
  { label: "Quick Fix",          emoji: "⚡", color: "var(--text-primary)",  msg: "Quick fix my resume — find the top 3 flaws and rewrite them" },
];

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

function parseSSE(chunk) {
  const out = [];
  for (const block of chunk.split("\n\n")) {
    if (!block.trim()) continue;
    let ev = "message", raw = "";
    for (const ln of block.split("\n")) {
      if (ln.startsWith("event: ")) ev = ln.slice(7).trim();
      else if (ln.startsWith("data: ")) raw = ln.slice(6);
    }
    if (!raw) continue;
    try { out.push({ event: ev, data: JSON.parse(raw) }); }
    catch { out.push({ event: ev, data: { raw } }); }
  }
  return out;
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function AgentChat({ onAnalysisRefresh }) {
  const [agents, setAgents]                 = useState(TEAM);
  const [messages, setMessages]             = useState([]);
  const [trace, setTrace]                   = useState([]);
  const [input, setInput]                   = useState("");
  const [streaming, setStreaming]           = useState(false);
  const [loading, setLoading]               = useState(true);
  // Track ALL currently-active agents (Set of names) — enables parallel UI
  const [activeAgentSet, setActiveAgentSet] = useState(new Set());
  const [isParallel, setIsParallel]         = useState(false);
  const [traceOpen, setTraceOpen]           = useState(false);
  const endRef   = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  useEffect(() => {
    Promise.all([
      api.get("/agents/team").then(r => r.data).catch(() => null),
      api.get("/agents/history").then(r => r.data).catch(() => null),
    ]).then(([team, hist]) => {
      if (team?.agents?.length) setAgents(team.agents);
      if (hist?.messages?.length) setMessages(hist.messages);
    }).finally(() => setLoading(false));
  }, []);

  // Update a single agent's status
  const setAgentStatus = useCallback((name, status) => {
    if (!name) return;
    setAgents(prev => prev.map(a =>
      a.name.toLowerCase() === name.toLowerCase() ? { ...a, status } : a
    ));
  }, []);

  // Add an agent to the active set
  const addActive = useCallback((name) => {
    if (!name) return;
    setActiveAgentSet(prev => new Set([...prev, name.toLowerCase()]));
    setAgentStatus(name, "thinking");
  }, [setAgentStatus]);

  // Remove an agent from the active set
  const removeActive = useCallback((name) => {
    if (!name) return;
    setActiveAgentSet(prev => {
      const next = new Set(prev);
      next.delete(name.toLowerCase());
      return next;
    });
    setAgentStatus(name, "standby");
  }, [setAgentStatus]);

  // Reset all agents to standby
  const resetAll = useCallback(() => {
    setAgents(prev => prev.map(a => ({ ...a, status: "standby" })));
    setActiveAgentSet(new Set());
    setIsParallel(false);
  }, []);

  const send = useCallback(async (text) => {
    const body = (text || input).trim();
    if (!body || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { id: `u-${uid()}`, event_type: "user", agent: "you", content: body, timestamp: new Date().toISOString() }]);
    setStreaming(true);
    setTrace([]);
    setIsParallel(false);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API_BASE}/agents/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: body }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() || "";

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          for (const evt of parseSSE(chunk + "\n\n")) {
            const m = {
              id: `e-${uid()}`, event_type: evt.event,
              agent: evt.data.agent || evt.data.from_agent || "system",
              emoji: evt.data.emoji || evt.data.from_emoji || "🤖",
              color: evt.data.color || "var(--accent)",
              content: evt.data.content || "",
              data: evt.data,
              tools_used: evt.data.tools_used || [],
              timestamp: new Date().toISOString(),
            };
            setTrace(p => [...p, m]);

            if (evt.event === "agent_thinking") {
              addActive(evt.data.agent);
              setMessages(p => [...p.filter(x => x.event_type !== "agent_thinking"), m]);

            } else if (evt.event === "agent_handoff") {
              // If parallel flag is set, mark parallel mode — all handoffs fire at once
              if (evt.data.parallel) {
                setIsParallel(true);
                addActive(evt.data.to_agent);
              } else {
                // Sequential: deactivate sender, activate receiver
                if (evt.data.from_agent) removeActive(evt.data.from_agent);
                addActive(evt.data.to_agent);
              }
              setMessages(p => [...p, m]);

            } else if (evt.event === "tool_call") {
              setAgentStatus(evt.data.agent, "tool_executing");

            } else if (evt.event === "tool_result") {
              setAgentStatus(evt.data.agent, "active");
              if (evt.data.tool === "score_resume" && evt.data.success !== false) {
                onAnalysisRefresh && onAnalysisRefresh();
              }

            } else if (evt.event === "agent_message") {
              setAgentStatus(evt.data.agent, "active");
              // In parallel mode we don't remove from activeSet until done
              setMessages(p => [...p.filter(x => x.event_type !== "agent_thinking"), m]);

            } else if (evt.event === "error") {
              setMessages(p => [...p, m]);

            } else if (evt.event === "done") {
              resetAll();
              onAnalysisRefresh && onAnalysisRefresh();
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages(p => [...p, { id: `x-${uid()}`, event_type: "error", agent: "system", content: err.message, data: { error: err.message }, timestamp: new Date().toISOString() }]);
      }
    } finally {
      setStreaming(false);
      resetAll();
      abortRef.current = null;
    }
  }, [input, streaming, addActive, removeActive, setAgentStatus, resetAll, onAnalysisRefresh]);

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const clearHistory = async () => {
    if (!window.confirm("Clear all conversations?")) return;
    try {
      await api.delete("/agents/history");
      setMessages([]);
      setTrace([]);
    } catch (e) {
      console.error(e);
    }
  };

  const empty = !messages.length && !loading && !streaming;
  const activeCount = activeAgentSet.size;
  const liveAgents = agents.filter(a => activeAgentSet.has(a.name.toLowerCase()));

  // Build status label
  let statusLabel;
  if (!streaming) {
    statusLabel = "● Online";
  } else if (isParallel && activeCount >= 2) {
    statusLabel = `⚡ ${activeCount} agents in parallel`;
  } else if (liveAgents.length === 1) {
    statusLabel = `● ${liveAgents[0].emoji} ${liveAgents[0].name}...`;
  } else {
    statusLabel = "● Coordinating...";
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-surface)", overflow: "hidden", height: "100%" }}
    >
      <style>{`
        @keyframes agentPulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes parallelGlow { 0%,100%{box-shadow:2px 2px 0 var(--text-primary)} 50%{box-shadow:2px 2px 0 var(--text-primary), 0 0 12px var(--accent)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes parallelBadgePop { 0%{transform:scale(0) rotate(-10deg)} 70%{transform:scale(1.15) rotate(2deg)} 100%{transform:scale(1) rotate(0)} }
        .ac-input:focus{outline:none} .ac-input{resize:none}
        .ac-chip { transition: all var(--transition-fast); }
        .ac-chip:hover { transform: translate(-1px, -1px); box-shadow: 2px 2px 0 var(--text-primary); }
        .ac-chip-parallel { animation: parallelGlow 1.8s ease-in-out infinite; }
        
        @media (max-width: 600px) {
          .quick-actions-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: "18px 24px", borderBottom: "var(--border-brutal)", background: "#fffdf7", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              background: "var(--accent-light)", border: "var(--border-brutal)", borderRadius: "var(--radius-sm)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "var(--shadow-brutal)", flexShrink: 0,
            }}>🧠</div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--accent-dark)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>Agent Team</p>
              <h2 className="text-2xl font-black text-primary uppercase" style={{ letterSpacing: "-0.03em", fontFamily: "var(--font-display)", lineHeight: 1 }}>
                Nova & Team
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Status pill — glows orange during parallel */}
            <div style={{
              fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
              color: streaming
                ? (isParallel && activeCount >= 2 ? "#f97316" : "var(--color-warning)")
                : "var(--color-success)",
              textTransform: "uppercase", letterSpacing: ".1em",
              padding: "4px 10px", border: "var(--border-brutal)",
              background: streaming && isParallel && activeCount >= 2 ? "#fff7ed" : "var(--bg-surface)",
              boxShadow: streaming && isParallel && activeCount >= 2
                ? "2px 2px 0 var(--text-primary), 0 0 8px #f9731640"
                : "2px 2px 0 var(--text-primary)",
              borderRadius: "var(--radius-sm)",
              transition: "all 0.3s ease",
            }}>{statusLabel}</div>

            <button
              onClick={clearHistory}
              className="btn btn-secondary btn-sm"
              style={{ padding: "6px 12px", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", height: "auto" }}
            >Reset</button>
          </div>
        </div>

        {/* ── Agent chips — multiple can pulse simultaneously ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {agents.map(a => {
            const isActive   = activeAgentSet.has(a.name.toLowerCase());
            const isRunningParallel = isActive && isParallel && activeCount >= 2;
            const live = isActive || a.status === "tool_executing";

            return (
              <span
                key={a.name}
                className={`ac-chip${isRunningParallel ? " ac-chip-parallel" : ""}`}
                style={{
                  fontSize: 11, padding: "4px 10px", fontWeight: 700,
                  background: live ? (isRunningParallel ? "#fff7ed" : "var(--accent-light)") : "#fff",
                  border: "var(--border-brutal)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: live ? "2px 2px 0 var(--text-primary)" : "none",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  transform: live ? "translate(-1px, -1px)" : "none",
                }}
              >
                {a.emoji} {a.name}
                {live && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: isRunningParallel ? "#f97316" : "var(--accent)",
                    animation: "agentPulse 1.5s ease-in-out infinite",
                    marginLeft: 2,
                  }} />
                )}
              </span>
            );
          })}

          {/* ── Parallel badge — appears when ≥2 agents are active ── */}
          {isParallel && activeCount >= 2 && streaming && (
            <span style={{
              fontSize: 10, padding: "4px 8px", fontWeight: 800,
              background: "#f97316", color: "#fff",
              border: "var(--border-brutal)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "2px 2px 0 var(--text-primary)",
              display: "inline-flex", alignItems: "center", gap: 4,
              animation: "parallelBadgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".05em",
            }}>
              ⚡ Parallel
            </span>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 12px", background: "var(--bg-page)" }} className="grid-lines">
        {loading && (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div className="text-sm font-black uppercase tracking-widest animate-pulse" style={{ color: "var(--accent)" }}>Loading session...</div>
          </div>
        )}

        {empty && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32, gap: 24, maxWidth: 580, margin: "0 auto", paddingBottom: 32 }}>
            <div style={{
              width: 72, height: 72,
              background: "var(--accent-light)", border: "var(--border-brutal)", borderRadius: "var(--radius-sm)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, boxShadow: "var(--shadow-brutal-lg)",
            }}>🧠</div>
            <div style={{ textAlign: "center" }}>
              <h2>
                <span style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
                  letterSpacing: "-0.03em", color: "var(--text-primary)",
                  lineHeight: 1.2, marginBottom: 12,
                }}>Meet your </span>
                <span style={{ 
                  display: "inline-block", background: "var(--accent)", color: "#fff", 
                  fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: "700", 
                  padding: "4px 12px", borderRadius: "var(--radius-sm)", border: "var(--border-brutal)",
                  boxShadow: "2px 2px 0 var(--text-primary)",
                  fontSize: "clamp(1.2rem, 3.5vw, 1.8rem)",
                  transform: "translateY(-4px)"
                }}>career team</span><span style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
                  color: "var(--text-primary)",
                }}>.</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
                Five specialized AI agents collaborate in real-time — and run <strong>in parallel</strong> when tasks are independent.
                Ask for a resume review, job recommendations, or mock interviews.
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {agents.map(a => (
                <span key={a.name} style={{
                  fontSize: 11, padding: "4px 10px", fontWeight: 700,
                  background: "var(--bg-surface)", color: "var(--text-primary)", border: "var(--border-brutal)", borderRadius: "var(--radius-sm)",
                  display: "inline-flex", alignItems: "center", gap: 5,
                  boxShadow: "1px 1px 0 var(--text-primary)",
                }}>{a.emoji} {a.name} <span style={{ opacity: .7, fontSize: 10, fontWeight: 500 }}>· {a.role}</span></span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 520, marginTop: 8 }} className="quick-actions-grid">
              {QUICK_ACTIONS.map((w, i) => (
                <button key={i} className="card-premium text-left cursor-pointer" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8, border: "var(--border-brutal)", background: "#fff" }} onClick={() => send(w.msg)}>
                  <div style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--bg-elevated)", border: "var(--border-brutal)", fontSize: 14,
                    boxShadow: "2px 2px 0 var(--text-primary)", borderRadius: "var(--radius-sm)"
                  }}>{w.emoji}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{w.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => <AgentMessage key={m.id} message={m} />)}

        {streaming && messages.length > 0 && !messages.some(m => m.event_type === "agent_thinking") && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", marginBottom: 16,
            background: "var(--bg-elevated)", border: "1px dashed var(--border-muted)", borderRadius: "var(--radius-sm)",
          }}>
            <span style={{ fontSize: 14 }}>🧠</span>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              {isParallel && activeCount >= 2 ? `${activeCount} agents running in parallel` : "Coordinating agents"}
            </span>
            <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: isParallel ? "#f97316" : "var(--accent)", animation: "agentPulse 1.4s ease-in-out infinite", animationDelay: `${i * .2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} style={{ height: 20 }} />
      </div>

      {/* ── Trace ── */}
      {trace.length > 0 && <TraceViewer messages={trace} isOpen={traceOpen} onToggle={() => setTraceOpen(p => !p)} />}

      {/* ── Input ── */}
      <div style={{ padding: "16px 24px", borderTop: "var(--border-brutal)", background: "#fffdf7", flexShrink: 0 }}>
        <div style={{
          display: "flex", gap: 12, alignItems: "flex-end",
          background: "#fff", border: "var(--border-brutal)", borderRadius: "var(--radius-sm)",
          padding: "10px 16px", transition: "all var(--transition-fast)",
        }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "var(--shadow-brutal)"; e.currentTarget.style.transform = "translate(-2px,-2px)"; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--text-primary)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
        >
          <textarea className="ac-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
            placeholder="Ask the team anything (e.g. 'review my resume')..." disabled={streaming} rows={1}
            style={{ flex: 1, background: "none", border: "none", color: "var(--text-primary)", fontSize: 14, fontFamily: "var(--font-sans)", lineHeight: 1.6, maxHeight: 100, overflowY: "auto" }}
          />
          <button onClick={() => send()} disabled={!input.trim() || streaming}
            className="btn btn-primary"
            style={{
              width: 40, height: 40, padding: 0,
              cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              background: input.trim() && !streaming ? "var(--accent)" : "var(--bg-elevated)",
              color: input.trim() && !streaming ? "#fff" : "var(--text-muted)",
              border: "var(--border-brutal)",
              boxShadow: input.trim() && !streaming ? "2px 2px 0 var(--text-primary)" : "none",
              transform: input.trim() && !streaming ? "translate(-1px, -1px)" : "none",
            }}><SendIcon /></button>
        </div>
      </div>
    </div>
  );
}
