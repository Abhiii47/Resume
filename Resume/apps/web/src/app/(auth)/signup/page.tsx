"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signUp } from "@repo/core/client";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState<string | null>(null);

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
      window.location.href = "/dashboard?onboard=true";
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
            Everything You<br />
            <span className="opacity-50">Need to Get Hired.</span>
          </h1>
          <p className="text-xs text-[var(--bg)] opacity-60 leading-relaxed max-w-sm mb-12">
            Join thousands of job seekers using CareerAI to land roles faster. Analyze your resume, match jobs, learn new skills, and ace interviews.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="status-block status-block-active bg-[var(--bg)] text-[var(--fg)]">✓</div>
              <span className="font-bold uppercase tracking-widest text-sm">ATS Optimization</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="status-block status-block-active bg-[var(--bg)] text-[var(--fg)]">✓</div>
              <span className="font-bold uppercase tracking-widest text-sm">Automated Roadmaps</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="status-block status-block-active bg-[var(--bg)] text-[var(--fg)]">✓</div>
              <span className="font-bold uppercase tracking-widest text-sm">Mock Interviews</span>
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
            <span className="index-label block mb-2">[ 01 ] NEW_ENTITY_REGISTRATION</span>
            <h2 className="magazine-heading text-3xl md:text-4xl text-[var(--fg)]">Create Account</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-500 bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--fg-muted)] mb-2">Full Name</label>
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
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--fg-muted)] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</>
              ) : (
                <>Sign Up <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-[var(--fg-muted)] mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--fg)] hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs text-[var(--fg-muted)] mt-4">
            By signing up, you accept our <Link href="/terms" className="text-[var(--fg)] hover:underline">Terms</Link> and <Link href="/privacy" className="text-[var(--fg)] hover:underline">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
