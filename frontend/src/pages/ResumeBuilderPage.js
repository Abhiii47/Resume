import React from "react";
import { useNavigate } from "react-router-dom";
import ResumeBuilder from "../components/ResumeBuilder";
import { HomeIcon } from "../components/ui/Sidebar";
import AppLayout from "../components/AppLayout";

export default function ResumeBuilderPage() {
  const navigate = useNavigate();

  const left = (
    <>
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400 hover:text-slate-100 inline-flex items-center gap-2"
      >
        <HomeIcon className="w-4 h-4" />
        Back to dashboard
      </button>
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        <span>Resume builder</span>
      </div>
      <h1 className="hero-title">
        Design a <span>resume</span> that actually passes screening.
      </h1>
      <p className="hero-subtitle">
        Edit sections, tweak bullets, and export a clean PDF that lines up with the roles you care about.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
        <span>✓ Live preview</span>
        <span>✓ Export‑ready layout</span>
        <span>✓ Built for ATS</span>
      </div>
    </>
  );

  const right = (
    <div className="w-full h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
      <ResumeBuilder />
    </div>
  );

  return <AppLayout left={left} right={right} />;
}
