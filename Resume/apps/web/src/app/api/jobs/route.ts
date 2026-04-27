import { NextRequest, NextResponse } from "next/server";
import { auth, prisma } from "@repo/core";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const jobs = await prisma.job.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.job.count();

    return NextResponse.json({
      jobs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Jobs error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
