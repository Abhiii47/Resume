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
        <div className="h-10 w-10 border border-[var(--fg)] border-t-transparent animate-spin" />
        <p className="index-label">
          [ LOG_SYNC ] Synchronizing intelligence...
        </p>
      </div>
    );
  }

  const activeResume = resumes.find((r) => r.id === activeResumeId);

  const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse bg-[var(--fg-muted)]/10 border border-[var(--border)]", className)} />
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
                "group relative w-full p-8 border-b border-x border-[var(--border)] transition-all first:border-t",
                activeResumeId === resume.id
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "bg-transparent border-[var(--border)] hover:bg-[var(--bg-subtle)]",
              )}
            >
              <div className="flex flex-col gap-2 relative z-10">
                <p
                  className={cn(
                    "text-xs font-black truncate transition-colors uppercase italic tracking-tight",
                    activeResumeId === resume.id
                      ? "text-white"
                      : "text-zinc-600 group-hover:text-zinc-400",
                  )}
                >
                  {idx.toString().padStart(2, '0')} / {resume.fileName}
                </p>
                <div className="flex items-center justify-between">
                  <span className="index-label text-[8px]">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </span>
                  {resume.score ? (
                    <span
                      className="index-label text-[8px] text-white"
                    >
                      SCORE: {resume.score}
                    </span>
                  ) : (
                    <span className="index-label text-[8px] text-zinc-800">
                      SYNC
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}

          <Link
            href="/dashboard/resume"
            className="w-full p-6 border border-dashed border-white/10 index-label text-zinc-600 hover:border-white/40 hover:text-white transition-all flex items-center justify-center gap-3 mt-4"
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
              <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="magazine-heading text-2xl text-[var(--fg)] mb-3">
                Analysis Obstacle
              </h2>
              <p className="text-zinc-400 text-sm mb-2">{error.message}</p>
              {error.details && (
                <p className="text-[var(--fg-muted)] text-xs bg-[var(--bg-subtle)] p-6 border border-[var(--border)] leading-relaxed mb-8 font-mono">
                  {error.details}
                </p>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => mutateAnalysis()}
                  className="status-block status-block-outline px-8 py-3"
                >
                  Retry
                </button>
                <button
                  onClick={() => handleReanalyze()}
                  className="status-block status-block-active px-8 py-3"
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
              <div className="h-20 w-20 bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center mb-10 group">
                <Sparkles className="h-10 w-10 text-[var(--fg-muted)] group-hover:text-[var(--fg)] transition-colors" />
              </div>
              <h2 className="magazine-heading text-3xl text-[var(--fg)] mb-4">
                Ready for Insight
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-10">
                This resume hasn&apos;t been scanned by our AI engine yet.
                Let&apos;s see how much potential we can find.
              </p>
              <button
                onClick={() => handleReanalyze()}
                disabled={reanalyzing}
                className="status-block status-block-active px-12 py-6 text-sm hover:scale-105 transition-all"
              >
                <div className="relative z-10 flex items-center gap-3">
                  {reanalyzing ? (
                    <>
                      <div className="h-4 w-4 border border-[var(--bg)] border-t-transparent animate-spin" />
                      SYSTEM_WARMING_UP...
                    </>
                  ) : (
                    <>
                      <Activity className="h-5 w-5" />
                      ANALYZE_VECTOR_NOW
                    </>
                  )}
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-12 blueprint-border p-12 bg-white/[0.01] relative"
            >
              {/* --- ANALYZING OVERLAY --- */}
              {reanalyzing && (
                <div className="absolute inset-0 z-40 bg-[var(--bg)]/80 backdrop-blur-xl flex flex-col items-center justify-center gap-12">
                  <div className="relative h-28 w-28 border border-[var(--border)] flex items-center justify-center">
                    <Target className="h-12 w-12 text-[var(--fg)] animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="magazine-heading text-5xl text-[var(--fg)] mb-4">
                      Computing...
                    </h3>
                    <p className="index-label animate-pulse">
                      [ 00 ] PROCESSING_DIMENSIONAL_VECTORS
                    </p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
                <div className="flex-1">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 animate-fade-in-up">
                      <span className="index-label text-white">[ 01 ] Report</span>
                      <div className="h-px w-20 bg-white/10" />
                    </div>
                    
                    <h1 className="magazine-heading text-4xl md:text-6xl animate-fade-in-up">
                      {activeResume?.fileName || "Unknown Vector"}
                    </h1>
                  </div>
                  {analysisValidating && !analysis ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed font-medium">
                      {analysis.summary}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-6">
                  <div className="flex items-center gap-8 border border-white/10 p-8 bg-black/40">
                    <div className="flex flex-col items-center gap-2">
                      <span className="index-label text-zinc-600">Match Score</span>
                      <span className="text-5xl font-black text-white font-mono">{analysis.score}</span>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex flex-col items-center gap-2">
                      <span className="index-label text-zinc-600">ATS Value</span>
                      <span className="text-5xl font-black text-white font-mono">{analysis.atsScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <button
                      onClick={handleShare}
                      className="index-label text-white hover:underline transition-all"
                    >
                      Export Results →
                    </button>
                    <button
                      onClick={() => handleReanalyze()}
                      className="index-label text-zinc-600 hover:text-white transition-all"
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
                  <div className="blueprint-border p-8 bg-white/[0.01]">
                    <span className="index-label block mb-8">02 / BRANDING</span>
                    <div className="space-y-6">
                      <div>
                        <span className="index-label text-zinc-700 block mb-2">Headline Vector</span>
                        <p className="text-sm text-zinc-300 font-medium leading-relaxed italic">
                          &ldquo;{analysis.brandingKit?.linkedinHeadline}&rdquo;
                        </p>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div>
                        <span className="index-label text-zinc-700 block mb-2">High-Signal DM</span>
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed italic line-clamp-2">
                          &ldquo;{analysis.brandingKit?.coldDM}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Public Portfolio */}
                  <div className="blueprint-border p-8 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-8">
                      <span className="index-label block">03 / VISIBILITY</span>
                      <button
                        onClick={handleToggleVisibility}
                        className={cn(
                          "status-block transition-all",
                          analysis.isPublic ? "status-block-active" : "status-block-outline"
                        )}
                      >
                        {analysis.isPublic ? "LIVE" : "LOCAL"}
                      </button>
                    </div>
                    <div className="flex flex-col gap-6">
                      <p className="index-label text-zinc-600 leading-relaxed normal-case tracking-normal">
                        Your career trajectory is serialized and accessible to global recruiting engines.
                      </p>
                      {analysis.isPublic && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-4 py-3 border border-white/10 bg-black text-[10px] font-mono text-white truncate">
                            {origin}/u/{analysis.id}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(`${origin}/u/${analysis.id}`)}
                            className="p-3 border border-white/10 hover:bg-white hover:text-black transition-all"
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
                  <div className="blueprint-border p-8 bg-white/[0.01]">
                    <span className="index-label block mb-8">04 / CORE STRENGTHS</span>
                    <ul className="grid grid-cols-1 gap-6">
                      {(analysis.strengths as string[]).map((str, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="index-label text-zinc-800">[{i+1}]</span>
                          <span className="text-base text-zinc-300 leading-snug font-medium italic">
                            {str}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="blueprint-border p-8 bg-white/[0.01]">
                    <span className="index-label block mb-8">05 / SKILLS MATRIX</span>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.skills as string[]).map((skill, i) => (
                        <span
                          key={i}
                          className="status-block status-block-outline"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Gaps & Path (2 cols) */}
                <div className="md:col-span-2 flex flex-col gap-8">
                  <div className="p-8 rounded-3xl border border-amber-500/10 bg-amber-500/[0.02]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-3 mb-8">
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> Improvement Area
                    </h3>
                    <ul className="flex flex-col gap-5">
                      {(analysis.weaknesses as string[]).map((w, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                          <span className="text-sm text-zinc-500 font-medium leading-relaxed">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-8 rounded-3xl border border-red-500/10 bg-red-500/[0.02]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-3 mb-8">
                      <Target className="h-4 w-4 text-red-500" /> Missing Intelligence
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.missingSkills as string[]).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <Rocket className="h-24 w-24 text-white" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">
                      Trajectory Path
                    </h3>
                    {analysisValidating && !analysis ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <p className="text-2xl font-black text-white italic uppercase tracking-tight">
                        {analysis.careerPath}
                      </p>
                    )}
                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                        Vector:
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-xl">
                        {analysis.experienceLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Recommendations */}
              <div className="pt-6 border-t border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <Zap className="h-3 w-3" /> Strategic Advice
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisValidating && !analysis
                    ? [1, 2].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))
                    : (analysis.recommendations as string[]).map((rec, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-4 items-center"
                        >
                          <Sparkles className="h-5 w-5 text-zinc-600 flex-shrink-0" />
                          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
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

      {/* Global CSS for custom scrollbar - usually should be in globals.css but adding here for convenience */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
