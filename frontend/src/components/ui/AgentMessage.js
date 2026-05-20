import React from "react";

const BG = {
  user:           { bg: "hsl(24,100%,50%)", text: "#111",    border: "#000" },
  agent_message:  { bg: "#161616",          text: "#e5e5e5", border: "#222" },
  agent_thinking: { bg: "transparent",      text: "#555",    border: "#1a1a1a" },
  agent_handoff:  { bg: "transparent",      text: "#666",    border: "#1a1a1a" },
  tool_call:      { bg: "#0d0d0d",          text: "#8b5cf6", border: "#1a1a1a" },
  tool_result:    { bg: "#0d0d0d",          text: "#10b981", border: "#1a1a1a" },
  error:          { bg: "#1a0000",          text: "#ef4444", border: "#3b1111" },
};

function ToolCallBadge({ data }) {
  if (!data?.tool) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 16px", background: "#111", border: "1px solid #1f1f1f",
      fontFamily: "var(--font-mono)", fontSize: 11, color: "#888",
    }}>
      <span style={{ color: "#8b5cf6", fontWeight: 700 }}>⚡ {data.tool}</span>
      {data.arguments && (
        <span style={{ color: "#444", fontSize: 10, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {typeof data.arguments === "string" ? data.arguments : JSON.stringify(data.arguments).slice(0, 80)}
        </span>
      )}
    </div>
  );
}

function ToolResultBadge({ data }) {
  if (!data) return null;
  const ok = data.success !== false;
  return (
    <div style={{
      padding: "10px 16px", background: "#111", border: "1px solid #1f1f1f",
      fontFamily: "var(--font-mono)", fontSize: 11,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ color: ok ? "#10b981" : "#ef4444", fontWeight: 700 }}>{ok ? "✓" : "✗"} {data.tool || "tool"}</span>
        <span style={{ color: "#333", fontSize: 10 }}>· result</span>
      </div>
      {data.result && (
        <div style={{
          color: "#666", fontSize: 10, lineHeight: 1.6,
          maxHeight: 80, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {typeof data.result === "string" ? data.result.slice(0, 400) : JSON.stringify(data.result, null, 2).slice(0, 400)}
        </div>
      )}
    </div>
  );
}

export default function AgentMessage({ message: m }) {
  const type = m.event_type || "agent_message";
  const s = BG[type] || BG.agent_message;

  // thinking — minimal indicator
  if (type === "agent_thinking") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", marginBottom: 4, color: "#444", fontSize: 12, fontFamily: "var(--font-mono)" }}>
        <span>{m.emoji || "🧠"}</span>
        <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.agent || "Agent"}</span>
        <span style={{ opacity: .6 }}>thinking</span>
        <div style={{ display: "flex", gap: 3 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "hsl(24,100%,50%)", animation: "agentPulse 1.4s ease-in-out infinite", animationDelay: `${i * .2}s` }} />)}
        </div>
      </div>
    );
  }

  // handoff — inline transition
  if (type === "agent_handoff") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", marginBottom: 4, fontSize: 11, fontFamily: "var(--font-mono)", color: "#444" }}>
        <span>↳</span>
        <span style={{ color: m.data?.from_agent ? "#666" : "#444" }}>{m.data?.from_emoji || "🤖"} {m.data?.from_agent || "Agent"}</span>
        <span>→</span>
        <span style={{ color: m.data?.to_agent ? "#ec4899" : "#444", fontWeight: 700 }}>{m.data?.to_emoji || "🤖"} {m.data?.to_agent || "Agent"}</span>
      </div>
    );
  }

  // tool call/result — compact
  if (type === "tool_call") return <div style={{ marginBottom: 6 }}><ToolCallBadge data={m.data} /></div>;
  if (type === "tool_result") return <div style={{ marginBottom: 6 }}><ToolResultBadge data={m.data} /></div>;

  // user message
  if (type === "user") {
    return (
      <div style={{
        padding: "14px 20px", marginBottom: 12,
        background: "hsl(24,100%,50%)", border: "2px solid #000",
        boxShadow: "4px 4px 0 #b34500", color: "#111",
        alignSelf: "flex-end", maxWidth: "85%", marginLeft: "auto",
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {m.content}
        </p>
      </div>
    );
  }

  // error
  if (type === "error") {
    return (
      <div style={{ padding: "12px 18px", marginBottom: 12, background: s.bg, border: `2px solid ${s.border}`, color: s.text, fontSize: 12, fontFamily: "var(--font-mono)" }}>
        <span style={{ fontWeight: 700 }}>Error:</span> {m.data?.error || m.content || "Something went wrong"}
      </div>
    );
  }

  // agent_message — main response
  const agentColor = m.color || "#f97316";
  return (
    <div style={{
      padding: "18px 22px", marginBottom: 12,
      background: "#161616", border: "2px solid #222",
      borderLeft: `4px solid ${agentColor}`,
      boxShadow: "4px 4px 0 #000",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
          background: agentColor, border: "2px solid #000", fontSize: 13, flexShrink: 0,
        }}>{m.emoji || "🤖"}</span>
        <span className="font-black text-xs uppercase" style={{ color: agentColor, letterSpacing: ".04em" }}>
          {m.agent || "Agent"}
        </span>
        {m.tools_used?.length > 0 && (
          <span style={{ fontSize: 9, color: "#444", fontFamily: "var(--font-mono)" }}>
            · {m.tools_used.length} tool{m.tools_used.length > 1 ? "s" : ""} used
          </span>
        )}
      </div>
      <div style={{
        fontSize: 14, color: "#ddd", lineHeight: 1.7,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {m.content}
      </div>
    </div>
  );
}
