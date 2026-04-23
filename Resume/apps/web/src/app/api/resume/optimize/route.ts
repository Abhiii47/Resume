import { NextRequest, NextResponse } from "next/server";
import { auth, prisma } from "@repo/core";
import { optimizeResume } from "@repo/ai";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobTitle, jobDescription } = await request.json();

    if (!jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "Job details missing" },
        { status: 400 },
      );
    }

    // 1. Get user's base resume text from their latest active resume
    const resume = await prisma.resume.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { rawText: true },
    });

    const baseText = resume?.rawText || "";

    if (!baseText) {
      return NextResponse.json(
        { error: "Base resume not found. Please upload a resume first." },
        { status: 400 },
      );
    }

    // 2. Call AI Optimizer
    const optimizedText = await optimizeResume(
      baseText,
      jobTitle,
      jobDescription,
    );

    return NextResponse.json({ optimizedText });
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
