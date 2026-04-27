"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  Target,
  Zap,
  Activity,
  Sparkles,
  Copy,
  Rocket,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AnalysisResult } from "@repo/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility for tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResumeListItem {
  id: string;
  fileName: string;
  createdAt: string;
  score: number | null;
}

export default function AnalysisPage() {
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [localError, setLocalError] = useState<{
    message: string;
    details?: string;
  } | null>(null);

  // 1. Fetch all resumes (Cached via SWR)
  const {
    data: resumesData,
    mutate: mutateResumes,
    isLoading: resumesLoading,
  } = useSWR("/api/resume");
  const resumes: ResumeListItem[] = useMemo(
    () => resumesData?.resumes || [],
    [resumesData],
  );

  // Set first resume as active if none selected
  useEffect(() => {
    if (resumes.length > 0 && !activeResumeId) {
      setActiveResumeId(resumes[0].id);
    }
  }, [resumes, activeResumeId]);

  // 2. Fetch analysis (Cached via SWR per resumeId)
  const {
    data: analysisData,
    error: swrError,
    mutate: mutateAnalysis,
    isValidating: analysisValidating,
  } = useSWR(
    activeResumeId ? `/api/analysis?resumeId=${activeResumeId}` : null,
  );

  const analysis = useMemo(
    () => analysisData?.analysis as AnalysisResult | null,
    [analysisData],
  );

  const handleShare = () => {
    if (!analysis) return;
    const text = `I just analyzed my resume on CareerAI and got a score of ${analysis.score}! 🚀 Check out your own career trajectory at careerai.app`;
    const url = window.location.origin;

    if (navigator.share) {
      navigator.share({
        title: "CareerAI Analysis",
        text,
        url,
      });
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert("Link copied to clipboard!");
    }
  };

  const handleToggleVisibility = async () => {
    if (!analysis) return;
    const newStatus = !analysis.isPublic;
    try {
      const res = await fetch(`/api/analysis/${analysis.id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newStatus }),
      });
      if (res.ok) {
        mutateAnalysis();
      }
    } catch (err) {
      console.error("Visibility toggle failed:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleReanalyze = async (targetResumeId?: string) => {
    const idToAnalyze = targetResumeId || activeResumeId;
    if (!idToAnalyze) return;

    setReanalyzing(true);
    setLocalError(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: idToAnalyze }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLocalError({
          message: data.error || "Analysis failed",
          details: data.details,
        });
      } else {
        // Optimistically update the cache
        mutateAnalysis({ analysis: data.analysis }, false);
        mutateResumes();
      }
    } catch {
      setLocalError({ message: "Failed to reach analysis engine" });
    } finally {
      setReanalyzing(false);
    }
  };

  const error =
    localError || (swrError ? { message: "Failed to load analysis" } : null);
  const isLoading =
    resumesLoading || (activeResumeId && !analysisData && !swrError);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6">
        <div className="h-10 w-10 border-4 border-[var(--fg)] border-t-transparent animate-spin" />
        <p className="index-label">
          [ LOG_SYNC ] Synchronizing intelligence...
        </p>
      </div>
    );
  }

  const activeResume = resumes.find((r) => r.id === activeResumeId);

  const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse bg-[var(--bg-muted)] border border-[var(--border)]", className)} />
  );

  return (
    <div className="relative flex flex-col lg:flex-row h-full w-full gap-8 overflow-hidden max-w-7xl mx-auto px-4 py-8">
      {/* Background Decor */}

      {/* --- SIDEBAR: Resume History --- */}
      <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-8 border-b lg:border-b-0 lg:border-r border-[var(--border)] pb-8 lg:pb-0 lg:pr-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className="index-label">[ 00 ] ARCHIVE</span>
          </div>
          <span className="index-label">{resumes.length} ENTRIES</span>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto pr-3 custom-scrollbar flex-1">
          {resumes.map((resume, idx) => (
            <button
              key={resume.id}
              onClick={() => setActiveResumeId(resume.id)}
              className={cn(
                "group relative w-full p-8 border-[var(--border)] transition-all",
                activeResumeId === resume.id
                  ? "offset-card bg-[var(--fg)] text-[var(--bg)] border-2 border-[var(--fg)] translate-x-1"
                  : "bg-[var(--bg)] border hover:bg-[var(--bg-muted)]",
              )}
            >
              <div className="flex flex-col gap-2 relative z-10 text-left">
                <p
                  className={cn(
                    "text-xs font-black truncate transition-colors uppercase italic tracking-tight",
                    activeResumeId === resume.id
                      ? "text-[var(--bg)]"
                      : "text-[var(--fg)] group-hover:text-[var(--fg-muted)]",
                  )}
                >
                  {idx.toString().padStart(2, '0')} / {resume.fileName}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={cn("index-label text-[8px]", activeResumeId === resume.id ? "text-[var(--bg)] opacity-70" : "")}>
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </span>
                  {resume.score ? (
                    <span
                      className={cn("index-label text-[8px] font-bold", activeResumeId === resume.id ? "text-[var(--bg)]" : "text-[var(--fg)]")}
                    >
                      SCORE: {resume.score}
                    </span>
                  ) : (
                    <span className="index-label text-[8px] opacity-50">
                      SYNC
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}

          <Link
            href="/dashboard/resume"
            className="w-full p-6 blueprint-border bg-[var(--bg-muted)] hover:bg-[var(--bg)] text-[var(--fg)] font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 mt-4"
          >
            Upload Vector →
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT: Analysis Results --- */}
      <main className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto"
            >
              <div className="h-16 w-16 border-2 border-red-500 bg-red-50 flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="magazine-heading text-2xl text-[var(--fg)] mb-3">
                Analysis Obstacle
              </h2>
              <p className="text-[var(--fg-muted)] text-sm mb-2">{error.message}</p>
              {error.details && (
                <p className="text-[var(--fg)] text-xs bg-[var(--bg-muted)] p-6 border border-[var(--border)] leading-relaxed mb-8 font-mono">
                  {error.details}
                </p>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => mutateAnalysis()}
                  className="btn-primary"
                >
                  Retry
                </button>
                <button
                  onClick={() => handleReanalyze()}
                  className="btn-primary !bg-red-500 !border-red-500 !text-white hover:!bg-red-600"
                >
                  Force Re-Run
                </button>
              </div>
            </motion.div>
          ) : !analysis ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto"
            >
              <div className="h-20 w-20 bg-[var(--bg-muted)] border-2 border-[var(--fg)] flex items-center justify-center mb-10 group">
                <Sparkles className="h-10 w-10 text-[var(--fg)]" />
              </div>
              <h2 className="magazine-heading text-3xl text-[var(--fg)] mb-4">
                Ready for Insight
              </h2>
              <p className="text-[var(--fg-muted)] text-sm leading-relaxed mb-10">
                This resume hasn&apos;t been scanned by our AI engine yet.
                Let&apos;s see how much potential we can find.
              </p>
              <button
                onClick={() => handleReanalyze()}
                disabled={reanalyzing}
                className="btn-primary flex items-center justify-center gap-3 w-full"
              >
                {reanalyzing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin" />
                    SYSTEM_WARMING_UP...
                  </>
                ) : (
                  <>
                    <Activity className="h-5 w-5" />
                    ANALYZE_VECTOR_NOW
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-12 p-8 border-2 border-[var(--border)] relative bg-[var(--bg)]"
            >
              {/* --- ANALYZING OVERLAY --- */}
              {reanalyzing && (
                <div className="absolute inset-0 z-40 bg-[var(--bg)]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-12">
                  <div className="relative h-28 w-28 border-4 border-[var(--fg)] flex items-center justify-center">
                    <Target className="h-12 w-12 text-[var(--fg)] animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="magazine-heading text-5xl text-[var(--fg)] mb-4">
                      Computing...
                    </h3>
                    <p className="index-label animate-pulse text-[var(--fg)]">
                      [ 00 ] PROCESSING_DIMENSIONAL_VECTORS
                    </p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
                <div className="flex-1">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <span className="index-label text-[var(--fg)]">[ 01 ] Report</span>
                      <div className="h-px w-20 bg-[var(--fg)]" />
                    </div>
                    
                    <h1 className="magazine-heading text-4xl md:text-6xl text-[var(--fg)]">
                      {activeResume?.fileName || "Unknown Vector"}
                    </h1>
                  </div>
                  {analysisValidating && !analysis ? (
                    <div className="space-y-4 mt-6">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <p className="text-lg text-[var(--fg-muted)] max-w-2xl leading-relaxed font-medium mt-6">
                      {analysis.summary}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-6">
                  <div className="flex items-center gap-8 border-2 border-[var(--fg)] p-8 offset-card">
                    <div className="flex flex-col items-center gap-2">
                      <span className="index-label text-[var(--fg)]">Match Score</span>
                      <span className="text-5xl font-black text-[var(--fg)] font-mono">{analysis.score}</span>
                    </div>
                    <div className="h-10 w-px bg-[var(--fg)]" />
                    <div className="flex flex-col items-center gap-2">
                      <span className="index-label text-[var(--fg)]">ATS Value</span>
                      <span className="text-5xl font-black text-[var(--fg)] font-mono">{analysis.atsScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4">
                    <button
                      onClick={handleShare}
                      className="index-label text-[var(--fg)] hover:underline transition-all"
                    >
                      Export Results →
                    </button>
                    <button
                      onClick={() => handleReanalyze()}
                      className="index-label text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all"
                    >
                      Sync Engine
                    </button>
                  </div>
                </div>
              </div>

              {/* X-FACTOR: Branding & Portfolio */}
              {analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {/* LinkedIn Branding Kit */}
                  <div className="blueprint-border p-8 bg-[var(--bg-muted)]">
                    <span className="index-label block mb-8 text-[var(--fg)]">02 / BRANDING</span>
                    <div className="space-y-6">
                      <div>
                        <span className="index-label text-[var(--fg-muted)] block mb-2">Headline Vector</span>
                        <p className="text-sm text-[var(--fg)] font-medium leading-relaxed italic border-l-2 border-[var(--fg)] pl-4">
                          &ldquo;{analysis.brandingKit?.linkedinHeadline}&rdquo;
                        </p>
                      </div>
                      <div className="h-px bg-[var(--border)]" />
                      <div>
                        <span className="index-label text-[var(--fg-muted)] block mb-2">High-Signal DM</span>
                        <p className="text-sm text-[var(--fg)] font-medium leading-relaxed italic border-l-2 border-[var(--fg)] pl-4 line-clamp-3">
                          &ldquo;{analysis.brandingKit?.coldDM}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Public Portfolio */}
                  <div className="blueprint-border p-8 bg-[var(--bg-muted)]">
                    <div className="flex items-center justify-between mb-8">
                      <span className="index-label block text-[var(--fg)]">03 / VISIBILITY</span>
                      <button
                        onClick={handleToggleVisibility}
                        className={cn(
                          "status-block transition-all",
                          analysis.isPublic ? "status-block-active" : "bg-[var(--bg)] text-[var(--fg)]"
                        )}
                      >
                        {analysis.isPublic ? "LIVE" : "LOCAL"}
                      </button>
                    </div>
                    <div className="flex flex-col gap-6">
                      <p className="index-label text-[var(--fg-muted)] leading-relaxed normal-case tracking-normal">
                        Your career trajectory is serialized and accessible to global recruiting engines.
                      </p>
                      {analysis.isPublic && (
                        <div className="flex items-center gap-0 mt-auto">
                          <div className="flex-1 px-4 py-3 border border-[var(--border)] bg-[var(--bg)] text-[10px] font-mono text-[var(--fg)] truncate">
                            {origin}/u/{analysis.id}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(`${origin}/u/${analysis.id}`)}
                            className="p-3 border border-[var(--border)] border-l-0 bg-[var(--bg)] hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Left Side: Skills & Strengths (3 cols) */}
                <div className="md:col-span-3 flex flex-col gap-8">
                  <div className="blueprint-border p-8 bg-[var(--bg)]">
                    <span className="index-label block mb-8 text-[var(--fg)]">04 / CORE STRENGTHS</span>
                    <ul className="grid grid-cols-1 gap-6">
                      {(analysis.strengths as string[]).map((str, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="index-label text-[var(--fg-muted)]">[{i+1}]</span>
                          <span className="text-base text-[var(--fg)] leading-snug font-medium italic">
                            {str}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="blueprint-border p-8 bg-[var(--bg)]">
                    <span className="index-label block mb-8 text-[var(--fg)]">05 / SKILLS MATRIX</span>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.skills as string[]).map((skill, i) => (
                        <span
                          key={i}
                          className="status-block bg-[var(--bg)] text-[var(--fg)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Gaps & Path (2 cols) */}
                <div className="md:col-span-2 flex flex-col gap-8">
                  <div className="p-8 border-2 border-[var(--fg)] bg-[var(--bg-muted)] offset-card">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--fg)] flex items-center gap-3 mb-8">
                      <AlertTriangle className="h-4 w-4" /> Improvement Area
                    </h3>
                    <ul className="flex flex-col gap-5">
                      {(analysis.weaknesses as string[]).map((w, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <div className="h-1.5 w-1.5 bg-[var(--fg)] mt-2 flex-shrink-0" />
                          <span className="text-sm text-[var(--fg)] font-medium leading-relaxed">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-8 border-2 border-[var(--fg)] bg-[var(--bg-muted)] offset-card">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--fg)] flex items-center gap-3 mb-8">
                      <Target className="h-4 w-4" /> Missing Intelligence
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.missingSkills as string[]).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-[var(--bg)] text-[var(--fg)] text-[10px] font-black uppercase tracking-widest border border-[var(--border)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto p-8 border-2 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] relative overflow-hidden group offset-card">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <Rocket className="h-24 w-24 text-[var(--bg)]" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--bg)] mb-2 opacity-80">
                      Trajectory Path
                    </h3>
                    {analysisValidating && !analysis ? (
                      <Skeleton className="h-10 w-full !bg-[var(--bg)]" />
                    ) : (
                      <p className="text-2xl font-black text-[var(--bg)] italic uppercase tracking-tight relative z-10">
                        {analysis.careerPath}
                      </p>
                    )}
                    <div className="mt-6 flex items-center gap-3 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--bg)] opacity-80">
                        Vector:
                      </span>
                      <span className="px-3 py-1 bg-[var(--bg)] text-[var(--fg)] text-[10px] font-black uppercase tracking-widest border-2 border-[var(--bg)]">
                        {analysis.experienceLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Recommendations */}
              <div className="pt-8 border-t border-[var(--border)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--fg)] mb-6 flex items-center gap-2">
                  <Zap className="h-3 w-3" /> Strategic Advice
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysisValidating && !analysis
                    ? [1, 2].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))
                    : (analysis.recommendations as string[]).map((rec, i) => (
                        <div
                          key={i}
                          className="p-6 bg-[var(--bg-muted)] border border-[var(--border)] flex gap-4 items-start"
                        >
                          <Sparkles className="h-5 w-5 text-[var(--fg-muted)] flex-shrink-0 mt-1" />
                          <p className="text-sm text-[var(--fg)] font-medium leading-relaxed">
                            {rec}
                          </p>
                        </div>
                      ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
