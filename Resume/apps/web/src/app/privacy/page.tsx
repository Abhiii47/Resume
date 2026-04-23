import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-white/10 font-sans pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/5 blur-[120px] rounded-full" />
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
            <Shield className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase">Privacy Policy</h1>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mt-1">Last Updated: April 22, 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-12 text-zinc-400 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">1. Introduction</h2>
            <p>
              Welcome to CareerAI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">2. Information We Collect</h2>
            <p>
              When you use CareerAI, we collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li><strong>Account Information</strong>: Your name, email address, and profile picture.</li>
              <li><strong>Resume Data</strong>: The content of the resumes you upload for analysis.</li>
              <li><strong>Usage Data</strong>: Information about how you interact with our AI features and job matching system.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">3. How We Use Your Data</h2>
            <p>
              We use your information to provide and improve our services, specifically:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>To perform AI-powered resume analysis and job matching.</li>
              <li>To generate personalized career roadmaps and interview feedback.</li>
              <li>To process your subscription payments via Stripe.</li>
              <li>To send you transactional emails and important platform updates.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">4. Data Storage & Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. Resumes are stored in encrypted Supabase storage buckets, and user data is managed in our PostgreSQL database. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">5. Third-Party Services</h2>
            <p>
              We partner with selected third-party providers to deliver our services:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li><strong>Google Gemini</strong>: For AI analysis and content generation.</li>
              <li><strong>Stripe</strong>: For secure payment processing.</li>
              <li><strong>Supabase</strong>: For database and file storage.</li>
              <li><strong>Resend</strong>: For transactional email delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data at any time. You can manage your data through your Dashboard Settings or by contacting us at support@careerai.app.
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
