import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useScrollReveal } from "../utils";

const STEPS = [
  { num: "01", title: "Upload & Heuristic Extraction", desc: "Drop your PDF resume. Our client-side and backend python parsers extract all text blocks, spacing metrics, and hidden metadata using advanced PDF heuristics (pdfminer & pdfplumber) in under 500ms.", color: "#d97706" },
  { num: "02", title: "Heuristic Score Calculations", desc: "Run a free pre-scan covering keyword similarity (TF-IDF vs target JD), section detection, bullet counts, action verb counts, and metric percentages to generate a baseline format grade with zero API delays.", color: "#0284c7" },
  { num: "03", title: "Agentic Deep Evaluation", desc: "Nova, the coordinator AI agent, passes your parsed data to specialized subagents (the Resume Auditor and the Tech Matcher) in a single batched API call to Groq (Llama 3.3) or Gemini for deep quality analysis.", color: "#7c3aed" },
  { num: "04", title: "Diagnostic Report & Fixes", desc: "Get an interactive dashboard detailing 7 score dimensions, a target role keyword gap report, AI-suggested bullet point metric rewrites, a custom cover letter, and typical interview questions.", color: "#16a34a" },
  { num: "05", title: "Live Builder Refinement", desc: "Edit your data in the side-by-side builder. Choose from 7 custom layout templates, toggle spacing density, click '✨ Auto-Format' to normalize typography, and print a perfect A4 PDF instantly.", color: "#b45309" },
];

const FAQS = [
  { q: "How is the 7-dimension ATS score calculated?", a: "The overall score represents a weighted average of: Keywords (20%), Impact Metrics (20%), Job Relevance (20%), Quantification (15%), Layout Formatting (10%), Action Verbs (10%), and Length (5%). Each dimension is evaluated with clear reasoning explanation cards." },
  { q: "How do I export my resume to a proper PDF layout?", a: "In the Resume Builder page, click the 'Export PDF' button to launch the browser print modal. For clean alignments, set your print settings Margins to 'None' and make sure 'Background graphics' is checked. The stylesheet automatically hides menus, sidebars, and dashboard panels so only the white A4 document renders." },
  { q: "Which AI models power the Nova Copilot and audit tools?", a: "We run a hybrid LLM setup. General chat queries, mock interview coaching, and fast bullet point rewrites are routed through Groq (Llama 3.3 70B) for sub-second speeds, while comprehensive 7-dimension auditing maps use Gemini 1.5 Pro." },
  { q: "Is my personal information and resume text secure?", a: "Yes. All uploads are processed via encrypted API tunnels and stored in a secure local database mapped to your private account. Your information is never sold, shared, or used to train public LLM models." },
  { q: "Can I evaluate my resume without a job description?", a: "Certainly. If you do not provide a job description, our system evaluates your resume against standard, high-signal software developer expectations. Adding a job description enables comparative matching, mapping missing keywords, and calculating a custom role match score." }
];

export default function HowItWorksPage() {
  const navigate = useNavigate();
  useScrollReveal();

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }} className="grid-lines">
      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
          <div className="section-label sr"><span className="section-label-text">How It Works</span></div>
          <h1 className="text-display sr" style={{ marginBottom: 16, maxWidth: 600 }}>
            5 steps to a <span className="highlight-accent" style={{ display: "inline-block", color: "#fff", border: "none", boxShadow: "none", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>perfect resume</span>.
          </h1>
          <p className="sr" style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 520 }}>
            From PDF upload to a complete diagnostic report — here's exactly what happens under the hood.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 64 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`card sr sr-delay-${(i % 3) + 1}`}
              style={{ padding: "24px 28px", display: "flex", gap: 24, alignItems: "flex-start" }}
            >
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "var(--radius-md)",
                  background: "var(--accent-light)", border: "1px solid rgba(99, 102, 241, 0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 16,
                  color: "var(--accent)",
                }}>{step.num}</div>
              </div>
              <div>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
                  color: "var(--text-primary)", marginBottom: 6,
                }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 64 }}>
          <div className="section-label sr"><span className="section-label-text">Frequently Asked</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className={`card-surface sr sr-delay-${(i % 2) + 1}`} style={{ padding: "22px 24px" }}>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
                  color: "var(--text-primary)", marginBottom: 8,
                }}>{faq.q}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/signup")}
            id="how-it-works-cta-btn"
          >
            Try It Free →
          </button>
        </div>
      </div>
    </div>
  );
}
