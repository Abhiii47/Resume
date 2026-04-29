"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  Target,
  Activity,
  Sparkles,
  Copy,
  Rocket,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AnalysisResult } from "@repo/types";
import { cn } from "@repo/ui";

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
    mutate: mutateAnalysis,
    error: swrError,
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
      <div className="flex flex-col items-center justify-center h-screen gap-12 bg-[var(--bg)]">
        <div className="relative h-24 w-24 border-4 border-[var(--fg)] flex items-center justify-center">
          <div className="absolute inset-0 border-t-4 border-[var(--fg)] animate-spin" />
          <Activity className="h-8 w-8 text-[var(--fg)]" />
        </div>
        <div className="text-center">
          <h3 className="magazine-heading text-3xl mb-2">Syncing Data</h3>
          <p className="index-label animate-pulse">[ LOG_SYNC ] Synchronizing intelligence vectors...</p>
        </div>
      </div>
    );
  }

  const activeResume = resumes.find((r) => r.id === activeResumeId);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[var(--bg)] overflow-hidden">
      {/* --- SIDEBAR: Resume History --- */}
      <aside className="w-full lg:w-[400px] flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r-4 border-[var(--fg)] bg-[var(--bg-muted)]">
        <div className="p-10 border-b-2 border-[var(--fg)]">
          <div className="flex items-center justify-between mb-8">
            <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-2 py-0.5">[ 00 ] ARCHIVE</span>
            <span className="index-label font-black">{resumes.length} ENTRIES</span>
          </div>
          <h2 className="magazine-heading text-5xl">History.</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {resumes.map((resume, index) => (
            <button
              key={resume.id}
              onClick={() => setActiveResumeId(resume.id)}
              className={cn(
                "group relative w-full p-8 transition-all text-left",
                activeResumeId === resume.id
                  ? "offset-card bg-[var(--bg)] border-4 border-[var(--fg)] translate-x-2"
                  : "border-2 border-[var(--border)] bg-[var(--bg)] hover:border-[var(--fg)]",
              )}
            >
              <div className="flex flex-col gap-3 relative z-10">
                <p
                  className={cn(
                    "text-lg font-black truncate uppercase italic tracking-tight leading-none",
                    activeResumeId === resume.id ? "text-[var(--fg)]" : "text-[var(--fg-muted)] group-hover:text-[var(--fg)]",
                  )}
                >
                  {index.toString().padStart(2, "0")} / {resume.fileName}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="index-label text-[10px]">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </span>
                  {resume.score ? (
                    <span className="status-block bg-[var(--fg)] text-[var(--bg)] py-1 px-3 text-[10px]">
                      SCORE: {resume.score}
                    </span>
                  ) : (
                    <span className="index-label text-[10px] opacity-50 animate-pulse">PENDING</span>
                  )}
                </div>
              </div>
            </button>
          ))}
          
          <Link
            href="/dashboard/resume"
            className="w-full p-8 border-4 border-dashed border-[var(--fg-subtle)] hover:border-[var(--fg)] hover:bg-[var(--bg)] text-[var(--fg)] font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-4 mt-8 group"
          >
            <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" /> 
            Upload New Vector
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT: Analysis Results --- */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg)] custom-scrollbar">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-full p-20 text-center max-w-2xl mx-auto"
            >
              <div className="h-32 w-32 border-4 border-red-500 bg-red-50 flex items-center justify-center mb-10 shadow-[12px_12px_0_0_rgba(239,68,68,0.2)]">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              <h2 className="magazine-heading text-6xl text-[var(--fg)] mb-6">
                Critical<br />Obstacle.
              </h2>
              <p className="text-xl text-[var(--fg)] font-bold uppercase mb-8 leading-tight italic border-y-2 border-[var(--fg)] py-4 w-full">
                {error.message}
              </p>
              {error.details && (
                <div className="w-full text-[var(--fg)] text-xs bg-[var(--bg-muted)] p-8 border-2 border-[var(--fg)] leading-relaxed mb-12 font-mono text-left relative blueprint-corners">
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  {error.details}
                </div>
              )}
              <div className="flex gap-6 w-full">
                <button
                  onClick={() => mutateAnalysis()}
                  className="btn-primary flex-1 py-5 text-lg"
                >
                  RETRY_SYNC
                </button>
                <button
                  onClick={() => handleReanalyze()}
                  className="btn-primary flex-1 py-5 text-lg !bg-red-600 !border-red-600 !text-white"
                >
                  FORCE_RECOMPUTE
                </button>
              </div>
            </motion.div>
          ) : !analysis ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-full p-20 text-center max-w-2xl mx-auto"
            >
              <div className="h-40 w-40 bg-[var(--bg-muted)] border-4 border-[var(--fg)] flex items-center justify-center mb-16 relative blueprint-corners group">
                <div className="corner-bl" />
                <div className="corner-br" />
                <Sparkles className="h-20 w-20 text-[var(--fg)] group-hover:scale-110 transition-transform" />
              </div>
              <h2 className="magazine-heading text-7xl text-[var(--fg)] mb-8">
                Ready for<br />Insight.
              </h2>
              <p className="text-xl text-[var(--fg)] font-bold uppercase tracking-tight leading-relaxed mb-16 italic opacity-80 border-l-4 border-[var(--fg)] pl-8 text-left">
                This career vector has not been processed by our neural intelligence engine. 
                Initialize analysis to decode market alignment and trajectory probability.
              </p>
              <button
                onClick={() => handleReanalyze()}
                disabled={reanalyzing}
                className="btn-primary py-8 px-16 text-2xl flex items-center justify-center gap-6 w-full group"
              >
                {reanalyzing ? (
                  <>
                    <div className="h-8 w-8 border-4 border-current border-t-transparent animate-spin" />
                    COMPUTING_VECTORS...
                  </>
                ) : (
                  <>
                    <Activity className="h-8 w-8 group-hover:rotate-12 transition-transform" />
                    INITIALIZE_ANALYSIS
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-16 p-10 md:p-20"
            >
              {/* --- ANALYZING OVERLAY --- */}
              {reanalyzing && (
                <div className="fixed inset-0 z-50 bg-[var(--bg)]/95 flex flex-col items-center justify-center gap-16">
                  <div className="relative h-40 w-40 border-8 border-[var(--fg)] flex items-center justify-center shadow-[20px_20px_0_0_var(--bg-muted)]">
                    <Target className="h-20 w-20 text-[var(--fg)] animate-ping" />
                  </div>
                  <div className="text-center">
                    <h3 className="magazine-heading text-4xl text-[var(--fg)] mb-6">
                      Scanning.
                    </h3>
                    <p className="index-label text-lg font-black animate-pulse text-[var(--fg)] tracking-[0.2em]">
                      [ 00 ] PROCESSING_NEURAL_VECTORS
                    </p>
                  </div>
                </div>
              )}

              {/* Header Section */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-16 border-b-4 border-[var(--fg)] pb-16">
                <div className="flex-1 space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 text-sm font-black">[ 01 ] Report</span>
                      <div className="h-px w-32 bg-[var(--fg)]" />
                    </div>
                    <h1 className="magazine-heading text-3xl md:text-5xl text-[var(--fg)] leading-tight">
                      {activeResume?.fileName || "Unknown Vector"}
                    </h1>
                  </div>
                  <p className="text-lg text-[var(--fg)] font-bold leading-tight uppercase italic max-w-3xl">
                    &ldquo;{analysis.summary}&rdquo;
                  </p>
                </div>

                <div className="flex flex-col items-end gap-10 min-w-[300px]">
                  <div className="w-full flex items-center gap-10 border-4 border-[var(--fg)] p-12 offset-card relative blueprint-corners">
                    <div className="corner-bl" />
                    <div className="corner-br" />
                    <div className="flex flex-col items-center gap-4 flex-1">
                      <span className="index-label text-base font-black">Score</span>
                      <span className="text-7xl font-black text-[var(--fg)] font-mono leading-none">{analysis.score}</span>
                    </div>
                    <div className="h-20 w-1 bg-[var(--fg)] opacity-20" />
                    <div className="flex flex-col items-center gap-4 flex-1">
                      <span className="index-label text-base font-black">ATS</span>
                      <span className="text-7xl font-black text-[var(--fg)] font-mono leading-none">{analysis.atsScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-10 mt-4">
                    <button
                      onClick={handleShare}
                      className="magazine-heading text-xl text-[var(--fg)] hover:translate-x-2 transition-transform underline decoration-4 underline-offset-8"
                    >
                      Export Vector →
                    </button>
                    <button
                      onClick={() => handleReanalyze()}
                      className="magazine-heading text-xl text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all"
                    >
                      Recalibrate
                    </button>
                  </div>
                </div>
              </div>

              {/* Insights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="blueprint-border p-12 bg-[var(--bg-muted)] relative blueprint-corners">
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  <span className="index-label block mb-10 text-[var(--fg)] font-black text-base">02 / BRANDING_KIT</span>
                  <div className="space-y-10">
                    <div>
                      <span className="index-label text-[var(--fg-muted)] block mb-4">Headline Vector</span>
                      <p className="text-xl text-[var(--fg)] font-black leading-tight italic border-l-4 border-[var(--fg)] pl-6">
                        &ldquo;{analysis.brandingKit?.linkedinHeadline}&rdquo;
                      </p>
                    </div>
                    <div className="h-px bg-[var(--fg)] opacity-10" />
                    <div>
                      <span className="index-label text-[var(--fg-muted)] block mb-4">Cold Outreach</span>
                      <p className="text-base text-[var(--fg)] font-bold leading-relaxed italic border-l-4 border-[var(--fg)] pl-6">
                        &ldquo;{analysis.brandingKit?.coldDM}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                <div className="blueprint-border p-12 bg-[var(--bg)] relative blueprint-corners border-4 border-[var(--fg)]">
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  <div className="flex items-center justify-between mb-10 pb-6 border-b-2 border-[var(--fg)]">
                    <span className="index-label block text-[var(--fg)] font-black text-base">03 / VISIBILITY</span>
                    <button
                      onClick={handleToggleVisibility}
                      className={cn(
                        "status-block px-6 py-2 transition-all",
                        analysis.isPublic ? "status-block-active" : "bg-[var(--bg)] text-[var(--fg)]"
                      )}
                    >
                      {analysis.isPublic ? "NETWORK_LIVE" : "PROTOCOL_LOCKED"}
                    </button>
                  </div>
                  <div className="space-y-10">
                    <p className="index-label text-[var(--fg)] text-base leading-tight normal-case font-bold">
                      Your career metadata is serialized and indexed for global talent acquisition engines.
                    </p>
                    {analysis.isPublic && (
                      <div className="flex items-center gap-0 mt-auto border-4 border-[var(--fg)]">
                        <div className="flex-1 px-6 py-4 bg-[var(--bg-muted)] text-sm font-black font-mono text-[var(--fg)] truncate uppercase">
                          {origin}/u/{analysis.id}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(`${origin}/u/${analysis.id}`)}
                          className="p-4 bg-[var(--fg)] text-[var(--bg)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)] transition-all"
                        >
                          <Copy className="h-6 w-6" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Layers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                  <div className="blueprint-border p-12 bg-[var(--bg)] relative blueprint-corners border-2 border-[var(--fg)]">
                    <div className="corner-bl" />
                    <div className="corner-br" />
                    <span className="index-label block mb-10 text-[var(--fg)] font-black text-base">04 / CORE_STRENGTHS</span>
                    <ul className="space-y-8">
                      {(analysis.strengths as string[]).map((str, i) => (
                        <li key={i} className="flex gap-8 group">
                          <span className="magazine-heading text-3xl text-[var(--fg-muted)] group-hover:text-[var(--fg)] transition-colors opacity-30">{(i+1).toString().padStart(2, "0")}</span>
                          <span className="text-2xl text-[var(--fg)] leading-none font-black italic uppercase tracking-tighter">
                            {str}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="blueprint-border p-12 bg-[var(--bg-muted)] relative blueprint-corners border-2 border-[var(--fg)]">
                    <div className="corner-bl" />
                    <div className="corner-br" />
                    <span className="index-label block mb-10 text-[var(--fg)] font-black text-base">05 / SKILLS_MATRIX</span>
                    <div className="flex flex-wrap gap-4">
                      {(analysis.skills as string[]).map((skill, i) => (
                        <span
                          key={i}
                          className="status-block bg-[var(--bg)] text-[var(--fg)] border-2 border-[var(--fg)] text-sm px-6 py-3"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="p-10 border-4 border-red-600 bg-red-50 offset-card shadow-none">
                    <h3 className="magazine-heading text-2xl text-red-600 flex items-center gap-4 mb-10">
                      <AlertTriangle className="h-6 w-6" /> Gaps
                    </h3>
                    <ul className="space-y-8">
                      {(analysis.weaknesses as string[]).map((w, i) => (
                        <li key={i} className="flex items-start gap-6 group">
                          <div className="h-3 w-3 bg-red-600 mt-1 flex-shrink-0 group-hover:rotate-45 transition-transform" />
                          <span className="text-lg text-red-900 font-bold uppercase leading-tight italic">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-10 border-4 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] offset-card shadow-none relative blueprint-corners">
                    <div className="corner-bl !border-[var(--bg)]" />
                    <div className="corner-br !border-[var(--bg)]" />
                    <h3 className="magazine-heading text-3xl mb-10 italic">Strategic Advice</h3>
                    <div className="space-y-10">
                       {(analysis.recommendations as string[]).slice(0, 2).map((rec, i) => (
                         <div key={i} className="space-y-2">
                           <span className="index-label text-[var(--bg)] opacity-50">REC_{i+1}</span>
                           <p className="text-base font-bold uppercase leading-tight italic">{rec}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trajectory Banner */}
              <div className="p-16 border-8 border-[var(--fg)] bg-[var(--bg)] offset-card relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:scale-110 transition-transform -rotate-12">
                  <Rocket className="h-64 w-64 text-[var(--fg)]" />
                </div>
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-4">
                    <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black">06 / TARGET_TRAJECTORY</span>
                    <div className="h-px w-24 bg-[var(--fg)]" />
                  </div>
                  <h2 className="magazine-heading text-4xl md:text-6xl leading-tight mb-8">
                    {analysis.careerPath}.
                  </h2>
                  <div className="flex flex-wrap items-center gap-10">
                    <div className="flex flex-col gap-2">
                      <span className="index-label">Seniority Vector</span>
                      <span className="status-block bg-[var(--fg)] text-[var(--bg)] text-xl py-3 px-10">{analysis.experienceLevel}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="index-label">Execution Status</span>
                      <span className="status-block border-4 text-xl py-3 px-10">Protocol_Active</span>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

