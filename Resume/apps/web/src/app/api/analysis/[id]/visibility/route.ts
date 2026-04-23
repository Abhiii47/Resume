import { NextRequest, NextResponse } from "next/server";
import { auth, prisma } from "@repo/core";
import { headers } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isPublic } = await request.json();

    // Verify ownership
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!analysis || analysis.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.analysis.update({
      where: { id },
      data: { isPublic }
    });

    return NextResponse.json({ success: true, isPublic: updated.isPublic });
  } catch (error) {
    console.error("Visibility toggle error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
