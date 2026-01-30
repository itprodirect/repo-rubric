import { NextRequest, NextResponse } from "next/server";
import {
  parseGitHubUrl,
  getRepoMetadata,
  getLatestCommit,
  getTree,
  GitHubError,
  TreeNode,
} from "@/lib/github";
import { selectFiles, SelectionResult, SelectedFile } from "@/lib/heuristics";

const DEFAULT_MAX_FILES = 25;
const DEFAULT_MAX_TOTAL_CHARS = 250_000;
const MAX_PER_FILE_CHARS = 50_000;
const AVG_CHARS_PER_BYTE = 1;

interface SelectFilesRequest {
  repoUrl: string;
}

interface SelectFilesResponse {
  success: true;
  data: {
    owner: string;
    repo: string;
    sha: string;
    defaultBranch: string;
    tree: TreeNode[];
    truncated: boolean;
    preselected: {
      paths: string[];
      reasons: Record<string, string>;
    };
    estimates: {
      totalFiles: number;
      totalChars: number;
      overCaps: boolean;
      caps: {
        maxFiles: number;
        maxChars: number;
        maxPerFile: number;
      };
    };
    detected_stack: string[];
    warnings: string[];
  };
}

interface SelectFilesErrorResponse {
  success: false;
  error: string;
  retryAfter?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SelectFilesRequest;
    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { success: false, error: "repoUrl is required" } as SelectFilesErrorResponse,
        { status: 400 }
      );
    }

    // Step 1: Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(repoUrl);

    // Step 2: Get repo metadata
    const metadata = await getRepoMetadata(owner, repo);

    // Step 3: Get latest commit SHA
    const commitSha = await getLatestCommit(owner, repo, metadata.defaultBranch);

    // Step 4: Get file tree
    const treeResult = await getTree(owner, repo, commitSha);

    // Step 5: Run file selection heuristics
    const selection: SelectionResult = selectFiles(treeResult.tree);

    // Build preselected paths and reasons
    const preselectedPaths = selection.selected.map((s: SelectedFile) => s.path);
    const reasons: Record<string, string> = {};
    for (const file of selection.selected) {
      reasons[file.path] = `Tier ${file.tier}: ${file.reason}`;
    }

    // Calculate estimates
    const totalFiles = selection.stats.selected_count;
    const totalChars = selection.stats.estimated_chars;
    const overCaps = totalFiles > DEFAULT_MAX_FILES || totalChars > DEFAULT_MAX_TOTAL_CHARS;

    const response: SelectFilesResponse = {
      success: true,
      data: {
        owner,
        repo,
        sha: commitSha,
        defaultBranch: metadata.defaultBranch,
        tree: treeResult.tree,
        truncated: treeResult.truncated,
        preselected: {
          paths: preselectedPaths,
          reasons,
        },
        estimates: {
          totalFiles,
          totalChars,
          overCaps,
          caps: {
            maxFiles: DEFAULT_MAX_FILES,
            maxChars: DEFAULT_MAX_TOTAL_CHARS,
            maxPerFile: MAX_PER_FILE_CHARS,
          },
        },
        detected_stack: selection.detected_stack,
        warnings: selection.warnings,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Select files error:", error);

    if (error instanceof GitHubError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: "GitHub rate limit exceeded",
            retryAfter: error.retryAfter,
          } as SelectFilesErrorResponse,
          {
            status: 429,
            headers: {
              "Retry-After": String(error.retryAfter || 60),
            },
          }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message } as SelectFilesErrorResponse,
        { status: error.status }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message } as SelectFilesErrorResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to select files" } as SelectFilesErrorResponse,
      { status: 500 }
    );
  }
}
