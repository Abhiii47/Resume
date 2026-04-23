"use client";
import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  NoiseButton,
  Spotlight,
} from "@repo/ui";

// Dynamic imports cleaned
const BackgroundBeams = dynamic(
  () => import("@repo/ui").then((m) => m.BackgroundBeams),
  { ssr: false },
);
// Dynamic imports cleaned
// Dynamic imports cleaned
// Dynamic imports cleaned
const AuroraBackground = dynamic(
  () => import("@repo/ui").then((m) => m.AuroraBackground),
  { ssr: false },
);
// Dynamic imports cleaned
// Dynamic imports cleaned
const InfiniteMovingCards = dynamic(
  () => import("@repo/ui").then((m) => m.InfiniteMovingCards),
  { ssr: false },
);
import {
  Zap,
  Brain,
  Mic2,
  Map,
  Rocket,
  Play,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";


export default function LandingPage() {
  const stats = [
    { value: "147%", label: "Average Score Increase" },
    { value: "3.2x", label: "More Interviews" },
    { value: "500k+", label: "Jobs Indexed" },
  ];

  // Features hardcoded below

  const testimonials = [
    {
      quote:
        "My resume went from ignored to top 10% in 3 days. The AI scoring revealed gaps I never knew existed.",
      name: "Sarah Chen",
      title: "Senior Engineer @ Meta",
    },
    {
      quote:
        "147% boost in quality score. I landed 5 interviews within the first week. This is next-level.",
      name: "Marcus Johnson",
      title: "Product Manager @ Stripe",
    },
    {
      quote:
        "The skill-to-job vector matching changed everything. No more spray and pray. Real results.",
      name: "Elena Rodriguez",
      title: "Staff Engineer @ Google",
    },
    {
      quote:
        "Finally, a tool that tells exactly what to fix. Week-by-week roadmap got me to offer in 6 weeks.",
      name: "David Kim",
      title: "Engineering Lead @ Airbnb",
    },
    {
      quote:
        "The behavioral prep simulation felt like the real interview. Walked in with absolute confidence.",
      name: "Priya Patel",
      title: "Senior Developer @ Netflix",
    },
    {
      quote:
        "ATS no longer hides my resume. Every keyword optimized. Every metric quantified. Dominance achieved.",
      name: "James Wilson",
      title: "Principal Architect @ Uber",
    },
  ];

  return (
    <div className="bg-[var(--bg)] min-h-screen text-[var(--fg)] overflow-hidden selection:bg-[var(--fg)] selection:text-[var(--bg)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[60] border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="h-6 w-6 bg-[var(--fg)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--bg)] fill-current" />
            </div>
            <span className="font-black text-xl tracking-tighter text-[var(--fg)] italic uppercase">
              CareerAI
            </span>
          </Link>
          
          <div className="flex items-center gap-12">
            <div className="hidden md:flex items-center gap-10">
              <Link href="#features" className="index-label hover:text-[var(--fg)] transition-colors">
                [ 01 ] SYSTEM_CAPABILITIES
              </Link>
              <Link href="#pricing" className="index-label hover:text-[var(--fg)] transition-colors">
                [ 02 ] ACCESS_TIERS
              </Link>
            </div>
            <div className="h-4 w-px bg-[var(--border)] hidden md:block" />
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="index-label hover:text-[var(--fg)] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="status-block status-block-active hover:scale-105 transition-transform"
              >
                Request Access →
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center pt-20">
        {/* Cinematic Background - Strict Grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-dot opacity-[0.05]" />
          <div className="absolute inset-0 bg-[linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] bg-[size:100px_100px]" />
        </div>

        <div className="relative z-10 w-full px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-12">
              <div className="flex items-center gap-6">
                <span className="index-label">[ 00 ] INITIALIZING_CORE</span>
                <div className="h-px w-24 bg-[var(--border)]" />
                <div className="status-block status-block-outline">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  REAL_TIME_VECTOR_SYNC_ACTIVE
                </div>
              </div>

              <h1 className="magazine-heading text-7xl md:text-[12rem] lg:text-[16rem]">
                Career <br />
                <span className="text-[var(--fg-muted)]">Engineering.</span>
              </h1>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-16">
                <div className="max-w-2xl">
                  <p className="text-2xl md:text-3xl text-[var(--fg-subtle)] font-medium leading-tight uppercase italic tracking-tighter">
                    A high-precision career acceleration engine. <br />
                    Bespoke intelligence for the top <span className="text-[var(--fg)]">1%</span>.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <Link
                    href="/signup"
                    className="status-block status-block-active px-12 py-8 text-sm hover:scale-105 transition-all shadow-2xl"
                  >
                    Execute Protocol →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Pure Brutalist Grid */}
      <section id="features" className="relative w-full py-40 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center gap-6 mb-32">
            <span className="index-label">[ 01 ] SYSTEM_CAPABILITIES</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[var(--border)]">
            {[
              {
                idx: "01",
                title: "VECTOR_MAPPING",
                desc: "Rebuild your capability profile into a high-dimensional vector database for sub-second job correlation.",
              },
              {
                idx: "02",
                title: "VOICE_SIMULATION",
                desc: "Real-time AI behavioral simulations with low-latency feedback on core technical vectors.",
              },
              {
                idx: "03",
                title: "WEEKLY_TRAJECTORY",
                desc: "Automated learning roadmaps designed to close the delta between your current state and target role.",
              },
            ].map((feature, i) => (
              <div key={i} className="p-16 border-r border-[var(--border)] last:border-r-0 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all group">
                <span className="index-label block mb-12 group-hover:text-[var(--bg)] transition-colors">{feature.idx} / MODULE</span>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-8 leading-none">
                  {feature.title}
                </h3>
                <p className="opacity-60 text-lg leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative w-full py-40 border-t border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center gap-6 mb-32">
            <span className="index-label">[ 02 ] ACCESS_TIERS</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[var(--border)]">
            {/* Tier 1 */}
            <div className="p-16 border-r border-[var(--border)]">
              <span className="index-label block mb-12">BASIC_TIER</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Starter</h3>
              <div className="text-6xl font-black mb-16 font-mono tracking-tighter">
                $00.00
              </div>
              <ul className="space-y-6 text-xs font-mono text-[var(--fg-muted)] mb-16 uppercase tracking-widest leading-relaxed">
                <li>• 3 Resume Scans</li>
                <li>• 5 Job Matches</li>
                <li>• 1 Career Roadmap</li>
              </ul>
              <Link href="/signup" className="status-block status-block-outline w-full justify-center py-6 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                Initialize →
              </Link>
            </div>

            {/* Tier 2 - Recommended */}
            <div className="p-16 bg-[var(--fg)] text-[var(--bg)] border-r border-[var(--border)] relative">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[var(--bg)] text-[var(--fg)] font-mono text-[10px] font-black uppercase">
                MOST_STABLE
              </div>
              <span className="index-label text-[var(--bg)] opacity-40 block mb-12">OPTIMIZED_TIER</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Early Bird</h3>
              <div className="text-6xl font-black mb-16 font-mono tracking-tighter">
                $05.00
              </div>
              <ul className="space-y-6 text-xs font-mono text-[var(--bg)] opacity-60 mb-16 uppercase tracking-widest leading-relaxed">
                <li>• 20 Resume Scans</li>
                <li>• 30 Job Matches</li>
                <li>• 5 Career Roadmaps</li>
                <li>• 10 Mock Interviews</li>
              </ul>
              <Link href="/signup" className="status-block status-block-active w-full justify-center py-6 bg-[var(--bg)] text-[var(--fg)] hover:opacity-90">
                Acquire Access →
              </Link>
            </div>

            {/* Tier 3 */}
            <div className="p-16">
              <span className="index-label block mb-12">ELITE_TIER</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Enterprise</h3>
              <div className="text-6xl font-black mb-16 font-mono tracking-tighter">
                $50.00
              </div>
              <ul className="space-y-6 text-xs font-mono text-[var(--fg-muted)] mb-16 uppercase tracking-widest leading-relaxed">
                <li>• Unlimited Scans</li>
                <li>• 1-on-1 Review</li>
                <li>• ATS-Bypass Guarantee</li>
              </ul>
              <Link href="/signup" className="status-block status-block-outline w-full justify-center py-6 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                Contact Sales →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-8 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="max-w-md">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-6 w-6 bg-[var(--fg)]" />
              <span className="font-black text-xl tracking-tighter text-[var(--fg)] italic uppercase">CareerAI</span>
            </div>
            <p className="index-label leading-relaxed text-[var(--fg-muted)]">
              A high-precision career acceleration engine. <br />
              System Status: <span className="text-emerald-500">OPTIMAL</span> <br />
              [ 52.5200° N, 13.4050° E ]
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-32">
            <div className="flex flex-col gap-6">
              <span className="index-label text-[var(--fg)]">Navigation</span>
              <Link href="#features" className="index-label hover:text-[var(--fg)] transition-colors">Work</Link>
              <Link href="#pricing" className="index-label hover:text-[var(--fg)] transition-colors">Pricing</Link>
            </div>
            <div className="flex flex-col gap-6">
              <span className="index-label text-[var(--fg)]">Connect</span>
              <Link href="/" className="index-label hover:text-[var(--fg)] transition-colors">Twitter</Link>
              <Link href="/" className="index-label hover:text-[var(--fg)] transition-colors">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
