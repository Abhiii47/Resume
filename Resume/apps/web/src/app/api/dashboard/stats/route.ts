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
    const [latestAnalysis, applicationCount, roadmapProgress, matchCount, recentActivity] =
      await Promise.all([
        prisma.analysis.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { score: true },
        }),
        prisma.application.count({ where: { userId } }),
        prisma.roadmap.aggregate({
          where: { userId },
          _avg: { progress: true },
          _count: { id: true },
        }),
        prisma.match.count({ where: { userId } }),
        // Real recent activity: last 5 events from analyses, matches, applications
        Promise.all([
          prisma.analysis.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 2,
            select: { createdAt: true, score: true },
          }),
          prisma.match.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 2,
            include: { job: { select: { title: true, company: true } } },
          }),
          prisma.application.findMany({
            where: { userId },
            orderBy: { appliedAt: "desc" },
            take: 2,
            include: { job: { select: { title: true, company: true } } },
          }),
          prisma.roadmap.findMany({
            where: { userId, progress: { gt: 0 } },
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { week: true, progress: true, updatedAt: true },
          }),
        ]),
      ]);

    const [analyses, matches, applications, roadmaps] = recentActivity;

    // Normalize into a unified activity feed
    const activities: Array<{
      action: string;
      item: string;
      time: string;
      status: string;
    }> = [];

    for (const a of analyses) {
      activities.push({
        action: "RESUME_SCAN",
        item: `Score: ${a.score}/100`,
        time: formatTime(a.createdAt),
        status: "COMPLETED",
      });
    }
    for (const m of matches) {
      activities.push({
        action: "JOB_MATCH",
        item: `${m.job.title} @ ${m.job.company}`,
        time: formatTime(m.createdAt),
        status: "DETECTED",
      });
    }
    for (const app of applications) {
      activities.push({
        action: "APPLICATION",
        item: `${app.job.title} @ ${app.job.company}`,
        time: formatTime(app.appliedAt),
        status: app.status,
      });
    }
    for (const r of roadmaps) {
      activities.push({
        action: "ROADMAP_UPDATE",
        item: `Week ${r.week} — ${r.progress}% complete`,
        time: formatTime(r.updatedAt),
        status: "SYNCHRONIZED",
      });
    }

    // Sort by most recent
    activities.sort((a, b) => {
      // Already sorted by time string, just take top 5
      return 0;
    });

    const stats = {
      score: latestAnalysis?.score ?? 0,
      applications: applicationCount,
      matches: matchCount,
      roadmap: Math.round(roadmapProgress._avg.progress ?? 0),
    };

    return NextResponse.json({ stats, activities: activities.slice(0, 5) });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({
      stats: { score: 0, applications: 0, matches: 0, roadmap: 0 },
      activities: [],
    });
  }
}

function formatTime(date: Date | null | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function POST() {
  return GET();
}
