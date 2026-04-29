import { NextRequest, NextResponse } from "next/server";
import { auth, prisma, checkPlanLimit, checkRateLimit, checkDailyLimit } from "@repo/core";
import { analyzeResume, diagnosticResume } from "@repo/ai";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resumeId");

    const analysis = await prisma.analysis.findFirst({
      where: {
        userId: session.user.id,
        ...(resumeId ? { resumeId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { resume: true },
    });

    if (!analysis) {
      return NextResponse.json({ analysis: null });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Failed to fetch analysis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    // ── Rate limit ────────────────────────────────────────────
    if (!(await checkRateLimit(session.user.id, "analysis", 5))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    // ── Plan limit ────────────────────────────────────────────
    const limitCheck = await checkPlanLimit(session.user.id, "resumesAnalyzed");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `You've reached your ${limitCheck.plan} plan limit of ${limitCheck.limit} resume analyses.`,
          upgrade: true,
          used: limitCheck.used,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
        },
        { status: 402 },
      );
    }

    // ── Daily Cooldown (New) ──────────────────────────────────
    const dailyCheck = await checkDailyLimit(session.user.id, "resumesAnalyzed", 5);
    
    if (!dailyCheck.allowed && limitCheck.plan === "FREE") {
      return NextResponse.json(
        {
          error: "Daily analysis limit reached.",
          details: "You can analyze 5 resumes every 24 hours on the Free plan. Please try again tomorrow or upgrade for higher daily limits.",
          cooldown: true,
        },
        { status: 429 },
      );
    }

    let resumeId: string | null = null;
    try {
      const body = await request.json();
      resumeId = body.resumeId;
    } catch {
      // Body might be empty, that's fine
    }

    console.log(
      `[Analysis API] Manual analysis requested by ${session.user.email} (ResumeID: ${resumeId || "latest"})`,
    );

    // Fetch the target resume
    const targetResume = await prisma.resume.findFirst({
      where: {
        userId: session.user.id,
        ...(resumeId ? { id: resumeId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!targetResume) {
      return NextResponse.json(
        { error: "No resume found. Please upload one first." },
        { status: 404 },
      );
    }

    if (!targetResume.rawText || targetResume.rawText.length < 50) {
      return NextResponse.json(
        {
          error: "Resume content is unreadable or too short.",
          details:
            "The system was unable to extract enough text from your resume. Please re-upload a digital PDF version.",
        },
        { status: 422 },
      );
    }

    console.log(`[Analysis API] Re-analyzing resume: ${targetResume.fileName}`);

    let analysisData, diagnosticData;
    try {
      [analysisData, diagnosticData] = await Promise.all([
        analyzeResume(targetResume.rawText),
        diagnosticResume(targetResume.rawText)
      ]);
    } catch (aiError) {
      console.error("[Analysis API] AI engine error:", aiError);
      const errorMessage =
        aiError instanceof Error ? aiError.message : "Unknown error";
      const isQuotaError =
        errorMessage.toLowerCase().includes("quota") ||
        errorMessage.toLowerCase().includes("rate limit");
      return NextResponse.json(
        {
          error: isQuotaError ? "AI Rate Limit Reached" : "AI Analysis failed.",
          details: isQuotaError
            ? "Your Gemini API key has temporarily reached its free tier limit. Please wait about 60 seconds and try again."
            : errorMessage,
        },
        { status: isQuotaError ? 429 : 500 },
      );
    }

    console.log(
      `[Analysis API] AI Analysis complete. Score: ${analysisData.score}`,
    );

    const [analysis] = await Promise.all([
      prisma.analysis.upsert({
        where: { resumeId: targetResume.id },
        update: {
          score: analysisData.score,
          atsScore: analysisData.atsScore,
          summary: analysisData.summary,
          strengths: analysisData.strengths,
          weaknesses: analysisData.weaknesses,
          missingSkills: analysisData.missingSkills,
          skills: analysisData.skills,
          recommendations: analysisData.recommendations,
          careerPath: analysisData.careerPath,
          experienceLevel: analysisData.experienceLevel,
          skillsMatrix: JSON.parse(JSON.stringify(analysisData.skillsMatrix)),
          diagnostic: JSON.parse(JSON.stringify(diagnosticData)),
          brandingKit: JSON.parse(JSON.stringify(analysisData.brandingKit)),
        },
        create: {
          userId: session.user.id,
          resumeId: targetResume.id,
          score: analysisData.score,
          atsScore: analysisData.atsScore,
          summary: analysisData.summary,
          strengths: analysisData.strengths,
          weaknesses: analysisData.weaknesses,
          missingSkills: analysisData.missingSkills,
          skills: analysisData.skills,
          recommendations: analysisData.recommendations,
          careerPath: analysisData.careerPath,
          experienceLevel: analysisData.experienceLevel,
          skillsMatrix: JSON.parse(JSON.stringify(analysisData.skillsMatrix)),
          diagnostic: JSON.parse(JSON.stringify(diagnosticData)),
          brandingKit: JSON.parse(JSON.stringify(analysisData.brandingKit)),
        },
      }),
      prisma.resume.update({
        where: { id: targetResume.id },
        data: { score: analysisData.score },
      }),
    ]);

    console.log("[Analysis API] Analysis stored and synced successfully.");

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("[Analysis API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
