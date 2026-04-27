"use client";

import { useMemo } from "react";
import {
  ArrowUpRight,
  Activity,
  Briefcase,
  TrendingUp,
  Zap,
  CheckCircle2,
  FileText,
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
      title: "Resume Score",
      value: stats.score > 0 ? stats.score : "—",
      suffix: stats.score > 0 ? "/100" : "",
      icon: Activity,
      description: stats.score > 0 ? "Placement rating" : "Upload to score",
      href: "/dashboard/analysis",
    },
    {
      title: "Applications",
      value: stats.applications,
      suffix: "",
      icon: CheckCircle2,
      description: "Total tracked",
      href: "/dashboard/applications",
    },
    {
      title: "Job Matches",
      value: stats.matches,
      suffix: "",
      icon: Briefcase,
      description: "Matched to profile",
      href: "/dashboard/jobs",
    },
    {
      title: "Roadmap",
      value: stats.roadmap > 0 ? `${stats.roadmap}%` : "—",
      suffix: "",
      icon: TrendingUp,
      description: stats.roadmap > 0 ? "Avg progress" : "Generate plan",
      href: "/dashboard/roadmap",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full py-10">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-dot opacity-[0.04]" />
      </div>

      <div className="flex flex-col gap-14 w-full max-w-7xl mx-auto relative z-10">

        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-[var(--border)]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="index-label">[ 00 ] OPERATION_OVERVIEW</span>
              <div className="h-px w-16 bg-[var(--border)]" />
            </div>
            <h1 className="magazine-heading text-6xl md:text-8xl">
              Career<br />
              <span className="text-[var(--fg-muted)]">Vector.</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="status-block status-block-outline">
              <span
                className="w-1.5 h-1.5 bg-emerald-500 inline-block"
                style={{ animation: "pulse-dim 2s ease-in-out infinite" }}
              />
              ENGINE_ONLINE
            </div>
          </div>
        </div>

        {/* ── Stats Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[var(--border)]">
          {loading
            ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 border-r border-[var(--border)] last:border-r-0 animate-pulse bg-[var(--bg-muted)]"
              />
            ))
            : statCards.map((card, idx) => (
              <Link
                key={card.title}
                href={card.href}
                className="group relative p-10 border-r border-[var(--border)] last:border-r-0 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="index-label group-hover:text-[var(--bg)] transition-colors">
                    {String(idx).padStart(2, "0")} / {card.title}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black tracking-tighter font-mono italic">
                    {card.value}
                  </span>
                  {card.suffix && (
                    <span className="text-xs font-mono opacity-40">
                      {card.suffix}
                    </span>
                  )}
                </div>
                <p className="index-label opacity-50 group-hover:text-[var(--bg)]">
                  {card.description}
                </p>
              </Link>
            ))}
        </div>

        {/* ── Main Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Activity Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="index-label">[ 01 ] EVENT_LOG</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <div className="flex flex-col border border-[var(--border)]">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-16 border-b border-[var(--border)] last:border-b-0 animate-pulse bg-[var(--bg-muted)]" />
                ))
              ) : activities.length > 0 ? (
                activities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-6 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    <div className="flex items-center gap-8">
                      <span className="font-mono text-[10px] text-[var(--fg-muted)] min-w-[60px]">
                        {activity.time}
                      </span>
                      <div>
                        <p className="font-black text-xs uppercase italic tracking-tighter">
                          {activity.action}
                        </p>
                        <p className="text-[10px] text-[var(--fg-muted)] font-mono truncate max-w-[240px]">
                          {activity.item}
                        </p>
                      </div>
                    </div>
                    <div className="tag shrink-0">
                      {activity.status}
                    </div>
                  </div>
                ))
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="h-12 w-12 border border-[var(--border)] flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[var(--fg-muted)]" />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase italic tracking-tighter mb-1">
                      No Activity Yet
                    </p>
                    <p className="index-label">Upload a resume to initialize your vector.</p>
                  </div>
                  <Link
                    href="/dashboard/resume"
                    className="status-block status-block-active mt-2 px-6 py-3"
                  >
                    Upload Resume →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="index-label">[ 02 ] QUICK_ACTIONS</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <div className="flex flex-col gap-3">
              {[
                { href: "/dashboard/resume", label: "Upload Resume", sub: "Analyze & score your PDF" },
                { href: "/dashboard/jobs", label: "Find Job Matches", sub: "AI-ranked live jobs" },
                { href: "/dashboard/roadmap", label: "Generate Roadmap", sub: "12-week learning plan" },
                { href: "/dashboard/interview", label: "Practice Interview", sub: "AI coaching & feedback" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="p-6 flex items-center justify-between group border border-[var(--border)] hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-xs uppercase italic tracking-tighter">{action.label}</span>
                    <span className="index-label group-hover:text-[var(--bg)] opacity-50">{action.sub}</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Onboarding Banner (when no data) ───────────────────── */}
        {stats.score === 0 && !loading && (
          <div className="p-10 border-2 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-14 w-14 border-2 border-[var(--bg)] flex items-center justify-center flex-shrink-0">
                <Zap className="h-7 w-7 fill-current" />
              </div>
              <div>
                <h3 className="magazine-heading text-3xl leading-none mb-2">
                  System Halted.
                </h3>
                <p className="text-xs font-mono opacity-70">
                  No resume detected. Upload your PDF to initialize all AI modules.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/resume"
              className="px-8 py-4 bg-[var(--bg)] text-[var(--fg)] font-black uppercase text-xs tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Upload Resume →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
