import React from "react";

/* ── Client-side content sanitizer ────────────────────────────────────────
   Last-resort defence: strip raw {"tool_call":...} JSON blobs that survive
   the backend filter. Also cleans markdown code fences containing JSON.
──────────────────────────────────────────────────────────────────────────── */
function sanitizeContent(text) {
  if (!text) return "";
  // Remove ```json ... ``` fences that hold tool_call objects
  text = text.replace(/```(?:json)?\s*\n?\{"tool_call"[\s\S]*?\}\s*\n?```/g, "");
  // Remove bare {"tool_call": ...} objects (greedy but bounded)
  text = text.replace(/\{\s*"tool_call"\s*:[\s\S]{0,3000}?\}\s*/g, "");
  // Remove lines that look like raw JSON (start with { end with })
  text = text.replace(/^\s*\{[\s\S]{0,3000}?\}\s*$/gm, "");
  return text.trim();
}
/* ── Lightweight Markdown → React renderer ─────────────────────────────────
   Handles: **bold**, *italic*, `code`, # headings, - / * bullet lists,
   numbered lists, > blockquotes, --- separators, [link](url).
   No external dependencies.
──────────────────────────────────────────────────────────────────────────── */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Heading (# ## ###)
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const sizes = { 1: 18, 2: 16, 3: 14 };
      elements.push(
        <div key={key++} style={{
          fontSize: sizes[level],
          fontWeight: 900,
          color: "#e5e5e5",
          marginBottom: 6,
          marginTop: level === 1 ? 10 : 6,
          letterSpacing: "-0.01em",
          borderBottom: level === 1 ? "1px solid #2a2a2a" : "none",
          paddingBottom: level === 1 ? 6 : 0,
        }}>
          {inlineMarkdown(hMatch[2])}
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<div key={key++} style={{ borderTop: "1px solid #2a2a2a", margin: "10px 0" }} />);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      elements.push(
        <div key={key++} style={{
          borderLeft: "3px solid hsl(24,100%,50%)",
          paddingLeft: 10,
          marginBottom: 6,
          color: "#888",
          fontSize: 13,
          fontStyle: "italic",
        }}>
          {inlineMarkdown(line.slice(1).trim())}
        </div>
      );
      i++;
      continue;
    }

    // Bullet list (- or * or •)
    if (/^[-*•]\s+/.test(line)) {
      const bulletItems = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i])) {
        bulletItems.push(lines[i].replace(/^[-*•]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={key++} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
          {bulletItems.map((item, idx) => (
            <li key={idx} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              marginBottom: 4, fontSize: 13.5, color: "#ddd", lineHeight: 1.6,
            }}>
              <span style={{ color: "hsl(24,100%,50%)", fontWeight: 700, marginTop: 2, flexShrink: 0 }}>▸</span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const numItems = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        numItems.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
          {numItems.map((item, idx) => (
            <li key={idx} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              marginBottom: 4, fontSize: 13.5, color: "#ddd", lineHeight: 1.6,
            }}>
              <span style={{
                color: "hsl(24,100%,50%)", fontWeight: 900, fontFamily: "var(--font-mono)",
                fontSize: 11, minWidth: 20, textAlign: "right", marginTop: 2, flexShrink: 0,
              }}>{idx + 1}.</span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Fenced code block
    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={key++} style={{
          background: "#0d0d0d", border: "1px solid #1f1f1f",
          padding: "10px 14px", fontSize: 11, fontFamily: "var(--font-mono)",
          color: "#10b981", overflowX: "auto", marginBottom: 8,
          lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>
          {codeLines.join("\n")}
        </pre>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} style={{
        fontSize: 13.5, color: "#ddd", lineHeight: 1.7,
        marginBottom: 6, wordBreak: "break-word",
      }}>
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return elements.length > 0 ? elements : <span style={{ color: "#ddd" }}>{text}</span>;
}

/* Inline markdown: **bold**, *italic*, `code`, [link](url) */
function inlineMarkdown(text) {
  if (!text) return null;
  // Split on markdown tokens while preserving them
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#fff", fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} style={{ color: "#ccc" }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} style={{
          background: "#1a1a1a", color: "#10b981", padding: "1px 5px",
          fontFamily: "var(--font-mono)", fontSize: 12, border: "1px solid #2a2a2a",
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
          style={{ color: "hsl(24,100%,50%)", textDecoration: "underline" }}>
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

/* ── Message type styles ────────────────────────────────────────────────── */
const BG = {
  user:           { bg: "hsl(24,100%,50%)", text: "#111",    border: "#000" },
  agent_message:  { bg: "#161616",          text: "#e5e5e5", border: "#222" },
  agent_thinking: { bg: "transparent",      text: "#555",    border: "#1a1a1a" },
  agent_handoff:  { bg: "transparent",      text: "#666",    border: "#1a1a1a" },
  tool_call:      { bg: "#0d0d0d",          text: "#8b5cf6", border: "#1a1a1a" },
  tool_result:    { bg: "#0d0d0d",          text: "#10b981", border: "#1a1a1a" },
  error:          { bg: "#1a0000",          text: "#ef4444", border: "#3b1111" },
};

export default function AgentMessage({ message: m }) {
  const type = m.event_type || "agent_message";
  const s = BG[type] || BG.agent_message;

  // tool_call and tool_result are now hidden from main chat (shown in TraceViewer only)
  if (type === "tool_call" || type === "tool_result") return null;

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
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", marginBottom: 8,
        fontSize: 11, fontFamily: "var(--font-mono)", color: "#444",
        background: "#111", border: "1px solid #1a1a1a",
      }}>
        <span style={{ color: "#333" }}>↳</span>
        <span style={{ color: "#555" }}>{m.data?.from_emoji || "🤖"} {m.data?.from_agent || "Agent"}</span>
        <span style={{ color: "#333" }}>→</span>
        <span style={{ color: "#ec4899", fontWeight: 700 }}>{m.data?.to_emoji || "🤖"} {m.data?.to_agent || "Agent"}</span>
        {m.data?.task && (
          <span style={{ color: "#333", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 4 }}>
            · {m.data.task}
          </span>
        )}
      </div>
    );
  }

  // user message
  if (type === "user") {
    return (
      <div style={{
        padding: "14px 20px", marginBottom: 12,
        background: "var(--primary)", border: "none", borderRadius: "1rem", borderBottomRightRadius: "0.25rem",
        boxShadow: "var(--shadow-soft)", color: "var(--primary-foreground)",
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

  // agent_message — main response with markdown
  const agentColor = m.color || "#f97316";
  return (
    <div style={{
      padding: "18px 22px", marginBottom: 12,
      background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.75rem",
      borderLeft: `4px solid ${agentColor}`,
      boxShadow: "var(--shadow-soft)",
    }}>
      {/* Agent header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{
          width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
          background: agentColor, border: "none", borderRadius: "0.5rem", fontSize: 13, flexShrink: 0,
        }}>{m.emoji || "🤖"}</span>
        <span style={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: agentColor }}>
          {m.agent || "Agent"}
        </span>
        {m.data?.role && (
          <span style={{ fontSize: 10, color: "#444", fontFamily: "var(--font-mono)" }}>
            · {m.data.role}
          </span>
        )}
        {m.tools_used?.length > 0 && (
          <span style={{
            marginLeft: "auto", fontSize: 9, color: "#333", fontFamily: "var(--font-mono)",
            background: "#0d0d0d", padding: "2px 6px", border: "1px solid #1a1a1a",
          }}>
            ⚡ {m.tools_used.length} tool{m.tools_used.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Markdown-rendered content */}
      <div style={{ lineHeight: 1.7 }}>
        {renderMarkdown(sanitizeContent(m.content))}
      </div>
    </div>
  );
}
