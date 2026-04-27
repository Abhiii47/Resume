import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-white/10 font-sans pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <nav className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Home</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase">Terms of Service</h1>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mt-1">Last Updated: April 22, 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-12 text-zinc-400 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using CareerAI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">2. Description of Service</h2>
            <p>
              CareerAI is an AI-powered career platform that provides resume analysis, job matching, and career coaching tools. We use advanced language models to provide insights, but we do not guarantee employment or specific job outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use this service. You agree to provide accurate information when creating your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">4. Subscriptions & Payments</h2>
            <p>
              Certain features require a paid subscription. All payments are processed securely through Stripe. Subscriptions automatically renew unless cancelled through your dashboard settings. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">5. Usage Limits</h2>
            <p>
              To ensure platform stability, we enforce usage limits and rate limiting (e.g., 24-hour daily cooldowns on AI features). Attempting to bypass these limits or scrape data from our platform is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">6. Intellectual Property</h2>
            <p>
              The platform, including its code, design, and AI models, is the property of CareerAI. You retain ownership of your uploaded resumes, but grant us a license to process them to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">7. Limitation of Liability</h2>
            <p>
              CareerAI is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the platform or reliance on AI-generated advice.
            </p>
          </section>

          <footer className="pt-20 border-t border-white/5 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700">
              © 2026 CareerAI — All Rights Reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
