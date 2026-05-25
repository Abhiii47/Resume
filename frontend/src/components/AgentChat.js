import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE, getAuthToken } from "../utils";
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
  { label: "Full Resume Review", emoji: "🔍", color: "var(--color-info)", msg: "Review my resume — do a full analysis with improvements and career advice" },
  { label: "Job Hunt",           emoji: "🎯", color: "var(--color-success)", msg: "Find me matching jobs based on my skills and help me apply" },
  { label: "Interview Prep",     emoji: "🎙️", color: "var(--accent)", msg: "Prepare me for interviews — find my weak areas and give me practice questions" },
  { label: "Quick Fix",          emoji: "⚡", color: "var(--text-primary)",    msg: "Quick fix my resume — find the top 3 flaws and rewrite them" },
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
  const [agents, setAgents]           = useState(TEAM);
  const [messages, setMessages]       = useState([]);
  const [trace, setTrace]             = useState([]);
  const [input, setInput]             = useState("");
  const [streaming, setStreaming]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [activeAgent, setActiveAgent] = useState(null);
  const [traceOpen, setTraceOpen]     = useState(false);
  const endRef   = useRef(null);
  const abortRef = useRef(null);
  const hadAgentMessageRef = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  useEffect(() => {
    const hdrs = { Authorization: `Bearer ${getAuthToken()}` };
    Promise.all([
      fetch(`${API_BASE}/agents/team`,    { headers: hdrs }).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/agents/history`,  { headers: hdrs }).then(r => r.json()).catch(() => null),
    ]).then(([team, hist]) => {
      if (team?.agents?.length) setAgents(team.agents);
      if (hist?.messages?.length) setMessages(hist.messages);
    }).finally(() => setLoading(false));
  }, []);

  const setStatus = useCallback((name, status) => {
    setAgents(prev => prev.map(a => a.name.toLowerCase() === name?.toLowerCase() ? { ...a, status } : a));
    if (status === "active" || status === "thinking") setActiveAgent(name);
  }, []);

  const resetAll = useCallback(() => {
    setAgents(prev => prev.map(a => ({ ...a, status: "standby" })));
    setActiveAgent(null);
  }, []);

  const send = useCallback(async (text) => {
    const body = (text || input).trim();
    if (!body || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { id: `u-${uid()}`, event_type: "user", agent: "you", content: body, timestamp: new Date().toISOString() }]);
    setStreaming(true);
    setTrace([]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    hadAgentMessageRef.current = false;

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
              setStatus(evt.data.agent, "thinking");
              setMessages(p => [...p.filter(x => x.event_type !== "agent_thinking"), m]);
            } else if (evt.event === "tool_call") {
              setStatus(evt.data.agent, "tool_executing");
            } else if (evt.event === "tool_result") {
              if (evt.data.tool === "score_resume" && evt.data.success !== false) {
                onAnalysisRefresh && onAnalysisRefresh();
              }
            } else if (evt.event === "agent_message") {
              setStatus(evt.data.agent, "active");
              hadAgentMessageRef.current = true;
              setMessages(p => [...p.filter(x => x.event_type !== "agent_thinking"), m]);
            } else if (evt.event === "agent_handoff") {
              setStatus(evt.data.to_agent, "thinking");
              if (evt.data.from_agent) setStatus(evt.data.from_agent, "standby");
              setMessages(p => [...p, m]);
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
  }, [input, streaming, setStatus, resetAll, onAnalysisRefresh]);

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const clearHistory = async () => {
    if (!window.confirm("Clear all conversations?")) return;
    try {
      await fetch(`${API_BASE}/agents/history`, { method: "DELETE", headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setMessages([]);
      setTrace([]);
    } catch (e) {
      console.error(e);
    }
  };

  const empty = !messages.length && !loading && !streaming;
  const liveAgent = agents.find(a => a.name?.toLowerCase() === activeAgent?.toLowerCase());

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-surface)", overflow: "hidden", height: "100%" }}
    >
      <style>{`
        @keyframes agentPulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ac-input:focus{outline:none} .ac-input{resize:none}
        .ac-chip { transition: all var(--transition-fast); }
        .ac-chip:hover { transform: translate(-1px, -1px); box-shadow: 2px 2px 0 var(--text-primary); }
        
        @media (max-width: 600px) {
          .quick-actions-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* header */}
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
            <div style={{
              fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
              color: streaming ? "var(--color-warning)" : "var(--color-success)",
              textTransform: "uppercase", letterSpacing: ".1em",
              padding: "4px 10px", border: "var(--border-brutal)",
              background: "var(--bg-surface)", boxShadow: "2px 2px 0 var(--text-primary)",
              borderRadius: "var(--radius-sm)",
            }}>● {streaming ? (liveAgent ? `${liveAgent.emoji} ${liveAgent.name}...` : "Processing...") : "Online"}</div>
            <button 
              onClick={clearHistory} 
              className="btn btn-secondary btn-sm"
              style={{
                padding: "6px 12px", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: ".06em", height: "auto"
              }}
            >Reset</button>
          </div>
        </div>
        {/* agent chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {agents.map(a => {
            const live = a.status === "active" || a.status === "thinking" || a.status === "tool_executing";
            return (
              <span key={a.name} className="ac-chip" style={{
                fontSize: 11, padding: "4px 10px", fontWeight: 700,
                background: live ? "var(--accent-light)" : "#fff",
                border: "var(--border-brutal)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-sm)",
                boxShadow: live ? "2px 2px 0 var(--text-primary)" : "none",
                display: "inline-flex", alignItems: "center", gap: 6,
                transform: live ? "translate(-1px, -1px)" : "none",
              }}>
                {a.emoji} {a.name}
                {live && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "agentPulse 1.5s ease-in-out infinite", marginLeft: 2 }} />}
              </span>
            );
          })}
        </div>
      </div>

      {/* messages */}
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
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
                letterSpacing: "-0.03em", color: "var(--text-primary)",
                lineHeight: 1.2, marginBottom: 12,
              }}>
                Meet your <span className="highlight-accent rotate-left-1" style={{ display: "inline-block", color: "#fff", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600", padding: "2px 8px" }}>career team</span>.
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
                Five specialized AI agents collaborate in real-time to get you placed.
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
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>Coordinating agents</span>
            <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)", animation: "agentPulse 1.4s ease-in-out infinite", animationDelay: `${i * .2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} style={{ height: 20 }} />
      </div>

      {/* trace */}
      {trace.length > 0 && <TraceViewer messages={trace} isOpen={traceOpen} onToggle={() => setTraceOpen(p => !p)} />}

      {/* input */}
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
