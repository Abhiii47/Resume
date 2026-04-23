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
      include: { job: true },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ applications });
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
    const { role, company, location, url } = body;

    if (!role || !company) {
      return NextResponse.json(
        { error: "Role and company are required." },
        { status: 400 },
      );
    }

    // Since users are adding generic applications without a pre-existing job in the system,
    // we create a job record or connect to an existing one, then create the application.
    const job = await prisma.job.create({
      data: {
        title: role,
        company: company,
        location: location || "Remote",
        description: `Application via tracker for ${role} at ${company}.`,
        sourceUrl: url,
      },
    });

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId: job.id,
        status: "APPLIED",
        notes: "Manually added to tracker.",
      },
      include: { job: true },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Application create error:", error);
    return NextResponse.json(
      { error: "Failed to add application." },
      { status: 500 },
    );
  }
}
