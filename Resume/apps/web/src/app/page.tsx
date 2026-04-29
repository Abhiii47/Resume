"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@repo/core/client";

import Link from "next/link";
import { 
  ArrowRight, 
  FileText, 
  Zap, 
  Activity, 
  Database, 
  Target, 
  ShieldCheck, 
  Terminal,
  Cpu,
  Layers,
  Search,
  CheckCircle2,
  Globe,
  BarChart3,
  TrendingUp,
  Menu
} from "lucide-react";
import { cn } from "@repo/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";

export default function LandingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isPending && session) {
      router.push('/dashboard');
    }
  }, [session, isPending, router]);

  return (
    <div className="bg-[var(--bg)] min-h-screen text-[var(--fg)] overflow-x-hidden selection:bg-[var(--fg)] selection:text-[var(--bg)]">
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      
      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b-2 border-[var(--fg)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-24 flex items-center justify-between">
          <Link href="/" className="font-black text-2xl tracking-tighter uppercase italic flex items-center gap-3">
            <div className="h-10 w-10 bg-[var(--fg)] flex items-center justify-center text-[var(--bg)]">C</div>
            CareerAI
          </Link>

          <div className="hidden md:flex items-center gap-12 font-black text-xs tracking-[0.2em] uppercase italic">
            <Link href="#features" className="hover:line-through transition-all underline decoration-2 underline-offset-8">Features</Link>
            <Link href="#pricing" className="hover:line-through transition-all underline decoration-2 underline-offset-8">Pricing</Link>
            <Link href="/login" className="hover:opacity-60 transition-opacity">Log In</Link>
            <Link href="/signup" className="btn-primary py-3 px-8 text-xs">
              START_FREE
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsMobileNavOpen(true)}
              className="h-12 w-12 border-2 border-[var(--fg)] flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] border border-[var(--fg)] rotate-12" />
           <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] border-4 border-[var(--fg)] -rotate-6" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 w-full flex-1 flex flex-col justify-center relative">
          <div className="flex items-center gap-6 mb-12">
            <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1">[ 00 ] SYSTEM_ENTRY</span>
            <div className="h-px w-32 bg-[var(--fg)]" />
          </div>

          <h1 className="magazine-heading text-6xl md:text-[8rem] lg:text-[10rem] text-[var(--fg)] leading-[0.8] mb-0 tracking-[-0.05em]">
            LAND_YOUR.
          </h1>
          <h1 className="magazine-heading text-6xl md:text-[8rem] lg:text-[10rem] text-[var(--fg)] opacity-20 leading-[0.8] mb-16 tracking-[-0.05em] italic">
            NEXT_JOB.
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-end">
            <div className="space-y-12">
              <p className="text-3xl md:text-5xl font-black leading-[1] text-[var(--fg)] uppercase italic border-l-8 border-[var(--fg)] pl-10 max-w-2xl">
                DECRYPT YOUR POTENTIAL. MAP YOUR TRAJECTORY. EXECUTE THE HIRE.
              </p>
              <p className="text-xl md:text-2xl font-bold leading-tight max-w-xl text-[var(--fg-muted)]">
                Our AI engine extracts high-fidelity vectors from your raw PDF, matches them against live market signals, and generates a serialized roadmap to offer.
              </p>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-12">
              <div className="p-8 border-4 border-[var(--fg)] bg-[var(--bg)] blueprint-corners offset-card shadow-none w-full max-w-md relative group hover:bg-[var(--bg-muted)] transition-colors">
                <div className="corner-bl" />
                <div className="corner-br" />
                <div className="flex items-center gap-6 mb-6">
                  <div className="h-12 w-12 border-2 border-[var(--fg)] flex items-center justify-center">
                    <Activity className="h-6 w-6" />
                  </div>
                  <span className="index-label">REALTIME_SIGNALS</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-sm font-black uppercase italic">ATS_SCORE_AVG</span>
                    <span className="font-mono font-black text-xl">82.4</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-sm font-black uppercase italic">LIVE_MATCHES</span>
                    <span className="font-mono font-black text-xl text-emerald-500">12,402</span>
                  </div>
                </div>
              </div>

              <Link href="/signup" className="group w-full max-w-md">
                <div className="btn-primary py-8 px-12 text-3xl flex items-center justify-between gap-8 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all italic">
                  Get Started 
                  <ArrowRight className="w-12 h-12 group-hover:translate-x-4 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── [ 01 ] SYSTEM_PULSE ───────────────────────────────────────── */}
      <section className="border-y-4 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "VECTORS_MAPPED", value: "842K+", icon: Database },
              { label: "AI_SUGGESTIONS", value: "1.2M", icon: Cpu },
              { label: "ROADMAPS_ACTIVE", value: "48.2K", icon: Layers },
              { label: "MARKET_SIGNALS", value: "24/7", icon: Globe }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group">
                <stat.icon className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col">
                  <span className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none mb-2">
                    {stat.value}
                  </span>
                  <span className="index-label text-[var(--bg)] opacity-60 text-[10px]">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── [ 02 ] EXTRACTION_PIPELINE ────────────────────────────────── */}
      <section className="py-32 bg-[var(--bg)] border-b-4 border-[var(--fg)] relative">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-24">
            <div className="max-w-2xl">
              <div className="flex items-center gap-6 mb-8">
                <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1">[ 02 ] EXTRACTION_PIPELINE</span>
                <div className="h-px w-32 bg-[var(--fg)]" />
              </div>
              <h2 className="magazine-heading text-6xl md:text-8xl mb-8">Raw PDF to Vector.</h2>
              <p className="text-2xl font-bold text-[var(--fg-muted)] uppercase italic">
                Our proprietary parsing engine deconstructs your resume into a multi-dimensional feature set.
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <Terminal className="h-48 w-48 text-[var(--fg)] opacity-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-[var(--fg)] -translate-y-1/2 hidden md:block z-0 opacity-20" />
            
            {[
              { title: "SOURCE_INPUT", desc: "Raw PDF ingestion & OCR normalization", icon: FileText },
              { title: "TOKEN_DESTRUCTION", desc: "Breaking text into high-fidelity nodes", icon: Zap },
              { title: "VECTOR_ENCODING", desc: "Gemini-powered semantic embedding", icon: Cpu },
              { title: "TRAJECTORY_MAP", desc: "Cross-referencing with market signals", icon: Target }
            ].map((step, i) => (
              <div key={i} className="relative z-10 p-10 border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none flex flex-col gap-6 group hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all">
                <div className="h-16 w-16 border-2 border-current flex items-center justify-center mb-4">
                  <step.icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase mb-4">{step.title}</h3>
                  <p className="text-sm font-bold opacity-60 uppercase">{step.desc}</p>
                </div>
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-current opacity-40 group-hover:opacity-100">
                  <span className="font-mono text-xs">STAGE_0{i+1}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── [ 03 ] MARKET_INTELLIGENCE ────────────────────────────────── */}
      <section id="features" className="py-32 bg-[var(--bg-muted)] border-b-4 border-[var(--fg)]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="flex items-center gap-6">
                <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1">[ 03 ] MARKET_INTELLIGENCE</span>
                <div className="h-px w-32 bg-[var(--fg)]" />
              </div>
              <h2 className="magazine-heading text-6xl md:text-8xl">Signal vs Noise.</h2>
              <p className="text-xl md:text-2xl font-bold leading-relaxed text-[var(--fg-muted)] italic uppercase">
                We monitor 400+ career vectors to provide absolute clarity on your standing.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 border-2 border-[var(--fg)] bg-[var(--bg)] blueprint-corners">
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  <Search className="h-8 w-8 mb-6 text-emerald-500" />
                  <h4 className="font-black italic uppercase mb-2">Live Matching</h4>
                  <p className="text-xs font-bold opacity-60 uppercase leading-tight">Direct correlation between your vector and active job openings.</p>
                </div>
                <div className="p-8 border-2 border-[var(--fg)] bg-[var(--bg)] blueprint-corners">
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  <BarChart3 className="h-8 w-8 mb-6 text-blue-500" />
                  <h4 className="font-black italic uppercase mb-2">Skill Gap Analysis</h4>
                  <p className="text-xs font-bold opacity-60 uppercase leading-tight">Identifying the exact missing tokens required for tier-1 placement.</p>
                </div>
              </div>
            </div>

            <div className="p-12 border-4 border-[var(--fg)] bg-[var(--bg)] offset-card shadow-none relative blueprint-corners overflow-hidden">
              <div className="corner-bl" />
              <div className="corner-br" />
              <div className="absolute top-0 right-0 p-4 border-l-4 border-b-4 border-[var(--fg)] bg-[var(--bg-muted)] index-label text-[10px]">REALTIME_CAPTURE</div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="index-label">TRENDING_VECTORS</span>
                  <div className="flex flex-wrap gap-3">
                    {["RUST", "LLM_OPS", "SYSTEM_DESIGN", "VECTOR_DB", "K8S"].map(tag => (
                      <span key={tag} className="status-block bg-[var(--bg-muted)] text-[10px] px-3 py-1 font-black italic">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="p-8 border-2 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]">
                  <div className="flex items-center justify-between mb-6">
                    <span className="index-label text-[var(--bg)]">MARKET_VELOCITY</span>
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="h-32 flex items-end gap-2">
                    {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-[var(--bg)] opacity-20" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-[var(--bg-muted)] border-2 border-[var(--fg)] border-dashed">
                   <div className="flex items-center gap-4">
                     <ShieldCheck className="h-6 w-6 text-emerald-500" />
                     <span className="font-black italic uppercase text-sm">Integrity Verified</span>
                   </div>
                   <span className="font-mono text-xs opacity-40">NODE_742</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── [ 04 ] RECENT_OPERATIONS ─────────────────────────────────── */}
      <section className="py-32 bg-[var(--bg)] border-b-4 border-[var(--fg)] relative">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-6 mb-16">
            <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1">[ 04 ] RECENT_OPERATIONS</span>
            <div className="h-px w-32 bg-[var(--fg)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-4">
              {[
                { time: "12:44:02", op: "VECTOR_MAPPING", status: "COMPLETE", id: "V_742" },
                { time: "12:44:15", op: "SEMANTIC_ANALYSIS", status: "COMPLETE", id: "A_109" },
                { time: "12:44:28", op: "ROADMAP_GENERATION", status: "IN_PROGRESS", id: "R_882" },
                { time: "12:44:40", op: "SIGNAL_SYNC", status: "AWAITING", id: "S_001" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-6 border-2 border-[var(--fg)] bg-[var(--bg-muted)] hover:bg-white transition-all group cursor-crosshair">
                   <div className="flex items-center gap-8">
                     <span className="font-mono text-xs opacity-40">{log.time}</span>
                     <span className="font-black italic uppercase text-lg group-hover:translate-x-2 transition-transform">{log.op}</span>
                   </div>
                   <div className="flex items-center gap-8">
                     <span className="font-mono text-[10px] opacity-40 hidden sm:block">REF_{log.id}</span>
                     <div className={cn(
                       "status-block text-[10px] min-w-[100px] justify-center",
                       log.status === "COMPLETE" ? "bg-emerald-500 text-white border-emerald-500" : "bg-[var(--bg)]"
                     )}>
                       {log.status}
                     </div>
                   </div>
                </div>
              ))}
            </div>

            <div className="p-10 border-4 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] offset-card shadow-none flex flex-col justify-between relative blueprint-corners">
               <div className="corner-bl" />
               <div className="corner-br" />
               <div>
                 <h3 className="magazine-heading text-4xl mb-6">Join the Grid.</h3>
                 <p className="font-bold text-lg leading-tight uppercase italic opacity-80">
                   Join 48,000+ engineers optimizing their career vectors.
                 </p>
               </div>
               <Link href="/signup" className="btn-primary !bg-[var(--bg)] !text-[var(--fg)] !border-[var(--bg)] py-6 text-xl text-center mt-12 hover:!bg-transparent hover:!text-[var(--bg)] transition-all">
                 INITIALIZE_ACCESS
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── [ 05 ] DEPLOYMENT_TIERS ──────────────────────────────────── */}
      <section id="pricing" className="py-32 bg-[var(--bg)] border-b-4 border-[var(--fg)]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-24">
            <div className="max-w-2xl">
              <div className="flex items-center gap-6 mb-8">
                <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1">[ 05 ] DEPLOYMENT_TIERS</span>
                <div className="h-px w-32 bg-[var(--fg)]" />
              </div>
              <h2 className="magazine-heading text-6xl md:text-8xl">Pricing.</h2>
            </div>
            <p className="text-xl font-black italic uppercase text-[var(--fg-muted)] border-l-4 border-[var(--fg)] pl-6">
              Choose your operation scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                id: "STARTER",
                name: "Core",
                price: "$0",
                features: ["3 Resume Analyses", "5 Job Matches", "1 Roadmap"],
                cta: "START_FREE",
                type: "secondary"
              },
              {
                id: "EARLY_BIRD",
                name: "Operative",
                price: "$5",
                features: ["20 Resume Analyses", "30 Job Matches", "5 Roadmaps", "Interview Access"],
                cta: "Upgrade",
                popular: true,
                type: "primary"
              },
              {
                id: "PREMIUM",
                name: "Elite",
                price: "$50",
                features: ["Unlimited Analyses", "Unlimited Matches", "Priority Support", "Vortex Mode"],
                cta: "Go Elite",
                type: "secondary"
              }
            ].map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative p-12 border-4 flex flex-col gap-12 transition-all offset-card shadow-none blueprint-corners group",
                  plan.popular 
                    ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]" 
                    : "bg-[var(--bg)] text-[var(--fg)] border-[var(--fg)] hover:bg-[var(--bg-muted)]"
                )}
              >
                <div className="corner-bl" />
                <div className="corner-br" />
                
                {plan.popular && (
                  <div className="absolute top-0 right-0 px-6 py-2 bg-[var(--bg)] text-[var(--fg)] index-label border-b-4 border-l-4 border-[var(--fg)] font-black text-[10px] italic">
                    RECOMMENDED_NODE
                  </div>
                )}

                <div>
                  <p className={cn(
                    "magazine-heading text-4xl mb-4 italic",
                    plan.popular ? "text-[var(--bg)]" : "text-[var(--fg)]"
                  )}>
                    {plan.name}.
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black italic tracking-tighter leading-none">{plan.price}</span>
                    <span className="index-label opacity-40 italic">/mo</span>
                  </div>
                </div>

                <ul className="space-y-6 flex-1 border-t-4 border-current pt-10">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-4 index-label font-black text-xs italic uppercase leading-tight">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/signup" 
                  className={cn(
                    "w-full py-6 text-center index-label font-black text-xl italic uppercase border-4 transition-all group/btn",
                    plan.popular 
                      ? "bg-[var(--bg)] text-[var(--fg)] border-[var(--bg)] hover:scale-[1.02]" 
                      : "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)] hover:scale-[1.02]"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-24 bg-[var(--bg)]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 border-t-4 border-[var(--fg)] pt-16">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-[var(--fg)] flex items-center justify-center text-[var(--bg)] text-xl font-black italic">C</div>
               <span className="magazine-heading text-3xl">CareerAI.</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-12 index-label text-xs">
              <Link href="/privacy" className="hover:line-through">Privacy_Policy</Link>
              <Link href="/terms" className="hover:line-through">Terms_Of_Service</Link>
              <Link href="/contact" className="hover:line-through">SUPPORT_TERMINAL</Link>
            </div>

            <div className="flex items-center gap-4 index-label text-[10px] opacity-40">
               © 2026_CAREER_GRID. ALL_RIGHTS_RETAINED.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
