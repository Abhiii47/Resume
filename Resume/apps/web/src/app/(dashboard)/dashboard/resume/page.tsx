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

const PIPELINE_STEPS = [
  {
    id: 1,
    label: "Uploading PDF to Supabase Storage",
    icon: Database,
  },
  {
    id: 2,
    label: "Extracting text with pdf-parse",
    icon: FileText,
  },
  {
    id: 3,
    label: "Sending resume to Gemini Flash",
    icon: BrainCircuit,
  },
  {
    id: 4,
    label: "Running AI analysis — scoring strengths & gaps",
    icon: Server,
  },
  {
    id: 5,
    label: "Building skills graph & career path model",
    icon: GitMerge,
  },
  {
    id: 6,
    label: "Persisting analysis results to database",
    icon: Save,
  },
];

const INFO_ITEMS = [
  {
    label: "AI Model",
    value: "Gemini Flash",
    icon: BrainCircuit,
  },
  {
    label: "Parsing",
    value: "pdf-parse v2",
    icon: FileText,
  },
  {
    label: "Storage",
    value: "Supabase",
    icon: Database,
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
    <div className="flex flex-col gap-8 h-full max-w-3xl mx-auto w-full py-8 text-[var(--fg)]">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <span className="index-label text-[var(--fg)]">[ 00 ] Vector</span>
          <div className="h-px w-20 bg-[var(--fg)]" />
        </div>

        <h1 className="magazine-heading text-5xl md:text-7xl mb-4 text-[var(--fg)]">
          Ingestion <br />
          <span className="text-[var(--fg-muted)]">Engine.</span>
        </h1>
        
        <p className="text-[var(--fg-muted)] text-lg leading-tight font-medium max-w-lg">
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
          "relative transition-all duration-300 blueprint-border",
          isDragging ? "bg-[var(--bg-muted)] border-4 border-[var(--fg)]" : "bg-[var(--bg)]",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Pipeline Overlay */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-[var(--bg)]/95 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-12 border-2 border-[var(--fg)]"
            >
              <div className="w-full max-w-md mb-12">
                <div className="flex justify-between index-label mb-4 text-[var(--fg)]">
                  <span>Processing Stream</span>
                  <span className="font-bold text-[var(--fg)]">{progressPct}%</span>
                </div>
                <div className="h-2 border border-[var(--border)] overflow-hidden bg-[var(--bg-muted)]">
                  <motion.div
                    className="h-full bg-[var(--fg)]"
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
                        "flex items-center justify-between p-3 border-b border-[var(--border)] transition-all",
                        isCurrent ? "opacity-100" : "opacity-40"
                      )}
                    >
                      <span className="index-label text-[var(--fg)]">
                        {step.id.toString().padStart(2, '0')} / {step.label.toUpperCase()}
                      </span>
                      {isPast ? (
                        <span className="index-label font-bold text-[var(--fg)]">OK</span>
                      ) : isCurrent ? (
                        <span className="index-label font-bold text-[var(--fg)] animate-pulse">BUSY</span>
                      ) : (
                        <span className="index-label text-[var(--fg-muted)]">WAIT</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 border-2 border-[var(--fg)] bg-[var(--bg-muted)] text-center w-full max-w-md"
                >
                  <p className="text-sm text-[var(--fg)] font-bold mb-3">{error}</p>
                  <button
                    onClick={() => {
                      setUploading(false);
                      setError(null);
                    }}
                    className="btn-primary py-2 px-6"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Content */}
        <div className="flex flex-col items-center justify-center p-20 text-center gap-8 min-h-[440px] relative z-10">
          <div className="h-20 w-20 bg-[var(--fg)] flex items-center justify-center offset-card">
            <CloudUpload className="h-10 w-10 text-[var(--bg)]" />
          </div>

          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--fg)] mb-4">
              {isDragging ? "Drop Vector" : "Source PDF"}
            </h2>
            <p className="index-label text-[var(--fg-muted)] max-w-sm mx-auto leading-relaxed">
              Drag & drop your source file. <br />
              [ RAW DATA INGESTION MODE ]
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="status-block bg-[var(--bg)] text-[var(--fg)]">PDF ONLY</div>
            <div className="status-block bg-[var(--bg)] text-[var(--fg)]">MAX 10MB</div>
          </div>

          <div className="relative mt-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="btn-primary px-10 py-5 hover:scale-105 transition-all">
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
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {INFO_ITEMS.map((item) => (
          <div
            key={item.label}
            className="p-6 text-center border-2 border-[var(--fg)] offset-card bg-[var(--bg)] flex flex-col items-center"
          >
            <div
              className="inline-flex items-center justify-center p-3 rounded-none border border-[var(--fg)] mb-4 bg-[var(--bg-muted)]"
            >
              <item.icon className="h-5 w-5 text-[var(--fg)]" />
            </div>
            <div className="index-label mb-1">
              {item.label}
            </div>
            <div className="text-lg font-black text-[var(--fg)] uppercase tracking-tight">
              {item.value}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
