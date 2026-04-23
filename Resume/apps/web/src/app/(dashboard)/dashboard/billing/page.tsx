"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BadgeCheck,
  CreditCard,
  Crown,
  Loader2,
  Sparkles,
  Zap,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@repo/ui";
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
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[var(--fg-muted)]">
          {label}
        </span>
        <span className="text-xs text-[var(--fg-muted)]">
          {isUnlimited ? (
            <span className="text-emerald-500 font-semibold">Unlimited</span>
          ) : (
            <span className={nearLimit ? "text-amber-400 font-semibold" : ""}>
              {used} / {limit as number}
            </span>
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              nearLimit ? "bg-amber-400" : "bg-white"
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
      "1-on-1 Human Review",
      "ATS-Bypass Guarantee",
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
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-[var(--accent-fg)]" />
              </div>
              <span className="text-xs text-[var(--fg-muted)] font-medium uppercase tracking-wider">
                Billing
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Plan & Usage</h1>
            <p className="text-sm text-[var(--fg-subtle)] mt-1">
              Manage your subscription and monitor product usage in real time.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchBilling}>
            Refresh
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--fg-muted)]" />
          <span className="text-sm text-[var(--fg-muted)]">
            Loading billing...
          </span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 text-sm">
          {error}
        </div>
      ) : billing ? (
        <>
          {/* Current Plan Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-[var(--fg-muted)]">
                  Current Plan
                </span>
                {billing.plan === "PREMIUM" ? (
                  <Crown className="h-4 w-4 text-yellow-500" />
                ) : billing.plan === "EARLY_BIRD" ? (
                  <Sparkles className="h-4 w-4 text-violet-400" />
                ) : (
                  <Zap className="h-4 w-4 text-[var(--fg-muted)]" />
                )}
              </div>
              <p className="text-2xl font-bold">{billing.plan}</p>
              <p className="text-xs text-[var(--fg-muted)] mt-1">
                Status:{" "}
                <span className="font-medium capitalize">{billing.status}</span>
              </p>
              {billing.renewsAt && (
                <p className="text-xs text-[var(--fg-muted)] mt-1">
                  Renews {new Date(billing.renewsAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Usage bars */}
            <div className="md:col-span-2 p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col gap-4">
              <p className="text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                Usage This Period
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
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-4">
              All Plans
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = billing.plan === plan.id;
                const isEarlyBird = plan.id === "EARLY_BIRD";
                return (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-2xl border flex flex-col gap-4 transition-all ${
                      isEarlyBird
                        ? "border-white/20 bg-white/5"
                        : "border-[var(--border)] bg-[var(--card)]"
                    }`}
                  >
                    {isEarlyBird && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-full tracking-wider">
                        POPULAR
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-white mb-1">
                        {plan.name}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">
                          {plan.price}
                        </span>
                        <span className="text-sm text-[var(--fg-muted)]">
                          {plan.period}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs text-[var(--fg-muted)]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-white flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                        <BadgeCheck className="h-4 w-4" />
                        Current Plan
                      </div>
                    ) : plan.cta ? (
                      <Button
                        onClick={() =>
                          handleUpgrade(plan.id as "EARLY_BIRD" | "PREMIUM")
                        }
                        disabled={!!upgrading}
                        size="sm"
                        className={`w-full ${isEarlyBird ? "bg-white text-black hover:bg-zinc-200" : ""}`}
                        variant={isEarlyBird ? "default" : "outline"}
                      >
                        {upgrading === plan.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            {plan.cta}
                            <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[var(--fg-muted)]">
            Signed in as {session?.user?.email || "user"}.
          </p>
        </>
      ) : null}
    </div>
  );
}
