import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobRubric, ComponentWeights, CandidateItemScores } from "@/types/rubric";
import { evaluateResumeWithLLM } from "@/lib/llm-adapter";
import {
  computeCandidateScores,
  assignExcelRanks,
  generateExplanation,
} from "@/lib/scoring";

export async function POST(
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
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const rubric: JobRubric = JSON.parse(job.rubric);
    const weights: ComponentWeights = JSON.parse(job.weights);

    // Filter candidates needing screening (no evaluation or uncompleted)
    const unscreenedCandidates = job.candidates.filter(
      (c) => !c.evaluation || c.evaluation.status !== "COMPLETED"
    );

    let newlyScreenedCount = 0;

    for (const candidate of unscreenedCandidates) {
      // Step 1: LLM extracts evidence and individual item scores
      const { itemScores } = await evaluateResumeWithLLM(
        candidate.resumeText,
        rubric
      );

      // Step 2: Deterministic scoring
      const computed = computeCandidateScores(rubric, itemScores, weights);
      const explanation = generateExplanation(
        candidate.name,
        rubric,
        itemScores,
        computed
      );

      if (candidate.evaluation) {
        await prisma.evaluation.update({
          where: { candidateId: candidate.id },
          data: {
            itemScores: JSON.stringify(itemScores),
            skillsMatch: computed.skillsMatch,
            experienceMatch: computed.experienceMatch,
            educationMatch: computed.educationMatch,
            preferredMatch: computed.preferredMatch,
            projectsMatch: computed.projectsMatch,
            totalScore: computed.totalScore,
            explanation,
            missingSkills: computed.missingSkills,
            status: "COMPLETED",
          },
        });
      } else {
        await prisma.evaluation.create({
          data: {
            candidateId: candidate.id,
            itemScores: JSON.stringify(itemScores),
            skillsMatch: computed.skillsMatch,
            experienceMatch: computed.experienceMatch,
            educationMatch: computed.educationMatch,
            preferredMatch: computed.preferredMatch,
            projectsMatch: computed.projectsMatch,
            totalScore: computed.totalScore,
            rank: 0,
            explanation,
            missingSkills: computed.missingSkills,
            status: "COMPLETED",
          },
        });
      }

      newlyScreenedCount++;
    }

    // Refresh and re-rank all completed candidates for this job
    const allEvaluatedCandidates = await prisma.candidate.findMany({
      where: { jobId },
      include: { evaluation: true },
    });

    const completed = allEvaluatedCandidates
      .filter((c) => c.evaluation && c.evaluation.status === "COMPLETED")
      .map((c) => ({
        candidateId: c.id,
        totalScore: c.evaluation!.totalScore,
      }));

    const ranked = assignExcelRanks(completed);

    for (const r of ranked) {
      await prisma.evaluation.update({
        where: { candidateId: r.candidateId },
        data: { rank: r.rank },
      });
    }

    return NextResponse.json({
      success: true,
      screenedCount: newlyScreenedCount,
      totalCandidates: job.candidates.length,
      message:
        newlyScreenedCount > 0
          ? `Successfully screened ${newlyScreenedCount} new candidate(s).`
          : "All candidates are already screened.",
    });
  } catch (error: any) {
    console.error("Error screening resumes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to screen resumes" },
      { status: 500 }
    );
  }
}
