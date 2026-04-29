"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Cpu, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@repo/ui";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DiagnosticPage() {
  const { data: analysisData, isLoading } = useSWR('/api/analysis', fetcher);
  
  const analysis = analysisData?.analysis;
  const diagnostic = analysis?.diagnostic as any;

  const telemetry = useMemo(() => {
    if (!diagnostic?.formattingTelemetry) return null;
    return [
      { id: 'TELE_01', label: 'MULTIPLE_COLUMNS', status: diagnostic.formattingTelemetry.hasMultipleColumns ? 'WARN' : 'PASS', value: diagnostic.formattingTelemetry.hasMultipleColumns ? 'DETECTED' : 'CLEAR' },
      { id: 'TELE_02', label: 'DATA_TABLES', status: diagnostic.formattingTelemetry.hasTables ? 'FAIL' : 'PASS', value: diagnostic.formattingTelemetry.hasTables ? 'DETECTED' : 'CLEAR' },
      { id: 'TELE_03', label: 'NON_STD_FONTS', status: diagnostic.formattingTelemetry.hasNonStandardFonts ? 'WARN' : 'PASS', value: diagnostic.formattingTelemetry.hasNonStandardFonts ? 'DETECTED' : 'CLEAR' },
      { id: 'TELE_04', label: 'CONTACT_INFO', status: diagnostic.formattingTelemetry.hasContactInfo ? 'PASS' : 'FAIL', value: diagnostic.formattingTelemetry.hasContactInfo ? 'SYNCED' : 'MISSING' },
      { id: 'TELE_05', label: 'SECTION_HEADERS', status: diagnostic.formattingTelemetry.hasSectionHeaders ? 'PASS' : 'WARN', value: diagnostic.formattingTelemetry.hasSectionHeaders ? 'VALID' : 'UNSTABLE' },
      { id: 'TELE_06', label: 'IMAGE_SCAN', status: diagnostic.formattingTelemetry.isScannedImage ? 'FAIL' : 'PASS', value: diagnostic.formattingTelemetry.isScannedImage ? 'TRUE' : 'FALSE' },
    ];
  }, [diagnostic]);

  if (isLoading) {
    return <div className="p-12 animate-pulse space-y-8">
      <div className="h-20 bg-[var(--bg-muted)] border-4 border-[var(--border)]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1,2,3].map(i => <div key={i} className="h-64 bg-[var(--bg-muted)] border-4 border-[var(--border)]" />)}
      </div>
    </div>;
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] border-4 border-dashed border-[var(--border)] bg-[var(--bg-muted)]/30 rounded-3xl p-12 text-center">
        <Terminal className="h-20 w-20 text-[var(--fg-muted)] mb-8 opacity-20" />
        <h2 className="magazine-heading text-4xl mb-4 italic uppercase">System_Not_Initialized.</h2>
        <p className="font-mono text-xs uppercase text-[var(--fg-muted)] max-w-md">
          Awaiting resume analysis signal. Please upload and process a resume vector to generate technical telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-8 border-[var(--fg)] pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <span className="bg-[var(--fg)] text-[var(--bg)] px-3 py-1 font-black text-xs">[ DIAG_0.44.2 ]</span>
             <div className="h-px w-24 bg-[var(--fg)]" />
             <span className="font-mono text-xs text-[var(--fg-muted)] uppercase tracking-widest">ATS_TELEMETRY_STREAM</span>
          </div>
          <h1 className="magazine-heading text-3xl md:text-5xl leading-tight tracking-tighter uppercase italic">
            Diagnostic.
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-4">
              <span className="font-mono text-xs font-black uppercase text-[var(--fg-muted)]">CORE_SYNC_READY</span>
              <div className="h-4 w-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_emerald-500]" />
           </div>
           <p className="text-sm font-bold text-[var(--fg-muted)] uppercase">Version: 2.1.0_BETA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Formatting Telemetry Column */}
        <div className="lg:col-span-2 space-y-12">
          <div className="p-10 border-4 border-[var(--fg)] bg-[var(--bg)] relative overflow-hidden group shadow-[12px_12px_0_0_var(--fg)]">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Cpu className="h-24 w-24" />
             </div>
             <h3 className="magazine-heading text-3xl mb-12 flex items-center gap-4 uppercase italic">
                <Terminal className="h-6 w-6" /> Formatting_Telemetry
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {telemetry?.map((t) => (
                   <div key={t.id} className="flex items-center justify-between p-6 border-2 border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--fg)] transition-all">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-[var(--fg-muted)] mb-1">{t.id}</span>
                         <span className="font-bold text-sm text-[var(--fg)] uppercase tracking-tight">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="font-mono text-xs font-black opacity-40">{t.value}</span>
                         <div className={cn(
                            "px-3 py-1 text-[10px] font-black uppercase rounded border",
                            t.status === 'PASS' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            t.status === 'WARN' ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                            "bg-red-500/10 text-red-600 border-red-500/20"
                         )}>
                            {t.status}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="p-10 border-4 border-[var(--fg)] bg-[var(--bg)] shadow-[12px_12px_0_0_var(--fg)] relative">
             <h3 className="magazine-heading text-3xl mb-12 flex items-center gap-4 uppercase italic">
                <BarChart3 className="h-6 w-6" /> Keyword_Saturation
             </h3>
             
             <div className="space-y-6">
                {diagnostic?.keywordSaturation?.map((kw: any, i: number) => (
                   <div key={i} className="flex items-center justify-between gap-12 group">
                      <div className="flex items-center gap-6 flex-1">
                         <div className={cn(
                            "h-4 w-4 border-2 border-[var(--fg)] flex-shrink-0",
                            kw.found ? "bg-emerald-500 border-emerald-600 shadow-[0_0_8px_emerald-500]" : "bg-transparent opacity-20"
                         )} />
                         <span className="font-black text-lg uppercase italic tracking-tighter flex-1">{kw.keyword}</span>
                      </div>
                      <div className="w-48 h-2 bg-[var(--bg-muted)] border border-[var(--border)] rounded-full overflow-hidden">
                         <div className="h-full bg-[var(--fg)] opacity-80" style={{ width: `${kw.relevance}%` }} />
                      </div>
                      <span className="font-mono text-xs font-black w-12 text-right opacity-40">{kw.relevance}%</span>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* System Health Column */}
        <div className="space-y-12">
          <div className="p-10 bg-[var(--fg)] text-[var(--bg)] shadow-[12px_12px_0_0_rgba(0,0,0,0.1)] relative group">
             <div className="absolute -top-4 -right-4 bg-orange-500 text-white px-3 py-1 text-[10px] font-black uppercase rotate-12 z-20">CRITICAL_LAYER</div>
             <div className="space-y-8 relative z-10">
                <div className="flex flex-col items-center py-12 border-b-2 border-[var(--bg)]/10">
                   <p className="text-[10px] font-black uppercase opacity-60 mb-4 tracking-widest">ATS_Filter_Probability</p>
                   <div className="relative h-48 w-48 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                         <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="transparent"
                            className="text-[var(--bg)]/10"
                         />
                         <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="transparent"
                            strokeDasharray={552}
                            strokeDashoffset={552 - (552 * (diagnostic?.atsProbability || 0)) / 100}
                            className="text-[var(--bg)] transition-all duration-1000 ease-out"
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-5xl font-black font-mono leading-none">{diagnostic?.atsProbability || 0}%</span>
                         <span className="text-[10px] font-bold opacity-60 uppercase mt-2">Chance_Pass</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Critical_Vector_Failures</p>
                   {diagnostic?.criticalFailures?.length > 0 ? (
                      <div className="space-y-4">
                         {diagnostic.criticalFailures.map((fail: string, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-4 border-2 border-[var(--bg)]/20 bg-[var(--bg)]/5">
                               <ShieldAlert className="h-5 w-5 text-orange-500 flex-shrink-0" />
                               <span className="text-xs font-bold uppercase italic leading-tight">{fail}</span>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="p-6 border-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-4">
                         <CheckCircle2 className="h-6 w-6" />
                         <span className="text-[10px] font-black uppercase">Zero_Failures_Detected</span>
                      </div>
                   )}
                </div>
             </div>
          </div>

          <div className="p-10 border-4 border-[var(--fg)] bg-[var(--bg)] shadow-[12px_12px_0_0_var(--fg)] space-y-8">
             <h3 className="magazine-heading text-2xl uppercase italic flex items-center gap-4">
                <Activity className="h-5 w-5" /> Vector_Calibration
             </h3>
             <div className="space-y-6">
                <div className="flex justify-between items-end">
                   <p className="text-[10px] font-black uppercase text-[var(--fg-muted)]">Readability_Rating</p>
                   <p className="text-2xl font-black font-mono">{analysis?.score}%</p>
                </div>
                <div className="h-3 bg-[var(--bg-muted)] border-2 border-[var(--border)]">
                   <div className="h-full bg-[var(--accent)]" style={{ width: `${analysis?.score}%` }} />
                </div>
                <div className="p-4 bg-[var(--bg-muted)] border-2 border-[var(--border)] space-y-4">
                   <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-[var(--accent)]" />
                      <span className="text-[10px] font-black uppercase">Optimization_Signal</span>
                   </div>
                   <p className="text-[11px] font-bold text-[var(--fg-muted)] uppercase italic leading-tight">
                      System recommends recalibrating experience headers to increase keyword saturation by 12.4%.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
