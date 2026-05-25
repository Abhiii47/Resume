import React, { useMemo } from "react";

const EVT = {
  agent_message:  { bg: "var(--accent-glow)", text: "var(--accent-dark)", label: "MSG" },
  agent_thinking: { bg: "var(--bg-page)", text: "var(--text-secondary)",    label: "THINK" },
  tool_call:      { bg: "rgba(124, 58, 237, 0.08)",  text: "#7c3aed", label: "TOOL→" },
  tool_result:    { bg: "rgba(22, 163, 74, 0.08)",  text: "var(--color-success)", label: "←TOOL" },
  agent_handoff:  { bg: "rgba(219, 39, 119, 0.08)",  text: "#db2777", label: "HAND" },
  error:          { bg: "rgba(220, 38, 38, 0.08)",   text: "var(--color-error)", label: "ERR" },
  user:           { bg: "var(--accent-glow)",  text: "var(--accent-dark)", label: "USER" },
  done:           { bg: "rgba(22, 163, 74, 0.08)",   text: "var(--color-success)", label: "DONE" },
};

function summary(msg) {
  const t = msg.event_type || "agent_message";
  if (t === "user")           return msg.content?.substring(0, 60) || "User message";
  if (t === "agent_message")  return msg.content?.substring(0, 60) || "Agent response";
  if (t === "agent_thinking") return `Step ${msg.data?.iteration || "…"}`;
  if (t === "tool_call")      return msg.data?.tool || "tool";
  if (t === "tool_result")    return `${msg.data?.tool || "tool"} → ${msg.data?.success ? "OK" : "ERR"}`;
  if (t === "agent_handoff")  return `${msg.data?.from_agent || "?"} → ${msg.data?.to_agent || "?"}`;
  if (t === "error")          return msg.data?.error?.substring(0, 50) || "Error";
  return t;
}

export default function TraceViewer({ messages, isOpen, onToggle }) {
  const stats = useMemo(() => {
    const seen = new Set();
    let tools = 0, t0 = null, t1 = null;
    messages.forEach(m => {
      if (m.agent) seen.add(m.agent);
      if (m.event_type === "tool_call") tools++;
      const ts = m.timestamp || m.created_at;
      if (ts) { const d = new Date(ts); if (!t0 || d < t0) t0 = d; if (!t1 || d > t1) t1 = d; }
    });
    return { agents: seen.size, tools, elapsed: t0 && t1 ? Math.max(1, Math.round((t1 - t0) / 1000)) : null };
  }, [messages]);

  return (
    <div style={{ borderTop: "var(--border-brutal)", background: "var(--bg-elevated)", flexShrink: 0 }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 24px",
        background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)",
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        letterSpacing: ".06em", textTransform: "uppercase",
      }}>
        <span style={{ color: "var(--accent)" }}>{isOpen ? "▾" : "▸"}</span>
        <span>Trace Log</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16, color: "var(--text-secondary)" }}>
          <span>🤖 {stats.agents}</span>
          <span>⚡ {stats.tools} tools</span>
          {stats.elapsed && <span>⏱ {stats.elapsed}s</span>}
        </div>
      </button>

      {isOpen && (
        <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 24px 16px", background: "var(--bg-surface)", borderTop: "1px dashed var(--border-muted)" }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: 16, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>No events yet</div>
          ) : messages.map((msg, i) => {
            const type = msg.event_type || "agent_message";
            const e = EVT[type] || EVT.agent_message;
            const ts = msg.timestamp || msg.created_at;
            const time = ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
            return (
              <div key={msg.id || i} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                borderBottom: "1px dashed var(--border-muted)",
                fontFamily: "var(--font-mono)", fontSize: 11,
              }}>
                <span style={{ color: "var(--text-muted)", width: 70, flexShrink: 0 }}>{time}</span>
                <span style={{ 
                  background: e.bg, color: e.text, padding: "2px 6px", fontSize: 9, 
                  letterSpacing: ".08em", fontWeight: 700, width: 50, textAlign: "center", 
                  flexShrink: 0, border: "1px solid rgba(28,25,23,0.15)", borderRadius: "var(--radius-sm)" 
                }}>{e.label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700, width: 68, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {msg.emoji || "🤖"} {msg.agent || "you"}
                </span>
                <span style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {summary(msg)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
