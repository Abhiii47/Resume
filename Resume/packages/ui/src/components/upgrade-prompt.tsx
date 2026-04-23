"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

interface UpgradePromptProps {
  feature?: string;
  used?: number;
  limit?: number;
  plan?: string;
  message?: string;
}

export function UpgradePrompt({
  feature,
  used,
  limit,
  plan = "FREE",
  message,
}: UpgradePromptProps) {
  const defaultMessage =
    feature && limit
      ? `You've used ${used ?? 0} of ${limit} ${feature} on your ${plan} plan.`
      : (message ?? "You've reached the limit on your current plan.");

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 p-10 text-center shadow-2xl">
      {/* Premium ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full bg-violet-500/10 blur-[100px] animate-pulse" />
        <div className="h-48 w-48 rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Lock icon with aura */}
      <div className="relative mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm group">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Lock className="h-8 w-8 text-white transition-transform group-hover:scale-110 duration-500" />
      </div>

      <h3 className="relative mb-3 text-2xl font-black text-white tracking-tight">
        Elevate your search
      </h3>
      <p className="relative mx-auto mb-10 max-w-sm text-base text-zinc-400 leading-relaxed">
        {defaultMessage} Unlock unlimited AI analysis, priority job matching, and elite career roadmaps.
      </p>

      {/* Upgrade CTA */}
      <div className="flex flex-col items-center gap-4 relative">
        <Link
          href="/dashboard/billing"
          className="group relative inline-flex items-center gap-3 rounded-full bg-white px-10 py-4 text-base font-black text-black transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
        >
          <Sparkles className="h-4 w-4 fill-black animate-pulse" />
          Unlock Pro Access
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <div className="h-1 w-1 rounded-full bg-violet-500" />
            Unlimited Scans
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <div className="h-1 w-1 rounded-full bg-blue-500" />
            AI Simulations
          </div>
        </div>
      </div>

      <div className="relative mt-10 pt-6 border-t border-white/5">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
          Current Membership: <span className="text-zinc-400">{plan}</span>
        </p>
      </div>
    </div>
  );
}
