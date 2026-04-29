"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tokenError = useMemo(() => {
    if (errorParam === "INVALID_TOKEN") {
      return "This reset link is invalid or has expired.";
    }
    return null;
  }, [errorParam]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || data?.error || "Unable to reset password.");
        return;
      }

      setSuccess("Password updated successfully. You can sign in now.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] relative overflow-hidden">
      <div className="absolute inset-0 bg-dot opacity-[0.05]" />
      <div className="absolute top-8 inset-x-0 flex items-center justify-between px-10 z-10">
        <Link href="/" className="flex items-center gap-4">
          <div className="h-6 w-6 bg-[var(--fg)]" />
          <span className="magazine-heading text-xl text-[var(--fg)]">
            CareerAI
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <h1 className="magazine-heading text-5xl text-[var(--fg)] mb-4">
            Reset Password.
          </h1>
          <p className="index-label text-[var(--fg-muted)] mb-12">
            [ 00 ] PASSWORD_RECALIBRATION
          </p>

          <div className="p-10 border border-[var(--border)] bg-[var(--bg-subtle)] blueprint-border">
            {(tokenError || error) && (
              <div className="mb-4 px-3 py-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                {tokenError || error}
              </div>
            )}

            {success && (
              <div className="mb-4 px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(tokenError) || !token}
                className="btn-primary w-full py-2.5 mt-1 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Save new password <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-[var(--fg-muted)] mt-5">
            Back to{" "}
            <Link
              href="/login"
              className="text-[var(--fg)] font-medium hover:underline"
            >
              sign in {"->"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)]">
          Loading reset flow...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
