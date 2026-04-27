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
import { useSession, signOut } from "@repo/core/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Plan = "FREE" | "EARLY_BIRD" | "PREMIUM";

type AccountData = {
  name: string;
  email: string;
  plan: Plan;
  createdAt: string;
};

const planMeta = {
  FREE: { label: "Starter", icon: Zap },
  EARLY_BIRD: { label: "Early Bird", icon: Sparkles },
  PREMIUM: { label: "Elite", icon: Crown },
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
      const res = await fetch("/api/auth/request-password-reset", {
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
    <div className="flex flex-col gap-10 max-w-6xl mx-auto w-full pb-20 px-4 pt-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-dot opacity-[0.05]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-2 border-[var(--fg)] pb-12"
      >
        <div>
          <div className="flex items-center gap-6 mb-4">
            <span className="index-label text-[var(--fg)]">[ 00 ] CONTROL_CENTER</span>
            <div className="h-px w-24 bg-[var(--fg)]" />
          </div>

          <h1 className="magazine-heading text-6xl md:text-8xl text-[var(--fg)] leading-none">
            Settings.
          </h1>
          
          <p className="text-[var(--fg-subtle)] text-lg leading-tight font-medium max-w-xl uppercase tracking-tighter mt-6">
            Calibrate career trajectory and security vectors. <br />
            Identity parameters: <span className="text-[var(--fg)] font-black">ACTIVE</span>{" // "}
            Protocols: <span className="text-[var(--fg)] font-mono">STABLE</span>
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-12">
          <div className="relative h-20 w-20 border-4 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)]">
            <div className="absolute inset-0 border-[var(--fg)] animate-spin border-t-4" />
          </div>
          <p className="index-label animate-pulse text-[var(--fg)]">
            [ 00 ] SYNCING_ACCOUNT_DATA
          </p>
        </div>
      ) : (
        <>
          {/* Profile Card */}
          <section className="border-2 border-[var(--fg)] bg-[var(--bg)] offset-card">
            <div className="px-8 py-6 border-b-2 border-[var(--fg)] bg-[var(--bg-muted)]">
              <h2 className="index-label text-[var(--fg)]">
                [ 01 ] IDENTITY_PROFILE
              </h2>
            </div>

            <div className="divide-y-2 divide-[var(--fg)]">
              {/* Name */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-8 group/item gap-6">
                <div className="flex items-start md:items-center gap-6 md:gap-8">
                  <div className="h-16 w-16 border-2 border-[var(--fg)] flex items-center justify-center text-[var(--fg)] bg-[var(--bg)] group-hover/item:bg-[var(--fg)] group-hover/item:text-[var(--bg)] transition-colors flex-shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="index-label mb-2 text-[var(--fg-muted)]">
                      DISPLAY_IDENTITY
                    </p>
                    {editingName ? (
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <input
                          autoFocus
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveName();
                            if (e.key === "Escape") setEditingName(false);
                          }}
                          className="bg-[var(--bg-muted)] border-2 border-[var(--fg)] px-4 py-3 text-sm text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] w-full md:w-80 font-bold transition-colors"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveName}
                            disabled={savingName}
                            className="h-[48px] w-[48px] bg-[var(--fg)] text-[var(--bg)] border-2 border-[var(--fg)] flex items-center justify-center hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-colors"
                          >
                            {savingName ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Check className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingName(false);
                              setNameError(null);
                            }}
                            className="h-[48px] w-[48px] bg-[var(--bg-muted)] border-2 border-[var(--fg)] flex items-center justify-center hover:bg-[var(--bg)] transition-colors text-[var(--fg)]"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-3xl md:text-4xl font-black text-[var(--fg)] italic uppercase tracking-tighter">
                        {account?.name}
                      </p>
                    )}
                    {nameError && (
                      <p className="index-label text-red-600 mt-3 font-bold">[ ERROR ] {nameError}</p>
                    )}
                  </div>
                </div>
                {!editingName && (
                   <button
                    onClick={() => {
                      setEditingName(true);
                      setNameValue(account?.name ?? "");
                    }}
                    className="status-block bg-[var(--bg)] text-[var(--fg)] border-2 border-[var(--fg)] h-14 w-14 justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="flex items-start md:items-center gap-6 md:gap-8 p-8">
                <div className="h-16 w-16 border-2 border-[var(--fg)] flex items-center justify-center text-[var(--fg)] bg-[var(--bg)] flex-shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="index-label mb-2 text-[var(--fg-muted)]">COMMUNICATION_VECTOR</p>
                  <p className="text-2xl md:text-3xl font-black text-[var(--fg)] italic uppercase tracking-tighter truncate">
                    {account?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 md:gap-8 p-8">
                <div className="h-16 w-16 border-2 border-[var(--fg)] flex items-center justify-center text-[var(--fg)] bg-[var(--bg)] flex-shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="index-label mb-2 text-[var(--fg-muted)]">SYNC_DATE</p>
                  <p className="text-2xl md:text-3xl font-black text-[var(--fg)] italic uppercase tracking-tighter">
                    {account?.createdAt}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-[var(--fg)] text-[var(--bg)] gap-6">
                <div className="flex items-center gap-6 md:gap-8">
                  <div className="h-16 w-16 border-2 border-[var(--bg)] flex items-center justify-center flex-shrink-0">
                    <PlanIcon className="h-8 w-8 fill-current" />
                  </div>
                  <div>
                    <p className="index-label mb-2 opacity-70">
                      INTELLIGENCE_TIER
                    </p>
                    <p className="text-4xl font-black italic uppercase tracking-tighter text-[var(--bg)]">
                      {currentPlanMeta.label}
                    </p>
                  </div>
                </div>
                {account?.plan === "FREE" && (
                  <Link
                    href="/dashboard/billing"
                    className="px-8 py-4 bg-[var(--bg)] text-[var(--fg)] border-2 border-[var(--bg)] font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:bg-transparent hover:text-[var(--bg)] transition-colors w-full md:w-auto justify-center"
                  >
                    UPGRADE_NOW <Zap className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Security Card */}
          <section className="border-2 border-[var(--fg)] bg-[var(--bg)] offset-card">
            <div className="px-8 py-6 border-b-2 border-[var(--fg)] bg-[var(--bg-muted)]">
              <h2 className="index-label text-[var(--fg)]">
                [ 02 ] SECURITY_VECTORS
              </h2>
            </div>

            <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="flex items-center gap-6 md:gap-8">
                <div className="h-16 w-16 border-2 border-[var(--fg)] flex items-center justify-center text-[var(--fg)] bg-[var(--bg)] flex-shrink-0">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-[var(--fg)] italic uppercase tracking-tighter leading-none mb-3">Access Token</p>
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
                className="status-block bg-[var(--bg-muted)] text-[var(--fg)] border-2 border-[var(--fg)] px-8 py-4 disabled:opacity-50 hover:bg-[var(--bg)] transition-colors w-full md:w-auto"
              >
                {resettingPassword ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : resetSent ? (
                  "Vector Sent ✓"
                ) : (
                  "Recalibrate Token"
                )}
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="border-2 border-red-500 bg-red-50 offset-card">
            <div className="px-8 py-6 border-b-2 border-red-500 bg-red-100">
              <h2 className="index-label text-red-600 font-bold">
                [ 03 ] TERMINAL_PROTOCOL
              </h2>
            </div>

            <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6 md:gap-8">
                <div className="h-16 w-16 bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-600 flex-shrink-0">
                   <ShieldAlert className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-3xl font-black text-red-600 italic uppercase tracking-tighter leading-none mb-3">Delete Account</p>
                  <p className="index-label text-red-600 font-bold">
                    [ WARNING ] PERMANENT_VECTOR_PURGE_REQUIRED
                  </p>
                </div>
              </div>

              {!deleteConfirm ? (
                <button
                  className="status-block bg-white text-red-600 border-2 border-red-500 px-8 py-4 hover:bg-red-600 hover:text-white transition-colors w-full md:w-auto"
                  onClick={() => setDeleteConfirm(true)}
                >
                  PURGE_DATA
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-shrink-0 w-full md:w-auto">
                  <span className="index-label text-red-600 font-black text-center sm:text-left mb-2 sm:mb-0">
                    CONFIRM_PURGE?
                  </span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="status-block bg-red-600 text-white border-2 border-red-600 px-8 py-4 disabled:opacity-50 hover:bg-red-700 transition-colors"
                  >
                    {deleting ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      "EXECUTE"
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="status-block bg-white text-red-600 border-2 border-red-500 px-8 py-4 hover:bg-red-50 transition-colors"
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
