"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Map,
  RefreshCcw,
  AlertCircle,
  Rocket,
} from "lucide-react";
import { motion } from "framer-motion";
import { Roadmap, RoadmapWeek } from "@repo/types";
import useSWR from "swr";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RoadmapPage() {
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // 1. Fetch Roadmap (Cached via SWR)
  const {
    data: roadmapData,
    error: swrError,
    mutate: mutateRoadmap,
    isLoading: roadmapLoading,
    isValidating: roadmapValidating,
  } = useSWR("/api/roadmap");

  const roadmap = useMemo(
    () => roadmapData?.roadmap as Roadmap | null,
    [roadmapData],
  );

  async function handleGenerate() {
    setGenerating(true);
    setLocalError(null);
    setLocalFeedback(null);

    try {
      const res = await fetch("/api/roadmap", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setLocalError(data?.error || "Failed to generate roadmap.");
        return;
      }

      if (data.roadmap) {
        mutateRoadmap({ roadmap: data.roadmap });
        setLocalFeedback("Roadmap generated successfully.");
      } else {
        setLocalError("Roadmap generation returned empty data.");
      }
    } catch {
      setLocalError("Network error while generating roadmap.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleProgress(stepId: string, currentProgress: number) {
    if (!roadmap?.steps) return;

    setLocalError(null);
    setLocalFeedback(null);

    const targetCompleted = currentProgress !== 100;

    // Optimistically update the UI
    const optimisticRoadmap = {
      ...roadmap,
      steps: roadmap.steps.map((s: RoadmapWeek) =>
        s.id === stepId ? { ...s, progress: targetCompleted ? 100 : 0 } : s,
      ),
    };
    mutateRoadmap({ roadmap: optimisticRoadmap }, false);

    try {
      const res = await fetch("/api/roadmap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stepId, completed: targetCompleted }),
      });
      const data = await res.json();

      if (!res.ok) {
        mutateRoadmap(); // Rollback on error
        setLocalError(data?.error || "Failed to update progress.");
        return;
      }

      mutateRoadmap(); // Sync with server
      setLocalFeedback("Progress updated.");
    } catch {
      mutateRoadmap(); // Rollback on error
      setLocalError("Network error while updating progress.");
    }
  }

  const error =
    localError || (swrError ? "Failed to synchronize roadmap" : null);
  const feedback = localFeedback;
  const isLoading = roadmapLoading && !roadmapData;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-16 max-w-5xl mx-auto w-full animate-pulse py-20">
        <div className="flex justify-between items-end border-b border-[var(--border)] pb-12">
          <div className="space-y-6 w-full">
            <div className="h-4 w-32 bg-[var(--bg-muted)] border border-[var(--border)]" />
            <div className="h-20 w-full max-w-md bg-[var(--bg-muted)] border border-[var(--border)]" />
          </div>
          <div className="h-20 w-40 bg-[var(--bg-muted)] border border-[var(--border)]" />
        </div>
        <div className="space-y-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 w-full border-2 border-[var(--border)] bg-[var(--bg-muted)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-10 max-w-md mx-auto text-center">
        <div className="relative h-28 w-28 border-4 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)]">
          <div className="absolute inset-0 border-[var(--fg)] animate-spin border-t-4" />
          <Map className="h-12 w-12 text-[var(--fg)] animate-pulse" />
        </div>
        <div className="animate-fade-in-up">
          <h2 className="magazine-heading text-4xl text-[var(--fg)] mb-4">
            Mapping Intelligence
          </h2>
          <p className="index-label animate-pulse text-[var(--fg)]">
            [ 00 ] CONSTRUCTING_VECTOR_PATH
          </p>
        </div>
      </div>
    );
  }

  const steps = roadmap?.steps || [];
  const completedCount = steps.filter((s) => s.progress === 100).length;
  const progressPercent = steps.length
    ? Math.round((completedCount / steps.length) * 100)
    : 0;

  return (
    <div className="relative flex flex-col gap-16 max-w-5xl mx-auto w-full pb-32 pt-8">
      {/* Background Decor - Minimalist */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-dot opacity-[0.05]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b-2 border-[var(--fg)] pb-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="index-label text-[var(--fg)]">[ 00 ] ROADMAP_PROTOCOL</span>
              <div className="h-px w-24 bg-[var(--fg)]" />
            </div>
            <h1 className="magazine-heading text-5xl md:text-7xl text-[var(--fg)] leading-none">
              {roadmap?.title || "Career Roadmap"}
            </h1>
            <p className="text-[var(--fg-subtle)] text-lg max-w-xl font-medium leading-tight uppercase tracking-tight">
              {roadmap?.description ||
                "A serialized 12-week path to career dominance."}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => mutateRoadmap()}
              disabled={roadmapValidating}
              className="status-block bg-[var(--bg)] text-[var(--fg)] h-16 w-16 flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors border-2 border-[var(--fg)]"
            >
              <RefreshCcw
                className={cn("h-6 w-6", roadmapValidating && "animate-spin")}
              />
            </button>
            <div className="px-10 py-4 border-2 border-[var(--fg)] bg-[var(--bg)] flex items-center gap-6 offset-card">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black font-mono text-[var(--fg)] leading-none">
                  {progressPercent}%
                </span>
                <span className="index-label mt-2 text-[var(--fg)]">SYNC_STATUS</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="p-8 border-2 border-red-500 bg-red-50 text-xs text-red-600 flex items-center justify-between gap-6 font-black uppercase tracking-widest offset-card">
          <span className="flex items-center gap-4">
            <AlertCircle className="h-5 w-5" /> {error}
          </span>
          <button onClick={() => mutateRoadmap()} className="status-block bg-white text-red-600 border-2 border-red-500 px-6 py-2">
            Retry Sync
          </button>
        </div>
      )}

      {feedback && !error && (
        <div className="p-4 border-2 border-[var(--fg)] bg-[var(--bg-muted)] index-label text-[var(--fg)] offset-card">
          [ FEEDBACK ] {feedback}
        </div>
      )}

      {!roadmap || steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center max-w-xl mx-auto">
          <div className="p-16 border-2 border-[var(--fg)] bg-[var(--bg)] w-full relative group offset-card">
            <div className="h-20 w-20 bg-[var(--bg-muted)] border-2 border-[var(--fg)] flex items-center justify-center mb-10 mx-auto">
              <Map className="h-10 w-10 text-[var(--fg)] group-hover:scale-110 transition-transform" />
            </div>
            <h1 className="magazine-heading text-3xl text-[var(--fg)] mb-4">No Roadmap Detected</h1>
            <p className="index-label text-[var(--fg-muted)] mb-12">
              [ 00 ] UPLOAD_VECTOR_TO_INITIALIZE_PATH
            </p>
            <button
              onClick={handleGenerate}
              className="btn-primary px-12 py-6 text-sm hover:scale-105 transition-all"
            >
              Initialize Generation →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-10 top-0 bottom-0 w-1 bg-[var(--fg)] opacity-10 hidden md:block" />

          {steps.map((step, idx) => {
            const isCompleted = step.progress === 100;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={cn(
                  "p-8 md:p-12 border-2 border-[var(--fg)] bg-[var(--bg)] transition-all relative group overflow-hidden offset-card",
                  isCompleted ? "bg-[var(--bg)] opacity-70" : ""
                )}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-8 relative z-10">
                  {/* Indicator */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className={cn(
                      "h-20 w-20 border-2 flex items-center justify-center transition-all duration-300",
                      isCompleted 
                        ? "bg-[var(--fg)] border-[var(--fg)] text-[var(--bg)]" 
                        : "bg-[var(--bg)] border-[var(--fg)] text-[var(--fg)] group-hover:bg-[var(--fg)] group-hover:text-[var(--bg)]"
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-10 w-10" /> : <span className="text-3xl font-black font-mono">{idx + 1}</span>}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--fg-muted)]">
                        {step.week}
                      </span>
                        <button
                          onClick={() => handleToggleProgress(step.id, step.progress)}
                          className={cn(
                            "px-6 py-2 border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            isCompleted
                              ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]"
                              : "bg-[var(--bg)] text-[var(--fg)] border-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)]"
                          )}
                        >
                          {isCompleted ? "COMPLETED" : "MARK_DONE"}
                        </button>
                    </div>

                    <h3 className={cn(
                      "text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-6 transition-all",
                      isCompleted ? "text-[var(--fg-muted)] line-through" : "text-[var(--fg)]"
                    )}>
                      {step.title}
                    </h3>

                    <div className="space-y-4 mb-8">
                      {(step.description || "")
                        .split("\n")
                        .filter(Boolean)
                        .map((task: string, tIdx: number) => (
                          <div
                            key={tIdx}
                            className="flex items-start gap-3 text-sm text-[var(--fg)] font-medium"
                          >
                            <div className={cn(
                              "h-2 w-2 mt-2 flex-shrink-0 transition-colors border border-[var(--fg)]",
                              isCompleted ? "bg-[var(--fg-muted)] border-[var(--fg-muted)]" : "bg-[var(--fg)]"
                            )} />
                            <span className={cn(isCompleted && "text-[var(--fg-muted)]")}>{task}</span>
                          </div>
                        ))}
                    </div>

                    {step.resources?.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-[var(--border)]">
                        <span className="index-label w-full block mb-2 text-[var(--fg-muted)]">Resources</span>
                        {step.resources
                          .slice(0, 3)
                          .map((res: string, rIdx: number) => (
                            <a
                              key={rIdx}
                              href={res}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/res flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--fg)] px-6 py-3 border border-[var(--fg)] bg-[var(--bg-muted)] hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all"
                            >
                              Resource {rIdx + 1}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: steps.length * 0.08 + 0.2 }}
            className="p-16 border-2 border-[var(--fg)] bg-[var(--bg)] text-center relative overflow-hidden group offset-card"
          >
            <div className="h-20 w-20 bg-[var(--bg-muted)] border-2 border-[var(--fg)] flex items-center justify-center mx-auto mb-8 relative z-10">
              <Rocket className="h-10 w-10 text-[var(--fg)] group-hover:scale-110 transition-transform" />
            </div>
            <p className="index-label text-[var(--fg)] relative z-10 font-bold">
              [ 00 ] COMPLETE_ALL_MODULES_TO_UNLOCK_DOMINANCE
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
