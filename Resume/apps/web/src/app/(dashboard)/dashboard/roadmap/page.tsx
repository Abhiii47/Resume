"use client";

import { useState, useMemo } from "react";
import {
  ExternalLink,
  Map,
  RefreshCcw,
  AlertCircle,
  Rocket,
} from "lucide-react";
import { motion } from "framer-motion";
import { Roadmap, RoadmapWeek } from "@repo/types";
import useSWR from "swr";
import { cn } from "@repo/ui";

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
  const isLoading = roadmapLoading && !roadmapData;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-16 max-w-7xl mx-auto w-full animate-pulse py-24 px-8 bg-[var(--bg)]">
        <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-[var(--border)] pb-12 gap-8">
          <div className="space-y-6 w-full">
            <div className="h-6 w-48 bg-[var(--bg-muted)] border-2 border-[var(--border)]" />
            <div className="h-24 w-full max-w-2xl bg-[var(--bg-muted)] border-2 border-[var(--border)]" />
          </div>
          <div className="h-24 w-48 bg-[var(--bg-muted)] border-2 border-[var(--border)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-80 w-full border-4 border-[var(--border)] bg-[var(--bg-muted)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg)] gap-16 p-8">
        <div className="relative h-40 w-40 border-8 border-[var(--fg)] flex items-center justify-center shadow-[20px_20px_0_0_var(--bg-muted)]">
          <Map className="h-20 w-20 text-[var(--fg)] animate-ping" />
        </div>
        <div className="text-center">
          <h2 className="magazine-heading text-5xl text-[var(--fg)] mb-6">
            Constructing.
          </h2>
          <p className="index-label text-xl font-black animate-pulse text-[var(--fg)] tracking-[0.2em]">
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
    <div className="relative flex flex-col gap-12 max-w-7xl mx-auto w-full pb-32 pt-16 px-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b-4 border-[var(--fg)] pb-12">
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black">[ 00 ] ROADMAP_PROTOCOL</span>
              <div className="h-px w-32 bg-[var(--fg)]" />
            </div>
            <h1 className="magazine-heading text-3xl md:text-5xl text-[var(--fg)] leading-tight">
              {roadmap?.title || "Career Roadmap."}
            </h1>
          </div>
          <p className="text-lg text-[var(--fg)] font-bold leading-tight uppercase italic max-w-3xl border-l-4 border-[var(--fg)] pl-6">
            &ldquo;{roadmap?.description || "A serialized path to career dominance through structured intelligence."}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-8 min-w-[320px]">
          <button
            onClick={() => mutateRoadmap()}
            disabled={roadmapValidating}
            className="status-block bg-[var(--bg)] text-[var(--fg)] h-24 w-24 border-4 border-[var(--fg)] flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all group"
          >
            <RefreshCcw
              className={cn("h-8 w-8 group-hover:rotate-180 transition-transform duration-500", roadmapValidating && "animate-spin")}
            />
          </button>
          <div className="flex-1 px-12 py-6 border-4 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] offset-card shadow-none flex flex-col items-center justify-center min-w-[180px]">
             <span className="text-5xl font-black font-mono leading-none">{progressPercent}%</span>
             <span className="index-label text-[var(--bg)] opacity-60 text-xs mt-2">SYNC_COMPLETED</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-10 border-4 border-red-600 bg-red-50 flex items-center justify-between gap-10 offset-card relative blueprint-corners shadow-none">
          <div className="corner-bl !border-red-600" />
          <div className="corner-br !border-red-600" />
          <div className="flex items-center gap-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <div className="flex flex-col">
              <span className="magazine-heading text-2xl text-red-600">Protocol Failure</span>
              <span className="index-label text-red-900 font-bold">{error}</span>
            </div>
          </div>
          <button onClick={() => mutateRoadmap()} className="status-block bg-red-600 text-white border-4 border-red-600 px-10 py-4 text-sm hover:bg-white hover:text-red-600 transition-all font-black">
            RE_SYNC_PROTOCOL
          </button>
        </div>
      )}

      {!roadmap || steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center max-w-4xl mx-auto w-full">
          <div className="p-20 border-[6px] border-[var(--fg)] bg-[var(--bg)] w-full relative group offset-card shadow-none blueprint-corners">
            <div className="corner-bl" />
            <div className="corner-br" />
            <div className="h-40 w-40 bg-[var(--fg)] border-4 border-[var(--fg)] flex items-center justify-center mb-16 mx-auto shadow-[16px_16px_0_0_var(--accent)]">
              <Map className="h-20 w-20 text-[var(--bg)] group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            </div>
            <h1 className="magazine-heading text-4xl text-[var(--fg)] mb-6 tracking-tighter">Path_Uninitialized.</h1>
            <p className="text-lg text-[var(--fg)] font-black uppercase tracking-tight leading-relaxed mb-12 italic opacity-80 border-y-2 border-[var(--fg)] py-6 max-w-xl mx-auto">
              [ 00 ] UPLOAD_SOURCE_VECTOR_TO_GENERATE_TRAJECTORY_PATH
            </p>
            <button
              onClick={handleGenerate}
              className="btn-primary px-12 py-6 text-lg hover:translate-x-2 transition-all flex items-center gap-4 mx-auto"
            >
              INITIALIZE_GENERATION <Rocket className="h-6 w-6 animate-bounce" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
          {steps.map((step, idx) => {
            const isCompleted = step.progress === 100;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "p-12 border-4 border-[var(--fg)] bg-[var(--bg)] transition-all relative group overflow-hidden offset-card flex flex-col justify-between blueprint-corners",
                  isCompleted ? "opacity-60 grayscale-[0.8]" : "hover:bg-[var(--bg-muted)]"
                )}
              >
                <div className="corner-bl" />
                <div className="corner-br" />
                
                <div className="space-y-10 relative z-10">
                  <div className="flex items-center justify-between border-b-2 border-[var(--fg)] pb-6">
                    <span className="index-label font-black text-base">{step.week}</span>
                    <button
                      onClick={() => handleToggleProgress(step.id, step.progress)}
                      className={cn(
                        "status-block px-6 py-2 transition-all border-2",
                        isCompleted
                          ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]"
                          : "bg-[var(--bg)] text-[var(--fg)] border-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)]"
                      )}
                    >
                      {isCompleted ? "VERIFIED" : "MARK_READY"}
                    </button>
                  </div>

                  <div className="flex gap-6 items-start">
                    <span className="magazine-heading text-2xl text-[var(--fg-muted)] opacity-20">{(idx + 1).toString().padStart(2, "0")}</span>
                    <h3 className={cn(
                      "text-xl font-black italic uppercase tracking-tighter leading-tight transition-all",
                      isCompleted ? "text-[var(--fg-muted)] line-through" : "text-[var(--fg)]"
                    )}>
                      {step.title}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {(step.description || "")
                      .split("\n")
                      .filter(Boolean)
                      .map((task: string, tIdx: number) => (
                        <div
                          key={tIdx}
                          className="flex items-start gap-4 text-base text-[var(--fg)] font-bold uppercase leading-tight italic"
                        >
                          <div className={cn(
                            "h-3 w-3 mt-1 flex-shrink-0 transition-all border-2 border-[var(--fg)]",
                            isCompleted ? "bg-[var(--fg-muted)] border-[var(--fg-muted)] rotate-45" : "bg-[var(--fg)] group-hover:rotate-180"
                          )} />
                          <span className={cn(isCompleted && "text-[var(--fg-muted)]")}>{task}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {step.resources?.length > 0 && (
                  <div className="mt-12 pt-8 border-t-2 border-[var(--fg)] flex flex-wrap gap-4 relative z-10">
                    {step.resources
                      .slice(0, 2)
                      .map((res: string, rIdx: number) => (
                        <a
                          key={rIdx}
                          href={res}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--fg)] px-6 py-3 border-2 border-[var(--fg)] bg-[var(--bg)] hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all group-hover:shadow-[4px_4px_0_0_var(--fg)]"
                        >
                          Resource_{rIdx + 1}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ))}
                  </div>
                )}
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-16 border-4 border-dashed border-[var(--fg-subtle)] bg-[var(--bg-muted)] text-center relative overflow-hidden group col-span-1 md:col-span-2 flex flex-col items-center justify-center gap-8 mt-12"
          >
            <div className="h-24 w-24 bg-[var(--bg)] border-4 border-[var(--fg)] flex items-center justify-center mx-auto relative z-10 group-hover:scale-110 transition-transform">
              <Rocket className="h-10 w-10 text-[var(--fg)]" />
            </div>
            <div className="relative z-10">
              <h4 className="magazine-heading text-4xl mb-2">Final Vector.</h4>
              <p className="index-label text-[var(--fg)] font-bold text-lg">
                [ 00 ] COMPLETE_ALL_MODULES_TO_UNLOCK_DOMINANCE
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

