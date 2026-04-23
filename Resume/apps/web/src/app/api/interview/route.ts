import { NextRequest, NextResponse } from "next/server";
import { auth, prisma, checkPlanLimit, checkRateLimit } from "@repo/core";
import { mockInterview } from "@repo/ai";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interviews = await prisma.interview.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ history: interviews });
  } catch (error) {
    console.error("Interview fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit (10 req/min) ───────────────────────────────
    if (!(await checkRateLimit(session.user.id, "interview", 10))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    // ── Plan limit ────────────────────────────────────────────
    const limitCheck = await checkPlanLimit(session.user.id, "interviews");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `You've reached your ${limitCheck.plan} plan limit of ${limitCheck.limit} interview sessions.`,
          upgrade: true,
          used: limitCheck.used,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
        },
        { status: 402 },
      );
    }

    const { role, question, answer } = await request.json();

    if (!role || !question || !answer) {
      return NextResponse.json(
        { error: "role, question, and answer are required" },
        { status: 400 },
      );
    }

    if (answer.trim().length < 10) {
      return NextResponse.json(
        { error: "Answer is too short to evaluate" },
        { status: 400 },
      );
    }

    const feedback = await mockInterview(role, question, answer);

    await prisma.interview.create({
      data: {
        userId: session.user.id,
        role: role,
        score: feedback.score,
        feedback: JSON.parse(JSON.stringify(feedback)),
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Interview API error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 },
    );
  }
}
