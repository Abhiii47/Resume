"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  Briefcase,
  RefreshCcw,
  AlertCircle,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

const statusConfig: Record<
  string,
  { bg: string; text: string; border: string; icon: typeof CheckCircle2 }
> = {
  APPLIED: {
    bg: "bg-black",
    text: "text-white",
    border: "border-[var(--fg)]",
    icon: Send,
  },
  INTERVIEW: {
    bg: "bg-[var(--bg-muted)]",
    text: "text-[var(--fg)]",
    border: "border-[var(--fg)]",
    icon: Clock,
  },
  OFFER: {
    bg: "bg-[var(--fg)]",
    text: "text-[var(--bg)]",
    border: "border-[var(--fg)]",
    icon: CheckCircle2,
  },
  REJECTED: {
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-500",
    icon: Briefcase,
  },
  default: {
    bg: "bg-[var(--bg)]",
    text: "text-[var(--fg)]",
    border: "border-[var(--fg)]",
    icon: Briefcase,
  },
};

type ApplicationListItem = {
  id: string;
  role: string;
  company: string;
  location: string;
  status: string;
  date: string;
  match: number;
};

type ApplicationApiItem = {
  id: string;
  status?: string | null;
  appliedAt?: string | null;
  createdAt?: string | null;
  job?: {
    title?: string | null;
    company?: string | null;
    location?: string | null;
    matchScore?: number | null;
    sourceUrl?: string | null;
  } | null;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newApp, setNewApp] = useState({
    role: "",
    company: "",
    location: "",
    url: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function fetchApplications(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      setError(null);
      const res = await fetch("/api/applications");
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to fetch applications.");
        return;
      }

      if (data.applications) {
        setApplications(
          data.applications.map((app: ApplicationApiItem) => ({
            id: app.id,
            role: app.job?.title ?? "Unknown Role",
            company: app.job?.company ?? "Unknown Company",
            location: app.job?.location ?? "Remote",
            status: app.status ?? "APPLIED",
            date: new Date(
              app.appliedAt ?? app.createdAt ?? Date.now(),
            ).toLocaleDateString(),
            match: app.job?.matchScore ?? 0,
          })),
        );
      } else {
        setApplications([]);
      }
    } catch (e) {
      console.error("Failed to fetch applications:", e);
      setError("Network error while loading applications.");
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }

  async function submitApplication() {
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to save application.");
        return;
      }

      setIsModalOpen(false);
      setNewApp({ role: "", company: "", location: "", url: "" });
      setFeedback("Application added successfully.");
      await fetchApplications({ silent: true });
    } catch (e) {
      console.error("Failed to submit", e);
      setError("Network error while saving application.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    fetchApplications();
    const id = setInterval(() => {
      void fetchApplications({ silent: true });
    }, 60000);

    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-12">
        <div className="relative h-20 w-20 border-4 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)]">
          <div className="absolute inset-0 border-[var(--fg)] animate-spin border-t-4" />
        </div>
        <p className="index-label animate-pulse text-[var(--fg)]">
          [ 00 ] SYNCING_APPLICATION_ENGINE
        </p>
      </div>
    );
  }

  const pendingCount = applications.filter(
    (a) =>
      a.status === "Pending User Approval" ||
      a.status === "Drafting Cover Letter",
  ).length;
  const interviewCount = applications.filter(
    (a) => a.status === "INTERVIEW",
  ).length;
  const offerCount = applications.filter((a) => a.status === "OFFER").length;

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto w-full pb-20 px-4 pt-8">
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
            <span className="index-label text-[var(--fg)]">[ 00 ] OUTBOUND_MATRIX</span>
            <div className="h-px w-24 bg-[var(--fg)]" />
          </div>
          <h1 className="magazine-heading text-6xl md:text-8xl text-[var(--fg)] leading-none">
            Tracker.
          </h1>
          <p className="text-[var(--fg-subtle)] text-lg leading-tight font-medium max-w-xl uppercase tracking-tighter mt-6">
            Monitor and serialize your active market signals. Maintain absolute
            visibility on outbound communication vectors.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => fetchApplications({ silent: true })}
            disabled={refreshing}
            className="h-[52px] w-[52px] border-2 border-[var(--fg)] bg-[var(--bg)] flex items-center justify-center hover:bg-[var(--bg-muted)] offset-card"
          >
            <RefreshCcw
              className={`h-6 w-6 text-[var(--fg)] ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary h-[52px] px-8 flex items-center gap-3 text-sm flex-1 md:flex-none justify-center"
          >
            <Send className="h-4 w-4" /> Initialize Target
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 border-2 border-red-500 bg-red-50 text-sm text-red-600 flex items-center justify-between gap-3 offset-card">
          <span className="flex items-center gap-2 font-bold">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
          <button
            className="status-block bg-white text-red-600 border-2 border-red-500 px-4 py-1 text-xs"
            onClick={() => fetchApplications()}
          >
            Retry
          </button>
        </div>
      )}

      {feedback && !error && (
        <div className="p-4 border-2 border-[var(--fg)] bg-[var(--bg-muted)] index-label text-[var(--fg)] offset-card">
          [ INFO ] {feedback}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        {[
          { label: "Total Sent", value: applications.length },
          { label: "Processing", value: pendingCount },
          { label: "Interviews", value: interviewCount },
          { label: "Offers", value: offerCount },
        ].map((s, i) => (
          <div
            key={i}
            className="p-8 border-2 border-[var(--fg)] bg-[var(--bg)] offset-card flex flex-col items-center justify-center text-center"
          >
            <p className="index-label text-[var(--fg-muted)] mb-2">
              {s.label}
            </p>
            <p className="text-4xl font-black font-mono text-[var(--fg)]">{s.value}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-2 border-[var(--fg)] bg-[var(--bg)] offset-card"
      >
        <div className="border-b-2 border-[var(--fg)] p-6 md:p-8 flex items-center justify-between bg-[var(--bg-muted)]">
          <h2 className="index-label text-[var(--fg)] flex items-center gap-3 text-sm md:text-base">
            <Send className="h-5 w-5" /> Pipeline Status
          </h2>
          <span className="status-block bg-[var(--bg)] text-[var(--fg)] border-2 border-[var(--fg)] font-mono px-4 py-1">
            COUNT: {applications.length.toString().padStart(2, '0')}
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="h-20 w-20 border-2 border-[var(--fg)] bg-[var(--bg-muted)] flex items-center justify-center offset-card">
              <Briefcase className="h-8 w-8 text-[var(--fg)]" />
            </div>
            <p className="index-label text-[var(--fg-muted)]">
              [ NO_SIGNALS_DETECTED ]
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-[var(--fg)]">
            {applications.map((app, idx) => {
              const cfg = statusConfig[app.status] ?? statusConfig.default;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  className="p-6 md:p-8 hover:bg-[var(--bg-muted)] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group cursor-pointer"
                >
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="h-14 w-14 border-2 border-[var(--fg)] bg-[var(--bg)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--fg)] group-hover:text-[var(--bg)] transition-colors">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-[var(--fg)] truncate">
                        {app.role}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 index-label text-[var(--fg-muted)] mt-2">
                        <span>{app.company}</span>
                        <div className="w-1.5 h-1.5 bg-[var(--fg)]" />
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> {app.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    {app.match > 0 && (
                      <div className="text-center hidden md:block">
                        <p className="index-label text-[var(--fg-muted)] mb-1">SCORE</p>
                        <p className="text-xl font-black font-mono text-[var(--fg)]">{app.match}%</p>
                      </div>
                    )}

                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest border-2 ${cfg.bg} ${cfg.text} ${cfg.border} shadow-[2px_2px_0px_0px_currentColor]`}
                    >
                      <StatusIcon className="h-4 w-4" /> {app.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/90 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-[var(--bg)] border-2 border-[var(--fg)] p-8 md:p-12 offset-card"
          >
            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-[var(--fg)]">
              <h2 className="magazine-heading text-4xl text-[var(--fg)]">Initialize Target</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 border-2 border-[var(--fg)] flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="index-label text-[var(--fg)] block mb-3">
                  Target Role
                </label>
                <input
                  type="text"
                  value={newApp.role}
                  onChange={(e) =>
                    setNewApp({ ...newApp, role: e.target.value })
                  }
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-[var(--bg-muted)] border-2 border-[var(--fg)] px-4 py-4 text-sm font-medium text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-colors placeholder:text-[var(--fg-subtle)]"
                />
              </div>
              <div>
                <label className="index-label text-[var(--fg)] block mb-3">
                  Company
                </label>
                <input
                  type="text"
                  value={newApp.company}
                  onChange={(e) =>
                    setNewApp({ ...newApp, company: e.target.value })
                  }
                  placeholder="e.g. Vercel"
                  className="w-full bg-[var(--bg-muted)] border-2 border-[var(--fg)] px-4 py-4 text-sm font-medium text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-colors placeholder:text-[var(--fg-subtle)]"
                />
              </div>
              <div>
                <label className="index-label text-[var(--fg)] block mb-3">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={newApp.location}
                  onChange={(e) =>
                    setNewApp({ ...newApp, location: e.target.value })
                  }
                  placeholder="e.g. Remote"
                  className="w-full bg-[var(--bg-muted)] border-2 border-[var(--fg)] px-4 py-4 text-sm font-medium text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-colors placeholder:text-[var(--fg-subtle)]"
                />
              </div>
              <div>
                <label className="index-label text-[var(--fg)] block mb-3">
                  Job Link (Optional)
                </label>
                <input
                  type="url"
                  value={newApp.url}
                  onChange={(e) =>
                    setNewApp({ ...newApp, url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full bg-[var(--bg-muted)] border-2 border-[var(--fg)] px-4 py-4 text-sm font-medium text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-colors placeholder:text-[var(--fg-subtle)]"
                />
              </div>
            </div>
            <div className="flex gap-6 mt-10 pt-8 border-t-2 border-[var(--fg)]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="status-block bg-[var(--bg-muted)] text-[var(--fg)] border-2 border-[var(--fg)] flex-1 py-4 hover:bg-[var(--bg)] transition-colors"
              >
                ABORT
              </button>
              <button
                onClick={submitApplication}
                disabled={submitting || !newApp.role || !newApp.company}
                className="btn-primary flex-[2] py-4 disabled:opacity-50"
              >
                {submitting ? "PROCESSING..." : "COMMIT VECTOR"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
