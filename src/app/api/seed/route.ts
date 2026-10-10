import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST() {
  try {
    const cmd = `& "C:\\Program Files\\nodejs\\npx.cmd" tsx prisma/seed.ts`;
    const { stdout, stderr } = await execPromise(
      `powershell -Command "$env:Path = 'C:\\Program Files\\nodejs;' + $env:Path; ${cmd}"`,
      { cwd: process.cwd() }
    );

    return NextResponse.json({
      success: true,
      message: "Database successfully reseeded with benchmark candidates.",
      stdout,
    });
  } catch (error: any) {
    console.error("Error executing seed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reseed database" },
      { status: 500 }
    );
  }
}
