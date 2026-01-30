import { NextRequest, NextResponse } from "next/server";
import {
  getRepoMetadata,
  getLatestCommit,
  getTree,
  GitHubError,
} from "@/lib/github";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const { owner, name } = await params;

    // Get optional sha from query params
    const { searchParams } = new URL(request.url);
    const requestedSha = searchParams.get("sha");

    // Get repo metadata
    const metadata = await getRepoMetadata(owner, name);

    // Get commit SHA (use provided or fetch latest)
    const commitSha = requestedSha || await getLatestCommit(owner, name, metadata.defaultBranch);

    // Get tree
    const treeResult = await getTree(owner, name, commitSha);

    return NextResponse.json({
      tree: treeResult.tree,
      defaultBranch: metadata.defaultBranch,
      description: metadata.description,
      commitSha,
      truncated: treeResult.truncated,
    });
  } catch (error) {
    if (error instanceof GitHubError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: error.message, retryAfter: error.retryAfter },
          {
            status: 429,
            headers: {
              "Retry-After": String(error.retryAfter || 60),
            },
          }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Tree fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository tree" },
      { status: 500 }
    );
  }
}
