import { NextRequest, NextResponse } from "next/server";
import { auth, prisma, checkPlanLimit, checkRateLimit } from "@repo/core";
import { generateRoadmap } from "@repo/ai";
import { headers } from "next/headers";

type StoredRoadmapTask = {
  focus?: string;
  tasks?: string[];
  resources?: string[];
};

function formatRoadmapFromDb(
  roadmaps: Array<{
    id: string;
    week: number;
    tasks: unknown;
    progress: number;
  }>,
  title = "Your Career Roadmap",
  description = "A customized path based on your resume analysis.",
) {
  return {
    title,
    description,
    steps: roadmaps.map((r) => {
      const taskBlock = (
        Array.isArray(r.tasks) ? r.tasks[0] : null
      ) as StoredRoadmapTask | null;
      const tasks = Array.isArray(taskBlock?.tasks) ? taskBlock!.tasks! : [];
      const resources = Array.isArray(taskBlock?.resources)
        ? taskBlock!.resources!
        : [];
      return {
        id: r.id,
        week: `Week ${r.week}`,
        title: taskBlock?.focus || "Weekly Focus",
        description: tasks.join("\n"),
        resources,
        progress: r.progress || 0,
      };
    }),
  };
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: session.user.id },
      orderBy: { week: "asc" },
      select: { id: true, week: true, tasks: true, progress: true },
    });

    if (roadmaps.length > 0) {
      return NextResponse.json({ roadmap: formatRoadmapFromDb(roadmaps) });
    }

    const analysis = await prisma.analysis.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { careerPath: true },
    });

    return NextResponse.json({
      roadmap: {
        title: `${analysis?.careerPath || "Career"} Path`,
        description:
          "No roadmap generated yet. Generate one to start tracking progress.",
        steps: [],
      },
    });
  } catch (error) {
    console.error("Roadmap fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmap." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit (3 req/min) ────────────────────────────────
    if (!(await checkRateLimit(session.user.id, "roadmap", 3))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    // ── Plan limit ────────────────────────────────────────────
    const limitCheck = await checkPlanLimit(
      session.user.id,
      "roadmapGenerations",
    );
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `You've reached your ${limitCheck.plan} plan limit of ${limitCheck.limit} roadmap generation(s).`,
          upgrade: true,
          used: limitCheck.used,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
        },
        { status: 402 },
      );
    }

    const analysis = await prisma.analysis.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Upload and analyze your resume first." },
        { status: 400 },
      );
    }

    const missingSkills = (
      Array.isArray(analysis.missingSkills) ? analysis.missingSkills : []
    ) as string[];
    const careerPath = analysis.careerPath || "Software Engineer";
    const seniority = analysis.experienceLevel === "entry" ? "junior" : 
                      analysis.experienceLevel === "senior" || analysis.experienceLevel === "lead" ? "senior" : 
                      "intermediate";

    const aiRoadmap = await generateRoadmap(
      careerPath,
      missingSkills,
      seniority,
    );

    await prisma.$transaction([
      prisma.roadmap.deleteMany({ where: { userId: session.user.id } }),
      ...aiRoadmap.weeks.map((w) =>
        prisma.roadmap.create({
          data: {
            userId: session.user.id,
            week: w.week,
            tasks: [{ focus: w.focus, tasks: w.tasks, resources: w.resources }],
            progress: 0,
          },
        }),
      ),
    ]);

    const storedRoadmaps = await prisma.roadmap.findMany({
      where: { userId: session.user.id },
      orderBy: { week: "asc" },
      select: { id: true, week: true, tasks: true, progress: true },
    });

    return NextResponse.json({
      roadmap: formatRoadmapFromDb(
        storedRoadmaps,
        `${careerPath} Acceleration Path`,
        `A targeted plan to bridge your skill gaps: ${missingSkills.slice(0, 3).join(", ") || "core competencies"}.`,
      ),
    });
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, completed } = await request.json();

    if (!id || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid payload." },
        { status: 400 },
      );
    }

    const existing = await prisma.roadmap.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Roadmap step not found." },
        { status: 404 },
      );
    }

    const updated = await prisma.roadmap.update({
      where: { id: existing.id },
      data: { progress: completed ? 100 : 0 },
      select: { progress: true },
    });

    return NextResponse.json({ success: true, progress: updated.progress });
  } catch (error) {
    console.error("Roadmap progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 },
    );
  }
}
