import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/core";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const whereClause = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined;

    // Bolt ⚡ Optimization: Execute independent database queries concurrently to reduce cumulative I/O latency
    // Also fixes a bug where count() didn't use the same where clause as findMany()
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.job.count({
        where: whereClause,
      }),
    ]);

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
