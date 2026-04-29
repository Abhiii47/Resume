"use client";

import { BentoGrid, BentoGridItem } from '@repo/ui';
import { 
  ArrowRight, 
  Activity, 
  Briefcase, 
  TrendingUp, 
  Zap, 
  Target, 
  Layers,
  Search,
  Sparkles,
  FileText,
  Terminal
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useMemo, Suspense } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip
} from 'recharts';

function DashboardContent() {
  const searchParams = useSearchParams();
  const onboard = searchParams.get('onboard') === 'true';
  const { data: statsData, isLoading: loading } = useSWR('/api/dashboard/stats');

  const stats = useMemo(() => statsData?.stats || { 
    score: 0, 
    applications: 0, 
    matches: 0, 
    roadmap: 0,
    skillsMatrix: null,
    marketSentiment: "STABLE",
    profileVisibility: 85
  }, [statsData]);
  const activities = statsData?.activities || [];

  // Real data for Radar Chart from backend
  const radarData = useMemo(() => {
    if (!stats.skillsMatrix) {
      // Default placeholder if no analysis exists
      return [
        { subject: 'Technical', A: 0, fullMark: 100 },
        { subject: 'Soft Skills', A: 0, fullMark: 100 },
        { subject: 'Leadership', A: 0, fullMark: 100 },
        { subject: 'Strategy', A: 0, fullMark: 100 },
        { subject: 'Experience', A: 0, fullMark: 100 },
      ];
    }
    const sm = stats.skillsMatrix as any;
    return [
      { subject: 'Technical', A: sm.technical || 0, fullMark: 100 },
      { subject: 'Soft Skills', A: sm.softSkills || 0, fullMark: 100 },
      { subject: 'Leadership', A: sm.leadership || 0, fullMark: 100 },
      { subject: 'Strategy', A: sm.strategy || 0, fullMark: 100 },
      { subject: 'Experience', A: sm.experience || 0, fullMark: 100 },
    ];
  }, [stats.skillsMatrix]);

  const historyData = [
    { name: 'Jan', score: 45 },
    { name: 'Feb', score: 52 },
    { name: 'Mar', score: 61 },
    { name: 'Apr', score: 68 },
    { name: 'May', score: 75 },
    { name: 'Jun', score: 82 },
  ];

  return (
    <div className="space-y-10">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="text-[10px] font-black tracking-widest text-[var(--accent)] uppercase bg-[var(--accent)]/10 px-2 py-0.5 rounded">Terminal_Session_Active</span>
             <div className="h-px w-8 bg-[var(--border)]" />
             <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase">User_ID: {statsData?.userId?.slice(0,8) || "88C-22"}</span>
          </div>
          <h1 className="magazine-heading text-3xl md:text-5xl tracking-tighter">
            System<span className="text-[var(--fg-muted)]">.Dashboard</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/resume" 
            className="btn-primary py-3 px-6 text-xs group"
          >
            <Zap className="h-3.5 w-3.5 group-hover:fill-current" />
            SYNCHRONIZE_RESUME
          </Link>
        </div>
      </div>

      {/* ── Onboarding Banner ──────────────────────────────────────── */}
      {(stats.score === 0 || onboard) && !loading && (
        <div className="p-10 border-4 border-[var(--fg)] bg-[var(--bg)] flex flex-col md:flex-row items-center justify-between gap-12 offset-card shadow-none blueprint-corners relative overflow-hidden">
          <div className="corner-bl" />
          <div className="corner-br" />
          <div className="flex items-center gap-8 relative z-10">
            <div className="h-20 w-20 bg-[var(--fg)] border-2 border-[var(--fg)] flex items-center justify-center shadow-[8px_8px_0_0_var(--accent)]">
              <Sparkles className="h-10 w-10 text-[var(--bg)] animate-pulse" />
            </div>
            <div>
              <h3 className="magazine-heading text-2xl mb-2">Initialize_Vector</h3>
              <p className="text-[var(--fg)] text-lg font-bold uppercase italic leading-tight max-w-md opacity-70">
                Your career vector is currently uninitialized. Upload a resume to generate your score, roadmap, and skills matrix.
              </p>
            </div>
          </div>
          <Link href="/dashboard/resume" className="btn-primary px-12 py-6 text-xl relative z-10 hover:scale-[1.02]">
            START_SCAN <ArrowRight className="h-6 w-6 ml-4" />
          </Link>
        </div>
      )}

      {/* ── Primary Bento Grid ─────────────────────────────────────── */}
      <BentoGrid>
        {/* Main Score Card */}
        <BentoGridItem
          title="Career Optimization Score"
          description="A multi-dimensional rating of your professional standing and market readiness."
          header={
            <div className="h-full min-h-[10rem] flex flex-col justify-center relative">
               <div className="flex items-baseline gap-2">
                 <span className="text-6xl md:text-7xl font-black tracking-tighter text-[var(--fg)]">
                   {loading ? "..." : stats.score || "00"}
                 </span>
                 <span className="text-xl font-bold text-[var(--fg-muted)]">/100</span>
               </div>
               <div className="w-full h-1.5 bg-[var(--border)] rounded-full mt-4 overflow-hidden">
                 <div 
                   className="h-full bg-[var(--accent)] transition-all duration-1000 ease-out shadow-[0_0_12px_var(--accent)]" 
                   style={{ width: `${stats.score}%` }} 
                 />
               </div>
            </div>
          }
          icon={<Activity className="h-4 w-4 text-[var(--accent)]" />}
          className="md:col-span-2"
        />

        {/* Skills Radar */}
        <BentoGridItem
          title="Skills Matrix"
          description="AI-mapped proficiency across core domains."
          header={
            <div className="h-full min-h-[10rem] flex flex-col items-center justify-center">
              {loading ? (
                <div className="animate-pulse flex items-center justify-center h-full w-full">
                  <div className="h-32 w-32 border-4 border-dashed border-[var(--border)] rounded-full" />
                </div>
              ) : !stats.skillsMatrix ? (
                <div className="text-[10px] font-mono text-[var(--fg-muted)] uppercase text-center px-4">
                  Await_Analysis_To_Generate_Matrix
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--fg-muted)', fontSize: 8, fontWeight: 700 }} />
                      <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="var(--accent)"
                        fill="var(--accent)"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  <Link 
                    href="/dashboard/diagnostic" 
                    className="mt-4 text-[10px] font-black uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--accent)] flex items-center gap-2 group"
                  >
                    <Terminal className="h-3 w-3" />
                    Run_Deep_Diagnostic
                    <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          }
          icon={<Target className="h-4 w-4 text-purple-500" />}
        />

        {/* Progress History */}
        <BentoGridItem
          title="Score Trajectory"
          description="Monitoring your growth through system iterations."
          header={
            <div className="h-full min-h-[8rem] flex items-end">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="var(--accent)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '0px' }}
                    labelStyle={{ color: 'var(--fg-muted)', fontWeight: 700, fontSize: '10px' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
        />

        {/* Stats 1 */}
        <BentoGridItem
          title="Job Matches"
          description="High-probability opportunities detected."
          header={
            <div className="h-full flex items-center gap-4">
              <div className="text-5xl font-black text-[var(--fg)]">{stats.matches}</div>
              <div className="h-10 w-px bg-[var(--border)]" />
              <div className="text-[10px] font-bold text-emerald-500 uppercase leading-tight">
                +12% vs last<br />scan
              </div>
            </div>
          }
          icon={<Briefcase className="h-4 w-4 text-emerald-500" />}
        />

        {/* Stats 2 */}
        <BentoGridItem
          title="Active Roadmap"
          description="Current progression stage."
          header={
            <div className="h-full flex flex-col justify-center">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-[var(--fg)]">{stats.roadmap}%</span>
                <span className="text-xs font-bold text-[var(--fg-muted)] uppercase">Complete</span>
              </div>
            </div>
          }
          icon={<Layers className="h-4 w-4 text-orange-500" />}
        />
      </BentoGrid>

      {/* ── Secondary Layout: Activity & Status ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl uppercase italic tracking-tighter">System_Activity_Log</h3>
            <Link href="/dashboard/applications" className="text-[10px] font-bold text-[var(--accent)] hover:underline">VIEW_ALL_HISTORY {"->"}</Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-24 bg-[var(--bg-muted)] border-2 border-[var(--border)] animate-pulse" />)
            ) : activities.length > 0 ? (
              activities.map((activity: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-6 bg-[var(--bg)] border-2 border-[var(--fg)] group hover:bg-[var(--bg-muted)] transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 border-2 border-[var(--fg)] flex items-center justify-center text-[var(--fg-muted)] group-hover:bg-[var(--fg)] group-hover:text-[var(--bg)] transition-all">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-lg text-[var(--fg)] uppercase italic leading-none mb-1">{activity.action}</p>
                      <p className="text-[10px] text-[var(--fg-muted)] font-black uppercase tracking-widest">{activity.item}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-mono text-[10px] opacity-40">{activity.time}</p>
                    <span className="status-block text-[10px] py-1 px-3 border-2">{activity.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-[var(--bg-muted)] border-4 border-dashed border-[var(--border)] opacity-50">
                <p className="font-mono text-xs text-[var(--fg-muted)] uppercase tracking-[0.2em]">[ AWAITING_ACTIVITY_STREAM ]</p>
              </div>
            )}
          </div>
        </div>

        {/* Calibration & Insights */}
        <div className="space-y-6">
          <h3 className="font-black text-xl uppercase italic tracking-tighter">Market_Intel</h3>
          <div className="p-8 bg-[var(--fg)] text-[var(--bg)] shadow-[12px_12px_0_0_var(--accent)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
              <Zap className="h-16 w-16" />
            </div>
            <div className="space-y-8 relative z-10">
              <div>
                <p className="index-label text-[var(--bg)] opacity-60 mb-2">Calibration Status</p>
                <p className="magazine-heading text-4xl italic">{stats.marketSentiment}</p>
              </div>
              <div className="h-0.5 bg-[var(--bg)]/20" />
              <div>
                <p className="index-label text-[var(--bg)] opacity-60 mb-3">Profile Visibility</p>
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black font-mono leading-none">{stats.profileVisibility}%</span>
                  <div className="h-2 flex-1 bg-[var(--bg)]/20 overflow-hidden">
                    <div className="h-full bg-[var(--accent)]" style={{ width: `${stats.profileVisibility}%` }} />
                  </div>
                </div>
              </div>
              <button className="w-full py-4 bg-[var(--bg)] text-[var(--fg)] text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-all">
                FORCE_RECALIBRATION
              </button>
            </div>
          </div>
          
          <div className="p-8 border-4 border-[var(--fg)] bg-[var(--bg)] space-y-6 blueprint-corners relative">
             <div className="corner-bl" />
             <div className="corner-br" />
             <div className="flex items-center gap-4 text-[var(--fg-muted)]">
                <FileText className="h-6 w-6" />
                <span className="index-label text-xs">Active Resume</span>
             </div>
             <p className="font-black text-lg text-[var(--fg)] truncate uppercase italic leading-tight">Software_Engineer_v2_final.pdf</p>
             <div className="flex items-center justify-between font-mono text-[10px] opacity-40 border-t border-[var(--border)] pt-4">
                <span>Created: 24/04/28</span>
                <span>Size: 1.2 MB</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 animate-pulse bg-[var(--bg-muted)] h-screen" />}>
      <DashboardContent />
    </Suspense>
  );
}
