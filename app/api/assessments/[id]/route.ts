import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assessment = await prisma.repoAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: assessment.id,
      repoUrl: assessment.repoUrl,
      owner: assessment.owner,
      name: assessment.name,
      defaultBranch: assessment.defaultBranch,
      commitSha: assessment.commitSha,
      selectedPaths: JSON.parse(assessment.selectedPathsJson),
      fileDigests: JSON.parse(assessment.fileDigestsJson),
      rubric: JSON.parse(assessment.rubricJson),
      createdAt: assessment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Assessment fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}
