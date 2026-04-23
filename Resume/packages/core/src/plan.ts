export const PLAN_LIMITS = {
  FREE: {
    resumesAnalyzed: 3,
    jobMatches: 5,
    roadmapGenerations: 1,
    interviews: 2,
  },
  EARLY_BIRD: {
    resumesAnalyzed: 20,
    jobMatches: 30,
    roadmapGenerations: 5,
    interviews: 10,
  },
  PREMIUM: {
    resumesAnalyzed: Infinity,
    jobMatches: Infinity,
    roadmapGenerations: Infinity,
    interviews: Infinity,
  },
} as const;

export type PlanFeature = keyof (typeof PLAN_LIMITS)["FREE"];
