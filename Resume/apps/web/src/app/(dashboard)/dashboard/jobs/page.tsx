"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Briefcase, RefreshCcw, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@repo/ui";

type JobMatch = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  sourceUrl?: string;
  applied?: boolean;
  match?: {
    score?: number;
    matchedSkills?: string[];
  };
};

export default function JobsPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    } catch (fetchError) {
      console.error("Match fetch failed", fetchError);
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
    void fetchMatches();
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
    } catch (optimizeError) {
      console.error("Optimization failed", optimizeError);
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
    } catch (saveError) {
      console.error("Save failed", saveError);
      setError("Network error while saving optimized resume.");
    }
  };

  const handleApply = async (job: JobMatch) => {
    setApplyingJobId(job.id);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to track application.");
        return;
      }

      setMatches((current) =>
        current.map((entry) =>
          entry.id === job.id ? { ...entry, applied: true } : entry,
        ),
      );
      setSaveSuccess("Application saved to your tracker.");
    } catch (applyError) {
      console.error("Application tracking failed", applyError);
      setError("Network error while tracking application.");
    } finally {
      setApplyingJobId(null);
    }
  };

  const filteredMatches = matches.filter(
    (job) =>
      !searchQuery ||
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (selectedJob && (optimizing || optimizedResume)) {
    return (
      <div className="relative flex flex-col h-screen w-full bg-[var(--bg)] overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b-4 border-[var(--fg)] bg-[var(--bg-muted)]">
          <button
            onClick={() => {
              setSelectedJob(null);
              setOptimizedResume(null);
              setSaveSuccess(null);
            }}
            className="magazine-heading text-2xl text-[var(--fg)] hover:-translate-x-2 transition-transform flex items-center gap-4"
          >
            {"<-"} BACK_TO_MATRIX
          </button>
          <div className="flex items-center gap-6">
             <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black">[ REFINING_VECTOR ]</span>
             <div className="h-px w-24 bg-[var(--fg)] opacity-20" />
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Job Details Panel */}
          <div className="flex-1 overflow-y-auto p-12 border-b lg:border-b-0 lg:border-r-4 border-[var(--fg)] bg-[var(--bg)] custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-12">
               <div className="space-y-6">
                 <div className="flex items-center gap-6">
                    <span className="status-block bg-[var(--fg)] text-[var(--bg)] px-6 py-2 text-base font-black">
                      {selectedJob.match?.score}% SYNC_MATCH
                    </span>
                    <span className="index-label">VECT_ID: {selectedJob.id.slice(0,8)}</span>
                 </div>
                 <h2 className="magazine-heading text-3xl md:text-5xl leading-tight mb-8">{selectedJob.title}</h2>
                 <div className="flex flex-wrap items-center gap-10">
                    <div className="flex flex-col">
                      <span className="index-label opacity-50">Organization</span>
                      <span className="text-xl font-black italic uppercase">{selectedJob.company}</span>
                    </div>
                    <div className="h-10 w-px bg-[var(--fg)] opacity-20" />
                    <div className="flex flex-col">
                      <span className="index-label opacity-50">Location</span>
                      <span className="text-xl font-black italic uppercase">{selectedJob.location}</span>
                    </div>
                 </div>
               </div>

               <div className="p-12 border-4 border-[var(--fg)] bg-[var(--bg-muted)] relative blueprint-corners">
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  <h3 className="index-label text-base font-black mb-8 border-b-2 border-[var(--fg)] pb-4">[ 01 ] SOURCE_DESCRIPTION</h3>
                  <div className="text-xl text-[var(--fg)] leading-relaxed font-bold italic uppercase tracking-tight whitespace-pre-wrap">
                    {selectedJob.description}
                  </div>
               </div>
            </div>
          </div>

          {/* Optimization Output Panel */}
          <div className="flex-1 overflow-y-auto p-12 bg-[var(--bg-muted)] custom-scrollbar relative">
             <div className="max-w-3xl mx-auto space-y-12">
               <div className="flex items-center justify-between border-b-4 border-[var(--fg)] pb-8">
                 <h3 className="magazine-heading text-4xl">Optimized.</h3>
                 {optimizedResume && !optimizing && (
                    <button
                      onClick={handleSaveVersion}
                      className="btn-primary py-4 px-10 text-sm"
                    >
                      COMMIT_TO_HISTORY {"->"}
                    </button>
                 )}
               </div>

               {optimizing ? (
                 <div className="flex flex-col items-center justify-center py-32 gap-12 bg-[var(--bg)] border-4 border-[var(--fg)] offset-card shadow-none">
                    <div className="relative h-24 w-24 border-4 border-[var(--fg)] flex items-center justify-center">
                      <div className="absolute inset-0 border-t-4 border-[var(--fg)] animate-spin" />
                      <RefreshCcw className="h-10 w-10" />
                    </div>
                    <div className="text-center">
                      <h4 className="magazine-heading text-3xl mb-4">Processing.</h4>
                      <p className="index-label animate-pulse">[ 00 ] SYNCING_WITH_GEMINI_CORE_V4</p>
                    </div>
                 </div>
               ) : (
                 <div className="p-10 bg-[var(--bg)] border-4 border-[var(--fg)] text-lg font-mono text-[var(--fg)] leading-relaxed whitespace-pre-wrap relative blueprint-corners offset-card shadow-none">
                    <div className="corner-bl" />
                    <div className="corner-br" />
                    {optimizedResume}
                 </div>
               )}

               {saveSuccess && (
                 <div className="p-8 border-4 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] font-black uppercase text-center animate-bounce">
                    VERSION_COMMITTED_SUCCESSFULLY
                 </div>
               )}

               {error && (
                 <div className="p-8 border-4 border-red-600 bg-red-50 text-red-600 font-black uppercase flex items-center gap-6">
                    <AlertCircle className="h-8 w-8" /> {error}
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-16 max-w-7xl mx-auto w-full pb-32 pt-16 px-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-16 border-b-4 border-[var(--fg)] pb-16"
      >
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black">[ 00 ] OPPORTUNITY_MATRIX</span>
              <div className="h-px w-32 bg-[var(--fg)]" />
            </div>
            <h1 className="magazine-heading text-4xl md:text-5xl text-[var(--fg)] leading-tight">
              Intelligence <br />
              <span className="text-[var(--fg-muted)]">Match.</span>
            </h1>
          </div>
          <p className="text-lg text-[var(--fg)] font-bold leading-tight uppercase italic max-w-2xl border-l-4 border-[var(--fg)] pl-6">
            AI-ranked job vectors calibrated to your unique career footprint.
            Market signals: <span className="text-emerald-500 font-black animate-pulse">ACTIVE_RECEPTION</span>
          </p>
        </div>

        <div className="flex items-center gap-6 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-96 group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH_MATRIX_NODE..."
              className="w-full bg-[var(--bg-muted)] border-4 border-[var(--fg)] px-8 py-6 text-base font-black font-mono text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-all offset-card shadow-none"
            />
          </div>
          <button
            onClick={() => fetchMatches({ silent: true })}
            disabled={refreshing}
            className="h-20 w-20 border-4 border-[var(--fg)] bg-[var(--bg)] flex items-center justify-center hover:bg-[var(--bg-muted)] transition-all group"
          >
            <RefreshCcw
              className={cn("h-10 w-10 text-[var(--fg)] group-hover:rotate-180 transition-transform duration-700", refreshing && "animate-spin")}
            />
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-10 border-4 border-red-600 bg-red-50 flex items-center justify-between gap-10 offset-card relative blueprint-corners shadow-none">
          <div className="corner-bl !border-red-600" />
          <div className="corner-br !border-red-600" />
          <div className="flex items-center gap-8">
            <AlertCircle className="h-12 w-12 text-red-600" />
            <div className="flex flex-col">
              <span className="magazine-heading text-3xl text-red-600">Signal Error</span>
              <span className="index-label text-red-900 font-black text-base">{error}</span>
            </div>
          </div>
          <button onClick={() => fetchMatches()} className="btn-primary !bg-red-600 !border-red-600 !text-white px-12 py-5 text-lg">
            RE_TRY_PROTOCOL
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 gap-16">
          <div className="relative h-32 w-32 border-8 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)] shadow-[20px_20px_0_0_var(--bg-muted)]">
            <div className="absolute inset-0 border-t-8 border-[var(--fg)] animate-spin" />
            <Briefcase className="h-12 w-12" />
          </div>
          <div className="text-center">
             <h3 className="magazine-heading text-5xl mb-4">Syncing Matrix</h3>
             <p className="index-label text-2xl font-black animate-pulse">[ 00 ] DECODING_MARKET_SIGNALS</p>
          </div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-32 border-8 border-[var(--fg)] bg-[var(--bg-muted)] text-center relative group offset-card shadow-none"
        >
          <div className="corner-bl" />
          <div className="corner-br" />
          <div className="h-40 w-40 bg-[var(--bg)] border-4 border-[var(--fg)] flex items-center justify-center mb-12 mx-auto shadow-[16px_16px_0_0_var(--fg)]">
            <Briefcase className="h-20 w-20 text-[var(--fg)] group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="magazine-heading text-6xl text-[var(--fg)] mb-8">
            Zero Matches.
          </h3>
          <p className="text-xl text-[var(--fg)] font-bold uppercase border-y-2 border-[var(--fg)] py-8 max-w-2xl mx-auto italic">
            [ 00 ] {searchQuery ? "MATRIX_EMPTY_FOR_QUERY_NODE" : "UPLOAD_SOURCE_VECTOR_TO_ACTIVATE_MATCHING_PROTOCOL"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          {filteredMatches.map((job) => {
            const score = job.match?.score ?? 0;
            const matchedSkills = job.match?.matchedSkills ?? [];

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full"
              >
                <div className="border-4 border-[var(--fg)] p-12 bg-[var(--bg)] flex flex-col h-full group/card transition-all offset-card hover:bg-[var(--bg-muted)] relative blueprint-corners">
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  
                  <div className="flex items-start justify-between gap-10 mb-12 border-b-2 border-[var(--fg)] pb-8">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-2xl font-black text-[var(--fg)] italic uppercase tracking-tighter truncate mb-4 group-hover/card:translate-x-2 transition-transform">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-6">
                        <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-2 py-0.5 text-xs font-black">{job.company}</span>
                        <div className="h-1 w-1 bg-[var(--fg)] rounded-full" />
                        <span className="index-label font-bold text-xs">{job.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-4 min-w-[140px]">
                      <div className="text-4xl font-black font-mono text-[var(--fg)]">{score}%</div>
                      <span className="index-label text-[10px] opacity-50">SYNC_RATING</span>
                    </div>
                  </div>

                  {matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-16">
                      {matchedSkills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="status-block bg-[var(--bg)] border-2 border-[var(--fg)] text-[var(--fg)] text-[10px] px-4 py-2 font-black italic"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-10 border-t-4 border-[var(--fg)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-3 w-3 rounded-full animate-pulse", job.applied ? "bg-emerald-500" : "bg-orange-500")} />
                      <span className="index-label font-black text-base italic">
                        {job.applied ? "TRACKED" : "UNSTABLE"}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleApply(job)}
                        disabled={Boolean(job.applied) || applyingJobId === job.id}
                        className="status-block bg-[var(--bg)] text-[var(--fg)] border-4 border-[var(--fg)] px-8 py-4 disabled:opacity-30 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all font-black text-sm uppercase"
                      >
                        {job.applied ? "TRACKED" : applyingJobId === job.id ? "SAVING..." : "TRACK_APPLY"}
                      </button>
                      <button
                        onClick={() => handleOptimize(job)}
                        className="btn-primary px-10 py-4 text-sm font-black flex items-center gap-4"
                      >
                        OPTIMIZE <Rocket className="h-4 w-4" />
                      </button>
                    </div>
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

