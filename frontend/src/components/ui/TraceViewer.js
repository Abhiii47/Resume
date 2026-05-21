import React, { useMemo, } from "react";

const EVT = {
  agent_message:  { bg: "rgba(249,115,22,.12)", text: "#f97316", label: "MSG" },
  agent_thinking: { bg: "rgba(255,255,255,.05)", text: "#888",    label: "THINK" },
  tool_call:      { bg: "rgba(139,92,246,.12)",  text: "#8b5cf6", label: "TOOL→" },
  tool_result:    { bg: "rgba(16,185,129,.12)",  text: "#10b981", label: "←TOOL" },
  agent_handoff:  { bg: "rgba(236,72,153,.12)",  text: "#ec4899", label: "HAND" },
  error:          { bg: "rgba(239,68,68,.12)",   text: "#ef4444", label: "ERR" },
  user:           { bg: "rgba(249,115,22,.08)",  text: "#f97316", label: "USER" },
  done:           { bg: "rgba(16,185,129,.08)",  text: "#10b981", label: "DONE" },
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
    <div style={{ borderTop: "2px solid #1f1f1f", background: "#111", flexShrink: 0 }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 28px",
        background: "none", border: "none", cursor: "pointer", color: "#555",
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        letterSpacing: ".06em", textTransform: "uppercase",
      }}>
        <span style={{ color: "hsl(24,100%,50%)" }}>{isOpen ? "▾" : "▸"}</span>
        <span>Trace Log</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          <span>🤖 {stats.agents}</span>
          <span>⚡ {stats.tools} tools</span>
          {stats.elapsed && <span>⏱ {stats.elapsed}s</span>}
        </div>
      </button>

      {isOpen && (
        <div style={{ maxHeight: 300, overflowY: "auto", padding: "4px 20px 12px" }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: 16, fontFamily: "var(--font-mono)", fontSize: 11, color: "#333" }}>No events yet</div>
          ) : messages.map((msg, i) => {
            const type = msg.event_type || "agent_message";
            const e = EVT[type] || EVT.agent_message;
            const ts = msg.timestamp || msg.created_at;
            const time = ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
            return (
              <div key={msg.id || i} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                borderBottom: "1px solid #1a1a1a",
                fontFamily: "var(--font-mono)", fontSize: 10,
              }}>
                <span style={{ color: "#333", width: 58, flexShrink: 0 }}>{time}</span>
                <span style={{ background: e.bg, color: e.text, padding: "1px 6px", fontSize: 9, letterSpacing: ".08em", fontWeight: 700, width: 44, textAlign: "center", flexShrink: 0 }}>{e.label}</span>
                <span style={{ color: "#555", width: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{msg.emoji || ""} {msg.agent || "you"}</span>
                <span style={{ color: "#444", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary(msg)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
