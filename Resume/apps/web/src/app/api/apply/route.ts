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

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId,
        status: "APPLIED",
      },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
