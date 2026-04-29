"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Play,
  Send,
  RotateCcw,
  ChevronDown,
  AlertCircle,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@repo/ui";

const ROLES = [
  "Senior Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "AI/ML Engineer",
  "DevOps Engineer",
  "Product Manager",
  "Data Scientist",
];

const QUESTION_BANK: Record<string, string[]> = {
  behavioral: [
    "Tell me about a time you had to debug a critical production issue under pressure.",
    "Describe a situation where you had to convince your team to change direction on a project.",
    "Tell me about a conflict with a colleague and how you resolved it.",
    "Describe your most impactful contribution to a project.",
    "Tell me about a time you failed, and what you learned from it.",
  ],
  technical: [
    "Explain how you would design a URL shortener like bit.ly at scale.",
    "Walk me through how React's reconciliation algorithm works.",
    "How would you design a distributed rate limiter?",
    "Explain the difference between SQL and NoSQL, and when you'd use each.",
    "How do you approach performance optimization in a web application?",
  ],
  leadership: [
    "How do you handle disagreements with your manager?",
    "Describe how you mentor junior engineers.",
    "How do you prioritize when everything seems urgent?",
    "Tell me about a time you led a project from inception to delivery.",
    "How do you ensure code quality across your team?",
  ],
};

type Feedback = {
  score: number;
  strengths: string[];
  improvements: string[];
  betterAnswer: string;
  overallFeedback: string;
};

type QuestionType = "behavioral" | "technical" | "leadership";

type InterviewHistoryItem = {
  feedback?: {
    question?: string;
  };
  question?: string;
  score?: number;
};

