import { NextRequest, NextResponse } from "next/server";
import { prisma, auth } from "@repo/core";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: session.user.id,
        jobId: job.id,
      },
    });

    if (existingApplication) {
      return NextResponse.json({ application: existingApplication });
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId: job.id,
        status: "APPLIED",
      },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
