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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const [resumesAnalyzed, jobMatchesViewed, roadmapGenerations] =
      await Promise.all([
        prisma.analysis.count({ where: { userId } }),
        prisma.match.count({ where: { userId } }),
        prisma.roadmap.count({ where: { userId } }),
      ]);

    return NextResponse.json({
      billing: {
        plan: user?.plan ?? "FREE",
        status: "active",
        renewsAt: null,
        usage: {
          resumesAnalyzed,
          jobMatchesViewed,
          roadmapGenerations,
        },
      },
    });
  } catch (error) {
    console.error("Billing fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load billing data." },
      { status: 500 },
    );
  }
}
