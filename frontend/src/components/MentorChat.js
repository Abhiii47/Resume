import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../lib/api";

// ── Icons ──────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const BrainIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2"/>
  </svg>
);
const ZapIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

// ── Tool label map ─────────────────────────────────────────────────────────────
const TOOL_LABELS = {
  get_user_status:       "📊 status check",
  analyze_resume_gaps:   "📄 resume scan",
  rewrite_bullet:        "✏️ bullet rewrite",
  generate_cover_letter: "✉️ cover letter",
  add_job_application:   "💼 job tracked",
  generate_roadmap:      "🗺️ roadmap built",
};

// ── Suggestion chips ───────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { label: "How am I doing overall?",         icon: "📊", color: "#3b82f6" },
  { label: "What should I work on today?",    icon: "🎯", color: "hsl(24,100%,50%)" },
  { label: "What's weak in my resume?",       icon: "📄", color: "#ef4444" },
  { label: "Make me a plan for Google SDE",   icon: "🗺️", color: "#22c55e" },
  { label: "Write a cover letter for Amazon", icon: "✉️", color: "#8b5cf6" },
];

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-5" style={{ animation: "mcFadeIn 0.2s ease-out" }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,35%))",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: "0 0 16px rgba(255,102,0,0.35)",
      }}>
        <BrainIcon size={16} />
      </div>
      <div style={{
        padding: "12px 18px",
        background: "#161616",
        border: "1.5px solid #2a2a2a",
        borderRadius: "4px 16px 16px 16px",
        display: "flex", gap: 5, alignItems: "center",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "hsl(24,100%,50%)",
            animation: "mcDotPulse 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
          }}/>
        ))}
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isAlex = msg.role === "assistant";
  const time = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "now";

  return (
    <div style={{
      display: "flex",
      flexDirection: isAlex ? "row" : "row-reverse",
      alignItems: "flex-end",
      gap: 10,
      marginBottom: 24,
      animation: "mcFadeIn 0.25s ease-out",
    }}>
      {/* Avatar */}
      {isAlex ? (
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,35%))",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 0 16px rgba(255,102,0,0.3)",
        }}>
          <BrainIcon size={16} />
        </div>
      ) : (
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "#1e1e1e",
          border: "1.5px solid #333",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 14,
        }}>
          👤
        </div>
      )}

      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column",
                    gap: 5, alignItems: isAlex ? "flex-start" : "flex-end" }}>

        {/* Tool badges */}
        {isAlex && msg.tools_used && msg.tools_used.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 2 }}>
            {msg.tools_used.map((tool, i) => (
              <span key={i} style={{
                fontSize: 10, fontFamily: "monospace",
                background: "rgba(255,102,0,0.12)",
                color: "hsl(24,100%,60%)",
                border: "1px solid rgba(255,102,0,0.25)",
                padding: "2px 8px", borderRadius: 20,
                display: "flex", alignItems: "center", gap: 3,
                letterSpacing: "0.02em",
              }}>
                <ZapIcon /> {TOOL_LABELS[tool] || tool}
              </span>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div style={{
          padding: "13px 17px",
          background: isAlex
            ? "#161616"
            : "linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,42%))",
          color: isAlex ? "#e8e8e8" : "#fff",
          border: isAlex ? "1.5px solid #2a2a2a" : "none",
          borderRadius: isAlex ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          fontSize: 14, lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          boxShadow: isAlex
            ? "0 2px 16px rgba(0,0,0,0.35)"
            : "0 4px 20px rgba(255,102,0,0.25)",
        }}>
          {msg.content}
        </div>

        {/* Timestamp + sender */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 10, color: "#444",
          fontFamily: "monospace",
        }}>
          {isAlex && <span style={{ color: "hsl(24,100%,50%)", fontWeight: "bold" }}>ALEX</span>}
          <span>·</span>
          <span>{time}</span>
          {!isAlex && <span style={{ color: "#555", fontWeight: "bold" }}>YOU</span>}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ onSend }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100%", padding: "40px 24px",
      gap: 32,
    }}>
      {/* Glowing orb */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", inset: -20,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,102,0,0.15) 0%, transparent 70%)",
          animation: "mcGlow 3s ease-in-out infinite",
        }} />
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,30%))",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 40px rgba(255,102,0,0.4), 0 0 80px rgba(255,102,0,0.1)",
          position: "relative",
        }}>
          <BrainIcon size={36} />
        </div>
        {/* Orbiting dot */}
        <div style={{
          position: "absolute", top: -4, right: -4,
          width: 16, height: 16, borderRadius: "50%",
          background: "#22c55e",
          border: "2px solid #0d0d0d",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "mcDotPulse 2s infinite" }} />
        </div>
      </div>

      {/* Headline */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{
          fontWeight: 900, fontSize: 22,
          textTransform: "uppercase", letterSpacing: "-0.02em",
          marginBottom: 8, color: "#fff",
        }}>
          Ask Alex anything
        </h2>
        <p style={{ color: "#555", fontSize: 13, maxWidth: 360, lineHeight: 1.6 }}>
          Your personal career co-pilot. Knows your resume, DSA streak, and job pipeline.
        </p>
      </div>

      {/* Suggestion chips */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        width: "100%",
        maxWidth: 520,
      }}>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSend(s.label)}
            style={{
              padding: "11px 14px",
              background: "#111",
              border: "1.5px solid #222",
              color: "#ccc",
              fontSize: 12, fontFamily: "inherit",
              cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.18s",
              borderRadius: 0,
              gridColumn: i === 4 ? "1 / -1" : undefined,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.color;
              e.currentTarget.style.background = `${s.color}0d`;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#222";
              e.currentTarget.style.background = "#111";
              e.currentTarget.style.color = "#ccc";
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Hint line */}
      <p style={{ fontSize: 11, fontFamily: "monospace", color: "#333", letterSpacing: "0.05em" }}>
        ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MentorChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/mentor/history");
        const hist = res.data.messages || [];
        if (hist.length > 0) {
          setMessages(hist);
          setIsLoadingHistory(false);
        } else {
          setIsLoadingHistory(false);
          await triggerInit();
        }
      } catch {
        setIsLoadingHistory(false);
      }
    })();
  }, []);

  const triggerInit = useCallback(async () => {
    setIsThinking(true);
    try {
      const res = await api.post("/mentor/chat", { is_init: true });
      setMessages([{
        id: Date.now(), role: "assistant",
        content: res.data.response,
        tools_used: res.data.tools_used || [],
        created_at: new Date().toISOString(),
      }]);
    } catch {
      setMessages([{
        id: Date.now(), role: "assistant",
        content: "Hey — I'm Alex, your career co-pilot. I'm having a brief connection issue. Try refreshing, or just send me a message.",
        tools_used: [], created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsThinking(false);
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || isThinking) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = {
      id: Date.now(), role: "user", content: msg,
      tools_used: [], created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await api.post("/mentor/chat", { message: msg });
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "assistant",
        content: res.data.response,
        tools_used: res.data.tools_used || [],
        created_at: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "assistant",
        content: "Hit a brief error — try again. I'm still here.",
        tools_used: [], created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleClear = async () => {
    if (!window.confirm("Clear your conversation with Alex? This can't be undone.")) return;
    try {
      await api.delete("/mentor/history");
      setMessages([]);
      await triggerInit();
    } catch (e) {
      console.error(e);
    }
  };

  const isEmpty = messages.length === 0 && !isLoadingHistory && !isThinking;
  const canSend = input.trim() && !isThinking;

  return (
    <>
      <style>{`
        @keyframes mcDotPulse {
          0%, 100% { opacity: 0.25; transform: scale(0.75); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes mcFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mcGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes mcSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mc-scrollbar::-webkit-scrollbar { width: 4px; }
        .mc-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .mc-scrollbar::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        .mc-scrollbar::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
        .mc-textarea { resize: none; background: none; border: none; outline: none; }
        .mc-textarea::placeholder { color: #444; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#0a0a0a" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          background: "#0e0e0e",
          borderBottom: "1px solid #1e1e1e",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar with glow */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,30%))",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 20px rgba(255,102,0,0.4)",
              }}>
                <BrainIcon size={20} />
              </div>
              {/* Online dot */}
              <div style={{
                position: "absolute", bottom: 1, right: 1,
                width: 11, height: 11, borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #0e0e0e",
              }} />
            </div>
            {/* Info */}
            <div>
              <div style={{
                fontWeight: 900, fontSize: 15,
                textTransform: "uppercase", letterSpacing: "0.06em",
                color: "#fff",
              }}>
                Alex
              </div>
              <div style={{
                fontSize: 10, fontFamily: "monospace",
                color: "#444", letterSpacing: "0.08em", marginTop: 1,
              }}>
                <span style={{ color: "#22c55e" }}>●</span> CAREER CO-PILOT · ONLINE
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              fontSize: 10, fontFamily: "monospace",
              color: "#333", letterSpacing: "0.05em",
              padding: "4px 10px",
              border: "1px solid #1e1e1e",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <SparkleIcon /> GPT-4 POWERED
            </div>
            <button
              onClick={handleClear}
              title="Clear conversation"
              style={{
                background: "none", border: "1px solid #222",
                color: "#444", cursor: "pointer",
                padding: "6px 10px", display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, fontFamily: "monospace",
                textTransform: "uppercase", letterSpacing: "0.05em",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#444"; }}
            >
              <TrashIcon /> Reset
            </button>
          </div>
        </div>

        {/* ── Messages area ────────────────────────────────────────────────── */}
        <div
          className="mc-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: isEmpty ? "0" : "28px 24px 0" }}
        >
          {/* Loading */}
          {isLoadingHistory && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", gap: 8,
              fontFamily: "monospace", fontSize: 11, color: "#333",
              letterSpacing: "0.1em",
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "hsl(24,100%,50%)",
                  animation: "mcDotPulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}/>
              ))}
              <span style={{ marginLeft: 8 }}>LOADING SESSION</span>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && <EmptyState onSend={sendMessage} />}

          {/* Messages */}
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

          {/* Typing */}
          {isThinking && <TypingIndicator />}

          <div ref={bottomRef} style={{ height: 28 }} />
        </div>

        {/* ── Input bar ────────────────────────────────────────────────────── */}
        <div style={{
          padding: "14px 20px 16px",
          background: "#0e0e0e",
          borderTop: "1px solid #1e1e1e",
          flexShrink: 0,
          animation: "mcSlideUp 0.3s ease-out",
        }}>
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: "#141414",
            border: `1.5px solid ${inputFocused ? "hsl(24,100%,50%)" : "#222"}`,
            padding: "12px 14px 12px 16px",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: inputFocused ? "0 0 0 3px rgba(255,102,0,0.08)" : "none",
          }}>
            <textarea
              ref={textareaRef}
              className="mc-textarea"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask Alex anything about your career..."
              disabled={isThinking}
              rows={1}
              style={{
                flex: 1,
                color: "#e8e8e8",
                fontSize: 14,
                fontFamily: "inherit",
                lineHeight: 1.65,
                maxHeight: 120,
                overflowY: "auto",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!canSend}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: canSend
                  ? "linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,38%))"
                  : "#1a1a1a",
                border: canSend ? "none" : "1.5px solid #2a2a2a",
                cursor: canSend ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: canSend ? "#fff" : "#333",
                flexShrink: 0,
                transition: "all 0.2s",
                boxShadow: canSend ? "0 0 16px rgba(255,102,0,0.35)" : "none",
                transform: canSend ? "scale(1)" : "scale(0.95)",
              }}
            >
              <SendIcon />
            </button>
          </div>

          {/* Footer hint */}
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: 12, marginTop: 8,
          }}>
            <p style={{
              fontSize: 10, fontFamily: "monospace",
              color: "#2e2e2e", letterSpacing: "0.04em",
            }}>
              Alex reads your live resume · DSA progress · job pipeline
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
