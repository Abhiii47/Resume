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
    <div className="flex flex-col gap-10 h-full max-w-6xl mx-auto w-full pb-20 px-4 pt-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-dot opacity-[0.05]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-2 border-[var(--fg)] pb-12"
      >
        <div>
          <div className="flex items-center gap-6 mb-4">
            <span className="index-label text-[var(--fg)]">[ 00 ] SIMULATION_MATRIX</span>
            <div className="h-px w-24 bg-[var(--fg)]" />
          </div>
          <h1 className="magazine-heading text-6xl md:text-8xl text-[var(--fg)] leading-none">
            Interview.
          </h1>
          <p className="text-[var(--fg-subtle)] text-lg leading-tight font-medium max-w-xl uppercase tracking-tighter mt-6">
            Practice with AI-powered mock interviews. Receive absolute grading on your responses.
          </p>
        </div>

        {avgScore !== null && (
          <div className="px-8 py-4 border-2 border-[var(--fg)] bg-[var(--bg)] flex items-center gap-6 offset-card">
            <Star className="h-8 w-8 text-[var(--fg)]" />
            <div className="flex flex-col items-start">
              <p className="index-label text-[var(--fg-muted)]">Session Avg</p>
              <p className={`text-4xl font-black font-mono text-[var(--fg)]`}>
                {avgScore}
                <span className="text-xl text-[var(--fg-muted)]">/100</span>
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {!sessionStarted ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-16 border-2 border-[var(--fg)] bg-[var(--bg)] text-center min-h-[500px] flex flex-col items-center justify-center offset-card"
            >
              <div className="h-24 w-24 border-2 border-[var(--fg)] bg-[var(--bg-muted)] flex items-center justify-center mb-10 offset-card">
                <Mic className="h-10 w-10 text-[var(--fg)]" />
              </div>
              <h2 className="magazine-heading text-4xl text-[var(--fg)] mb-6">Initialize Session</h2>
              <p className="index-label text-[var(--fg-muted)] mb-12 max-w-sm uppercase tracking-widest">
                Target: <span className="font-bold text-[var(--fg)]">{role}</span> <br/>
                Vector: <span className="font-bold text-[var(--fg)]">{questionType}</span>
              </p>
              <button
                onClick={startSession}
                className="btn-primary px-10 py-5 text-sm flex items-center gap-3 hover:scale-105 transition-all"
              >
                <Play className="h-4 w-4" /> BEGIN_SIMULATION
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="p-10 border-2 border-[var(--fg)] bg-[var(--bg)] offset-card"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <span className="status-block bg-[var(--bg)] text-[var(--fg)] border border-[var(--fg)] capitalize px-4">
                      {questionType}
                    </span>
                    <span className="status-block bg-[var(--fg)] text-[var(--bg)] border border-[var(--fg)] px-4">
                      {role}
                    </span>
                  </div>
                  <p className="magazine-heading text-3xl md:text-4xl text-[var(--fg)] leading-tight">
                    &ldquo;{currentQuestion}&rdquo;
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="p-8 border-2 border-[var(--fg)] bg-[var(--bg)] offset-card flex flex-col h-full min-h-[300px]">
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="[ AWAITING INPUT... ]"
                  rows={8}
                  disabled={loading}
                  className="w-full bg-[var(--bg-muted)] p-6 border-2 border-[var(--border)] text-sm leading-relaxed resize-none focus:outline-none focus:border-[var(--fg)] placeholder:text-[var(--fg-subtle)] font-mono flex-1 mb-6"
                />
                <div className="flex items-center justify-between">
                  <span className="index-label text-[var(--fg-muted)]">
                    {answer.length} chars
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setAnswer("")}
                      className="status-block bg-[var(--bg)] text-[var(--fg-muted)] border-2 border-[var(--border)] px-4 py-2 hover:border-[var(--fg)] hover:text-[var(--fg)]"
                    >
                      Clear
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={loading || answer.trim().length < 10}
                      className="btn-primary px-8 py-3 disabled:opacity-50 flex items-center gap-3"
                    >
                      {loading ? (
                        "PROCESSING..."
                      ) : (
                        <>
                          SUBMIT <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 border-2 border-red-500 bg-red-50 flex items-center gap-3 offset-card">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="index-label text-red-600">{error}</p>
                </div>
              )}

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 border-2 border-[var(--fg)] bg-[var(--bg)] offset-card"
                  >
                    <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-[var(--fg)]">
                      <span className="magazine-heading text-3xl">Evaluation</span>
                      <span
                        className={`text-4xl font-black font-mono text-[var(--fg)]`}
                      >
                        {feedback.score}/100
                      </span>
                    </div>

                    <p className="text-lg text-[var(--fg)] mb-8 pl-6 border-l-4 border-[var(--fg)] font-medium leading-relaxed italic">
                      {feedback.overallFeedback}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      <div className="border border-[var(--border)] bg-[var(--bg-muted)] p-6">
                        <h4 className="index-label text-[var(--fg)] mb-4">
                          Strengths
                        </h4>
                        <ul className="space-y-3">
                          {feedback.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="text-sm text-[var(--fg)] flex items-start gap-3 font-medium"
                            >
                              <span className="text-[var(--fg)] font-black mt-0.5">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="border border-[var(--border)] bg-[var(--bg-muted)] p-6">
                        <h4 className="index-label text-[var(--fg)] mb-4">
                          Areas to improve
                        </h4>
                        <ul className="space-y-3">
                          {feedback.improvements.map((s, i) => (
                            <li
                              key={i}
                              className="text-sm text-[var(--fg)] flex items-start gap-3 font-medium"
                            >
                              <span className="text-[var(--fg-muted)] font-black mt-0.5">-</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-8 border-2 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] mb-10 offset-card">
                      <h4 className="index-label text-[var(--bg)] mb-4 opacity-80">
                        Optimized Vector Response
                      </h4>
                      <p className="text-sm font-mono leading-relaxed">
                        {feedback.betterAnswer}
                      </p>
                    </div>

                    <button
                      onClick={nextQuestion}
                      className="status-block bg-[var(--bg)] text-[var(--fg)] border-2 border-[var(--fg)] w-full py-4 flex items-center justify-center gap-3 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
                    >
                      <Play className="h-4 w-4" /> INITIATE_NEXT_VECTOR
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <div className="p-8 border-2 border-[var(--fg)] bg-[var(--bg)] offset-card">
            <h3 className="index-label text-[var(--fg)] mb-8">Configuration</h3>

            <div className="mb-8">
              <span className="index-label text-[var(--fg-muted)] mb-3 block">
                Target Role
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full text-left text-sm px-4 py-4 border-2 border-[var(--fg)] bg-[var(--bg-muted)] flex items-center justify-between font-bold"
                >
                  <span className="truncate">{role}</span>
                  <ChevronDown className="h-4 w-4 text-[var(--fg)]" />
                </button>
                {showRoleDropdown && (
                  <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-[var(--bg)] border-2 border-[var(--fg)] shadow-[4px_4px_0px_0px_currentColor] overflow-hidden max-h-[300px] overflow-y-auto">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r);
                          setShowRoleDropdown(false);
                          if (sessionStarted) pickQuestion(questionType);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg-muted)] font-medium border-b border-[var(--border)] last:border-b-0"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="index-label text-[var(--fg-muted)] mb-3 block">
                Simulation Vector
              </span>
              <div className="flex flex-col gap-3">
                {(
                  ["behavioral", "technical", "leadership"] as QuestionType[]
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setQuestionType(type);
                      if (sessionStarted) pickQuestion(type);
                    }}
                    className={`px-4 py-3 border-2 font-bold uppercase tracking-widest text-xs text-left transition-all ${questionType === type ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]" : "border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg)] hover:text-[var(--fg)]"}`}
                  >
                    {type}
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
                className="w-full status-block bg-[var(--bg-muted)] text-[var(--fg)] border border-[var(--border)] py-4 mt-8 flex items-center justify-center gap-2 hover:bg-[var(--bg)] hover:border-[var(--fg)]"
              >
                <RotateCcw className="h-4 w-4" /> ABORT_SESSION
              </button>
            )}
          </div>

          <div className="p-8 border-2 border-[var(--fg)] bg-[var(--bg)] offset-card">
            <h3 className="index-label text-[var(--fg)] mb-6">Archive Log</h3>
            {history.length === 0 ? (
              <p className="index-label text-[var(--fg-muted)]">
                [ NO_ARCHIVE_DATA ]
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 p-4 border border-[var(--border)] bg-[var(--bg-muted)]"
                  >
                    <span className="text-[var(--fg)] text-xs font-mono truncate flex-1">
                      {h.question.slice(0, 30)}...
                    </span>
                    <span className={`font-black font-mono text-sm text-[var(--fg)]`}>
                      {h.score}
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
