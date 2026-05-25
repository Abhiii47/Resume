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
          color: "var(--text-primary)",
          marginBottom: 8,
          marginTop: level === 1 ? 14 : 10,
          letterSpacing: "-0.01em",
          borderBottom: level === 1 ? "2px solid var(--border-muted)" : "none",
          paddingBottom: level === 1 ? 4 : 0,
        }}>
          {inlineMarkdown(hMatch[2])}
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<div key={key++} style={{ borderTop: "2px solid var(--border-muted)", margin: "14px 0" }} />);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      elements.push(
        <div key={key++} style={{
          borderLeft: "3px solid var(--accent)",
          paddingLeft: 12,
          marginBottom: 8,
          color: "var(--text-secondary)",
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
        <ul key={key++} style={{ margin: "8px 0", paddingLeft: 0, listStyle: "none" }}>
          {bulletItems.map((item, idx) => (
            <li key={idx} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              marginBottom: 5, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65,
            }}>
              <span style={{ color: "var(--accent)", fontWeight: 700, marginTop: 2, flexShrink: 0 }}>▸</span>
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
        <ol key={key++} style={{ margin: "8px 0", paddingLeft: 0, listStyle: "none" }}>
          {numItems.map((item, idx) => (
            <li key={idx} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              marginBottom: 5, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65,
            }}>
              <span style={{
                color: "var(--accent)", fontWeight: 800, fontFamily: "var(--font-mono)",
                fontSize: 11, minWidth: 18, textAlign: "right", marginTop: 2, flexShrink: 0,
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
          background: "var(--bg-elevated)", border: "var(--border-brutal)",
          borderRadius: "var(--radius-sm)",
          padding: "12px 16px", fontSize: 12, fontFamily: "var(--font-mono)",
          color: "var(--text-primary)", overflowX: "auto", marginBottom: 12,
          lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all",
          boxShadow: "2px 2px 0 var(--text-primary)",
        }}>
          {codeLines.join("\n")}
        </pre>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} style={{
        fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7,
        marginBottom: 8, wordBreak: "break-word",
      }}>
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return elements.length > 0 ? elements : <span style={{ color: "var(--text-secondary)" }}>{text}</span>;
}

/* Inline markdown: **bold**, *italic*, `code`, [link](url) */
function inlineMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} style={{ color: "var(--text-secondary)" }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} style={{
          background: "var(--bg-elevated)", color: "var(--accent-dark)", padding: "2px 6px",
          fontFamily: "var(--font-mono)", fontSize: 12, border: "1px solid var(--border-muted)",
          borderRadius: "var(--radius-sm)",
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const url = encodeURI(linkMatch[2]);
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: "var(--accent-dark)", fontWeight: 700, textDecoration: "underline" }}>
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

export default function AgentMessage({ message: m }) {
  const type = m.event_type || "agent_message";

  // tool_call and tool_result are now hidden from main chat (shown in TraceViewer only)
  if (type === "tool_call" || type === "tool_result") return null;

  // thinking — minimal indicator
  if (type === "agent_thinking") {
    return (
      <div style={{ 
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", marginBottom: 12, 
        color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-mono)",
        background: "var(--bg-elevated)", border: "1px dashed var(--border-muted)",
        borderRadius: "var(--radius-sm)"
      }}>
        <span>{m.emoji || "🧠"}</span>
        <span style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.agent || "Agent"}</span>
        <span style={{ opacity: .8 }}>thinking</span>
        <div style={{ display: "flex", gap: 3 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)", animation: "agentPulse 1.4s ease-in-out infinite", animationDelay: `${i * .2}s` }} />)}
        </div>
      </div>
    );
  }

  // handoff — inline transition
  if (type === "agent_handoff") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", marginBottom: 12,
        fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)",
        background: "var(--bg-elevated)", border: "var(--border-brutal)", borderRadius: "var(--radius-sm)",
        boxShadow: "2px 2px 0 var(--text-primary)",
      }}>
        <span style={{ color: "var(--text-muted)" }}>↳</span>
        <span style={{ fontWeight: 700 }}>{m.data?.from_emoji || "🤖"} {m.data?.from_agent || "Agent"}</span>
        <span style={{ color: "var(--text-muted)" }}>→</span>
        <span style={{ color: "var(--accent-dark)", fontWeight: 800 }}>{m.data?.to_emoji || "🤖"} {m.data?.to_agent || "Agent"}</span>
        {m.data?.task && (
          <span style={{ color: "var(--text-muted)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 4 }}>
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
        background: "var(--accent-light)", border: "var(--border-brutal)", borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-brutal)", color: "var(--text-primary)",
        alignSelf: "flex-end", maxWidth: "80%", marginLeft: "auto",
      }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {m.content}
        </p>
      </div>
    );
  }

  // error
  if (type === "error") {
    return (
      <div style={{ 
        padding: "12px 18px", marginBottom: 12, 
        background: "rgba(220, 38, 38, 0.06)", border: "2px solid var(--color-error)", 
        color: "var(--color-error)", fontSize: 12.5, fontFamily: "var(--font-mono)",
        borderRadius: "var(--radius-sm)", boxShadow: "2px 2px 0 var(--text-primary)"
      }}>
        <span style={{ fontWeight: 800 }}>Error:</span> {m.data?.error || m.content || "Something went wrong"}
      </div>
    );
  }

  // agent_message — main response with markdown
  const agentColor = m.color || "var(--accent)";
  return (
    <div style={{
      padding: "20px 24px", marginBottom: 16,
      background: "var(--bg-surface)", border: "var(--border-brutal)", borderRadius: "var(--radius-sm)",
      borderLeft: `5px solid ${agentColor}`,
      boxShadow: "var(--shadow-brutal)",
    }}>
      {/* Agent header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, borderBottom: "1px dashed var(--border-muted)", paddingBottom: 10 }}>
        <div style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          background: agentColor, border: "var(--border-brutal)", borderRadius: "var(--radius-sm)", fontSize: 14, flexShrink: 0,
          boxShadow: "2px 2px 0 var(--text-primary)",
        }}>{m.emoji || "🤖"}</div>
        <span style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-primary)" }}>
          {m.agent || "Agent"}
        </span>
        {m.data?.role && (
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
            · {m.data.role}
          </span>
        )}
        {m.tools_used?.length > 0 && (
          <span style={{
            marginLeft: "auto", fontSize: 10, color: "var(--text-primary)", fontFamily: "var(--font-mono)",
            background: "var(--accent-light)", padding: "2px 8px", border: "var(--border-brutal)",
            boxShadow: "1px 1px 0 var(--text-primary)", fontWeight: 700, borderRadius: "var(--radius-sm)"
          }}>
            ⚡ {m.tools_used.length} tool{m.tools_used.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Markdown-rendered content */}
      <div style={{ lineHeight: 1.75 }}>
        {renderMarkdown(sanitizeContent(m.content))}
      </div>
    </div>
  );
}
