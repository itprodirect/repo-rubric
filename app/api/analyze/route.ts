import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseGitHubUrl,
  getRepoMetadata,
  getLatestCommit,
  getTree,
  getFileContent,
  GitHubError,
} from "@/lib/github";
import { selectFiles } from "@/lib/heuristics";
import { fetchAndChunkFiles } from "@/lib/chunker";
import { analyzeRepository } from "@/lib/llm";

export const maxDuration = 300; // 5 minutes for Vercel

interface AnalyzeRequest {
  repoUrl: string;
  extraPaths?: string[];      // Additive to heuristics
  selectedPaths?: string[];   // Override: analyze EXACTLY these (bypasses heuristics)
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as AnalyzeRequest;
    const { repoUrl, extraPaths = [], selectedPaths } = body;

    // Determine if we're in override mode (user selected specific files)
    const isOverrideMode = selectedPaths && selectedPaths.length > 0;

    if (!repoUrl) {
      return NextResponse.json(
        { error: "repoUrl is required" },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Step 1: Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(repoUrl);

    // Step 2: Get repo metadata
    const metadata = await getRepoMetadata(owner, repo);

    // Step 3: Get latest commit SHA
    const commitSha = await getLatestCommit(owner, repo, metadata.defaultBranch);

    // Check if we already have an assessment for this commit
    // Skip cache when user has selected specific files (override mode)
    if (!isOverrideMode) {
      const existing = await prisma.repoAssessment.findFirst({
        where: {
          owner,
          name: repo,
          commitSha,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existing) {
        return NextResponse.json({
          assessmentId: existing.id,
          cached: true,
          rubricJson: JSON.parse(existing.rubricJson),
        });
      }
    }

    // Step 4: Get file tree
    const treeResult = await getTree(owner, repo, commitSha);

    // Step 5: Select files using heuristics OR use override paths
    const selection = selectFiles(treeResult.tree);

    let uniquePaths: string[];

    if (isOverrideMode) {
      // Override mode: analyze EXACTLY the paths provided
      // Validate that paths exist in tree
      const validPaths = selectedPaths!.filter((path) =>
        treeResult.tree.some((n) => n.path === path && n.type === "blob")
      );
      uniquePaths = validPaths;
    } else {
      // Heuristic mode: use selection + extraPaths
      const extraNodes = extraPaths
        .map((path) => treeResult.tree.find((n) => n.path === path))
        .filter(Boolean);

      const pathsFromHeuristics = [
        ...selection.selected.map((s) => s.path),
        ...extraNodes.map((n) => n!.path),
      ];

      // Deduplicate
      uniquePaths = Array.from(new Set(pathsFromHeuristics));
    }

    // Step 6: Fetch and chunk file contents
    const filesToFetch = uniquePaths.map((path) => {
      const node = treeResult.tree.find((n) => n.path === path);
      return { path, size: node?.size ?? 0 };
    });

    const fetchResult = await fetchAndChunkFiles(
      filesToFetch,
      async (path) => getFileContent(owner, repo, path, commitSha),
      commitSha
    );

    if (fetchResult.chunks.length === 0) {
      return NextResponse.json(
        { error: "No file content could be fetched" },
        { status: 400 }
      );
    }

    // Step 7: Run LLM analysis
    const context = {
      repoUrl,
      owner,
      repo,
      commitSha,
      defaultBranch: metadata.defaultBranch,
      detectedStack: selection.detected_stack,
      analyzedPaths: uniquePaths,
    };

    const analysisResult = await analyzeRepository(context, fetchResult.chunks);

    // Populate meta fields that weren't set by LLM
    analysisResult.rubric.meta = {
      ...analysisResult.rubric.meta,
      repo_url: repoUrl,
      owner,
      repo,
      commit_sha: commitSha,
      default_branch: metadata.defaultBranch,
      detected_stack: selection.detected_stack,
      analyzed_paths: uniquePaths,
      content_caps: {
        max_files: 25,
        max_total_chars: 250000,
        truncated: selection.truncated || fetchResult.stats.truncatedFiles > 0,
      },
    };

    // Step 8: Save to database
    const assessment = await prisma.repoAssessment.create({
      data: {
        repoUrl,
        owner,
        name: repo,
        defaultBranch: metadata.defaultBranch,
        commitSha,
        selectedPathsJson: JSON.stringify(uniquePaths),
        fileDigestsJson: JSON.stringify(fetchResult.digests),
        rubricJson: JSON.stringify(analysisResult.rubric),
      },
    });

    // Step 9: Return response
    return NextResponse.json({
      assessmentId: assessment.id,
      cached: false,
      rubricJson: analysisResult.rubric,
      warnings: [
        ...selection.warnings,
        ...fetchResult.warnings,
        ...(analysisResult.validationErrors.length > 0
          ? [`Validation warnings: ${analysisResult.validationErrors.join(", ")}`]
          : []),
      ],
      stats: {
        filesAnalyzed: fetchResult.stats.totalFiles,
        chunksProcessed: fetchResult.stats.totalChunks,
        totalChars: fetchResult.stats.totalChars,
        detectedStack: selection.detected_stack,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof GitHubError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "GitHub rate limit exceeded",
            retryAfter: error.retryAfter,
          },
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

    if (error instanceof Error) {
      // OpenAI errors
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
