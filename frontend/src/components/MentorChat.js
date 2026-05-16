import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE, getAuthToken } from "../utils";

// ── Icons ─────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2"/>
  </svg>
);
const ZapIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

// ── Tool label map ────────────────────────────────────────────────────────────
const TOOL_LABELS = {
  get_user_status:       "status check",
  analyze_resume_gaps:   "resume analysis",
  rewrite_bullet:        "bullet rewrite",
  generate_cover_letter: "cover letter",
  add_job_application:   "added job",
  generate_roadmap:      "roadmap build",
};

// ── Suggested prompts (shown when chat is empty) ──────────────────────────────
const SUGGESTIONS = [
  { label: "How am I doing overall?",          icon: "📊" },
  { label: "What should I work on today?",     icon: "🎯" },
  { label: "What's weak in my resume?",        icon: "📄" },
  { label: "Make me a plan for Google SDE",    icon: "🗺️" },
  { label: "Write a cover letter for Amazon",  icon: "✉️" },
];

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "var(--primary)", display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <BrainIcon />
      </div>
      <div style={{
        padding: "10px 16px",
        background: "var(--card)",
        border: "2px solid var(--border)",
        borderRadius: "0 12px 12px 12px",
        display: "flex", gap: 6, alignItems: "center",
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--primary)",
            animation: "alexPulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}/>
        ))}
      </div>
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isAlex = msg.role === "assistant";
  return (
    <div style={{
      display: "flex",
      flexDirection: isAlex ? "row" : "row-reverse",
      alignItems: "flex-end",
      gap: 10,
      marginBottom: 20,
      animation: "alexFadeIn 0.25s ease-out",
    }}>
      {isAlex && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "var(--primary)", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
          boxShadow: "0 0 12px rgba(255,102,0,0.4)",
        }}>
          <BrainIcon />
        </div>
      )}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 6,
                    alignItems: isAlex ? "flex-start" : "flex-end" }}>
        {/* Tool badges */}
        {isAlex && msg.tools_used && msg.tools_used.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {msg.tools_used.map((tool, i) => (
              <span key={i} style={{
                fontSize: 10, fontFamily: "monospace",
                background: "rgba(255,102,0,0.15)",
                color: "var(--primary)",
                border: "1px solid rgba(255,102,0,0.3)",
                padding: "2px 7px", borderRadius: 3,
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <ZapIcon /> {TOOL_LABELS[tool] || tool}
              </span>
            ))}
          </div>
        )}
        {/* Bubble */}
        <div style={{
          padding: "12px 16px",
          background: isAlex ? "var(--card)" : "var(--primary)",
          color: isAlex ? "var(--foreground)" : "var(--primary-foreground)",
          border: isAlex ? "2px solid var(--border)" : "2px solid var(--primary)",
          borderRadius: isAlex ? "0 12px 12px 12px" : "12px 0 12px 12px",
          fontSize: 14, lineHeight: 1.65,
          whiteSpace: "pre-wrap",
          boxShadow: isAlex ? "0 0 20px rgba(255,102,0,0.08)" : "none",
        }}>
          {msg.content}
        </div>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "monospace" }}>
          {isAlex ? "Alex" : "You"} · {
            msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "now"
          }
        </span>
      </div>
    </div>
  );
}

