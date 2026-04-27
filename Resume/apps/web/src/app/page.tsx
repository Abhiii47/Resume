"use client";
import Link from "next/link";
import { Zap, FileText, Brain, Briefcase, Map, MessageSquare, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const STEPS = [
  {
    num: "01",
    title: "Upload Your Resume",
    body: "Drop your PDF. Our engine extracts every skill, role, and achievement in seconds.",
  },
  {
    num: "02",
    title: "Get AI Intelligence",
    body: "Gemini scores your resume, identifies gaps, builds your LinkedIn kit, and matches you to real live jobs.",
  },
  {
    num: "03",
    title: "Execute Your Plan",
    body: "Follow a personalized 12-week roadmap, practice interviews, and track every application — all in one place.",
  },
];

const FEATURES = [
  { icon: Brain, label: "ATS + Placement Score", desc: "Know exactly how recruiters see you. Get an ATS score and overall placement rating out of 100." },
  { icon: Briefcase, label: "Live Job Matching", desc: "AI ranks real job postings against your actual profile. No more irrelevant listings." },
  { icon: Map, label: "12-Week Career Roadmap", desc: "Close your skill gaps with a week-by-week AI-generated learning plan. Free resources only." },
  { icon: MessageSquare, label: "Mock Interview Coach", desc: "Answer questions and get scored feedback instantly. Build confidence before the real thing." },
  { icon: FileText, label: "LinkedIn Branding Kit", desc: "AI-written headline, About section, and cold DM template. Optimised for recruiter search." },
  { icon: Zap, label: "Public Career Portfolio", desc: "Share a verified profile page with your score and skills. Your personal proof of work." },
];

export default function LandingPage() {
  return (
    <div className="bg-[var(--bg)] min-h-screen text-[var(--fg)] overflow-hidden selection:bg-[var(--fg)] selection:text-[var(--bg)]">

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-[60] border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-6 w-6 bg-[var(--fg)] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[var(--bg)] fill-current" />
            </div>
            <span className="font-black text-base tracking-tighter text-[var(--fg)] italic uppercase">
              CareerAI
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-8">
              <Link href="#how-it-works" className="index-label hover:text-[var(--fg)] transition-colors">
                [ 01 ] HOW_IT_WORKS
              </Link>
              <Link href="#features" className="index-label hover:text-[var(--fg)] transition-colors">
                [ 02 ] FEATURES
              </Link>
              <Link href="#pricing" className="index-label hover:text-[var(--fg)] transition-colors">
                [ 03 ] PRICING
              </Link>
            </div>
            <div className="h-4 w-px bg-[var(--border)] hidden md:block" />
            <div className="flex items-center gap-4">
              <Link href="/login" className="index-label hover:text-[var(--fg)] transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="status-block status-block-active px-4 py-2.5">
                Get Started →
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 pt-16 bg-dot">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-40" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-8 w-full">
          {/* Status bar */}
          <div className="flex items-center gap-4 mb-12 border-b border-[var(--border)] pb-6">
            <span className="index-label">[ 00 ] SYSTEM_STATUS</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
            <div className="status-block status-block-outline gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 inline-block" style={{ animation: "pulse-dim 2s infinite" }} />
              ENGINE_ONLINE
            </div>
          </div>

          {/* Main heading */}
          <h1 className="magazine-heading text-[clamp(4rem,15vw,18rem)] text-[var(--fg)] leading-none mb-0">
            Land Your
          </h1>
          <h1 className="magazine-heading text-[clamp(4rem,15vw,18rem)] text-[var(--fg-muted)] leading-none mb-16">
            Next Job.
          </h1>

          {/* Sub-row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="max-w-xl">
              <p className="text-lg md:text-xl text-[var(--fg-subtle)] font-medium leading-relaxed">
                CareerAI analyzes your resume, matches you to real jobs, builds a learning roadmap, and coaches you for interviews — all powered by Gemini AI.
              </p>
              <p className="index-label mt-4">Free to start. No credit card required.</p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <Link
                href="/signup"
                className="status-block status-block-active px-8 py-5 text-sm hover:opacity-90 transition-opacity"
              >
                Analyze My Resume →
              </Link>
              <Link
                href="#how-it-works"
                className="status-block status-block-outline px-8 py-5 text-sm"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom ticker */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)]">
          <div className="max-w-[1400px] mx-auto px-8 py-3 flex items-center gap-8 overflow-hidden">
            {["AI Resume Analysis", "Live Job Matching", "Career Roadmap", "Mock Interview Coach", "LinkedIn Branding Kit", "Public Portfolio"].map((t, i) => (
              <span key={i} className="index-label whitespace-nowrap">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="max-w-[1400px] mx-auto px-8 py-32">
          <div className="flex items-center gap-6 mb-24">
            <span className="index-label">[ 01 ] HOW_IT_WORKS</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--border)]">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="p-12 border-r border-[var(--border)] last:border-r-0 group offset-card hover:z-10 relative"
              >
                <div className="text-[5rem] font-black font-mono text-[var(--border)] leading-none mb-8 group-hover:text-[var(--fg-muted)] transition-colors">
                  {step.num}
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight text-[var(--fg)] mb-4 leading-none">
                  {step.title}
                </h3>
                <p className="text-[var(--fg-subtle)] text-sm leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="relative border-t border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-8 py-32">
          <div className="flex items-center gap-6 mb-24">
            <span className="index-label">[ 02 ] CAPABILITIES</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="index-label">6 MODULES_ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-[var(--border)]">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-10 border-r border-b border-[var(--border)] last:border-r-0 group hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
              >
                <div className="flex items-start justify-between mb-10">
                  <f.icon className="h-5 w-5 text-[var(--fg-muted)] group-hover:text-[var(--bg)] transition-colors" />
                  <span className="index-label group-hover:text-[var(--bg)] opacity-40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-3 leading-none">
                  {f.label}
                </h3>
                <p className="text-sm opacity-60 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" className="relative border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="max-w-[1400px] mx-auto px-8 py-32">
          <div className="flex items-center gap-6 mb-24">
            <span className="index-label">[ 03 ] ACCESS_TIERS</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--border)]">
            {/* Free */}
            <div className="p-12 border-r border-[var(--border)]">
              <span className="index-label block mb-8">FREE_TIER</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Starter</h3>
              <div className="text-5xl font-black font-mono mb-12 tracking-tighter">$0</div>
              <ul className="space-y-3 mb-12">
                {["3 Resume Analyses", "5 Job Matches", "1 Career Roadmap", "2 Mock Interviews"].map((f) => (
                  <li key={f} className="text-xs font-mono text-[var(--fg-subtle)] flex items-center gap-2">
                    <span className="text-[var(--fg-muted)]">—</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="status-block status-block-outline w-full justify-center py-4">
                Start Free →
              </Link>
            </div>

            {/* Early Bird — highlighted */}
            <div className="p-12 bg-[var(--fg)] text-[var(--bg)] border-r border-[var(--border)] relative">
              <div className="absolute top-4 right-4 tag bg-[var(--bg)] text-[var(--fg)]">
                MOST POPULAR
              </div>
              <span className="index-label block mb-8 opacity-40">EARLY_BIRD</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Early Bird</h3>
              <div className="text-5xl font-black font-mono mb-12 tracking-tighter">$5<span className="text-2xl opacity-50">/mo</span></div>
              <ul className="space-y-3 mb-12">
                {["20 Resume Analyses", "30 Job Matches", "5 Career Roadmaps", "10 Mock Interviews", "LinkedIn Branding Kit"].map((f) => (
                  <li key={f} className="text-xs font-mono opacity-70 flex items-center gap-2">
                    <span className="opacity-50">—</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="status-block status-block-active w-full justify-center py-4 bg-[var(--bg)] text-[var(--fg)]">
                Get Early Access →
              </Link>
            </div>

            {/* Premium */}
            <div className="p-12">
              <span className="index-label block mb-8">PREMIUM_TIER</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Elite</h3>
              <div className="text-5xl font-black font-mono mb-12 tracking-tighter">$50<span className="text-2xl opacity-50">/mo</span></div>
              <ul className="space-y-3 mb-12">
                {["Everything in Early Bird", "Unlimited Analyses", "Unlimited Job Matches", "Unlimited Roadmaps", "Priority Support"].map((f) => (
                  <li key={f} className="text-xs font-mono text-[var(--fg-subtle)] flex items-center gap-2">
                    <span className="text-[var(--fg-muted)]">—</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="status-block status-block-outline w-full justify-center py-4">
                Go Elite →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="border-t border-b border-[var(--border)] bg-[var(--fg)] text-[var(--bg)]">
        <div className="max-w-[1400px] mx-auto px-8 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="magazine-heading text-5xl md:text-7xl">
              Ready to land<br />
              <span className="opacity-50">your next job?</span>
            </h2>
          </div>
          <Link
            href="/signup"
            className="flex-shrink-0 flex items-center gap-3 border border-[var(--bg)] px-10 py-6 font-black text-sm uppercase tracking-widest hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-colors"
          >
            Analyze My Resume <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="max-w-[1400px] mx-auto px-8 py-16 flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-6 bg-[var(--fg)] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[var(--bg)] fill-current" />
              </div>
              <span className="font-black text-base tracking-tighter italic uppercase">CareerAI</span>
            </div>
            <p className="index-label leading-relaxed text-[var(--fg-muted)] max-w-xs">
              AI-powered career acceleration. <br />
              Upload a resume. Land a job.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-4">
              <span className="index-label text-[var(--fg)]">Product</span>
              <Link href="#how-it-works" className="index-label hover:text-[var(--fg)] transition-colors">How it Works</Link>
              <Link href="#features" className="index-label hover:text-[var(--fg)] transition-colors">Features</Link>
              <Link href="#pricing" className="index-label hover:text-[var(--fg)] transition-colors">Pricing</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="index-label text-[var(--fg)]">Account</span>
              <Link href="/login" className="index-label hover:text-[var(--fg)] transition-colors">Sign In</Link>
              <Link href="/signup" className="index-label hover:text-[var(--fg)] transition-colors">Sign Up</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="index-label text-[var(--fg)]">Legal</span>
              <Link href="/privacy" className="index-label hover:text-[var(--fg)] transition-colors">Privacy</Link>
              <Link href="/terms" className="index-label hover:text-[var(--fg)] transition-colors">Terms</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between">
          <span className="index-label">© 2026 CareerAI — All rights reserved</span>
          <span className="index-label">Built with Gemini AI</span>
        </div>
      </footer>
    </div>
  );
}
