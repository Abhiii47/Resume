import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/core";
import { headers } from "next/headers";
import { auth } from "@repo/core";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      include: {
        job: {
          include: {
            matches: {
              where: { userId: session.user.id },
              select: { matchScore: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({
      applications: applications.map((application) => ({
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt,
        job: {
          title: application.job.title,
          company: application.job.company,
          location: application.job.location,
          matchScore: application.job.matches[0]?.matchScore ?? null,
          sourceUrl: application.job.sourceUrl,
        },
      })),
    });
  } catch (error) {
    console.error("Applications error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, role, company, location, url } = body;

    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true },
      });

      if (!job) {
        return NextResponse.json({ error: "Job not found." }, { status: 404 });
      }

      const existingApplication = await prisma.application.findFirst({
        where: {
          userId: session.user.id,
          jobId: job.id,
        },
        include: {
          job: {
            include: {
              matches: {
                where: { userId: session.user.id },
                select: { matchScore: true },
                take: 1,
              },
            },
          },
        },
      });

      if (existingApplication) {
        return NextResponse.json({
          success: true,
          application: {
            id: existingApplication.id,
            status: existingApplication.status,
            appliedAt: existingApplication.appliedAt,
            job: {
              title: existingApplication.job.title,
              company: existingApplication.job.company,
              location: existingApplication.job.location,
              matchScore:
                existingApplication.job.matches[0]?.matchScore ?? null,
              sourceUrl: existingApplication.job.sourceUrl,
            },
          },
          message: "Application already tracked.",
        });
      }

      const application = await prisma.application.create({
        data: {
          userId: session.user.id,
          jobId: job.id,
          status: "APPLIED",
          notes: "Created from matched jobs.",
        },
        include: {
          job: {
            include: {
              matches: {
                where: { userId: session.user.id },
                select: { matchScore: true },
                take: 1,
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        application: {
          id: application.id,
          status: application.status,
          appliedAt: application.appliedAt,
          job: {
            title: application.job.title,
            company: application.job.company,
            location: application.job.location,
            matchScore: application.job.matches[0]?.matchScore ?? null,
            sourceUrl: application.job.sourceUrl,
          },
        },
      });
    }

    if (!role || !company) {
      return NextResponse.json(
        { error: "Role and company are required." },
        { status: 400 },
      );
    }

    const existingJob = await prisma.job.findFirst({
      where: url
        ? { sourceUrl: url }
        : {
            title: role,
            company,
            location: location || "Remote",
          },
      select: { id: true },
    });

    const job = existingJob
      ? await prisma.job.update({
          where: { id: existingJob.id },
          data: {
            title: role,
            company,
            location: location || "Remote",
            description: `Application via tracker for ${role} at ${company}.`,
            sourceUrl: url,
          },
        })
      : await prisma.job.create({
          data: {
            title: role,
            company,
            location: location || "Remote",
            description: `Application via tracker for ${role} at ${company}.`,
            sourceUrl: url,
          },
        });

    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: session.user.id,
        jobId: job.id,
      },
      include: {
        job: {
          include: {
            matches: {
              where: { userId: session.user.id },
              select: { matchScore: true },
              take: 1,
            },
          },
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json({
        success: true,
        application: {
          id: existingApplication.id,
          status: existingApplication.status,
          appliedAt: existingApplication.appliedAt,
          job: {
            title: existingApplication.job.title,
            company: existingApplication.job.company,
            location: existingApplication.job.location,
            matchScore: existingApplication.job.matches[0]?.matchScore ?? null,
            sourceUrl: existingApplication.job.sourceUrl,
          },
        },
        message: "Application already tracked.",
      });
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId: job.id,
        status: "APPLIED",
        notes: "Manually added to tracker.",
      },
      include: {
        job: {
          include: {
            matches: {
              where: { userId: session.user.id },
              select: { matchScore: true },
              take: 1,
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt,
        job: {
          title: application.job.title,
          company: application.job.company,
          location: application.job.location,
          matchScore: application.job.matches[0]?.matchScore ?? null,
          sourceUrl: application.job.sourceUrl,
        },
      },
    });
  } catch (error) {
    console.error("Application create error:", error);
    return NextResponse.json(
      { error: "Failed to add application." },
      { status: 500 },
    );
  }
}
