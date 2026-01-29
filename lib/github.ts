const GITHUB_API = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "repo-rubric",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
}

export interface RepoMetadata {
  defaultBranch: string;
  description: string | null;
}

export interface TreeNode {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/**
 * Parse a GitHub URL into owner and repo
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/blob/branch/path
 * - github.com/owner/repo
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  // Remove trailing slashes and .git suffix
  let cleanUrl = url.trim().replace(/\/+$/, "").replace(/\.git$/, "");

  // Add protocol if missing
  if (!cleanUrl.startsWith("http")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const parsed = new URL(cleanUrl);

    if (!parsed.hostname.includes("github.com")) {
      throw new Error("Not a GitHub URL");
    }

    // Split path: /owner/repo/...
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      throw new Error("URL must include owner and repository name");
    }

    const owner = parts[0];
    const repo = parts[1];

    // Validate owner and repo names
    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
      throw new Error("Invalid owner or repository name");
    }

    return { owner, repo };
  } catch (error) {
    if (error instanceof Error && error.message !== "Not a GitHub URL") {
      throw new Error(`Invalid GitHub URL: ${error.message}`);
    }
    throw new Error("Invalid GitHub URL");
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
    throw new GitHubError("Rate limit exceeded", 429, retryAfter);
  }

  if (response.status === 403) {
    const remaining = response.headers.get("X-RateLimit-Remaining");
    if (remaining === "0") {
      const resetTime = response.headers.get("X-RateLimit-Reset");
      const retryAfter = resetTime
        ? Math.ceil((parseInt(resetTime, 10) * 1000 - Date.now()) / 1000)
        : 60;
      throw new GitHubError("Rate limit exceeded", 429, retryAfter);
    }
    throw new GitHubError("Access forbidden. Repository may be private.", 403);
  }

  if (response.status === 404) {
    throw new GitHubError("Repository not found", 404);
  }

  if (!response.ok) {
    throw new GitHubError(`GitHub API error: ${response.statusText}`, response.status);
  }

  return response.json();
}

/**
 * Get repository metadata including default branch
 */
export async function getRepoMetadata(
  owner: string,
  repo: string
): Promise<RepoMetadata> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: getHeaders(),
  });

  const data = await handleResponse<{
    default_branch: string;
    description: string | null;
  }>(response);

  return {
    defaultBranch: data.default_branch,
    description: data.description,
  };
}

/**
 * Get the latest commit SHA for a branch
 */
export async function getLatestCommit(
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits/${branch}`,
    {
      headers: getHeaders(),
    }
  );

  const data = await handleResponse<{ sha: string }>(response);
  return data.sha;
}

/**
 * Get the full file tree for a commit
 */
export async function getTree(
  owner: string,
  repo: string,
  sha: string
): Promise<TreeNode[]> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    {
      headers: getHeaders(),
    }
  );

  const data = await handleResponse<{
    tree: Array<{
      path: string;
      type: string;
      sha: string;
      size?: number;
    }>;
    truncated: boolean;
  }>(response);

  if (data.truncated) {
    console.warn("Warning: Tree was truncated due to size limits");
  }

  return data.tree
    .filter((item) => item.type === "blob" || item.type === "tree")
    .map((item) => ({
      path: item.path,
      type: item.type as "blob" | "tree",
      sha: item.sha,
      size: item.size,
    }));
}

/**
 * Get file content from a repository
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  sha: string
): Promise<{ content: string; size: number }> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${sha}`,
    {
      headers: getHeaders(),
    }
  );

  const data = await handleResponse<{
    content: string;
    encoding: string;
    size: number;
  }>(response);

  if (data.encoding !== "base64") {
    throw new Error(`Unexpected encoding: ${data.encoding}`);
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, size: data.size };
}
