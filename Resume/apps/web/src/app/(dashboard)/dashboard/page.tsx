"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Activity,
  Briefcase,
  TrendingUp,
  Zap,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

export default function DashboardPage() {
  const { data: statsData, isLoading } = useSWR("/api/dashboard/stats");

  const stats = useMemo(
    () =>
      statsData?.stats || {
        score: 0,
        applications: 0,
        matches: 0,
        roadmap: 0,
      },
    [statsData],
  );

  const activities: Array<{
    action: string;
    item: string;
    time: string;
    status: string;
  }> = statsData?.activities || [];

  const loading = isLoading;

  const statCards = [
    {
      id: "SCORE",
      value: stats.score > 0 ? stats.score : "--",
      suffix: stats.score > 0 ? "/100" : "",
      icon: Activity,
      desc: stats.score > 0 ? "Placement rating" : "Upload resume to score",
      href: "/dashboard/analysis",
    },
    {
      id: "APPLICATIONS",
      value: stats.applications,
      suffix: "",
      icon: CheckCircle2,
      desc: "Tracked instances",
      href: "/dashboard/applications",
    },
    {
      id: "JOB_MATCHES",
      value: stats.matches,
      suffix: "",
      icon: Briefcase,
      desc: "Vectors matched",
      href: "/dashboard/jobs",
    },
    {
      id: "ROADMAP",
      value: stats.roadmap > 0 ? `${stats.roadmap}%` : "--",
      suffix: "",
      icon: TrendingUp,
      desc: stats.roadmap > 0 ? "Execution progress" : "Generate a roadmap",
      href: "/dashboard/roadmap",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full pb-24">
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 blueprint-border opacity-20" />
      </div>

      <div className="flex flex-col gap-16 w-full max-w-7xl mx-auto relative z-10 px-4 md:px-0">
        
        {/* Header Block */}
        <div className="pt-12 md:pt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-[var(--fg)] pb-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="index-label">[ 00 ] OPERATION_OVERVIEW</span>
                <div className="h-px w-16 bg-[var(--border)]" />
              </div>
              <h1 className="magazine-heading text-4xl md:text-5xl">
                Career<br />
                <span className="text-[var(--fg-muted)]">Vector.</span>
              </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard/resume" className="btn-primary py-3 px-6 text-sm">
                Upload Resume
              </Link>
            </div>
          </div>
        </div>

        {/* System Error / Onboarding Banner */}
        {stats.score === 0 && !loading && (
          <div className="offset-card border-2 border-[var(--fg)] p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-[var(--bg-muted)]">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-[var(--bg)] border-2 border-[var(--fg)] flex items-center justify-center flex-shrink-0">
                <Zap className="h-8 w-8 text-[var(--fg)]" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight mb-2">System Halted</h3>
                <p className="text-[var(--fg-muted)] font-medium">
                  The engine requires a raw resume PDF to initialize AI modules.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/resume"
              className="btn-primary whitespace-nowrap flex items-center gap-2"
            >
              Upload PDF <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 offset-card animate-pulse bg-[var(--bg-muted)]"
                />
              ))
            : statCards.map((card) => (
                <Link
                  key={card.id}
                  href={card.href}
                  className="offset-card p-6 hover:bg-[var(--bg-muted)] transition-colors group flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="index-label">{card.id}</span>
                    <card.icon className="h-6 w-6 text-[var(--fg)] opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-5xl font-black font-mono tracking-tighter text-[var(--fg)]">
                        {card.value}
                      </span>
                      {card.suffix && (
                        <span className="text-lg font-bold text-[var(--fg-muted)]">
                          {card.suffix}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[var(--fg-subtle)]">
                      {card.desc}
                    </p>
                  </div>
                </Link>
              ))}
        </div>

        {/* Event Stream */}
        <div className="blueprint-border p-8 md:p-12">
          <div className="flex items-center justify-between mb-10 border-b border-[var(--border)] pb-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Event Stream</h2>
            <span className="index-label">LATEST</span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-[var(--fg-muted)] font-mono animate-pulse">Fetching stream...</div>
            ) : activities.length > 0 ? (
              activities.map((activity, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors gap-4">
                  <div className="flex items-center gap-6">
                    <span className="index-label min-w-[120px]">{activity.time}</span>
                    <span className="font-bold text-sm uppercase tracking-widest">{activity.action}</span>
                  </div>
                  <div className="flex items-center gap-6 justify-between sm:justify-end flex-1">
                    <span className="text-[var(--fg-muted)] text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{activity.item}</span>
                    <div className="status-block text-xs py-2">{activity.status}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 border border-[var(--border)] text-center">
                <span className="index-label block mb-2">Stream Empty</span>
                <p className="text-[var(--fg-muted)] font-medium text-sm">Upload a resume to populate event stream.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
