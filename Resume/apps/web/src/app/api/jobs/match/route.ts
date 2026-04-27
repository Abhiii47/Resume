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

    const requestedMatches = 6;
    const availablePlanSlots =
      limitCheck.limit === -1
        ? requestedMatches
        : Math.max(limitCheck.limit - limitCheck.used, 0);
    const availableDailySlots =
      limitCheck.plan === "FREE"
        ? Math.max(10 - dailyCheck.used, 0)
        : requestedMatches;
    const matchBudget = Math.min(
      requestedMatches,
      availablePlanSlots,
      availableDailySlots,
    );

    if (matchBudget <= 0) {
      return NextResponse.json({
        matches: [],
        message:
          limitCheck.plan === "FREE"
            ? "You've used the available job matches for now. Upgrade or come back after the daily reset."
            : "You've used the available job matches for your current plan.",
      });
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

    const jobsToMatch = liveJobs.slice(0, matchBudget);
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

    const persistedMatches = await Promise.all(
      batchResults.map(async (result, idx) => {
        const liveJob = jobsToMatch[idx];
        const description = `${liveJob.jobTitle} role at ${liveJob.companyName} based in ${liveJob.location}. This opportunity aligns with your ${analysis.careerPath} career path.`;

        const existingJob = await prisma.job.findFirst({
          where: liveJob.link
            ? { sourceUrl: liveJob.link }
            : {
                title: liveJob.jobTitle,
                company: liveJob.companyName,
                location: liveJob.location,
              },
          select: { id: true },
        });

        const jobRecord = existingJob
          ? await prisma.job.update({
              where: { id: existingJob.id },
              data: {
                title: liveJob.jobTitle,
                company: liveJob.companyName,
                location: liveJob.location,
                description,
                source: "yepapi",
                sourceUrl: liveJob.link,
                isActive: true,
              },
            })
          : await prisma.job.create({
              data: {
                title: liveJob.jobTitle,
                company: liveJob.companyName,
                location: liveJob.location,
                description,
                source: "yepapi",
                sourceUrl: liveJob.link,
                isActive: true,
              },
            });

        const matchRecord = await prisma.match.upsert({
          where: {
            userId_jobId: {
              userId: session.user.id,
              jobId: jobRecord.id,
            },
          },
          update: {
            matchScore: result.score,
            reason: result.reasoning,
          },
          create: {
            userId: session.user.id,
            jobId: jobRecord.id,
            matchScore: result.score,
            reason: result.reasoning,
          },
        });

        const existingApplication = await prisma.application.findFirst({
          where: {
            userId: session.user.id,
            jobId: jobRecord.id,
          },
          select: { id: true },
        });

        return {
          id: jobRecord.id,
          title: jobRecord.title,
          company: jobRecord.company,
          location: jobRecord.location,
          description: jobRecord.description,
          match: {
            score: matchRecord.matchScore,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            reasoning: result.reasoning,
          },
          sourceUrl: jobRecord.sourceUrl ?? undefined,
          applied: Boolean(existingApplication),
        };
      }),
    );

    const matches = persistedMatches.sort(
      (a, b) => (b.match.score ?? 0) - (a.match.score ?? 0),
    );

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Job match error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job matches", matches: [] },
      { status: 500 },
    );
  }
}
