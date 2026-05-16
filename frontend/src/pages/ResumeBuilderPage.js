import React from "react";
import { useNavigate } from "react-router-dom";
import ResumeBuilder from "../components/ResumeBuilder";
import { HomeIcon } from "../components/ui/Sidebar"; // Re-using an icon

export default function ResumeBuilderPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex-shrink-0 border-b-2 border-border bg-card p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-2 border-transparent hover:border-border px-3 py-1"
          >
            <HomeIcon className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
        <div>
          <span className="text-xl font-black uppercase tracking-tight">SmartResume Builder</span>
        </div>
        <div className="w-32"></div> {/* Spacer for center alignment */}
      </header>
      
      <main className="flex-1 overflow-hidden relative">
        <ResumeBuilder />
      </main>
    </div>
  );
}
