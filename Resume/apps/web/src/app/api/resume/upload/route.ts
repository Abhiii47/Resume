import { NextRequest, NextResponse } from "next/server";
import { auth, prisma, getSupabaseAdmin, checkPlanLimit, sanitizeFilename } from "@repo/core";
import { analyzeResume, diagnosticResume } from "@repo/ai";
import { headers } from "next/headers";

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    // This modern version of pdf-parse (v2.4.5) requires an options object
    const parser = new PDFParse({ 
      data: new Uint8Array(buffer),
      verbosity: 0 // Suppress internal logs
    });
    
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    console.error("[PDF Extraction] Critical failure:", error);
    if (error instanceof Error) {
       throw error;
    }
    throw new Error("Failed to read PDF content. The file may be corrupt or encrypted.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    console.log("[Upload][INIT] Starting request...");

    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      console.warn("[Upload][AUTH] Unauthorized.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[Upload][AUTH] User:", session.user.email);

    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error("[Upload][FORM] Failed to parse form data:", e);
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("resume") as File | null;
    if (!file) {
      console.warn("[Upload][FORM] No 'resume' field found in form data.");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    console.log(`[Upload][FILE] Received: ${file.name} (${file.size} bytes)`);

    const sanitizedName = sanitizeFilename(file.name);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract Text
    console.log("[Upload][STEP 1] Extracting text...");
    
    // Check if it's actually a PDF
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF file." },
        { status: 400 }
      );
    }

    const rawText = await parsePdf(buffer);
    console.log("[Upload][STEP 1] Success. Length:", rawText.length);

    if (!rawText || rawText.length < 50) {
      console.error("[Upload][STEP 1] Text too short.");
      return NextResponse.json(
        {
          error: "Unreadable resume content",
          details:
            "The PDF appears to be a scanned image or empty. Please use a digital PDF.",
        },
        { status: 422 },
      );
    }

    // 2. Upload to Supabase Storage
    console.log("[Upload][STEP 2] Initializing storage...");
    const sb = getSupabaseAdmin();
    if (!sb) {
      console.error("[Upload][STEP 2] Supabase admin failed.");
      return NextResponse.json(
        { error: "Storage configuration error" },
        { status: 500 },
      );
    }

    const fileName = `${session.user.id}/${Date.now()}-${sanitizedName}`;
    console.log(`[Upload][STEP 2] Uploading to bucket 'resumes': ${fileName}`);
    const { data: uploadData, error: uploadError } = await sb.storage
      .from("resumes")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Upload][STEP 2] Storage failure:", uploadError);
      return NextResponse.json(
        { error: "Storage upload failed", details: uploadError.message },
        { status: 500 },
      );
    }
    console.log("[Upload][STEP 2] Success.");

    console.log("[Upload][STEP 3] Generating public URL...");
    const {
      data: { publicUrl },
    } = sb.storage.from("resumes").getPublicUrl(uploadData.path);
    console.log("[Upload][STEP 3] URL:", publicUrl);

    // 4. Save to Database
    console.log("[Upload][STEP 4] Saving to Database...");
    let resume;
    try {
      resume = await prisma.resume.create({
        data: {
          userId: session.user.id,
          fileUrl: publicUrl,
          fileName: sanitizedName,
          rawText,
          isActive: true,
        },
      });
    } catch (dbError) {
      console.error("[Upload][STEP 4] Database failure:", dbError);
      return NextResponse.json(
        {
          error: "Database save failed",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 },
      );
    }
    console.log("[Upload][STEP 4] Success. Resume ID:", resume.id);

    // 5. Check plan limit before triggering AI analysis
    const limitCheck = await checkPlanLimit(session.user.id, "resumesAnalyzed");
    if (!limitCheck.allowed) {
      // Resume is uploaded but won't be analyzed due to limit
      return NextResponse.json({
        success: true,
        resume,
        warning: `You've reached your ${limitCheck.plan} plan limit of ${limitCheck.limit} resume analyses. Upgrade to analyze this resume.`,
        upgrade: true,
        used: limitCheck.used,
        limit: limitCheck.limit,
        plan: limitCheck.plan,
      });
    }

    // 6. Trigger AI Analysis
    console.log("[Upload][STEP 5] Starting AI analysis with Gemini 1.5 Flash...");
    try {
      const [analysisData, diagnosticData] = await Promise.all([
        analyzeResume(rawText),
        diagnosticResume(rawText)
      ]);
      console.log(`[Upload][STEP 5] Success. Score: ${analysisData.score}, ATS: ${analysisData.atsScore}`);

      await prisma.analysis.create({
        data: {
          userId: session.user.id,
          resumeId: resume.id,
          score: analysisData.score,
          atsScore: analysisData.atsScore,
          summary: analysisData.summary,
          strengths: analysisData.strengths,
          weaknesses: analysisData.weaknesses,
          missingSkills: analysisData.missingSkills,
          skills: analysisData.skills,
          recommendations: analysisData.recommendations,
          careerPath: analysisData.careerPath,
          experienceLevel: analysisData.experienceLevel,
          skillsMatrix: analysisData.skillsMatrix,
          diagnostic: diagnosticData,
          brandingKit: analysisData.brandingKit,
        },
      });

      await prisma.resume.update({
        where: { id: resume.id },
        data: { score: analysisData.score },
      });
      console.log("[Upload][DONE] Full pipeline complete.");

      return NextResponse.json({
        success: true,
        resume,
        analysis: analysisData,
        message: "Resume uploaded and analyzed successfully",
      });
    } catch (aiError) {
      console.error("[Upload][STEP 5] AI failure (Non-critical):", aiError);
      return NextResponse.json({
        success: true,
        resume,
        warning:
          "Resume uploaded, but AI analysis failed. Our team has been notified.",
      });
    }
  } catch (error) {
    console.error("[Upload][CRITICAL] Global failure:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected critical error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
