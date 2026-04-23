import { prisma } from "./prisma";
import { PLAN_LIMITS, PlanFeature } from "./plan";

// ─── Helper: check if a user has reached their plan limit ────────────────────
export async function checkPlanLimit(
  userId: string,
  feature: PlanFeature,
): Promise<{ allowed: boolean; used: number; limit: number; plan: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const plan = (user?.plan ?? "FREE") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan][feature];

  if (limit === Infinity) {
    return { allowed: true, used: 0, limit: -1, plan };
  }

  // Count current usage
  let used = 0;
  if (feature === "resumesAnalyzed") {
    used = await prisma.analysis.count({ where: { userId } });
  } else if (feature === "jobMatches") {
    used = await prisma.match.count({ where: { userId } });
  } else if (feature === "roadmapGenerations") {
    used = await prisma.roadmap.count({ where: { userId } });
  } else if (feature === "interviews") {
    used = await prisma.interview.count({ where: { userId } });
  }

  return { allowed: used < limit, used, limit, plan };
}

// ─── Helper: check if a user has reached a 24-hour cooldown limit ──────────────
export async function checkDailyLimit(
  userId: string,
  feature: PlanFeature,
  dailyMax = 5,
): Promise<{ allowed: boolean; used: number; resetInHours: number }> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let used = 0;

  if (feature === "resumesAnalyzed") {
    used = await prisma.analysis.count({
      where: { userId, createdAt: { gte: yesterday } },
    });
  } else if (feature === "jobMatches") {
    used = await prisma.match.count({
      where: { userId, createdAt: { gte: yesterday } },
    });
  } else if (feature === "roadmapGenerations") {
    used = await prisma.roadmap.count({
      where: { userId, createdAt: { gte: yesterday } },
    });
  } else if (feature === "interviews") {
    used = await prisma.interview.count({
      where: { userId, createdAt: { gte: yesterday } },
    });
  }

  return {
    allowed: used < dailyMax,
    used,
    resetInHours: used >= dailyMax ? 24 : 0,
  };
}
