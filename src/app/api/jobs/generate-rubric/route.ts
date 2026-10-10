import { NextRequest, NextResponse } from "next/server";
import { generateRubricFromJD } from "@/lib/llm-adapter";

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required to generate a rubric" },
        { status: 400 }
      );
    }

    const rubric = await generateRubricFromJD(title, description);

    return NextResponse.json({ success: true, rubric });
  } catch (error: any) {
    console.error("Error generating rubric:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate rubric" },
      { status: 500 }
    );
  }
}
