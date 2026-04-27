"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight, Brain, Briefcase, Map } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "@repo/core/client";

const FEATURES = [
  { icon: Brain, label: "AI Resume Score", desc: "ATS score + placement rating in seconds." },
  { icon: Briefcase, label: "Live Job Matching", desc: "Real jobs ranked by your actual skills." },
  { icon: Map, label: "Career Roadmap", desc: "12-week plan to close your skill gaps." },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });
      if (signInError) {
        setError(signInError.message || "Invalid credentials");
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
        {/* Logo */}
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

        {/* Big heading */}
        <div>
          <h1 className="magazine-heading text-[5rem] leading-none text-[var(--bg)] mb-8">
            Your Career,<br />Accelerated.
          </h1>
          <p className="text-sm text-[var(--bg)] opacity-60 leading-relaxed max-w-sm mb-16">
            Upload your resume. Get AI-powered analysis, live job matches, a personalized roadmap, and interview coaching — all in one place.
          </p>

          {/* Feature list */}
          <div className="space-y-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 border border-[var(--bg)] opacity-80 hover:opacity-100 transition-opacity">
                <f.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-black text-xs uppercase tracking-widest mb-1">{f.label}</p>
                  <p className="text-xs opacity-60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="index-label opacity-40 text-[var(--bg)]">© 2026 CareerAI</p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 bg-[var(--bg)] relative overflow-hidden">
        {/* Dot background */}
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
          transition={{ duration: 0.3 }}
          className="w-full max-w-md mx-auto relative z-10"
        >
          <div className="mb-10">
            <span className="index-label block mb-3">[ 00 ] AUTHENTICATION</span>
            <h2 className="magazine-heading text-5xl text-[var(--fg)]">Sign In</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-500/30 bg-red-500/5 text-red-500 text-sm font-mono">
              [ ERROR ] {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="flex items-center justify-between mb-2">
                <label className="index-label">Password</label>
                <Link href="/forgot-password" className="index-label hover:text-[var(--fg)] transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center index-label mt-8">
            No account?{" "}
            <Link href="/signup" className="text-[var(--fg)] hover:underline">
              Create one free →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
