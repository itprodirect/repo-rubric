import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get("repoUrl");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let assessments;

    if (repoUrl) {
      // Get assessments for specific repo
      assessments = await prisma.repoAssessment.findMany({
        where: { repoUrl },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          repoUrl: true,
          owner: true,
          name: true,
          commitSha: true,
          createdAt: true,
          rubricJson: true,
        },
      });
    } else {
      // Get recent assessments
      assessments = await prisma.repoAssessment.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          repoUrl: true,
          owner: true,
          name: true,
          commitSha: true,
          createdAt: true,
          rubricJson: true,
        },
      });
    }

    // Parse rubricJson to extract classification
    const results = assessments.map((a) => {
      let classification = "A_NOT_AGENTIC";
      try {
        const rubric = JSON.parse(a.rubricJson);
        classification = rubric.classification || classification;
      } catch {
        // Use default
      }

      return {
        id: a.id,
        repoUrl: a.repoUrl,
        owner: a.owner,
        name: a.name,
        commitSha: a.commitSha.slice(0, 7),
        createdAt: a.createdAt.toISOString(),
        classification,
      };
    });

    return NextResponse.json({ assessments: results });
  } catch (error) {
    console.error("Assessments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
