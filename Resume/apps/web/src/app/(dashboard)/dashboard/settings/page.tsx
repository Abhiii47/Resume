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
    <div className="relative flex flex-col gap-16 max-w-7xl mx-auto w-full pb-32 pt-16 px-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row justify-between items-end gap-12 border-b-4 border-[var(--fg)] pb-16"
      >
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black">[ 00 ] CONTROL_CENTER</span>
              <div className="h-px w-32 bg-[var(--fg)]" />
            </div>
            <h1 className="magazine-heading text-6xl md:text-9xl text-[var(--fg)] leading-[0.8]">
              Settings.
            </h1>
          </div>
          <p className="text-2xl text-[var(--fg)] font-bold leading-tight uppercase italic max-w-3xl border-l-4 border-[var(--fg)] pl-8">
            Calibrate career trajectory and security vectors. 
            Protocols: <span className="text-emerald-500 font-black animate-pulse">SYSTEM_STABLE</span>
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 gap-16">
          <div className="relative h-32 w-32 border-8 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)] shadow-[20px_20px_0_0_var(--bg-muted)]">
            <div className="absolute inset-0 border-t-8 border-[var(--fg)] animate-spin" />
            <User className="h-12 w-12" />
          </div>
          <div className="text-center">
             <h3 className="magazine-heading text-5xl mb-4">Syncing Account</h3>
             <p className="index-label text-2xl font-black animate-pulse">[ 00 ] DECODING_IDENTITY_PARAMS</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Profile Card */}
          <section className="border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners lg:col-span-2">
            <div className="corner-bl" />
            <div className="corner-br" />
            <div className="px-10 py-8 border-b-4 border-[var(--fg)] bg-[var(--bg-muted)]">
              <h2 className="magazine-heading text-4xl">
                [ 01 ] Identity.
              </h2>
            </div>

            <div className="divide-y-4 divide-[var(--fg)]">
              {/* Name */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-12 group/item gap-12">
                <div className="flex items-center gap-10">
                  <div className="h-24 w-24 border-4 border-[var(--fg)] flex items-center justify-center bg-[var(--bg)] group-hover/item:bg-[var(--fg)] group-hover/item:text-[var(--bg)] transition-all shadow-[8px_8px_0_0_var(--fg)] group-hover/item:shadow-none flex-shrink-0">
                    <User className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="index-label mb-4 text-[var(--fg-muted)] font-black text-sm uppercase">
                      DISPLAY_IDENTITY
                    </p>
                    {editingName ? (
                      <div className="flex flex-wrap items-center gap-6">
                        <input
                          autoFocus
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          className="bg-[var(--bg-muted)] border-4 border-[var(--fg)] px-8 py-4 text-2xl text-[var(--fg)] focus:outline-none focus:bg-[var(--bg)] w-full md:w-96 font-black italic uppercase transition-all"
                        />
                        <div className="flex gap-4">
                          <button
                            onClick={saveName}
                            disabled={savingName}
                            className="h-16 w-16 bg-[var(--fg)] text-[var(--bg)] border-4 border-[var(--fg)] flex items-center justify-center hover:bg-emerald-500 transition-all"
                          >
                            {savingName ? <Loader2 className="h-8 w-8 animate-spin" /> : <Check className="h-8 w-8" />}
                          </button>
                          <button
                            onClick={() => { setEditingName(false); setNameError(null); }}
                            className="h-16 w-16 bg-[var(--bg-muted)] border-4 border-[var(--fg)] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-[var(--fg)]"
                          >
                            <X className="h-8 w-8" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-5xl md:text-7xl font-black text-[var(--fg)] italic uppercase tracking-tighter leading-none">
                        {account?.name}
                      </p>
                    )}
                    {nameError && (
                      <p className="index-label text-red-600 mt-4 font-black">[ ERROR ] {nameError}</p>
                    )}
                  </div>
                </div>
                {!editingName && (
                   <button
                    onClick={() => { setEditingName(true); setNameValue(account?.name ?? ""); }}
                    className="status-block bg-[var(--bg)] text-[var(--fg)] border-4 border-[var(--fg)] h-20 w-20 justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all shadow-[8px_8px_0_0_var(--fg)] hover:shadow-none"
                  >
                    <Pencil className="h-8 w-8" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y-4 md:divide-y-0 md:divide-x-4 divide-[var(--fg)]">
                <div className="flex items-center gap-10 p-12 bg-[var(--bg)]">
                  <div className="h-20 w-20 border-4 border-[var(--fg)] flex items-center justify-center text-[var(--fg)] bg-[var(--bg-muted)] flex-shrink-0 shadow-[8px_8px_0_0_var(--fg)]">
                    <Mail className="h-8 w-8" />
                  </div>
                  <div className="min-w-0">
                    <p className="index-label mb-3 text-[var(--fg-muted)] font-black text-xs uppercase">VECTOR_COMM</p>
                    <p className="text-2xl md:text-3xl font-black text-[var(--fg)] italic uppercase tracking-tighter truncate leading-none">
                      {account?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-10 p-12 bg-[var(--bg)]">
                  <div className="h-20 w-20 border-4 border-[var(--fg)] flex items-center justify-center text-[var(--fg)] bg-[var(--bg-muted)] flex-shrink-0 shadow-[8px_8px_0_0_var(--fg)]">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="index-label mb-3 text-[var(--fg-muted)] font-black text-xs uppercase">SYNC_ORIGIN</p>
                    <p className="text-2xl md:text-3xl font-black text-[var(--fg)] italic uppercase tracking-tighter leading-none">
                      {account?.createdAt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between p-12 bg-[var(--fg)] text-[var(--bg)] gap-12">
                <div className="flex items-center gap-10">
                  <div className="h-24 w-24 border-4 border-[var(--bg)] flex items-center justify-center flex-shrink-0 bg-[var(--bg)] text-[var(--fg)] shadow-[12px_12px_0_0_rgba(255,255,255,0.2)]">
                    <PlanIcon className="h-12 w-12 fill-current" />
                  </div>
                  <div>
                    <p className="index-label mb-3 opacity-60 font-black text-xs uppercase">INTELLIGENCE_LEVEL</p>
                    <p className="text-6xl font-black italic uppercase tracking-tighter text-[var(--bg)] leading-none">
                      {currentPlanMeta.label}.
                    </p>
                  </div>
                </div>
                {account?.plan === "FREE" && (
                  <Link
                    href="/dashboard/billing"
                    className="px-16 py-6 bg-[var(--bg)] text-[var(--fg)] border-4 border-[var(--bg)] font-black uppercase tracking-widest text-xl flex items-center gap-4 hover:bg-transparent hover:text-[var(--bg)] transition-all w-full md:w-auto justify-center group"
                  >
                    UPGRADE_NOW <Zap className="h-6 w-6 group-hover:scale-125 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Security Card */}
          <section className="border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners">
            <div className="corner-bl" />
            <div className="corner-br" />
            <div className="px-10 py-8 border-b-4 border-[var(--fg)] bg-[var(--bg-muted)]">
              <h2 className="magazine-heading text-4xl">
                [ 02 ] Security.
              </h2>
            </div>

            <div className="p-12 space-y-12">
              <div className="flex items-center gap-10">
                <div className="h-24 w-24 border-4 border-[var(--fg)] flex items-center justify-center bg-[var(--bg-muted)] flex-shrink-0 shadow-[8px_8px_0_0_var(--fg)]">
                  <KeyRound className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-4">Recalibrate.</h3>
                  <p className="index-label text-base font-black italic opacity-60">
                    [ STATUS ] {resetSent ? "SIGNAL_TRANSMITTED" : "READY_FOR_SYNC"}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={resettingPassword || resetSent}
                className="btn-primary w-full py-6 text-xl"
              >
                {resettingPassword ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : resetSent ? (
                  "SIGNAL_SENT ✓"
                ) : (
                  "INITIATE_RECALIBRATION"
                )}
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="border-4 border-red-600 bg-red-50 offset-card shadow-none relative blueprint-corners overflow-hidden">
            <div className="corner-bl !border-red-600" />
            <div className="corner-br !border-red-600" />
            <div className="px-10 py-8 border-b-4 border-red-600 bg-red-100">
              <h2 className="magazine-heading text-4xl text-red-600">
                [ 03 ] Terminal.
              </h2>
            </div>

            <div className="p-12 space-y-12 relative z-10">
              <div className="flex items-center gap-10">
                <div className="h-24 w-24 bg-red-600 border-4 border-red-600 flex items-center justify-center text-white flex-shrink-0 shadow-[8px_8px_0_0_#991b1b]">
                   <ShieldAlert className="h-12 w-12" />
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl font-black text-red-600 italic uppercase tracking-tighter leading-none mb-4">Purge Node.</h3>
                  <p className="index-label text-red-600 font-black text-sm italic">
                    [ WARNING ] IRREVERSIBLE_DATA_ERASURE_PROTOCOL
                  </p>
                </div>
              </div>

              {!deleteConfirm ? (
                <button
                  className="w-full py-6 bg-red-600 text-white font-black uppercase text-xl border-4 border-red-600 hover:bg-white hover:text-red-600 transition-all italic"
                  onClick={() => setDeleteConfirm(true)}
                >
                  EXECUTE_PURGE
                </button>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 py-6 bg-red-600 text-white font-black text-2xl border-4 border-red-600 hover:bg-red-800 transition-all uppercase italic"
                    >
                      {deleting ? <Loader2 className="h-10 w-10 animate-spin mx-auto" /> : "CONFIRM"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 py-6 bg-white text-red-600 font-black text-2xl border-4 border-red-600 hover:bg-red-50 transition-all uppercase italic"
                    >
                      ABORT
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

