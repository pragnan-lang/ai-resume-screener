import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find candidates matched by userId or by applicant email
    const candidates = await prisma.candidate.findMany({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email.toLowerCase() },
        ],
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const applications = candidates.map((c) => ({
      id: c.id,
      candidateCode: `J${c.job.id}-C${c.candidateNumber}`,
      jobId: c.job.id,
      jobTitle: c.job.title,
      resumeFileName: c.resumeFileName,
      appliedAt: c.createdAt,
      status: "Application Received & Under Review",
    }));

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error("Portal applications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
