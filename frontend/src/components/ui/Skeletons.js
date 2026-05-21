import React from "react";

/* Skeleton pulse block — reusable primitive */
function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`bg-border/40 animate-pulse ${className}`}
      style={{ borderRadius: 0 }}
    />
  );
}

/* Score card skeleton — 3 wide blocks */
export function ScoreCardSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 bg-background border-2 border-border flex flex-col gap-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/* Resume card list skeleton */
export function ResumeHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border-2 border-border bg-card flex gap-4 items-center">
          <SkeletonBlock className="w-10 h-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-3 w-48" />
          </div>
          <SkeletonBlock className="h-6 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* Roadmap phase skeleton */
export function RoadmapSkeleton() {
  return (
    <div className="space-y-0 max-w-4xl mx-auto w-full">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-6">
          <SkeletonBlock className="w-20 h-6 mt-5 shrink-0" />
          <div className="w-6 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-border/40 animate-pulse mt-4 shrink-0" />
            {i < 4 && <div className="w-0.5 bg-border/40 flex-1 mt-1 min-h-16" />}
          </div>
          <div className="glass-card bg-card p-6 flex-1 mb-8 space-y-3">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-3/4" />
            <SkeletonBlock className="h-8 w-36 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Generic full-page skeleton */
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <SkeletonBlock className="h-8 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-4/5" />
            <SkeletonBlock className="h-8 w-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkeletonBlock;
