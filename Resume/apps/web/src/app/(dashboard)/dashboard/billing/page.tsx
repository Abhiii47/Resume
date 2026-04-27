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
            <span className="index-label text-[var(--fg)]">[ 00 ] BILLING_MATRIX</span>
            <div className="h-px w-24 bg-[var(--fg)]" />
          </div>
          <h1 className="magazine-heading text-6xl md:text-8xl text-[var(--fg)] leading-none">
            Usage.
          </h1>
          <p className="text-[var(--fg-subtle)] text-lg leading-tight font-medium max-w-xl uppercase tracking-tighter mt-6">
            Manage your subscription tier and monitor system usage across all features.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={fetchBilling}
            className="btn-primary h-[52px] px-8 flex items-center gap-3 text-sm flex-1 md:flex-none justify-center"
          >
            <Zap className="h-4 w-4" /> Refresh Status
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-12">
          <div className="relative h-20 w-20 border-4 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)]">
            <div className="absolute inset-0 border-[var(--fg)] animate-spin border-t-4" />
          </div>
          <p className="index-label animate-pulse text-[var(--fg)]">
            [ 00 ] SYNCING_BILLING_ENGINE
          </p>
        </div>
      ) : error ? (
        <div className="p-8 border-2 border-[var(--fg)] bg-red-50 text-red-600 font-bold offset-card">
          {error}
        </div>
      ) : billing ? (
        <>
          {/* Current Plan Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border-2 border-[var(--fg)] bg-[var(--bg)] flex flex-col justify-between offset-card">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="index-label text-[var(--fg)]">
                    Current Plan
                  </span>
                  {billing.plan === "PREMIUM" ? (
                    <Crown className="h-6 w-6 text-[var(--fg)]" />
                  ) : billing.plan === "EARLY_BIRD" ? (
                    <Sparkles className="h-6 w-6 text-[var(--fg)]" />
                  ) : (
                    <Zap className="h-6 w-6 text-[var(--fg-muted)]" />
                  )}
                </div>
                <p className="magazine-heading text-5xl text-[var(--fg)] mb-2">{billing.plan}</p>
                <p className="index-label text-[var(--fg-muted)] mt-4">
                  STATUS:{" "}
                  <span className="font-bold uppercase text-[var(--fg)]">{billing.status}</span>
                </p>
              </div>
              {billing.renewsAt && (
                <p className="index-label text-[var(--fg)] mt-8 border-t-2 border-[var(--fg)] pt-4">
                  RENEWS: {new Date(billing.renewsAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Usage bars */}
            <div className="md:col-span-2 p-8 border-2 border-[var(--fg)] bg-[var(--bg)] flex flex-col gap-6 offset-card">
              <p className="index-label text-[var(--fg)] mb-2">
                [ PERIOD_USAGE ]
              </p>
              <UsageBar
                label="Resume Analyses"
                used={billing.usage.resumesAnalyzed}
                limit={planLimits.resumesAnalyzed}
              />
              <UsageBar
                label="Job Matches"
                used={billing.usage.jobMatchesViewed}
                limit={planLimits.jobMatches}
              />
              <UsageBar
                label="Roadmap Generations"
                used={billing.usage.roadmapGenerations}
                limit={planLimits.roadmapGenerations}
              />
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="mt-8">
            <p className="index-label text-[var(--fg)] mb-6">
              [ ALL_PLANS ]
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PLANS.map((plan) => {
                const isCurrent = billing.plan === plan.id;
                const isEarlyBird = plan.id === "EARLY_BIRD";
                return (
                  <div
                    key={plan.id}
                    className={`relative p-8 md:p-10 border-2 flex flex-col gap-8 transition-all offset-card ${
                      isEarlyBird
                        ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
                        : "border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:border-[var(--fg)]"
                    }`}
                  >
                    {isEarlyBird && (
                      <div className="absolute top-0 right-0 px-4 py-2 bg-[var(--bg)] text-[var(--fg)] index-label border-b-2 border-l-2 border-[var(--fg)] font-bold">
                        POPULAR
                      </div>
                    )}

                    <div>
                      <p className={`magazine-heading text-3xl mb-4 ${isEarlyBird ? "text-[var(--bg)]" : "text-[var(--fg)]"}`}>
                        {plan.name}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-6xl font-black ${isEarlyBird ? "text-[var(--bg)]" : "text-[var(--fg)]"}`}>
                          {plan.price}
                        </span>
                        <span className={`index-label ${isEarlyBird ? "text-[var(--bg)] opacity-80" : "text-[var(--fg-muted)]"}`}>
                          {plan.period}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-4 flex-1">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className={`flex items-start gap-3 index-label normal-case tracking-normal ${isEarlyBird ? "text-[var(--bg)] font-medium" : "text-[var(--fg-muted)]"}`}
                        >
                          <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isEarlyBird ? "text-[var(--bg)]" : "text-[var(--fg)]"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className={`flex items-center justify-center gap-2 index-label py-4 border-2 ${isEarlyBird ? "border-[var(--bg)] text-[var(--bg)]" : "border-[var(--fg)] text-[var(--fg)]"} bg-transparent mt-4`}>
                        <BadgeCheck className="h-5 w-5" />
                        CURRENT_PLAN
                      </div>
                    ) : plan.cta ? (
                      <button
                        onClick={() =>
                          handleUpgrade(plan.id as "EARLY_BIRD" | "PREMIUM")
                        }
                        disabled={!!upgrading}
                        className={`w-full py-4 index-label flex items-center justify-center gap-2 border-2 transition-colors mt-4 ${
                          isEarlyBird 
                            ? "bg-[var(--bg)] text-[var(--fg)] border-[var(--bg)] hover:bg-transparent hover:text-[var(--bg)] hover:border-[var(--bg)]" 
                            : "bg-[var(--bg)] text-[var(--fg)] border-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)]"
                        }`}
                      >
                        {upgrading === plan.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            {plan.cta}
                            <ArrowUpRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="py-4 mt-4 opacity-0 hidden md:block">Spacer</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-2 border-[var(--fg)] bg-[var(--bg-muted)] index-label text-[var(--fg)] text-center offset-card mt-4">
            [ AUTH ] Signed in as {session?.user?.email || "user"}.
          </div>
        </>
      ) : null}
    </div>
  );
}
