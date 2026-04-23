"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Database,
  Server,
  BrainCircuit,
  GitMerge,
  Save,
  CloudUpload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@repo/core";
import { CardSpotlight } from "@repo/ui";

const PIPELINE_STEPS = [
  {
    id: 1,
    label: "Uploading PDF to Supabase Storage",
    icon: Database,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
  {
    id: 2,
    label: "Extracting text with pdf-parse",
    icon: FileText,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
  {
    id: 3,
    label: "Sending resume to Gemini Flash",
    icon: BrainCircuit,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
  {
    id: 4,
    label: "Running AI analysis — scoring strengths & gaps",
    icon: Server,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
  {
    id: 5,
    label: "Building skills graph & career path model",
    icon: GitMerge,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
  {
    id: 6,
    label: "Persisting analysis results to database",
    icon: Save,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
];


const INFO_ITEMS = [
  {
    label: "AI Model",
    value: "Gemini Flash",
    icon: BrainCircuit,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
  {
    label: "Parsing",
    value: "pdf-parse v2",
    icon: FileText,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
  {
    label: "Storage",
    value: "Supabase",
    icon: Database,
    color: "text-zinc-300",
    bg: "bg-white/[0.02] border-white/10",
  },
];

export default function ResumePage() {
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!uploading) return;
    let step = 1;
    setCurrentStep(1);
    const interval = setInterval(() => {
      step += 1;
      // Cap at Step 5 visually while waiting for actual server "Done" (Step 6)
      if (step >= PIPELINE_STEPS.length) {
        clearInterval(interval);
        setCurrentStep(PIPELINE_STEPS.length - 1);
      } else {
        setCurrentStep(step);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [uploading]);

  const processUpload = useCallback(
    async (file: File) => {
      if (!file || file.type !== "application/pdf") {
        setError("Please upload a valid PDF file.");
        return;
      }

      setUploading(true);
      setError(null);
      setCurrentStep(1);

      const formData = new FormData();
      formData.append("resume", file);

      try {
        const response = await fetch("/api/resume/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        // Success: Finalize visual progress
        setCurrentStep(PIPELINE_STEPS.length + 1);

        // Artificial delay for user feedback on the "Done" state
        setTimeout(() => {
          router.push("/dashboard/analysis");
        }, 800);
      } catch (err: unknown) {
        console.error("Upload error:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
        setUploading(false);
        setCurrentStep(0);
      }
    },
    [router],
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processUpload(file);
  };

  const progressPct = Math.round((currentStep / PIPELINE_STEPS.length) * 100);

  return (
    <div className="flex flex-col gap-8 h-full max-w-3xl mx-auto w-full py-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 animate-fade-in-up mb-6">
          <span className="index-label">[ 00 ] Vector</span>
          <div className="h-px w-20 bg-white/10" />
        </div>

        <h1 className="magazine-heading text-5xl md:text-7xl mb-4">
          Ingestion <br />
          <span className="text-zinc-600">Engine.</span>
        </h1>
        
        <p className="text-zinc-400 text-lg leading-tight font-medium max-w-lg">
          Initialize your career trajectory by providing your raw data vector.
          Our model parses every byte for semantic correlation.
        </p>
      </motion.div>

      {/* ── Drop Zone ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "relative rounded-2xl overflow-hidden transition-all duration-300 border",
          isDragging ? "border-white/30 bg-[#09090b]" : "border-white/10",
          "bg-[#09090b]",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Animated glow on drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/5 pointer-events-none z-[1]"
            />
          )}
        </AnimatePresence>

        {/* Pipeline Overlay */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-20 p-12"
            >
              <div className="w-full max-w-md mb-12">
                <div className="flex justify-between index-label mb-4">
                  <span>Processing Stream</span>
                  <span className="text-white">{progressPct}%</span>
                </div>
                <div className="h-0.5 bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="w-full max-w-md space-y-2">
                {PIPELINE_STEPS.map((step) => {
                  const isPast = currentStep > step.id;
                  const isCurrent = currentStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center justify-between p-3 border-b border-white/5 transition-all",
                        isCurrent ? "opacity-100" : "opacity-40"
                      )}
                    >
                      <span className="index-label">
                        {step.id.toString().padStart(2, '0')} / {step.label.toUpperCase()}
                      </span>
                      {isPast ? (
                        <span className="index-label text-emerald-500">OK</span>
                      ) : isCurrent ? (
                        <span className="index-label text-white animate-pulse">BUSY</span>
                      ) : (
                        <span className="index-label text-zinc-800">WAIT</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-center w-full max-w-md"
                >
                  <p className="text-sm text-red-400 mb-3">{error}</p>
                  <button
                    onClick={() => {
                      setUploading(false);
                      setError(null);
                    }}
                    className="text-xs font-bold text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Content */}
        <div className="blueprint-border flex flex-col items-center justify-center p-20 text-center gap-8 min-h-[440px] relative z-10 bg-white/[0.02]">
          <div className="h-20 w-20 bg-white flex items-center justify-center">
            <CloudUpload className="h-10 w-10 text-black" />
          </div>

          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">
              {isDragging ? "Drop Vector" : "Source PDF"}
            </h2>
            <p className="index-label text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Drag & drop your source file. <br />
              [ RAW DATA INGESTION MODE ]
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="status-block status-block-outline">PDF ONLY</div>
            <div className="status-block status-block-outline">MAX 10MB</div>
          </div>

          <div className="relative mt-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="status-block status-block-active px-10 py-5 text-sm hover:scale-105 transition-all">
              Initialize Upload →
            </button>
          </div>
        </div>
      </motion.div>

      {/* Info Items */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4"
      >
        {INFO_ITEMS.map((item) => (
          <CardSpotlight
            key={item.label}
            color="rgba(255,255,255,0.05)"
            className="p-4 text-center"
          >
            <div
              className={`inline-flex items-center justify-center p-2 rounded-lg border mb-2 ${item.bg}`}
            >
              <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            </div>
            <div className="text-[10px] text-zinc-600 mb-0.5 uppercase tracking-wider">
              {item.label}
            </div>
            <div className={`text-sm font-semibold ${item.color}`}>
              {item.value}
            </div>
          </CardSpotlight>
        ))}
      </motion.div>
    </div>
  );
}
