import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobRubric, ComponentWeights } from "@/types/rubric";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid Job ID" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        candidates: {
          include: {
            evaluation: true,
          },
          orderBy: {
            candidateNumber: "asc",
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const rubric: JobRubric = JSON.parse(job.rubric);
    const weights: ComponentWeights = JSON.parse(job.weights);

    // Format candidates for table and detail drawer
    const formattedCandidates = job.candidates.map((c) => {
      const candidateCode = `J${job.id}-C${c.candidateNumber}`;
      const evalData = c.evaluation;

      return {
        id: c.id,
        candidateCode,
        candidateNumber: c.candidateNumber,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
        resumeFileName: c.resumeFileName,
        evaluationStatus: evalData ? evalData.status : "UNSCREENED",
        // Scores (0-100 with one decimal)
        skillsMatch: evalData ? Number(evalData.skillsMatch.toFixed(1)) : null,
        experienceMatch: evalData ? Number(evalData.experienceMatch.toFixed(1)) : null,
        educationMatch: evalData ? Number(evalData.educationMatch.toFixed(1)) : null,
        preferredMatch: evalData ? Number(evalData.preferredMatch.toFixed(1)) : null,
        projectsMatch: evalData ? Number(evalData.projectsMatch.toFixed(1)) : null,
        totalScore: evalData ? Number(evalData.totalScore.toFixed(1)) : null,
        rank: evalData && evalData.rank > 0 ? evalData.rank : null,
        explanation: evalData?.explanation || "Awaiting screening",
        missingSkills: evalData?.missingSkills || "",
        itemScores: evalData?.itemScores ? JSON.parse(evalData.itemScores) : {},
      };
    });

    // Sort by Rank ascending (screened first, unranked at the end)
    formattedCandidates.sort((a, b) => {
      if (a.rank !== null && b.rank !== null) {
        return a.rank - b.rank;
      }
      if (a.rank !== null) return -1;
      if (b.rank !== null) return 1;
      return a.candidateNumber - b.candidateNumber;
    });

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        rubric,
        weights,
        createdAt: job.createdAt,
      },
      candidates: formattedCandidates,
    });
  } catch (error: any) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch job" },
      { status: 500 }
    );
  }
}
