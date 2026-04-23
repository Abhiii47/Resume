"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@repo/ui";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type JobMatch = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  sourceUrl?: string;
  match?: {
    score?: number;
    matchedSkills?: string[];
  };
};

export default function JobsPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [optimizing, setOptimizing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  async function fetchMatches(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      setError(null);
      const res = await fetch("/api/jobs/match");
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load job matches.");
        return;
      }

      setMatches(Array.isArray(data.matches) ? data.matches : []);
      setInfo(data?.message || null);
    } catch (e) {
      console.error("Match fetch failed", e);
      setError("Network error while loading job matches.");
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    fetchMatches();
    const id = setInterval(() => {
      void fetchMatches({ silent: true });
    }, 60000);

    return () => clearInterval(id);
  }, []);

  const handleOptimize = async (job: JobMatch) => {
    setSelectedJob(job);
    setOptimizing(true);
    setOptimizedResume(null);
    setError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/resume/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          jobDescription: job.description,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to optimize resume.");
        return;
      }

      if (!data.optimizedText) {
        setError("Optimization returned empty result.");
        return;
      }

      setOptimizedResume(data.optimizedText);
    } catch (e) {
      console.error("Optimization failed", e);
      setError("Network error while optimizing resume.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!optimizedResume || !selectedJob) return;
    setError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/resume/save-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optimizedText: optimizedResume,
          jobTitle: selectedJob.title,
          company: selectedJob.company,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to save optimized resume.");
        return;
      }

      if (!data.success) {
        setError("Save was not acknowledged by the server.");
        return;
      }

      setSaveSuccess("Optimized resume version saved successfully.");
    } catch (e) {
      console.error("Save failed", e);
      setError("Network error while saving optimized resume.");
    }
  };

  const filteredMatches = matches.filter(
    (j) =>
      !searchQuery ||
      j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (selectedJob && (optimizing || optimizedResume)) {
    return (
      <div className="relative flex flex-col h-full gap-10 max-w-6xl mx-auto w-full pb-20 px-4">
        {/* Background Decor */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute inset-0 bg-dot opacity-[0.05]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between relative z-10"
        >
          <button
            onClick={() => {
              setSelectedJob(null);
              setOptimizedResume(null);
              setSaveSuccess(null);
            }}
            className="index-label text-zinc-600 hover:text-white transition-all"
          >
            ← Return to Matrix
          </button>
          <h2 className="index-label text-white">REFINING VECTOR</h2>
          <div className="w-32" />
        </motion.div>

        {error && (
          <div className="p-8 border border-red-500/20 bg-red-500/5 text-xs text-red-500 flex items-center gap-6 font-black uppercase tracking-widest">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-8 border border-emerald-500/20 bg-emerald-500/5 index-label text-emerald-500">
            [ 00 ] {saveSuccess}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="blueprint-border p-12 bg-[var(--bg-subtle)] h-full relative">
              <div className="flex items-center gap-6 mb-12">
                <span className="status-block status-block-active px-6 py-2">
                  {selectedJob.match?.score}% MATCH_SYNC
                </span>
              </div>
              <h3 className="magazine-heading text-5xl text-[var(--fg)] mb-8">{selectedJob.title}</h3>
              <div className="flex flex-wrap items-center gap-6 index-label text-[var(--fg-muted)] mb-12">
                <span>{selectedJob.company}</span>
                <div className="w-1 h-1 bg-[var(--border)]" />
                <span>{selectedJob.location}</span>
              </div>
              <div className="text-lg text-[var(--fg-subtle)] leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[500px] font-medium custom-scrollbar pr-6">
                {selectedJob.description}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            <div className="blueprint-border p-10 bg-white/[0.01] h-full relative">
              <div className="flex items-center justify-between mb-8">
                <span className="index-label">Refined Output</span>
                {optimizedResume && (
                  <button
                    onClick={handleSaveVersion}
                    className="status-block status-block-active px-6 py-3"
                  >
                    Commit Version →
                  </button>
                )}
              </div>

              {optimizing ? (
                <div className="flex flex-col items-center justify-center gap-12 py-32">
                  <div className="h-16 w-16 border border-[var(--border)] flex items-center justify-center">
                    <RefreshCcw className="h-8 w-8 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="magazine-heading text-3xl text-[var(--fg)] mb-4">Generating Vector</p>
                    <p className="index-label animate-pulse">[ 00 ] SYNCING_WITH_GEMINI_CORE</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-mono bg-black border border-white/5 p-8 whitespace-pre-wrap text-zinc-300 max-h-[550px] overflow-y-auto custom-scrollbar leading-relaxed">
                  {optimizedResume}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-10 max-w-6xl mx-auto w-full pb-20 px-4">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-dot opacity-[0.05]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative z-10"
      >
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-6 mb-4">
            <span className="index-label">[ 00 ] OPPORTUNITY_MATRIX</span>
            <div className="h-px w-24 bg-[var(--border)]" />
          </div>

          <h1 className="magazine-heading text-6xl md:text-9xl">
            Intelligence <br />
            <span className="text-[var(--fg-muted)]">Match.</span>
          </h1>
          
          <p className="text-[var(--fg-subtle)] text-xl leading-tight font-medium max-w-2xl uppercase italic tracking-tighter">
            AI-ranked job vectors calibrated to your unique career footprint. <br />
            Market signals: <span className="text-[var(--fg)] font-black">ACTIVE</span> // 
            Match protocols: <span className="text-[var(--fg)] font-mono">OPTIMIZED</span>
          </p>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER MATRIX..."
              className="w-full bg-black border border-white/10 px-4 py-4 text-xs font-mono text-white focus:outline-none focus:border-white/40 transition-all"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMatches({ silent: true })}
            disabled={refreshing}
            className="h-16 w-16 border border-[var(--border)] bg-transparent hover:bg-[var(--bg-muted)]"
          >
            <RefreshCcw
              className={cn("h-6 w-6 text-[var(--fg-muted)]", refreshing && "animate-spin")}
            />
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-600 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
          <Button size="sm" variant="outline" onClick={() => fetchMatches()}>
            Retry
          </Button>
        </div>
      )}

      {!error && info && (
        <div className="p-4 border border-[var(--border)] bg-[var(--bg-subtle)] index-label text-[var(--fg-muted)]">
          [ INFO ] {info}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-12">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 border border-[var(--border)]" />
            <div className="absolute inset-0 border border-t-[var(--fg)] animate-spin" />
          </div>
          <p className="index-label animate-pulse">[ 00 ] SYNCING_OPPORTUNITY_ENGINE</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-32 border border-[var(--border)] bg-[var(--bg-subtle)] text-center relative group blueprint-border"
        >
          <div className="h-20 w-20 bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center mb-10 mx-auto">
            <Briefcase className="h-10 w-10 text-[var(--fg-muted)] group-hover:text-[var(--fg)] transition-colors" />
          </div>
          <h3 className="magazine-heading text-4xl text-[var(--fg)] mb-6">No Signals Found</h3>
          <p className="index-label text-[var(--fg-muted)] max-w-sm mx-auto">
            [ 00 ] {searchQuery
              ? "MATRIX_EMPTY_FOR_QUERY"
              : "UPLOAD_VECTOR_TO_ACTIVATE_ALGORITHM"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {filteredMatches.map((job) => {
            const score = job.match?.score ?? 0;
            const matchedSkills = job.match?.matchedSkills ?? [];
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="blueprint-border p-12 bg-[var(--bg-subtle)] flex flex-col h-full group/card transition-all">
                  <div className="flex items-start justify-between gap-8 mb-10">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black text-[var(--fg)] italic uppercase tracking-tighter truncate mb-3">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-4 index-label text-[var(--fg-muted)]">
                        <span>{job.company}</span>
                        <div className="w-1 h-1 bg-[var(--border)]" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="index-label text-white font-mono">
                        {score}% MATCH
                      </span>
                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="index-label text-zinc-800 hover:text-white transition-all"
                        >
                          OPEN →
                        </a>
                      )}
                    </div>
                  </div>

                  {matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-10">
                      {matchedSkills.slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          className="status-block status-block-outline text-[8px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                    <span className="index-label text-zinc-800">
                      READY
                    </span>
                    <button
                      onClick={() => handleOptimize(job)}
                      className="status-block status-block-active px-6 py-3"
                    >
                      Optimize Vector →
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
