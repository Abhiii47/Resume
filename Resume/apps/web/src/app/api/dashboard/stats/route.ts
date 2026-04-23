import { NextResponse } from "next/server";
import { auth, prisma } from "@repo/core";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch real user-specific data in parallel
    const [latestAnalysis, applicationCount, roadmapProgress, matchCount] =
      await Promise.all([
        prisma.analysis.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { score: true },
        }),
        prisma.application.count({
          where: { userId },
        }),
        prisma.roadmap.aggregate({
          where: { userId },
          _avg: { progress: true },
          _count: { id: true },
        }),
        prisma.match.count({
          where: { userId },
        }),
      ]);

    const stats = {
      score: latestAnalysis?.score ?? 0,
      applications: applicationCount,
      matches: matchCount,
      roadmap: Math.round(roadmapProgress._avg.progress ?? 0),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Stats fetch error:", error);
    // Return zeroed stats on failure — never fake data
    return NextResponse.json({
      stats: { score: 0, applications: 0, matches: 0, roadmap: 0 },
    });
  }
}

export async function POST() {
  return GET();
}