export default function InterviewPage() {
  const [role, setRole] = useState(ROLES[0]);
  const [questionType, setQuestionType] = useState<QuestionType>("behavioral");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [history, setHistory] = useState<{ question: string; score: number }[]>(
    [],
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pickQuestion = (type: QuestionType) => {
    const questions = QUESTION_BANK[type];
    const random = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(random);
    setAnswer("");
    setFeedback(null);
    setError(null);
  };

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/interview");
        if (res.ok) {
          const data = await res.json();
          if (data.history) {
            setHistory(
              data.history.map((h: InterviewHistoryItem) => ({
                question:
                  h.feedback?.question ||
                  h.question ||
                  "Mock Interview Question",
                score: h.score || 0,
              })),
            );
          }
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    }
    fetchHistory();
  }, []);

  const startSession = () => {
    pickQuestion(questionType);
    setSessionStarted(true);
  };

  const nextQuestion = () => {
    pickQuestion(questionType);
  };

  const submitAnswer = async () => {
    if (!answer.trim() || answer.trim().length < 10) return;
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, question: currentQuestion, answer }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setFeedback(data.feedback);
      setHistory((prev) => [
        { question: currentQuestion, score: data.feedback.score },
        ...prev.slice(0, 4),
      ]);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStarted && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentQuestion, sessionStarted]);

  const avgScore =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length)
      : null;

  return (
    <div className="relative flex flex-col gap-16 max-w-7xl mx-auto w-full pb-32 pt-16 px-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row justify-between items-end gap-12 border-b-4 border-[var(--fg)] pb-16"
      >
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black">[ 00 ] SIMULATION_MATRIX</span>
              <div className="h-px w-32 bg-[var(--fg)]" />
            </div>
            <h1 className="magazine-heading text-6xl md:text-9xl text-[var(--fg)] leading-[0.8]">
              Interview.
            </h1>
          </div>
          <p className="text-2xl text-[var(--fg)] font-bold leading-tight uppercase italic max-w-3xl border-l-4 border-[var(--fg)] pl-8">
            Practice with AI-powered mock interviews. Receive absolute grading on your responses.
          </p>
        </div>

        {avgScore !== null && (
          <div className="px-12 py-8 border-4 border-[var(--fg)] bg-[var(--bg)] flex items-center gap-10 offset-card shadow-none relative blueprint-corners group hover:bg-[var(--bg-muted)] transition-colors">
            <div className="corner-bl" />
            <div className="corner-br" />
            <Star className="h-12 w-12 text-[var(--fg)] group-hover:scale-125 transition-transform" />
            <div className="flex flex-col items-start">
              <p className="index-label text-[var(--fg-muted)] font-black text-xs uppercase mb-2">SESSION_AVG</p>
              <p className={`text-6xl font-black font-mono text-[var(--fg)] leading-none`}>
                {avgScore}
                <span className="text-xl text-[var(--fg-muted)] opacity-40 ml-2">/100</span>
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 flex flex-col gap-12">
          {!sessionStarted ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-24 border-4 border-[var(--fg)] bg-[var(--bg)] text-center min-h-[600px] flex flex-col items-center justify-center offset-card shadow-none relative blueprint-corners group hover:bg-[var(--bg-muted)] transition-colors"
            >
              <div className="corner-bl" />
              <div className="corner-br" />
              <div className="h-32 w-32 border-4 border-[var(--fg)] bg-[var(--bg)] flex items-center justify-center mb-12 shadow-[16px_16px_0_0_var(--fg)] group-hover:shadow-none group-hover:translate-x-2 group-hover:translate-y-2 transition-all">
                <Mic className="h-16 w-16 text-[var(--fg)]" />
              </div>
              <h2 className="magazine-heading text-6xl text-[var(--fg)] mb-8">Initialize.</h2>
              <p className="index-label text-xl text-[var(--fg-muted)] mb-16 max-w-sm uppercase italic font-black">
                Target: <span className="text-[var(--fg)] underline underline-offset-8">{role}</span> <br/>
                Vector: <span className="text-[var(--fg)] underline underline-offset-8">{questionType}</span>
              </p>
              <button
                onClick={startSession}
                className="btn-primary px-16 py-8 text-2xl flex items-center gap-6 group/btn"
              >
                BEGIN_SIMULATION <Play className="h-8 w-8 group-hover/btn:scale-125 transition-transform" />
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="p-16 border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners"
                >
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  <div className="flex items-center gap-6 mb-12">
                    <span className="status-block bg-[var(--bg)] text-[var(--fg)] border-2 border-[var(--fg)] px-6 py-1 font-black text-xs uppercase italic">
                      {questionType}
                    </span>
                    <span className="status-block bg-[var(--fg)] text-[var(--bg)] border-2 border-[var(--fg)] px-6 py-1 font-black text-xs uppercase italic">
                      {role}
                    </span>
                  </div>
                  <p className="magazine-heading text-4xl md:text-6xl text-[var(--fg)] leading-[1.1] italic">
                    &ldquo;{currentQuestion}&rdquo;
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="p-12 border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners flex flex-col h-full min-h-[400px]">
                <div className="corner-bl" />
                <div className="corner-br" />
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="[ AWAITING_INPUT_SIGNAL... ]"
                  disabled={loading}
                  className="w-full bg-[var(--bg-muted)] p-10 border-4 border-[var(--fg)] text-xl leading-relaxed resize-none focus:outline-none focus:bg-white transition-all placeholder:opacity-20 font-black italic uppercase flex-1 mb-10"
                />
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-4 py-1 font-black text-xs">
                      {answer.length.toString().padStart(4, '0')} BYTES
                    </span>
                    <div className="h-px w-24 bg-[var(--fg)] opacity-20" />
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <button
                      onClick={() => setAnswer("")}
                      className="status-block bg-white text-[var(--fg-muted)] border-4 border-[var(--fg)] px-10 py-4 hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-all font-black text-lg uppercase italic flex-1 md:flex-none"
                    >
                      CLEAR
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={loading || answer.trim().length < 10}
                      className="btn-primary px-12 py-5 disabled:opacity-20 flex items-center gap-6 text-xl flex-1 md:flex-none group/btn"
                    >
                      {loading ? (
                        "PROCESSING..."
                      ) : (
                        <>
                          TRANSMIT <Send className="h-6 w-6 group-hover/btn:translate-x-2 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-8 border-4 border-red-600 bg-red-50 flex items-center gap-8 offset-card shadow-none relative blueprint-corners">
                  <div className="corner-bl !border-red-600" />
                  <div className="corner-br !border-red-600" />
                  <AlertCircle className="h-10 w-10 text-red-600 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="magazine-heading text-2xl text-red-600">Signal Error</span>
                    <span className="index-label text-red-900 font-black text-base">{error}</span>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-16 border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners"
                  >
                    <div className="corner-bl" />
                    <div className="corner-br" />
                    <div className="flex items-center justify-between mb-16 pb-10 border-b-4 border-[var(--fg)]">
                      <span className="magazine-heading text-5xl">Evaluation.</span>
                      <span
                        className={`text-7xl font-black font-mono text-[var(--fg)] leading-none`}
                      >
                        {feedback.score}<span className="text-2xl opacity-20 ml-2">/100</span>
                      </span>
                    </div>

                    <p className="text-3xl text-[var(--fg)] mb-16 pl-12 border-l-8 border-[var(--fg)] font-black italic uppercase leading-tight tracking-tighter">
                      {feedback.overallFeedback}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                      <div className="border-4 border-[var(--fg)] bg-emerald-50 p-10 relative">
                        <div className="absolute top-0 right-0 bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black text-[10px] uppercase">STRENGTHS</div>
                        <ul className="space-y-6">
                          {feedback.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="text-lg text-[var(--fg)] flex items-start gap-6 font-black italic uppercase leading-none"
                            >
                              <span className="text-emerald-600 font-black">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="border-4 border-[var(--fg)] bg-red-50 p-10 relative">
                        <div className="absolute top-0 right-0 bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black text-[10px] uppercase">WEAKNESSES</div>
                        <ul className="space-y-6">
                          {feedback.improvements.map((s, i) => (
                            <li
                              key={i}
                              className="text-lg text-[var(--fg)] flex items-start gap-6 font-black italic uppercase leading-none"
                            >
                              <span className="text-red-600 font-black">-</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-12 border-4 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] mb-16 relative">
                       <div className="absolute top-0 right-0 bg-white text-[var(--fg)] px-3 py-1 font-black text-[10px] uppercase">OPTIMIZED_VECTOR</div>
                      <p className="text-xl font-mono leading-relaxed opacity-90 italic">
                        &ldquo;{feedback.betterAnswer}&rdquo;
                      </p>
                    </div>

                    <button
                      onClick={nextQuestion}
                      className="status-block bg-white text-[var(--fg)] border-4 border-[var(--fg)] w-full py-8 flex items-center justify-center gap-6 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all font-black text-2xl uppercase italic group"
                    >
                      INITIATE_NEXT_VECTOR <Play className="h-8 w-8 group-hover:scale-125 transition-transform" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-12 sticky top-12">
          <div className="p-12 border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners">
            <div className="corner-bl" />
            <div className="corner-br" />
            <h3 className="magazine-heading text-3xl mb-10 border-b-2 border-[var(--fg)] pb-4">Config.</h3>

            <div className="mb-12">
              <span className="index-label text-[var(--fg-muted)] mb-4 block font-black text-xs uppercase">
                TARGET_ROLE
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full text-left text-lg px-8 py-5 border-4 border-[var(--fg)] bg-[var(--bg-muted)] flex items-center justify-between font-black italic uppercase"
                >
                  <span className="truncate">{role}</span>
                  <ChevronDown className={cn("h-6 w-6 text-[var(--fg)] transition-transform", showRoleDropdown && "rotate-180")} />
                </button>
                {showRoleDropdown && (
                  <div className="absolute top-full mt-4 left-0 right-0 z-30 bg-[var(--bg)] border-4 border-[var(--fg)] shadow-[12px_12px_0_0_var(--fg)] overflow-hidden max-h-[400px] overflow-y-auto">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r);
                          setShowRoleDropdown(false);
                          if (sessionStarted) pickQuestion(questionType);
                        }}
                        className="w-full text-left px-8 py-5 text-lg hover:bg-[var(--fg)] hover:text-[var(--bg)] font-black italic uppercase border-b-2 border-[var(--fg)] last:border-b-0 transition-colors"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="index-label text-[var(--fg-muted)] mb-4 block font-black text-xs uppercase">
                SIMULATION_VECTOR
              </span>
              <div className="flex flex-col gap-4">
                {(
                  ["behavioral", "technical", "leadership"] as QuestionType[]
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setQuestionType(type);
                      if (sessionStarted) pickQuestion(type);
                    }}
                    className={cn(
                      "px-8 py-5 border-4 font-black uppercase text-lg italic text-left transition-all relative group",
                      questionType === type 
                        ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)] shadow-[8px_8px_0_0_rgba(0,0,0,0.1)]" 
                        : "border-[var(--fg)] text-[var(--fg)] bg-white hover:bg-[var(--bg-muted)] shadow-[8px_8px_0_0_var(--fg)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    )}
                  >
                    {type}
                    {questionType === type && <div className="absolute right-6 top-1/2 -translate-y-1/2 h-2 w-2 bg-[var(--bg)] animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>

            {sessionStarted && (
              <button
                onClick={() => {
                  setSessionStarted(false);
                  setFeedback(null);
                  setAnswer("");
                  setCurrentQuestion("");
                  setError(null);
                }}
                className="w-full py-6 bg-white text-red-600 border-4 border-red-600 mt-12 flex items-center justify-center gap-4 hover:bg-red-600 hover:text-white transition-all font-black text-lg uppercase italic shadow-[8px_8px_0_0_red-600] hover:shadow-none"
              >
                <RotateCcw className="h-6 w-6" /> ABORT_SESSION
              </button>
            )}
          </div>

          <div className="p-12 border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners">
            <div className="corner-bl" />
            <div className="corner-br" />
            <h3 className="magazine-heading text-3xl mb-10 border-b-2 border-[var(--fg)] pb-4 text-[var(--fg)]">Archive.</h3>
            {history.length === 0 ? (
              <div className="py-12 text-center border-4 border-dashed border-[var(--fg)] border-opacity-20">
                <p className="index-label text-[var(--fg-muted)] font-black uppercase italic">
                  [ NO_ARCHIVE_DATA ]
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-4 p-6 border-4 border-[var(--fg)] bg-[var(--bg-muted)] hover:bg-white transition-colors relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">LOG_{i.toString().padStart(2, '0')}</span>
                      <span className={`font-black font-mono text-2xl text-[var(--fg)]`}>
                        {h.score}
                      </span>
                    </div>
                    <span className="text-[var(--fg)] text-sm font-black italic uppercase leading-tight opacity-60">
                      {h.question.slice(0, 80)}...
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
