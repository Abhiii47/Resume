import Link from "next/link";
import { ArrowRight, FileText, Briefcase, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="bg-[var(--bg)] min-h-screen text-[var(--fg)] overflow-hidden selection:bg-[var(--fg)] selection:text-[var(--bg)]">
      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-[60] mix-blend-difference text-white">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tighter uppercase italic">
            CareerAI
          </Link>

          <div className="flex items-center gap-8 font-bold text-sm tracking-widest uppercase">
            <Link href="#features" className="hover:opacity-60 transition-opacity">Features</Link>
            <Link href="#pricing" className="hover:opacity-60 transition-opacity">Pricing</Link>
            <div className="h-4 w-px bg-white/20" />
            <Link href="/login" className="hover:opacity-60 transition-opacity">Log In</Link>
            <Link href="/signup" className="flex items-center gap-2 group">
              Start
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col pt-32 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 w-full flex-1 flex flex-col justify-center">
          
          <div className="flex items-center gap-4 mb-8">
            <span className="index-label">[ 00 ] INIT</span>
            <div className="h-px w-24 bg-[var(--fg)]" />
          </div>

          {/* Main heading */}
          <h1 className="magazine-heading text-5xl md:text-7xl lg:text-8xl text-[var(--fg)] leading-none mb-0">
            Land Your
          </h1>
          <h1 className="magazine-heading text-5xl md:text-7xl lg:text-8xl text-[var(--fg-muted)] leading-none mb-12">
            Next Job.
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <p className="text-xl md:text-2xl font-medium leading-tight max-w-lg">
              Upload your resume. Let AI extract your skills, match you to live roles, and generate a step-by-step roadmap to get hired.
            </p>

            <div className="flex flex-col items-start md:items-end justify-center">
              <Link href="/signup" className="group">
                <div className="status-block status-block-active text-xl md:text-3xl px-8 py-6 flex items-center gap-6 hover:bg-transparent hover:text-[var(--fg)] transition-colors cursor-pointer">
                  Execute 
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Steps ────────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] relative bg-[var(--bg)]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Upload",
                desc: "Drop your PDF. We extract every skill and achievement using advanced parsing."
              },
              {
                num: "02",
                title: "Analyze",
                desc: "Our Gemini model scores your profile and finds your exact market fit."
              },
              {
                num: "03",
                title: "Execute",
                desc: "Follow an AI-generated weekly roadmap to close skill gaps and land interviews."
              }
            ].map((step, i) => (
              <div 
                key={i} 
                className="p-12 border-r border-[var(--border)] last:border-r-0 group offset-card hover:z-10 relative"
              >
                <div className="text-6xl md:text-7xl font-black font-mono text-[var(--border)] leading-none mb-6 group-hover:text-[var(--fg-muted)] transition-colors">
                  {step.num}
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight text-[var(--fg)] mb-4 leading-none">
                  {step.title}
                </h3>
                <p className="text-[var(--fg-subtle)] font-medium leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-[var(--border)] py-32 bg-[var(--bg-muted)]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4 mb-16">
            <span className="index-label">[ 01 ] SYSTEM_CAPABILITIES</span>
            <div className="h-px w-24 bg-[var(--fg-muted)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
            <div>
              <FileText className="w-12 h-12 mb-6" />
              <h3 className="text-4xl font-black uppercase italic tracking-tight mb-4">Resume Parsing</h3>
              <p className="text-lg text-[var(--fg-muted)] font-medium leading-relaxed">
                Stop manually entering data. Our system reads your raw PDF, structures it into JSON, and evaluates it against strict ATS guidelines instantly.
              </p>
            </div>
            <div>
              <Briefcase className="w-12 h-12 mb-6" />
              <h3 className="text-4xl font-black uppercase italic tracking-tight mb-4">Live Job Matches</h3>
              <p className="text-lg text-[var(--fg-muted)] font-medium leading-relaxed">
                We query real job boards and rank your vector against live requirements, showing you exactly where you stand and what skills you're missing.
              </p>
            </div>
            <div>
              <Zap className="w-12 h-12 mb-6" />
              <h3 className="text-4xl font-black uppercase italic tracking-tight mb-4">AI Interview Prep</h3>
              <p className="text-lg text-[var(--fg-muted)] font-medium leading-relaxed">
                Practice behavioral and technical questions with our LLM coach. Get instant feedback on your answers before the real thing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-[var(--border)] py-32 bg-[var(--bg)]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4 mb-16">
            <span className="index-label">[ 02 ] DEPLOYMENT</span>
            <div className="h-px w-24 bg-[var(--fg-muted)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="blueprint-border p-10 flex flex-col">
              <h3 className="text-2xl font-black uppercase italic tracking-tight mb-2">Starter</h3>
              <div className="text-6xl font-black font-mono mb-8">$0</div>
              <ul className="space-y-4 mb-12 flex-1 font-medium text-[var(--fg-muted)]">
                <li>3 Resume Analyses</li>
                <li>5 Job Matches</li>
                <li>1 Roadmap</li>
              </ul>
              <Link href="/signup" className="btn-primary w-full text-center">Start Free</Link>
            </div>

            <div className="offset-card p-10 flex flex-col bg-[var(--fg)] text-[var(--bg)]">
              <div className="status-block status-block-active text-xs mb-4 w-fit">Most Popular</div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight mb-2">Early Bird</h3>
              <div className="text-6xl font-black font-mono mb-8">$5<span className="text-2xl text-[var(--bg)] opacity-50">/mo</span></div>
              <ul className="space-y-4 mb-12 flex-1 font-medium opacity-80">
                <li>20 Resume Analyses</li>
                <li>30 Job Matches</li>
                <li>5 Roadmaps</li>
              </ul>
              <Link href="/signup" className="btn-primary w-full text-center !bg-[var(--bg)] !text-[var(--fg)] !border-[var(--bg)] hover:!bg-transparent hover:!text-[var(--bg)]">Upgrade</Link>
            </div>

            <div className="blueprint-border p-10 flex flex-col">
              <h3 className="text-2xl font-black uppercase italic tracking-tight mb-2">Elite</h3>
              <div className="text-6xl font-black font-mono mb-8">$50<span className="text-2xl text-[var(--fg-muted)]">/mo</span></div>
              <ul className="space-y-4 mb-12 flex-1 font-medium text-[var(--fg-muted)]">
                <li>Unlimited Analyses</li>
                <li>Unlimited Job Matches</li>
                <li>Priority Support</li>
              </ul>
              <Link href="/signup" className="btn-primary w-full text-center">Go Elite</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-12 bg-[var(--bg)]">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-black text-xl tracking-tighter uppercase italic">
            CareerAI
          </div>
          <div className="flex gap-6 index-label">
            <Link href="/privacy" className="hover:text-[var(--fg)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--fg)]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
