"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "@repo/core/client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState<string | null>(null);

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
      {/* ── Left branding panel ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--fg)] text-[var(--bg)] flex-col justify-between p-12 relative overflow-hidden">
        
        <Link href="/" className="font-black text-xl tracking-tighter uppercase italic relative z-10">
          CareerAI
        </Link>

        <div className="relative z-10">
          <h1 className="magazine-heading text-4xl lg:text-5xl leading-none text-[var(--bg)] mb-6">
            Your Career,<br />Accelerated.
          </h1>
          <p className="text-xs text-[var(--bg)] opacity-60 leading-relaxed max-w-sm mb-12">
            Upload your resume. Get AI-powered analysis, live job matches, a personalized roadmap, and interview coaching — all in one place.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="status-block status-block-active bg-[var(--bg)] text-[var(--fg)]">01</div>
              <span className="font-bold uppercase tracking-widest text-sm">Resume Vectorization</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="status-block status-block-active bg-[var(--bg)] text-[var(--fg)]">02</div>
              <span className="font-bold uppercase tracking-widest text-sm">Market Alignment</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Right form panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 bg-[var(--bg)]">
        
        {/* Mobile logo */}
        <div className="lg:hidden mb-12">
          <Link href="/" className="font-black text-xl tracking-tighter uppercase italic">
            CareerAI
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="mb-8">
            <span className="index-label block mb-2">[ 00 ] AUTHENTICATION</span>
            <h2 className="magazine-heading text-3xl md:text-4xl text-[var(--fg)]">Sign In</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-500 bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--fg-muted)] mb-2">Email Address</label>
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
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--fg-muted)]">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold uppercase tracking-widest text-[var(--fg)] hover:underline">
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
              className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating...</>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-[var(--fg-muted)] mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[var(--fg)] hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
