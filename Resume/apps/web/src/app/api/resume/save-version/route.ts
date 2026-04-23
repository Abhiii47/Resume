import { NextRequest, NextResponse } from "next/server";
import { auth, prisma } from "@repo/core";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { optimizedText, jobTitle, company } = await request.json();

    if (!optimizedText) {
      return NextResponse.json({ error: "Content missing" }, { status: 400 });
    }

    // Save as a tailored resume version
    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        fileName: `Tailored: ${jobTitle} at ${company}.pdf`, // Naming convention
        fileUrl: "text-only", // Placeholder since we don't generate PDF yet
        rawText: optimizedText,
        isActive: false, // Don't replace the main resume
      },
    });

    return NextResponse.json({ success: true, resumeId: resume.id });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
