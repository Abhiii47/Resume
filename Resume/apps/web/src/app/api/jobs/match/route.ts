import { NextResponse } from "next/server";
import {
  auth,
  prisma,
  fetchJobs,
  checkPlanLimit,
  checkRateLimit,
  checkDailyLimit,
} from "@repo/core";
import { batchMatchJobsToResume } from "@repo/ai";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────
    if (!(await checkRateLimit(session.user.id, "jobs-match", 5))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment.", matches: [] },
        { status: 429 },
      );
    }

    // ── Plan limit ────────────────────────────────────────────
    const limitCheck = await checkPlanLimit(session.user.id, "jobMatches");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `You've reached your ${limitCheck.plan} plan limit of ${limitCheck.limit} job matches.`,
          upgrade: true,
          used: limitCheck.used,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
          matches: [],
        },
        { status: 402 },
      );
    }

    // ── Daily Cooldown ────────────────────────────────────────
    const dailyCheck = await checkDailyLimit(session.user.id, "jobMatches", 10);
    if (!dailyCheck.allowed && limitCheck.plan === "FREE") {
      return NextResponse.json(
        {
          error: "Daily matching limit reached.",
          details: "You can match 10 times every 24 hours on the Free plan. Please try again tomorrow.",
          cooldown: true,
          matches: [],
        },
        { status: 429 },
      );
    }

    // 1. Get user's latest analysis
    const analysis = await prisma.analysis.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        skills: true,
        careerPath: true,
        summary: true,
        missingSkills: true,
      },
    });

    const userSkills = (
      Array.isArray(analysis?.skills) ? analysis.skills : []
    ) as string[];

    if (!analysis || userSkills.length === 0) {
      return NextResponse.json({
        matches: [],
        message:
          "Upload and analyze your resume first to see personalized matches.",
      });
    }

    const userProfile = {
      skills: userSkills,
      summary: analysis.summary ?? "",
      careerPath: analysis.careerPath ?? "",
      experienceLevel: "mid",
    };

    const topSkills = userSkills.slice(0, 5).join(", ");
    const searchQuery = `${analysis.careerPath} jobs ${topSkills}`;

    const liveJobs = await fetchJobs(searchQuery);

    if (!liveJobs.length) {
      return NextResponse.json({
        matches: [],
        message: "No live jobs found right now. Try again shortly.",
      });
    }

    const jobsToMatch = liveJobs.slice(0, 6);
    const jobsForBatch = jobsToMatch.map((job, idx) => ({
      id: `live-${idx}`,
      title: job.jobTitle,
      description: `${job.jobTitle} position at ${job.companyName} in ${job.location}`,
      skillsRequired: userSkills.slice(0, 8),
    }));

    const batchResults = await batchMatchJobsToResume(
      userProfile,
      jobsForBatch,
    );

    const matches = batchResults
      .map((result, idx) => {
        const job = jobsToMatch[idx];
        return {
          id: result.jobId,
          title: job.jobTitle,
          company: job.companyName,
          location: job.location,
          description: `${job.jobTitle} role at ${job.companyName} based in ${job.location}. This opportunity aligns with your ${analysis.careerPath} career path.`,
          match: {
            score: result.score,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            reasoning: result.reasoning,
          },
          sourceUrl: job.link,
        };
      })
      .sort((a, b) => b.match.score - a.match.score);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Job match error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job matches", matches: [] },
      { status: 500 },
    );
  }
}
