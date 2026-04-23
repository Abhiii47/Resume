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

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="flex flex-col gap-8 h-full max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
                <Mic className="h-3.5 w-3.5 text-[var(--accent-fg)]" />
              </div>
              <span className="text-xs text-[var(--fg-muted)] font-medium uppercase tracking-wider">
                Interview
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Interview Practice
            </h1>
            <p className="text-sm text-[var(--fg-subtle)] mt-1">
              Practice with AI-powered mock interviews and get real-time
              feedback.
            </p>
          </div>

          {avgScore !== null && (
            <div className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center gap-3">
              <Star className="h-4 w-4 text-[var(--fg-muted)]" />
              <div>
                <p className="text-xs text-[var(--fg-muted)]">Session Avg</p>
                <p className={`text-xl font-bold ${scoreColor(avgScore)}`}>
                  {avgScore}
                  <span className="text-sm text-[var(--fg-muted)]">/100</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {!sessionStarted ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 rounded-xl border border-[var(--border)] bg-[var(--card)] text-center min-h-[400px] flex flex-col items-center justify-center"
            >
              <div className="h-16 w-16 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center mb-6">
                <Mic className="h-7 w-7 text-[var(--fg-muted)]" />
              </div>
              <h2 className="text-lg font-bold mb-2">Ready to Practice</h2>
              <p className="text-sm text-[var(--fg-muted)] mb-6 max-w-sm">
                Configure for <span className="font-medium">{role}</span> —{" "}
                {questionType} round.
              </p>
              <button
                onClick={startSession}
                className="btn-primary px-6 py-2 text-sm"
              >
                <Play className="h-4 w-4" /> Start Session
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[var(--bg-muted)] border border-[var(--border)] capitalize">
                      {questionType}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs text-[var(--fg-muted)] rounded-full bg-[var(--bg-subtle)] border border-[var(--border)]">
                      {role}
                    </span>
                  </div>
                  <p className="font-medium text-base leading-relaxed">
                    {currentQuestion}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  disabled={loading}
                  className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none placeholder:text-[var(--fg-muted)]"
                />
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 mt-3">
                  <span className="text-xs text-[var(--fg-muted)]">
                    {answer.length} chars
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAnswer("")}
                      className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] px-2 py-1"
                    >
                      Clear
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={loading || answer.trim().length < 10}
                      className="btn-primary text-sm px-4 py-1.5"
                    >
                      {loading ? (
                        "Evaluating..."
                      ) : (
                        <>
                          Submit <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold">AI Feedback</span>
                      <span
                        className={`text-sm font-bold ${scoreColor(feedback.score)}`}
                      >
                        {feedback.score}/100
                      </span>
                    </div>

                    <p className="text-sm text-[var(--fg-subtle)] mb-4 pl-3 border-l-2 border-[var(--border)]">
                      {feedback.overallFeedback}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-xs font-medium text-green-600 uppercase tracking-wider mb-2">
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {feedback.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="text-sm text-[var(--fg-subtle)] flex items-start gap-2"
                            >
                              <span className="text-green-500">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">
                          Areas to improve
                        </h4>
                        <ul className="space-y-1">
                          {feedback.improvements.map((s, i) => (
                            <li
                              key={i}
                              className="text-sm text-[var(--fg-subtle)] flex items-start gap-2"
                            >
                              <span className="text-amber-500">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] mb-4">
                      <h4 className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-1">
                        Model Answer
                      </h4>
                      <p className="text-sm text-[var(--fg-subtle)]">
                        {feedback.betterAnswer}
                      </p>
                    </div>

                    <button
                      onClick={nextQuestion}
                      className="btn-secondary w-full text-sm"
                    >
                      <Play className="h-4 w-4" /> Next Question
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-sm font-semibold mb-4">Configuration</h3>

            <div className="mb-4">
              <span className="text-xs text-[var(--fg-muted)] mb-2 block">
                Target Role
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] flex items-center justify-between"
                >
                  <span className="truncate">{role}</span>
                  <ChevronDown className="h-4 w-4 text-[var(--fg-muted)]" />
                </button>
                {showRoleDropdown && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r);
                          setShowRoleDropdown(false);
                          if (sessionStarted) pickQuestion(questionType);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-subtle)]"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-[var(--fg-muted)] mb-2 block">
                Round Type
              </span>
              <div className="flex flex-col gap-2">
                {(
                  ["behavioral", "technical", "leadership"] as QuestionType[]
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setQuestionType(type);
                      if (sessionStarted) pickQuestion(type);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium capitalize text-left transition-all ${questionType === type ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]" : "border-[var(--border)] hover:bg-[var(--bg-subtle)]"}`}
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
                className="w-full text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] mt-4 flex items-center justify-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-sm font-semibold mb-3">History</h3>
            {history.length === 0 ? (
              <p className="text-xs text-[var(--fg-muted)]">
                No submissions yet
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[var(--fg-muted)] truncate flex-1">
                      Q{history.length - i}: {h.question.slice(0, 30)}...
                    </span>
                    <span className={`font-medium ${scoreColor(h.score)}`}>
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
