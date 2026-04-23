import { NextRequest, NextResponse } from "next/server";
import { auth, prisma } from "@repo/core";
import { headers } from "next/headers";

// PATCH — update user name
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, plan: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[User PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update name." },
      { status: 500 },
    );
  }
}

// DELETE — delete account and all cascaded data
export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prisma schema has onDelete: Cascade on all user relations
    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[User DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 },
    );
  }
}
