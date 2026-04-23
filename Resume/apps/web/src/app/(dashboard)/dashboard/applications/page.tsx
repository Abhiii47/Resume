"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  Briefcase,
  Loader2,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@repo/ui";

const statusConfig: Record<
  string,
  { bg: string; text: string; border: string; icon: typeof CheckCircle2 }
> = {
  APPLIED: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    icon: Send,
  },
  INTERVIEW: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    icon: Clock,
  },
  OFFER: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    border: "border-green-500/20",
    icon: CheckCircle2,
  },
  REJECTED: {
    bg: "bg-red-500/10",
    text: "text-red-600",
    border: "border-red-500/20",
    icon: Briefcase,
  },
  default: {
    bg: "bg-[var(--bg-muted)]",
    text: "text-[var(--fg-muted)]",
    border: "border-[var(--border)]",
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
      <div className="flex items-center justify-center h-full gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--fg-muted)]" />
        <span className="text-sm text-[var(--fg-muted)]">
          Loading applications...
        </span>
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
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
                <Send className="h-3.5 w-3.5 text-[var(--accent-fg)]" />
              </div>
              <span className="text-xs text-[var(--fg-muted)] font-medium uppercase tracking-wider">
                Applications
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Application Tracker
            </h1>
            <p className="text-sm text-[var(--fg-subtle)] mt-1 max-w-xl">
              Monitor and track all your job applications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchApplications({ silent: true })}
              disabled={refreshing}
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="text-sm"
            >
              <Send className="h-4 w-4 mr-1.5" /> New Application
            </Button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-600 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchApplications()}
          >
            Retry
          </Button>
        </div>
      )}

      {feedback && !error && (
        <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm text-green-700">
          {feedback}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: "Total Applied", value: applications.length },
          { label: "Pending", value: pendingCount },
          { label: "Interviews", value: interviewCount },
          { label: "Offers", value: offerCount },
        ].map((s, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]"
          >
            <p className="text-xs text-[var(--fg-muted)] mb-1 uppercase tracking-wider">
              {s.label}
            </p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
      >
        <div className="border-b border-[var(--border)] p-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Send className="h-4 w-4" /> Applications
          </h2>
          <span className="text-xs text-[var(--fg-muted)]">
            {applications.length} total
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-[var(--fg-muted)]" />
            </div>
            <p className="text-sm text-[var(--fg-subtle)]">
              No applications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {applications.map((app, idx) => {
              const cfg = statusConfig[app.status] ?? statusConfig.default;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  className="p-4 hover:bg-[var(--bg-subtle)] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-[var(--fg-muted)]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium truncate">
                        {app.role}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--fg-muted)]">
                        <span>{app.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> {app.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {app.match > 0 && (
                      <div className="text-center hidden md:block">
                        <p className="text-xs text-[var(--fg-muted)]">Match</p>
                        <p className="text-sm font-medium">{app.match}%</p>
                      </div>
                    )}

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                    >
                      <StatusIcon className="h-3 w-3" /> {app.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold mb-4">Track New Application</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--fg-muted)] block mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={newApp.role}
                  onChange={(e) =>
                    setNewApp({ ...newApp, role: e.target.value })
                  }
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--fg-muted)] block mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={newApp.company}
                  onChange={(e) =>
                    setNewApp({ ...newApp, company: e.target.value })
                  }
                  placeholder="e.g. Vercel"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--fg-muted)] block mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={newApp.location}
                  onChange={(e) =>
                    setNewApp({ ...newApp, location: e.target.value })
                  }
                  placeholder="e.g. Remote"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--fg-muted)] block mb-1">
                  Job Link (Optional)
                </label>
                <input
                  type="url"
                  value={newApp.url}
                  onChange={(e) =>
                    setNewApp({ ...newApp, url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitApplication}
                disabled={submitting || !newApp.role || !newApp.company}
                className="flex-1"
              >
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
