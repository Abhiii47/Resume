"use client";

import { useMemo } from "react";
import {
  Briefcase,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  FileText,
  TrendingUp,
  Zap,
  Map,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import useSWR from "swr";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility for tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardPage() {
  const { data: statsData, error, isLoading } = useSWR("/api/dashboard/stats");
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

  const loading = isLoading && !error;

  const statCards = [
    {
      title: "Resume Score",
      value: stats.score > 0 ? stats.score : "—",
      suffix: "/100",
      icon: Activity,
      description: stats.score > 0 ? "Overall rating" : "Upload to score",
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
      description: "Active this week",
      href: "/dashboard/jobs",
    },
    {
      title: "Roadmap",
      value: stats.roadmap > 0 ? `${stats.roadmap}%` : "—",
      suffix: "",
      icon: TrendingUp,
      description: stats.roadmap > 0 ? "Progress" : "Generate",
      href: "/dashboard/roadmap",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full py-12">
      {/* Background Decor - Minimalist */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-dot opacity-[0.05]" />
      </div>

      <div className="flex flex-col gap-16 w-full max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-[var(--border)]">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-6">
              <span className="index-label">[ 00 ] OPERATION_OVERVIEW</span>
              <div className="h-px w-24 bg-[var(--border)]" />
            </div>
            
            <h1 className="magazine-heading text-6xl md:text-9xl">
              Career <br />
              <span className="text-[var(--fg-muted)]">Vector.</span>
            </h1>

            <p className="text-[var(--fg-subtle)] text-xl max-w-xl leading-tight font-medium uppercase italic tracking-tight">
              Trajectory: <span className="text-[var(--fg)] font-black">STABLE</span> // 
              Optimization: <span className="text-[var(--fg)] font-mono">12%</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="status-block status-block-active">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ENGINE_ONLINE
            </div>
          </div>
        </div>

        {/* Stats Grid - Itsua Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[var(--border)] bg-[var(--bg-subtle)]">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 border-r border-[var(--border)] animate-pulse"
                />
              ))
            : statCards.map((card, idx) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group relative p-12 border-r border-[var(--border)] last:border-r-0 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-12">
                    <span className="index-label group-hover:text-[var(--bg)] transition-colors">
                      {idx.toString().padStart(2, '0')} / {card.title}
                    </span>
                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black tracking-tighter font-mono italic">
                        {card.value}
                      </span>
                      {card.suffix && (
                        <span className="text-xs font-mono opacity-40">
                          {card.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Recent Activity - 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <span className="index-label">[ 01 ] EVENT_LOG</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <div className="flex flex-col border border-[var(--border)]">
              {[
                {
                  action: "VECTOR_SCAN",
                  item: "Senior_Dev_Resume.pdf",
                  time: "14:20:05",
                  status: "COMPLETED",
                },
                {
                  action: "MATCH_SYNC",
                  item: "Staff Engineer @ Google",
                  time: "09:12:44",
                  status: "DETECTED",
                },
                {
                  action: "ROADMAP_GEN",
                  item: "Week 3: Core Architecture",
                  time: "YESTERDAY",
                  status: "SYNCHRONIZED",
                },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-8 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-muted)] transition-colors"
                >
                  <div className="flex items-center gap-12">
                    <span className="font-mono text-[10px] text-[var(--fg-muted)]">{activity.time}</span>
                    <div>
                      <p className="font-black text-sm uppercase italic tracking-tighter">
                        {activity.action}
                      </p>
                      <p className="text-[10px] text-[var(--fg-muted)] font-mono uppercase">
                        {activity.item}
                      </p>
                    </div>
                  </div>
                  <div className="status-block status-block-outline text-[8px]">
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions - 1 col */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <span className="index-label">[ 02 ] ACTIONS</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href="/dashboard/resume"
                className="blueprint-border p-8 flex items-center justify-between group hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all"
              >
                <div className="flex flex-col gap-1">
                  <span className="index-label group-hover:text-[var(--bg)] transition-colors">Vector Upload</span>
                  <span className="text-xs font-mono opacity-50">Prime engine</span>
                </div>
                <ArrowUpRight className="h-5 w-5" />
              </Link>
              
              <Link
                href="/dashboard/roadmap"
                className="blueprint-border p-8 flex items-center justify-between group hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all"
              >
                <div className="flex flex-col gap-1">
                  <span className="index-label group-hover:text-[var(--bg)] transition-colors">Map Trajectory</span>
                  <span className="text-xs font-mono opacity-50">Bridge gaps</span>
                </div>
                <ArrowUpRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Global Warning Overlay if No Stats */}
        {stats.score === 0 && !loading && (
          <div className="p-12 border-2 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-8">
              <div className="h-20 w-20 border-2 border-[var(--bg)] flex items-center justify-center flex-shrink-0">
                <Zap className="h-10 w-10 fill-current" />
              </div>
              <div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">
                  System Halted.
                </h3>
                <p className="text-sm font-black uppercase tracking-widest opacity-80">
                  Insufficient data for career vectorization. <br />
                  Upload your resume to initialize intelligence cores.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/resume"
              className="px-12 py-6 bg-[var(--bg)] text-[var(--fg)] font-black uppercase tracking-widest hover:scale-105 transition-all text-center"
            >
              Initialize Profile →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
