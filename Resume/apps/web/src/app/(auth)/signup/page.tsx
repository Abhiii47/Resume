"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "@repo/ui";
import { signUp } from "@repo/core/client";

type Plan = "FREE" | "PRO" | "PREMIUM";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Plan>("FREE");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (signUpError) {
        setError(signUpError.message || "Unable to create account");
        return;
      }

      window.localStorage.setItem("careerai_plan", plan);
      window.location.href = "/dashboard";
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

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <h1 className="magazine-heading text-5xl text-[var(--fg)] mb-4">
            Initialize.
          </h1>
          <p className="index-label text-[var(--fg-muted)] mb-12">
            [ 01 ] NEW_ENTITY_REGISTRATION
          </p>

          <div className="p-10 border border-[var(--border)] bg-[var(--bg-subtle)] blueprint-border">
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">
                  Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["FREE", "PRO", "PREMIUM"] as Plan[]).map((tier) => {
                    const isActive = plan === tier;
                    return (
                      <button
                        type="button"
                        key={tier}
                        onClick={() => setPlan(tier)}
                        className={`border px-2 py-2 text-[10px] font-mono transition ${
                          isActive
                            ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
                            : "border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                        }`}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] mt-2 text-[var(--fg-muted)] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  You can upgrade or downgrade anytime.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 mt-1 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-[var(--fg-muted)] mt-5">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--fg)] font-medium hover:underline"
            >
              Sign in →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