// ── Main MentorChat component ─────────────────────────────────────────────────
export default function MentorChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Load history on mount; if empty, call init
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/mentor/history`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const hist = res.data.messages || [];
        if (hist.length > 0) {
          setMessages(hist);
          setIsLoadingHistory(false);
        } else {
          // First visit — trigger Alex's opening assessment
          setIsLoadingHistory(false);
          await triggerInit();
        }
      } catch {
        setIsLoadingHistory(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerInit = useCallback(async () => {
    setIsThinking(true);
    try {
      const res = await axios.post(
        `${API_BASE}/mentor/chat`,
        { is_init: true },
        { headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" } }
      );
      const msg = {
        id: Date.now(), role: "assistant",
        content: res.data.response,
        tools_used: res.data.tools_used || [],
        created_at: new Date().toISOString(),
      };
      setMessages([msg]);
    } catch (err) {
      setMessages([{
        id: Date.now(), role: "assistant",
        content: "Hey — I'm Alex, your career mentor. I'm having a brief connection issue. Try refreshing, or just send me a message and I'll get back on track.",
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

    const userMsg = {
      id: Date.now(), role: "user", content: msg,
      tools_used: [], created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await axios.post(
        `${API_BASE}/mentor/chat`,
        { message: msg },
        { headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" } }
      );
      const alexMsg = {
        id: Date.now() + 1, role: "assistant",
        content: res.data.response,
        tools_used: res.data.tools_used || [],
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, alexMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "assistant",
        content: "Hit a brief error. Try again — I'm still here.",
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

  const handleClear = async () => {
    if (!window.confirm("Clear your conversation with Alex? This can't be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/mentor/history`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setMessages([]);
      await triggerInit();
    } catch {}
  };

  const isEmpty = messages.length === 0 && !isLoadingHistory && !isThinking;

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes alexPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes alexFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mentor-input:focus { outline: none; border-color: var(--primary); }
        .mentor-input { resize: none; }
        .suggestion-chip:hover { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "2px solid var(--border)",
          background: "var(--card)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(255,102,0,0.5)",
            }}>
              <BrainIcon />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Alex
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--primary)", letterSpacing: "0.1em" }}>
                ● CAREER MENTOR · ONLINE
              </div>
            </div>
          </div>
          <button
            onClick={handleClear}
            title="Clear conversation"
            style={{
              background: "none", border: "2px solid var(--border)",
              color: "var(--muted-foreground)", cursor: "pointer",
              padding: "6px 10px", display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, fontFamily: "monospace", fontWeight: "bold",
              textTransform: "uppercase", letterSpacing: "0.05em",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--destructive)"; e.currentTarget.style.color = "var(--destructive)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
          >
            <TrashIcon /> Reset
          </button>
        </div>

        {/* ── Messages area ───────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0" }}>

          {/* Loading skeleton */}
          {isLoadingHistory && (
            <div style={{ textAlign: "center", color: "var(--muted-foreground)", fontFamily: "monospace", fontSize: 12, paddingTop: 40 }}>
              <div style={{ animation: "alexPulse 1.5s ease-in-out infinite", display: "inline-block" }}>
                [ LOADING MENTOR SESSION... ]
              </div>
            </div>
          )}

          {/* Empty state — show suggestions */}
          {isEmpty && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, gap: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "rgba(255,102,0,0.1)",
                border: "2px solid rgba(255,102,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BrainIcon />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase", marginBottom: 4 }}>Ask Alex anything</p>
                <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Your personal career mentor. Knows your resume, DSA, and job pipeline.</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => sendMessage(s.label)}
                    style={{
                      padding: "8px 14px", border: "2px solid var(--border)",
                      background: "var(--card)", color: "var(--foreground)",
                      fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                    }}
                  >
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

          {/* Thinking indicator */}
          {isThinking && <TypingIndicator />}

          <div ref={bottomRef} style={{ height: 24 }} />
        </div>

        {/* ── Input bar ───────────────────────────────────────────────── */}
        <div style={{
          padding: "16px 24px",
          borderTop: "2px solid var(--border)",
          background: "var(--card)", flexShrink: 0,
        }}>
          <div style={{
            display: "flex", gap: 12, alignItems: "flex-end",
            background: "var(--background)",
            border: "2px solid var(--border)",
            padding: "12px 16px", transition: "border-color 0.2s",
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = "var(--primary)"}
            onBlurCapture={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <textarea
              ref={textareaRef}
              className="mentor-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Alex... (Enter to send, Shift+Enter for new line)"
              disabled={isThinking}
              rows={1}
              style={{
                flex: 1, background: "none", border: "none",
                color: "var(--foreground)", fontSize: 14,
                fontFamily: "inherit", lineHeight: 1.6,
                maxHeight: 120, overflowY: "auto",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isThinking}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: input.trim() && !isThinking ? "var(--primary)" : "var(--muted)",
                border: "none", cursor: input.trim() && !isThinking ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", flexShrink: 0, transition: "all 0.2s",
                boxShadow: input.trim() && !isThinking ? "0 0 16px rgba(255,102,0,0.4)" : "none",
              }}
            >
              <SendIcon />
            </button>
          </div>
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "var(--muted-foreground)", textAlign: "center", marginTop: 8 }}>
            Alex uses your live resume, DSA progress, and job data to give personalized advice
          </p>
        </div>
      </div>
    </>
  );
}
