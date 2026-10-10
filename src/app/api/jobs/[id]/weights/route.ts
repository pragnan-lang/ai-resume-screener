import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ComponentWeights, JobRubric, CandidateItemScores } from "@/types/rubric";
import {
  validateWeights,
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

    const { weights }: { weights: ComponentWeights } = await req.json();

    const weightCheck = validateWeights(weights);
    if (!weightCheck.isValid) {
      return NextResponse.json({ error: weightCheck.error }, { status: 400 });
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

    // Save new weights
    await prisma.job.update({
      where: { id: jobId },
      data: { weights: JSON.stringify(weights) },
    });

    const rubric: JobRubric = JSON.parse(job.rubric);

    // Recalculate deterministic scores for all candidates with existing evaluations
    const candidatesToRecalculate = job.candidates.filter(
      (c) => c.evaluation && c.evaluation.itemScores
    );

    const recomputedList = candidatesToRecalculate.map((c) => {
      const itemScores: CandidateItemScores = JSON.parse(
        c.evaluation!.itemScores
      );
      const computed = computeCandidateScores(rubric, itemScores, weights);
      const explanation = generateExplanation(
        c.name,
        rubric,
        itemScores,
        computed
      );

      return {
        candidateId: c.id,
        computed,
        explanation,
        totalScore: computed.totalScore,
      };
    });

    // Assign Excel-style ranks
    const rankedList = assignExcelRanks(recomputedList);

    // Update DB
    for (const item of rankedList) {
      await prisma.evaluation.update({
        where: { candidateId: item.candidateId },
        data: {
          skillsMatch: item.computed.skillsMatch,
          experienceMatch: item.computed.experienceMatch,
          educationMatch: item.computed.educationMatch,
          preferredMatch: item.computed.preferredMatch,
          projectsMatch: item.computed.projectsMatch,
          totalScore: item.computed.totalScore,
          rank: item.rank,
          explanation: item.explanation,
          missingSkills: item.computed.missingSkills,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Weights updated and candidate scores recomputed.",
    });
  } catch (error: any) {
    console.error("Error updating weights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update weights" },
      { status: 500 }
    );
  }
}
