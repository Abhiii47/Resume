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
import { cn } from "@repo/ui";

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
      <div className="flex flex-col gap-16 max-w-7xl mx-auto w-full animate-pulse py-24 px-8 bg-[var(--bg)]">
        <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-[var(--border)] pb-12 gap-8">
          <div className="space-y-6 w-full">
            <div className="h-6 w-48 bg-[var(--bg-muted)] border-2 border-[var(--border)]" />
            <div className="h-24 w-full max-w-2xl bg-[var(--bg-muted)] border-2 border-[var(--border)]" />
          </div>
          <div className="h-24 w-48 bg-[var(--bg-muted)] border-2 border-[var(--border)]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
           {[1,2,3,4].map(i => <div key={i} className="h-40 border-4 border-[var(--border)] bg-[var(--bg-muted)]" />)}
        </div>
        <div className="h-96 w-full border-4 border-[var(--border)] bg-[var(--bg-muted)]" />
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
    <div className="relative flex flex-col gap-16 max-w-7xl mx-auto w-full pb-32 pt-16 px-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row justify-between items-end gap-12 border-b-4 border-[var(--fg)] pb-16"
      >
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black">[ 00 ] OUTBOUND_MATRIX</span>
              <div className="h-px w-32 bg-[var(--fg)]" />
            </div>
            <h1 className="magazine-heading text-4xl md:text-5xl text-[var(--fg)] leading-tight">
              Tracker.
            </h1>
          </div>
          <p className="text-lg text-[var(--fg)] font-bold leading-tight uppercase italic max-w-3xl border-l-4 border-[var(--fg)] pl-6">
            Monitor and serialize your active market signals. Maintain absolute visibility on outbound communication vectors.
          </p>
        </div>
        <div className="flex items-center gap-8 w-full md:w-auto">
          <button
            onClick={() => fetchApplications({ silent: true })}
            disabled={refreshing}
            className="h-24 w-24 border-4 border-[var(--fg)] bg-[var(--bg)] flex items-center justify-center hover:bg-[var(--bg-muted)] transition-all group"
          >
            <RefreshCcw
              className={cn("h-10 w-10 text-[var(--fg)] group-hover:rotate-180 transition-transform duration-700", refreshing && "animate-spin")}
            />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary h-24 px-12 flex items-center gap-6 text-xl flex-1 md:flex-none justify-center group"
          >
            INITIALIZE_TARGET <Send className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: "TOTAL_SENT", value: applications.length },
          { label: "PROCESSING", value: pendingCount },
          { label: "INTERVIEWS", value: interviewCount },
          { label: "OFFERS", value: offerCount },
        ].map((s, i) => (
          <div
            key={i}
            className="p-10 border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none flex flex-col items-center justify-center text-center relative blueprint-corners group hover:bg-[var(--bg-muted)] transition-colors"
          >
            <div className="corner-bl" />
            <div className="corner-br" />
            <p className="index-label text-[var(--fg-muted)] mb-4 text-xs font-black">
              {s.label}
            </p>
            <p className="text-6xl font-black font-mono text-[var(--fg)] group-hover:scale-110 transition-transform">{s.value.toString().padStart(2, '0')}</p>
          </div>
        ))}
      </div>

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
          <button onClick={() => fetchApplications()} className="btn-primary !bg-red-600 !border-red-600 !text-white px-12 py-5 text-lg">
            RE_TRY_PROTOCOL
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners"
      >
        <div className="corner-bl" />
        <div className="corner-br" />
        <div className="border-b-4 border-[var(--fg)] p-10 flex items-center justify-between bg-[var(--bg-muted)]">
          <h2 className="magazine-heading text-2xl md:text-3xl flex items-center gap-6">
            <Send className="h-6 w-6" /> Pipeline.
          </h2>
          <span className="status-block bg-[var(--fg)] text-[var(--bg)] border-2 border-[var(--fg)] font-black px-6 py-2 text-sm">
            ACTIVE_VECTORS: {applications.length.toString().padStart(2, '0')}
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-48 gap-12 bg-[var(--bg)]">
            <div className="h-32 w-32 border-4 border-[var(--fg)] bg-[var(--bg-muted)] flex items-center justify-center shadow-[16px_16px_0_0_var(--fg)]">
              <Briefcase className="h-16 w-16 text-[var(--fg)]" />
            </div>
            <div className="text-center">
              <h3 className="magazine-heading text-4xl mb-4">No Signals Detected.</h3>
              <p className="index-label font-black text-xl italic">[ 00 ] INITIALIZE_TARGET_TO_ACTIVATE_TRACKING</p>
            </div>
          </div>
        ) : (
          <div className="divide-y-4 divide-[var(--fg)]">
            {applications.map((app) => {
              const cfg = statusConfig[app.status] ?? statusConfig.default;
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={app.id}
                  className="p-12 hover:bg-[var(--bg-muted)] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-12 group cursor-pointer relative"
                >
                  <div className="flex items-center gap-10 flex-1 min-w-0">
                    <div className="h-20 w-20 border-4 border-[var(--fg)] bg-[var(--bg)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--fg)] group-hover:text-[var(--bg)] transition-colors shadow-[8px_8px_0_0_var(--fg)] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1">
                      <Briefcase className="h-10 w-10" />
                    </div>
                    <div className="min-w-0 space-y-4">
                      <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-[var(--fg)] truncate leading-tight group-hover:translate-x-2 transition-transform">
                        {app.role}
                      </h3>
                      <div className="flex flex-wrap items-center gap-6">
                        <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black text-xs uppercase">{app.company}</span>
                        <div className="w-2 h-2 bg-[var(--fg)] rounded-full opacity-20" />
                        <span className="flex items-center gap-3 index-label font-black text-xs uppercase">
                          <MapPin className="h-4 w-4" /> {app.location}
                        </span>
                        <div className="w-2 h-2 bg-[var(--fg)] rounded-full opacity-20" />
                        <span className="index-label font-black text-xs uppercase opacity-40">{app.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12 flex-shrink-0 w-full md:w-auto border-t md:border-t-0 pt-8 md:pt-0 border-[var(--fg)] border-opacity-10">
                    {app.match > 0 && (
                      <div className="text-center">
                        <p className="index-label text-[10px] mb-2 font-black opacity-40">SYNC_RATING</p>
                        <p className="text-3xl font-black font-mono text-[var(--fg)]">{app.match}%</p>
                      </div>
                    )}

                    <div className={cn(
                      "flex items-center gap-4 px-8 py-4 border-4 font-black uppercase text-sm italic tracking-widest flex-1 md:flex-none justify-center shadow-[8px_8px_0_0_currentColor]",
                      cfg.bg, cfg.text, cfg.border
                    )}>
                      <StatusIcon className="h-5 w-5" /> {app.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--fg)]/30 backdrop-blur-md p-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-[var(--bg)] border-8 border-[var(--fg)] p-16 relative blueprint-corners offset-card shadow-none"
          >
            <div className="corner-bl" />
            <div className="corner-br" />
            <div className="flex items-center justify-between mb-16 pb-8 border-b-4 border-[var(--fg)]">
              <h2 className="magazine-heading text-6xl text-[var(--fg)]">Initialize.</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-16 w-16 border-4 border-[var(--fg)] flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="index-label text-base font-black uppercase block">01_TARGET_ROLE</label>
                <input
                  type="text"
                  value={newApp.role}
                  onChange={(e) => setNewApp({ ...newApp, role: e.target.value })}
                  placeholder="E.G. SENIOR_FRONTEND_ARCHITECT"
                  className="w-full bg-[var(--bg-muted)] border-4 border-[var(--fg)] px-8 py-6 text-xl font-black italic uppercase text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-all placeholder:opacity-20"
                />
              </div>
              <div className="space-y-4">
                <label className="index-label text-base font-black uppercase block">02_ORGANIZATION</label>
                <input
                  type="text"
                  value={newApp.company}
                  onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                  placeholder="E.G. NEURAL_SYSTEMS_INC"
                  className="w-full bg-[var(--bg-muted)] border-4 border-[var(--fg)] px-8 py-6 text-xl font-black italic uppercase text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-all placeholder:opacity-20"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="index-label text-base font-black uppercase block">03_LOCATION</label>
                  <input
                    type="text"
                    value={newApp.location}
                    onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                    placeholder="E.G. REMOTE_NODE"
                    className="w-full bg-[var(--bg-muted)] border-4 border-[var(--fg)] px-6 py-5 text-lg font-black italic uppercase text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-all placeholder:opacity-20"
                  />
                </div>
                <div className="space-y-4">
                  <label className="index-label text-base font-black uppercase block">04_SOURCE_URL</label>
                  <input
                    type="url"
                    value={newApp.url}
                    onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                    placeholder="HTTPS://VECTOR.NETWORK/..."
                    className="w-full bg-[var(--bg-muted)] border-4 border-[var(--fg)] px-6 py-5 text-lg font-black italic uppercase text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] transition-all placeholder:opacity-20"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-10 mt-20 pt-12 border-t-4 border-[var(--fg)]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="status-block bg-[var(--bg-muted)] text-[var(--fg)] border-4 border-[var(--fg)] flex-1 py-6 hover:bg-white transition-all font-black text-lg uppercase italic"
              >
                ABORT_PROTOCOL
              </button>
              <button
                onClick={submitApplication}
                disabled={submitting || !newApp.role || !newApp.company}
                className="btn-primary flex-[2] py-6 disabled:opacity-20 text-2xl"
              >
                {submitting ? "PROCESSING..." : "COMMIT_VECTOR"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

