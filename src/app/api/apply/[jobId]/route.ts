import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractResumeText, redactPII } from "@/lib/parse-resume";
import * as fs from "fs";
import * as path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = parseInt(params.jobId, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid Job ID" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const consent = formData.get("consent");
    const file = formData.get("resume") as File | null;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (consent !== "true" && consent !== "on") {
      return NextResponse.json(
        { error: "Consent to process application is required" },
        { status: 400 }
      );
    }
    if (!file) {
      return NextResponse.json(
        { error: "Resume file is required" },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size limit of 5 MB" },
        { status: 400 }
      );
    }

    // Validate extension
    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "docx", "txt"].includes(ext)) {
      return NextResponse.json(
        { error: "Allowed file formats: PDF, DOCX, TXT" },
        { status: 400 }
      );
    }

    // Read buffer and extract text
    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);
    const resumeText = await extractResumeText(buffer, fileName);

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not read text from uploaded resume. Please check file content." },
        { status: 400 }
      );
    }

    // Redact PII from the parsed text before saving / analyzing
    const sanitizedText = redactPII(resumeText, name, email);

    // Save file in storage outside public directory
    const storageDir = path.join(process.cwd(), "storage", "resumes");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(storageDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    // Determine sequential candidateNumber for this job
    const highestCandidate = await prisma.candidate.findFirst({
      where: { jobId },
      orderBy: { candidateNumber: "desc" },
    });
    const nextCandidateNumber = (highestCandidate?.candidateNumber || 0) + 1;

    // Check if submitting user has an existing account
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    const candidate = await prisma.candidate.create({
      data: {
        jobId,
        candidateNumber: nextCandidateNumber,
        userId: existingUser?.id || null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        consentGiven: true,
        resumeFileName: fileName,
        resumeFilePath: filePath,
        resumeText: sanitizedText,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully.",
      candidateId: `J${job.id}-C${candidate.candidateNumber}`,
    });
  } catch (error: any) {
    console.error("Error processing application:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process application" },
      { status: 500 }
    );
  }
}
