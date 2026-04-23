"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Crown,
  Sparkles,
  Zap,
  Pencil,
  Check,
  X,
  Loader2,
  ShieldAlert,
  KeyRound,
} from "lucide-react";
// Button import cleaned
import { useSession, signOut } from "@repo/core/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Plan = "FREE" | "EARLY_BIRD" | "PREMIUM";

type AccountData = {
  name: string;
  email: string;
  plan: Plan;
  createdAt: string;
};

const planMeta = {
  FREE: { label: "Starter", icon: Zap, color: "text-zinc-400" },
  EARLY_BIRD: { label: "Early Bird", icon: Sparkles, color: "text-violet-400" },
  PREMIUM: { label: "Elite", icon: Crown, color: "text-yellow-400" },
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  // Name edit state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Password reset state
  const [resetSent, setResetSent] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing");
      const billingData = await res.json();
      const plan = billingData?.billing?.plan ?? "FREE";

      setAccount({
        name: session?.user?.name ?? "User",
        email: session?.user?.email ?? "",
        plan,
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
      setNameValue(session?.user?.name ?? "");
    } catch {
      // fallback to session data
      setAccount({
        name: session?.user?.name ?? "User",
        email: session?.user?.email ?? "",
        plan: "FREE",
        createdAt: "—",
      });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchAccount();
  }, [session, fetchAccount]);

  const saveName = async () => {
    if (!nameValue.trim() || nameValue.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error || "Failed to update name.");
        return;
      }
      setAccount((prev) => (prev ? { ...prev, name: data.user.name } : null));
      setEditingName(false);
    } catch {
      setNameError("Network error. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!account?.email) return;
    setResettingPassword(true);
    try {
      // Better-Auth exposes a client-side forgot password flow
      // We call the API directly since we're already signed in
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`,
        }),
      });
      if (res.ok) setResetSent(true);
    } catch {
      // silent fail
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (res.ok) {
        await signOut();
        router.push("/");
      }
    } catch {
      setDeleting(false);
    }
  };

  const PlanIcon = (account && planMeta[account.plan]) ? planMeta[account.plan].icon : Zap;
  const currentPlanMeta = (account && planMeta[account.plan]) ? planMeta[account.plan] : planMeta.FREE;

  return (
    <div className="relative flex flex-col gap-10 max-w-4xl mx-auto w-full pb-20 px-4">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-dot opacity-[0.05]" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="flex items-center gap-6 mb-8">
          <span className="index-label">[ 00 ] CONTROL_CENTER</span>
          <div className="h-px w-24 bg-[var(--border)]" />
        </div>

        <h1 className="magazine-heading text-6xl md:text-9xl mb-8">
          System <br />
          <span className="text-[var(--fg-muted)]">Control.</span>
        </h1>
        
        <p className="text-[var(--fg-subtle)] text-xl leading-tight font-medium max-w-2xl uppercase italic tracking-tighter">
          Calibrate career trajectory and security vectors. <br />
          Identity parameters: <span className="text-[var(--fg)] font-black">ACTIVE</span> // 
          Billing protocols: <span className="text-[var(--fg)] font-mono">STABLE</span>
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--fg-muted)]" />
          <span className="text-sm text-[var(--fg-muted)]">
            Loading account...
          </span>
        </div>
      ) : (
        <>
          {/* Profile Card */}
          <section className="blueprint-border bg-[var(--bg-subtle)]">
            <div className="px-10 py-8 border-b border-[var(--border)]">
              <h2 className="index-label">
                [ 01 ] IDENTITY_PROFILE
              </h2>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {/* Name */}
              <div className="flex items-center justify-between px-10 py-10 group/item">
                <div className="flex items-center gap-8">
                  <div className="h-16 w-16 bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] group-hover/item:text-[var(--fg)] transition-colors">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="index-label mb-2 text-[var(--fg-muted)]">
                      DISPLAY_IDENTITY
                    </p>
                    {editingName ? (
                      <div className="flex items-center gap-4 mt-2">
                        <input
                          autoFocus
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveName();
                            if (e.key === "Escape") setEditingName(false);
                          }}
                          className="bg-[var(--bg)] border border-[var(--border)] px-6 py-3 text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--fg)] w-80 font-mono"
                        />
                        <button
                          onClick={saveName}
                          disabled={savingName}
                          className="h-12 w-12 bg-[var(--fg)] text-[var(--bg)] flex items-center justify-center hover:opacity-90 transition-all"
                        >
                          {savingName ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingName(false);
                            setNameError(null);
                          }}
                          className="h-12 w-12 border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-muted)] transition-all text-[var(--fg-muted)]"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-3xl font-black text-[var(--fg)] italic uppercase tracking-tighter">
                        {account?.name}
                      </p>
                    )}
                    {nameError && (
                      <p className="index-label text-red-500 mt-3">[ ERROR ] {nameError}</p>
                    )}
                  </div>
                </div>
                {!editingName && (
                   <button
                    onClick={() => {
                      setEditingName(true);
                      setNameValue(account?.name ?? "");
                    }}
                    className="status-block status-block-outline h-12 w-12 justify-center"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-8 px-10 py-10">
                <div className="h-16 w-16 bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)]">
                  <Mail className="h-8 w-8" />
                </div>
                <div>
                  <p className="index-label mb-2 text-[var(--fg-muted)]">COMMUNICATION_VECTOR</p>
                  <p className="text-2xl font-black text-[var(--fg)] italic uppercase tracking-tighter">
                    {account?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 px-10 py-10">
                <div className="h-16 w-16 bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)]">
                  <Calendar className="h-8 w-8" />
                </div>
                <div>
                  <p className="index-label mb-2 text-[var(--fg-muted)]">SYNC_DATE</p>
                  <p className="text-2xl font-black text-[var(--fg)] italic uppercase tracking-tighter">
                    {account?.createdAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between px-10 py-10 bg-[var(--fg)] text-[var(--bg)]">
                <div className="flex items-center gap-8">
                  <div className="h-16 w-16 border border-[var(--bg)] flex items-center justify-center">
                    <PlanIcon className="h-8 w-8 fill-current" />
                  </div>
                  <div>
                    <p className="index-label mb-2 opacity-50">
                      INTELLIGENCE_TIER
                    </p>
                    <p className="text-3xl font-black italic uppercase tracking-tighter">
                      {currentPlanMeta.label}
                    </p>
                  </div>
                </div>
                {account?.plan === "FREE" && (
                  <Link
                    href="/dashboard/billing"
                  <Link
                    href="/dashboard/billing"
                    className="px-10 py-5 bg-[var(--bg)] text-[var(--fg)] font-black uppercase tracking-widest hover:scale-105 transition-all text-sm"
                  >
                    UPGRADE_NOW →
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Security Card */}
          <section className="blueprint-border bg-[var(--bg-subtle)]">
            <div className="px-10 py-8 border-b border-[var(--border)]">
              <h2 className="index-label">
                [ 02 ] SECURITY_VECTORS
              </h2>
            </div>

            <div className="px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="h-16 w-16 bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)]">
                  <KeyRound className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-2xl font-black text-[var(--fg)] italic uppercase tracking-tighter leading-none mb-2">Access Token</p>
                  <p className="index-label text-[var(--fg-muted)]">
                    [ STATUS ] {resetSent
                      ? "CHECK_INBOX_FOR_VECTOR"
                      : "SEND_RECALIBRATION_LINK"}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={resettingPassword || resetSent}
                className="status-block status-block-outline px-8 py-4"
              >
                {resettingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : resetSent ? (
                  "Vector Sent ✓"
                ) : (
                  "Recalibrate Password"
                )}
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="blueprint-border border-red-500/40 bg-red-500/[0.02]">
            <div className="px-10 py-8 border-b border-red-500/20">
              <h2 className="index-label text-red-500">
                [ 03 ] TERMINAL_PROTOCOL
              </h2>
            </div>

            <div className="px-10 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-12 relative z-10">
              <div className="flex items-center gap-8">
                <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                   <ShieldAlert className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-2xl font-black text-[var(--fg)] italic uppercase tracking-tighter leading-none mb-2">Delete Account</p>
                  <p className="index-label text-red-500/60">
                    [ WARNING ] PERMANENT_VECTOR_PURGE_REQUIRED
                  </p>
                </div>
              </div>

              {!deleteConfirm ? (
                <button
                  className="status-block border-red-500/40 text-red-500 hover:bg-red-500/10 px-10 py-5"
                  onClick={() => setDeleteConfirm(true)}
                >
                  PURGE_DATA →
                </button>
              ) : (
                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="index-label text-red-500 font-black">
                    CONFIRM_PURGE?
                  </span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="status-block bg-red-500 text-white hover:bg-red-600 px-8 py-4 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "EXECUTE"
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="status-block status-block-outline px-8 py-4"
                  >
                    ABORT
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
