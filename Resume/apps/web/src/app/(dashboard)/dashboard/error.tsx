"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[Dashboard Critical Failure]:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
      <div className="blueprint-border p-12 bg-white/[0.01] max-w-md w-full flex flex-col items-center gap-8 relative overflow-hidden">
        {/* Aesthetic Background */}
        <div className="absolute inset-0 bg-dot opacity-[0.05] pointer-events-none" />
        
        <div className="h-16 w-16 border border-red-500/20 bg-red-500/5 flex items-center justify-center relative z-10">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">
            SYSTEM_INTERRUPT
          </h2>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
            The intelligence vector encountered a runtime exception. 
            The current state has been captured for analysis.
          </p>
          
          <div className="text-[10px] font-mono text-red-400 bg-red-400/5 p-4 border border-red-400/10 mb-8 break-all">
            ERROR_DIGEST: {error.digest || "UNKNOWN_ERROR"}
          </div>
        </div>

        <div className="flex flex-col w-full gap-4 relative z-10">
          <button
            onClick={() => reset()}
            className="status-block status-block-active w-full py-4 flex items-center justify-center gap-3"
          >
            <RefreshCcw className="h-4 w-4" />
            RECALIBRATE SYSTEM
          </button>
          
          <Link
            href="/dashboard"
            className="index-label text-zinc-600 hover:text-white transition-all py-2"
          >
            RETURN TO MATRIX →
          </Link>
        </div>
      </div>
    </div>
  );
}
