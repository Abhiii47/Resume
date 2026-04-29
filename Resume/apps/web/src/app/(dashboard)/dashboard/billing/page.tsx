"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BadgeCheck,
  Crown,
  Loader2,
  Sparkles,
  Zap,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@repo/ui";
import { useSession, PLAN_LIMITS } from "@repo/core/client";

type BillingState = {
  plan: "FREE" | "EARLY_BIRD" | "PREMIUM";
  status: "active" | "trialing" | "inactive";
  renewsAt: string | null;
  usage: {
    resumesAnalyzed: number;
    jobMatchesViewed: number;
    roadmapGenerations: number;
  };
};

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | typeof Infinity;
}) {
  const isUnlimited = limit === Infinity || limit === -1;
  const pct = isUnlimited ? 0 : Math.min((used / (limit as number)) * 100, 100);
  const nearLimit = !isUnlimited && pct >= 80;

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <span className="index-label text-[var(--fg)]">
          {label}
        </span>
        <span className="index-label text-[var(--fg)] font-bold">
          {isUnlimited ? (
            <span className="text-[var(--fg)]">UNLIMITED</span>
          ) : (
            <span className={nearLimit ? "text-amber-500" : ""}>
              {used} / {limit as number}
            </span>
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 w-full border border-[var(--border)] bg-[var(--bg-muted)]">
          <div
            className={`h-full transition-all duration-500 ${
              nearLimit ? "bg-amber-500" : "bg-[var(--fg)]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

const PLANS = [
  {
    id: "FREE",
    name: "Starter",
    price: "$0",
    period: "/mo",
    features: [
      "3 Resume Analyses",
      "5 Job Matches",
      "1 Roadmap",
      "2 Interview Sessions",
    ],
    cta: null,
  },
  {
    id: "EARLY_BIRD",
    name: "Early Bird",
    price: "$5",
    period: "/mo",
    features: [
      "20 Resume Scans",
      "30 Job Matches",
      "5 Roadmaps",
      "10 Interview Sessions",
    ],
    cta: "Upgrade to Early Bird",
    popular: true,
  },
  {
    id: "PREMIUM",
    name: "Elite",
    price: "$50",
    period: "/mo",
    features: [
      "Everything in Early Bird",
      "Unlimited Analyses",
      "Unlimited Job Matches",
      "Unlimited Roadmaps",
      "Priority Support",
    ],
    cta: "Upgrade to Elite",
  },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to load billing.");
        return;
      }
      setBilling(data.billing);
    } catch {
      setError("Network error while loading billing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
    // Handle success/cancel redirect from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      fetchBilling();
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, [fetchBilling]);

  const handleUpgrade = async (plan: "EARLY_BIRD" | "PREMIUM") => {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Stripe not yet configured — show friendly message
        alert(
          data.error ||
            "Stripe is not yet configured. Add your API keys to .env.",
        );
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const planLimits = PLAN_LIMITS[billing?.plan ?? "FREE"];

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
              <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black">[ 00 ] BILLING_MATRIX</span>
              <div className="h-px w-32 bg-[var(--fg)]" />
            </div>
            <h1 className="magazine-heading text-6xl md:text-9xl text-[var(--fg)] leading-[0.8]">
              Usage.
            </h1>
          </div>
          <p className="text-2xl text-[var(--fg)] font-bold leading-tight uppercase italic max-w-3xl border-l-4 border-[var(--fg)] pl-8">
            Manage your subscription tier and monitor system usage across all features. 
            Billing Status: <span className="text-emerald-500 font-black">ACTIVE_NODE</span>
          </p>
        </div>
        <div className="flex items-center gap-8 w-full md:w-auto">
          <button
            onClick={fetchBilling}
            className="btn-primary h-24 px-12 flex items-center gap-6 text-xl flex-1 md:flex-none justify-center group"
          >
            REFRESH_STATUS <Zap className="h-6 w-6 group-hover:scale-125 transition-transform" />
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 gap-16">
          <div className="relative h-32 w-32 border-8 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)] shadow-[20px_20px_0_0_var(--bg-muted)]">
            <div className="absolute inset-0 border-t-8 border-[var(--fg)] animate-spin" />
            <Crown className="h-12 w-12" />
          </div>
          <div className="text-center">
             <h3 className="magazine-heading text-5xl mb-4">Syncing Credits</h3>
             <p className="index-label text-2xl font-black animate-pulse">[ 00 ] DECODING_USAGE_VECTORS</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-16 border-4 border-red-600 bg-red-50 flex items-center justify-between gap-12 offset-card shadow-none relative blueprint-corners">
          <div className="corner-bl !border-red-600" />
          <div className="corner-br !border-red-600" />
          <div className="flex items-center gap-10">
            <BadgeCheck className="h-16 w-16 text-red-600" />
            <div>
              <h3 className="magazine-heading text-4xl text-red-600 mb-2">Sync Error</h3>
              <p className="index-label text-xl font-black uppercase text-red-900 opacity-60 italic">{error}</p>
            </div>
          </div>
          <button onClick={fetchBilling} className="btn-primary !bg-red-600 !border-red-600 !text-white px-12 py-6 text-xl">
            RE_TRY_PROTOCOL
          </button>
        </div>
      ) : billing ? (
        <>
          {/* Current Plan Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="p-12 border-4 border-[var(--fg)] bg-[var(--bg)] flex flex-col justify-between offset-card shadow-none relative blueprint-corners group hover:bg-[var(--bg-muted)] transition-colors">
              <div className="corner-bl" />
              <div className="corner-br" />
              <div>
                <div className="flex items-center justify-between mb-16">
                  <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-4 py-1 font-black text-xs uppercase italic tracking-widest">
                    ACTIVE_PLAN
                  </span>
                  <div className="h-20 w-20 border-4 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)] shadow-[8px_8px_0_0_var(--fg)] group-hover:shadow-none group-hover:translate-x-2 group-hover:translate-y-2 transition-all">
                    {billing.plan === "PREMIUM" ? (
                      <Crown className="h-10 w-10 text-[var(--fg)]" />
                    ) : billing.plan === "EARLY_BIRD" ? (
                      <Sparkles className="h-10 w-10 text-[var(--fg)]" />
                    ) : (
                      <Zap className="h-10 w-10 text-[var(--fg-muted)]" />
                    )}
                  </div>
                </div>
                <p className="magazine-heading text-7xl text-[var(--fg)] mb-4">{billing.plan}.</p>
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="index-label text-xl font-black uppercase italic tracking-tighter text-[var(--fg)]">
                    STATUS: {billing.status}
                  </p>
                </div>
              </div>
              {billing.renewsAt && (
                <p className="index-label text-base font-black italic uppercase border-t-4 border-[var(--fg)] pt-8 mt-16 opacity-40">
                  RE_CALIBRATION_DATE: {new Date(billing.renewsAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Usage bars */}
            <div className="lg:col-span-2 p-12 border-4 border-[var(--fg)] bg-[var(--bg)] flex flex-col gap-12 offset-card shadow-none relative blueprint-corners">
              <div className="corner-bl" />
              <div className="corner-br" />
              <div className="flex items-center justify-between border-b-4 border-[var(--fg)] pb-8">
                <p className="magazine-heading text-4xl">
                  [ 01 ] Consumption.
                </p>
                <span className="index-label font-black text-xs opacity-40">CYCLE_EXPIRES_SOON</span>
              </div>
              <div className="space-y-10">
                <UsageBar
                  label="RESUME_ANALYSIS_VECTORS"
                  used={billing.usage.resumesAnalyzed}
                  limit={planLimits.resumesAnalyzed}
                />
                <UsageBar
                  label="JOB_MATCH_SIGNALS"
                  used={billing.usage.jobMatchesViewed}
                  limit={planLimits.jobMatches}
                />
                <UsageBar
                  label="ROADMAP_GRID_GENERATIONS"
                  used={billing.usage.roadmapGenerations}
                  limit={planLimits.roadmapGenerations}
                />
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="mt-16">
            <div className="flex items-center gap-8 mb-12">
               <h2 className="magazine-heading text-5xl">[ 02 ] Upgrades.</h2>
               <div className="h-px flex-1 bg-[var(--fg)] opacity-20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {PLANS.map((plan) => {
                const isCurrent = billing.plan === plan.id;
                const isEarlyBird = plan.id === "EARLY_BIRD";
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative p-16 border-4 flex flex-col gap-12 transition-all offset-card shadow-none blueprint-corners group",
                      isEarlyBird
                        ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
                        : "border-[var(--fg)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--bg-muted)]"
                    )}
                  >
                    <div className="corner-bl" />
                    <div className="corner-br" />
                    {isEarlyBird && (
                      <div className="absolute top-0 right-0 px-8 py-3 bg-[var(--bg)] text-[var(--fg)] index-label border-b-4 border-l-4 border-[var(--fg)] font-black text-xs uppercase italic">
                        PROTOCOL_RECOMMENDED
                      </div>
                    )}

                    <div>
                      <p className={cn(
                        "magazine-heading text-4xl mb-6 italic leading-none",
                        isEarlyBird ? "text-[var(--bg)]" : "text-[var(--fg)]"
                      )}>
                        {plan.name}.
                      </p>
                      <div className="flex items-baseline gap-3">
                        <span className={cn(
                          "text-7xl font-black italic tracking-tighter leading-none",
                          isEarlyBird ? "text-[var(--bg)]" : "text-[var(--fg)]"
                        )}>
                          {plan.price}
                        </span>
                        <span className={cn(
                          "index-label text-xl font-black italic uppercase",
                          isEarlyBird ? "text-[var(--bg)] opacity-40" : "text-[var(--fg-muted)]"
                        )}>
                          {plan.period}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-6 flex-1 border-t-4 border-current pt-10">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className={cn(
                            "flex items-start gap-4 index-label font-black text-sm italic uppercase leading-tight",
                            isEarlyBird ? "text-[var(--bg)]" : "text-[var(--fg-muted)]"
                          )}
                        >
                          <CheckCircle2 className={cn("h-5 w-5 mt-0.5 flex-shrink-0", isEarlyBird ? "text-[var(--bg)]" : "text-[var(--fg)]")} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className={cn(
                        "flex items-center justify-center gap-4 index-label py-6 border-4 font-black text-xl italic uppercase bg-transparent mt-8",
                        isEarlyBird ? "border-[var(--bg)] text-[var(--bg)]" : "border-[var(--fg)] text-[var(--fg)]"
                      )}>
                        <BadgeCheck className="h-8 w-8" />
                        ACTIVE_TIER
                      </div>
                    ) : plan.cta ? (
                      <button
                        onClick={() => handleUpgrade(plan.id as "EARLY_BIRD" | "PREMIUM")}
                        disabled={!!upgrading}
                        className={cn(
                          "w-full py-8 index-label flex items-center justify-center gap-4 border-4 transition-all mt-8 font-black text-2xl italic uppercase group/btn",
                          isEarlyBird 
                            ? "bg-[var(--bg)] text-[var(--fg)] border-[var(--bg)] hover:scale-[1.02]" 
                            : "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)] hover:scale-[1.02]"
                        )}
                      >
                        {upgrading === plan.id ? (
                          <Loader2 className="h-10 w-10 animate-spin mx-auto" />
                        ) : (
                          <>
                            {plan.cta}
                            <ArrowUpRight className="h-8 w-8 group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform" />
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-8 border-4 border-[var(--fg)] bg-[var(--bg-muted)] index-label text-[var(--fg)] text-center offset-card shadow-none relative blueprint-corners mt-16 font-black uppercase italic text-xl">
            <div className="corner-bl" />
            <div className="corner-br" />
            [ AUTHENTICATED_SESSION ] NODE_IDENTITY: {session?.user?.email || "UNKNOWN"}
          </div>
        </>
      ) : null}
    </div>
  );
}
