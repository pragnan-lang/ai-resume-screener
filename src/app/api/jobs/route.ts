import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_WEIGHTS, JOB_1_RUBRIC } from "@/types/rubric";
import { validateWeights } from "@/lib/scoring";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    const formatted = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      candidateCount: j._count.candidates,
      createdAt: j.createdAt,
    }));

    return NextResponse.json({ jobs: formatted });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, rubric, weights } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Job title is required" },
        { status: 400 }
      );
    }
    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const jobRubric = rubric || JOB_1_RUBRIC;
    const jobWeights = weights || DEFAULT_WEIGHTS;

    const weightCheck = validateWeights(jobWeights);
    if (!weightCheck.isValid) {
      return NextResponse.json({ error: weightCheck.error }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        rubric: JSON.stringify(jobRubric),
        weights: JSON.stringify(jobWeights),
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
      },
    });
  } catch (error: any) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}
