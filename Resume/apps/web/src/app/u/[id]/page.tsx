import { prisma } from "@repo/core";
import { notFound } from "next/navigation";
import { 
  CheckCircle2, 
  Zap, 
  Star, 
  ArrowRight,
  Sparkles,
  Layout,
  Globe
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

// ── SEO Metadata ───────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const analysis = await prisma.analysis.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!analysis) return { title: "CareerAI | Profile Not Found" };

  const name = analysis.user.name;
  return {
    title: `${name}'s Career Profile | CareerAI`,
    description: `View ${name}'s AI-verified career profile, strengths, and skills. Analyzed with CareerAI.`,
    openGraph: {
      title: `${name}'s Career Vector | ${analysis.score}% Ready`,
      description: analysis.summary || "View my career trajectory and skills.",
      type: "profile",
    }
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { id } = await params;
  const analysis = await prisma.analysis.findUnique({
    where: { id },
    include: { user: true }
  });

  // Only show if public
  if (!analysis || !analysis.isPublic) {
    notFound();
  }

  const strengths = (Array.isArray(analysis.strengths) ? analysis.strengths : []) as string[];
  const skills = (Array.isArray(analysis.skills) ? analysis.skills : []) as string[];

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-white/10 overflow-x-hidden font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] glow-orb glow-orb-violet opacity-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] glow-orb glow-orb-cyan opacity-10" />
        <div className="absolute inset-0 bg-dot opacity-[0.15]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-all duration-500">
              <Zap className="h-5 w-5 text-black fill-black" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic leading-none">CareerAI</span>
          </Link>
          <Link href="/signup">
            <button className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-2xl glass-panel border-white/10 hover:bg-white hover:text-black transition-all duration-500 shadow-xl">
              Initialize Your Vector
            </button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 bg-white/20 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                  Verified Candidate Profile
                </span>
                <Globe className="h-3 w-3 text-zinc-700 animate-pulse" />
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-[calc(-0.05em)] mb-6 leading-[0.85] italic uppercase text-white">
                {analysis.user.name}
              </h1>
              <p className="text-zinc-400 text-xl md:text-2xl font-medium max-w-2xl leading-relaxed italic">
                "{analysis.summary}"
              </p>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center md:items-end">
              <div className="relative group">
                <div className="absolute inset-0 bg-white/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative h-44 w-44 rounded-[2.5rem] glass-panel border-white/20 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 relative z-10">Match Index</span>
                  <span className="text-7xl font-black text-white italic tracking-tighter relative z-10">{analysis.score}</span>
                  <div className="absolute bottom-0 inset-x-0 h-1.5 bg-emerald-500/20">
                     <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${analysis.score}%` }} />
                  </div>
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-24">
            {/* Strengths Card */}
            <div className="p-10 rounded-[2.5rem] glass-panel border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-700">
                <Star className="h-32 w-32 text-white" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3 mb-10">
                <Zap className="h-4 w-4 text-violet-400" /> Executive Competencies
              </h3>
              <div className="space-y-6">
                {strengths.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 group/item">
                    <div className="h-6 w-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center mt-0.5 group-hover/item:border-white/20 transition-colors">
                      <div className="h-1 w-1 rounded-full bg-white group-hover/item:scale-150 transition-transform" />
                    </div>
                    <p className="text-base text-zinc-400 font-medium leading-relaxed group-hover/item:text-zinc-200 transition-colors">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Card */}
            <div className="p-10 rounded-[2.5rem] glass-panel border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-700">
                <Layout className="h-32 w-32 text-white" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3 mb-10">
                <Sparkles className="h-4 w-4 text-blue-400" /> Technical Arsenal
              </h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill: string, i: number) => (
                  <span 
                    key={i}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 shadow-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative p-16 md:p-24 rounded-[3rem] glass-panel border-white/10 overflow-hidden group text-center shadow-[0_0_100px_rgba(255,255,255,0.05)]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative z-10">
              <div className="h-16 w-16 rounded-3xl bg-white text-black flex items-center justify-center mx-auto mb-10 shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-glow-pulse">
                 <Zap className="h-8 w-8 fill-black" />
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9] italic uppercase">
                Acquire This <br /> <span className="text-zinc-500 group-hover:text-white transition-colors duration-700">Intelligence</span>
              </h2>
              <p className="text-zinc-400 font-bold text-lg mb-12 max-w-md mx-auto leading-tight italic uppercase tracking-tight">
                Unlock the full career vector and technical blueprint for this candidate.
              </p>
              <Link href="/signup">
                <button className="px-12 py-6 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all duration-500 flex items-center gap-4 mx-auto group/btn shadow-[0_20px_50px_rgba(255,255,255,0.2)]">
                  Verify Your Own Talent <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
                </button>
              </Link>
            </div>
          </div>

          <footer className="mt-40 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">
                <span>CareerAI Digital Identity</span>
                <div className="h-1 w-1 rounded-full bg-zinc-900" />
                <span>Verified 2026</span>
              </div>
              <p className="text-[9px] text-zinc-900 font-black uppercase tracking-[0.3em]">
                System Status: Optimized
              </p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
