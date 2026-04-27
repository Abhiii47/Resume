"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signUp } from "@repo/core/client";

const PERKS = [
  "AI resume analysis in under 30 seconds",
  "Real live job matches ranked by your skills",
  "12-week personalized career roadmap",
  "Mock interview coach with instant feedback",
  "Free plan. No credit card required.",
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">

      {/* ── Left brand panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--fg)] text-[var(--bg)] flex-col justify-between p-16">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-6 w-6 bg-[var(--bg)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current text-[var(--fg)]">
              <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
            </svg>
          </div>
          <span className="font-black text-base tracking-tighter italic uppercase text-[var(--bg)]">
            CareerAI
          </span>
        </Link>

        <div>
          <h1 className="magazine-heading text-[5rem] leading-none text-[var(--bg)] mb-8">
            Everything You<br />
            <span className="opacity-50">Need to Get Hired.</span>
          </h1>
          <p className="text-sm text-[var(--bg)] opacity-60 leading-relaxed max-w-sm mb-12">
            Join thousands of job seekers using CareerAI to land roles faster. Analyze your resume, match jobs, learn new skills, and ace interviews.
          </p>

          {/* Perks */}
          <div className="space-y-4">
            {PERKS.map((perk, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 opacity-80" />
                <span className="text-xs font-mono opacity-70">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="index-label opacity-40 text-[var(--bg)]">© 2026 CareerAI</p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 bg-[var(--bg)] relative overflow-hidden">
        <div className="absolute inset-0 bg-dot opacity-[0.04]" />

        {/* Mobile logo */}
        <div className="lg:hidden mb-12 relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-6 w-6 bg-[var(--fg)] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current text-[var(--bg)]">
                <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
              </svg>
            </div>
            <span className="font-black text-base tracking-tighter italic uppercase">CareerAI</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md mx-auto relative z-10"
        >
          <div className="mb-10">
            <span className="index-label block mb-3">[ 01 ] NEW_ENTITY_REGISTRATION</span>
            <h2 className="magazine-heading text-5xl text-[var(--fg)]">Create Account</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-500/30 bg-red-500/5 text-red-500 text-sm font-mono">
              [ ERROR ] {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="index-label block mb-2">Full Name</label>
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
              <label className="index-label block mb-2">Email Address</label>
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
              <label className="index-label block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="index-label mt-2">Minimum 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center index-label mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--fg)] hover:underline">
              Sign in →
            </Link>
          </p>

          <p className="text-center index-label mt-4 text-[var(--fg-muted)]">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="hover:text-[var(--fg)] transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="hover:text-[var(--fg)] transition-colors">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
