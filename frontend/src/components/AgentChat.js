import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE, getAuthToken } from "../utils";
import AgentMessage from "./ui/AgentMessage";
import TraceViewer from "./ui/TraceViewer";

const TEAM = [
  { name: "Nova",  role: "Orchestrator",   emoji: "🧠", color: "#f97316" },
  { name: "Maya",  role: "Resume Analyst", emoji: "🔍", color: "#3b82f6" },
  { name: "Max",   role: "Content Writer", emoji: "✍️",  color: "#8b5cf6" },
  { name: "Scout", role: "Job Scout",      emoji: "🎯", color: "#22c55e" },
  { name: "Alex",  role: "Career Coach",   emoji: "🧭", color: "#f59e0b" },
];

const QUICK_ACTIONS = [
  { label: "Full Resume Review", emoji: "🔍", color: "#2563EB", msg: "Review my resume — do a full analysis with improvements and career advice" },
  { label: "Job Hunt",           emoji: "🎯", color: "#16A34A", msg: "Find me matching jobs based on my skills and help me apply" },
  { label: "Interview Prep",     emoji: "🎙️", color: "hsl(24,100%,50%)", msg: "Prepare me for interviews — find my weak areas and give me practice questions" },
  { label: "Quick Fix",          emoji: "⚡", color: "#111",    msg: "Quick fix my resume — find the top 3 flaws and rewrite them" },
];

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
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
  // Track whether any agent_message was received during this turn
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
              color: evt.data.color || "#f97316",
              content: evt.data.content || "",
              data: evt.data,
              tools_used: evt.data.tools_used || [],
              timestamp: new Date().toISOString(),
            };
            // Always add to trace (debug log)
            setTrace(p => [...p, m]);

            if (evt.event === "agent_thinking") {
              setStatus(evt.data.agent, "thinking");
              // Show thinking indicator in main chat (but only one at a time)
              setMessages(p => [...p.filter(x => x.event_type !== "agent_thinking"), m]);
            } else if (evt.event === "tool_call") {
              // Tool calls go to trace only — not the main chat
              setStatus(evt.data.agent, "tool_executing");
            } else if (evt.event === "tool_result") {
              // Tool results go to trace only — not the main chat
              // Trigger a history refresh if score_resume was run (Maya saved a new analysis)
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
              // Refresh history so Resume Lab + Overview reflect any new analysis
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
  }, [input, streaming, setStatus, resetAll]);

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
      className="brutal-card"
    >
      <style>{`
        @keyframes agentPulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ac-input:focus{outline:none} .ac-input{resize:none}
        .ac-action{transition:all .15s}
        .ac-action:hover{border-color:hsl(24,100%,50%)!important;box-shadow:4px 4px 0 hsl(24,100%,50%,0.4)!important;transform:translate(-2px,-2px)}
        .ac-chip{transition:all .15s}
        .ac-chip:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 #000}
      `}</style>

      {/* header */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid #000", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              background: "hsl(var(--accent-500))", border: "none", borderRadius: "0px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "4px 4px 0 #000", flexShrink: 0,
            }}>🧠</div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "hsl(24,100%,50%)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>Agent Team</p>
              <h2 className="text-2xl font-black text-[#111] uppercase" style={{ letterSpacing: "-0.03em", fontFamily: "var(--font-display)", lineHeight: 1 }}>
                Nova & Team
              </h2>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
              color: streaming ? "#f59e0b" : "#22c55e",
              textTransform: "uppercase", letterSpacing: ".1em",
              padding: "4px 10px", border: `2px solid ${streaming ? "#f59e0b33" : "#22c55e33"}`,
            }}>● {streaming ? (liveAgent ? `${liveAgent.emoji} ${liveAgent.name}...` : "Processing...") : "Online"}</div>
            <button onClick={clearHistory} style={{
              background: "transparent", border: "2px solid #000", color: "#777", cursor: "pointer",
              padding: "6px 14px", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: ".06em", transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#555"; }}
            >Reset</button>
          </div>
        </div>
        {/* agent chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {agents.map(a => {
            const live = a.status === "active" || a.status === "thinking" || a.status === "tool_executing";
            return (
              <span key={a.name} className="ac-chip" style={{
                fontSize: 11, padding: "3px 10px", fontWeight: 700,
                background: live ? `${a.color}20` : "transparent",
                border: `2px solid ${live ? a.color : "#222"}`,
                color: live ? a.color : "#555",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                {a.emoji} {a.name}
                {live && <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, animation: "agentPulse 1.5s ease-in-out infinite", marginLeft: 2 }} />}
              </span>
            );
          })}
        </div>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 0" }}>
        {loading && (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div className="text-sm font-black uppercase tracking-widest animate-pulse" style={{ color: "hsl(24,100%,50%)" }}>Loading session...</div>
          </div>
        )}

        {empty && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 48, gap: 28, maxWidth: 560, margin: "0 auto" }}>
            <div style={{
              width: 80, height: 80,
              background: "hsl(var(--accent-500))", border: "none", borderRadius: "0px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, boxShadow: "6px 6px 0 #000",
            }}>🧠</div>
            <div style={{ textAlign: "center" }}>
              <h2 className="font-black text-3xl text-[#111] uppercase" style={{ letterSpacing: "-0.03em", fontFamily: "var(--font-display)", marginBottom: 8 }}>
                Meet Your Career Team
              </h2>
              <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
                Five specialized agents collaborate to get you placed.
                Upload your resume, describe your target role, and let the team handle the rest.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {agents.map(a => (
                <span key={a.name} style={{
                  fontSize: 12, padding: "4px 12px", fontWeight: 700,
                  background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}30`, borderRadius: "0px",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>{a.emoji} {a.name} <span style={{ opacity: .6, fontSize: 10 }}>· {a.role}</span></span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 480, marginTop: 8 }}>
              {QUICK_ACTIONS.map((w, i) => (
                <button key={i} className="brutal-card p-[18px] text-left cursor-pointer transition-all hover:-translate-y-1 group" onClick={() => send(w.msg)}>
                  <div style={{
                    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    background: w.color, color: w.color === "#111" ? "#fff" : (w.color === "hsl(24,100%,50%)" ? "#111" : "#fff"),
                    border: "2px solid #000", fontSize: 16, marginBottom: 10,
                  }}>{w.emoji}</div>
                  <div className="font-black text-sm uppercase" style={{ letterSpacing: "-0.01em" }}>{w.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => <AgentMessage key={m.id} message={m} />)}

        {streaming && messages.length > 0 && !messages.some(m => m.event_type === "agent_thinking") && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", marginBottom: 16,
            background: "#fff", border: "1px solid #000", borderRadius: "0px",
          }}>
            <span style={{ fontSize: 16 }}>🧠</span>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#777", fontFamily: "var(--font-mono)" }}>Coordinating agents</span>
            <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "hsl(24,100%,50%)", animation: "agentPulse 1.4s ease-in-out infinite", animationDelay: `${i * .2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} style={{ height: 20 }} />
      </div>

      {/* trace */}
      {trace.length > 0 && <TraceViewer messages={trace} isOpen={traceOpen} onToggle={() => setTraceOpen(p => !p)} />}

      {/* input */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid #000", background: "#fff", flexShrink: 0 }}>
        <div style={{
          display: "flex", gap: 12, alignItems: "flex-end",
          background: "#fff", border: "1px solid #000", borderRadius: "0px",
          padding: "12px 16px", transition: "all .15s",
        }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = "hsl(24,100%,50%)"; e.currentTarget.style.boxShadow = "4px 4px 0 hsl(24,100%,50%,0.3)"; e.currentTarget.style.transform = "translate(-2px,-2px)"; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
        >
          <textarea className="ac-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
            placeholder="Ask the team anything..." disabled={streaming} rows={1}
            style={{ flex: 1, background: "none", border: "none", color: "#111", fontSize: 14, fontFamily: "var(--font-sans)", lineHeight: 1.6, maxHeight: 120, overflowY: "auto" }}
          />
          <button onClick={() => send()} disabled={!input.trim() || streaming} style={{
            width: 40, height: 40,
            background: input.trim() && !streaming ? "hsl(24,100%,50%)" : "#222",
            border: "none", borderRadius: "0px",
            cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: input.trim() && !streaming ? "#111" : "#555",
            flexShrink: 0, transition: "all .15s",
            boxShadow: input.trim() && !streaming ? "4px 4px 0 #000" : "none",
          }}><SendIcon /></button>
        </div>
      </div>
    </div>
  );
}
