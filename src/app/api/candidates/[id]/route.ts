import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import { assignExcelRanks } from "@/lib/scoring";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidateId = params.id;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const jobId = candidate.jobId;

    // Delete uploaded file from storage if present
    if (candidate.resumeFilePath && fs.existsSync(candidate.resumeFilePath)) {
      try {
        fs.unlinkSync(candidate.resumeFilePath);
      } catch (err) {
        console.warn("Could not delete file from disk:", candidate.resumeFilePath, err);
      }
    }

    // Delete candidate from DB (Evaluation deleted via cascade)
    await prisma.candidate.delete({
      where: { id: candidateId },
    });

    // Re-rank remaining completed candidates
    const remaining = await prisma.candidate.findMany({
      where: { jobId },
      include: { evaluation: true },
    });

    const completed = remaining
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
      message: "Candidate data permanently deleted.",
    });
  } catch (error: any) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete candidate" },
      { status: 500 }
    );
  }
}
