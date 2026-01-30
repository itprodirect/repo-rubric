import { createHash } from "crypto";

export interface Chunk {
  path: string;
  sha: string;
  lineStart: number;
  lineEnd: number;
  content: string;
  citationId: string;
}

export interface ChunkResult {
  chunks: Chunk[];
  totalLines: number;
  truncated: boolean;
}

interface ChunkOptions {
  maxLinesPerChunk?: number;
  maxSingleFileChars?: number;
}

const DEFAULT_MAX_LINES_PER_CHUNK = 300;
const DEFAULT_MAX_SINGLE_FILE_CHARS = 40_000;

/**
 * Generate a deterministic citation ID
 */
function generateCitationId(path: string, sha: string, lineStart: number, lineEnd: number): string {
  const input = `${path}:${sha}:${lineStart}:${lineEnd}`;
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 8);
  return `CIT-${hash}`;
}

/**
 * Generate GitHub URL for a citation
 */
export function getCitationUrl(
  owner: string,
  repo: string,
  sha: string,
  path: string,
  lineStart: number,
  lineEnd: number
): string {
  return `https://github.com/${owner}/${repo}/blob/${sha}/${path}#L${lineStart}-L${lineEnd}`;
}

/**
 * Chunk a file's content into smaller pieces with line tracking
 */
export function chunkFile(
  content: string,
  path: string,
  sha: string,
  options: ChunkOptions = {}
): ChunkResult {
  const maxLines = options.maxLinesPerChunk ?? DEFAULT_MAX_LINES_PER_CHUNK;
  const maxChars = options.maxSingleFileChars ?? DEFAULT_MAX_SINGLE_FILE_CHARS;

  const lines = content.split("\n");
  const totalLines = lines.length;
  const chunks: Chunk[] = [];

  let truncated = false;
  let currentChars = 0;

  // If content is small enough, return as single chunk
  if (content.length <= maxChars && lines.length <= maxLines) {
    const chunk: Chunk = {
      path,
      sha,
      lineStart: 1,
      lineEnd: totalLines,
      content,
      citationId: generateCitationId(path, sha, 1, totalLines),
    };
    return { chunks: [chunk], totalLines, truncated: false };
  }

  // Split into chunks
  let lineStart = 1;

  while (lineStart <= totalLines) {
    // Determine chunk end
    let lineEnd = Math.min(lineStart + maxLines - 1, totalLines);

    // Get chunk content
    const chunkLines = lines.slice(lineStart - 1, lineEnd);
    let chunkContent = chunkLines.join("\n");

    // Check if we've exceeded total chars limit
    if (currentChars + chunkContent.length > maxChars) {
      // Truncate this chunk to fit
      const remainingChars = maxChars - currentChars;
      if (remainingChars <= 0) {
        truncated = true;
        break;
      }

      chunkContent = chunkContent.slice(0, remainingChars);
      // Adjust lineEnd based on actual content
      const actualLines = chunkContent.split("\n").length;
      lineEnd = lineStart + actualLines - 1;
      truncated = true;
    }

    const chunk: Chunk = {
      path,
      sha,
      lineStart,
      lineEnd,
      content: chunkContent,
      citationId: generateCitationId(path, sha, lineStart, lineEnd),
    };

    chunks.push(chunk);
    currentChars += chunkContent.length;

    if (truncated) break;

    lineStart = lineEnd + 1;
  }

  return { chunks, totalLines, truncated };
}

export interface FileDigest {
  path: string;
  sha: string;
  size: number;
  lineCount: number;
  chunks: number;
}

export interface FetchResult {
  chunks: Chunk[];
  digests: FileDigest[];
  warnings: string[];
  stats: {
    totalFiles: number;
    totalChunks: number;
    totalChars: number;
    truncatedFiles: number;
  };
}

interface FetchOptions {
  maxTotalChars?: number;
  maxSingleFileChars?: number;
  maxLinesPerChunk?: number;
}

const DEFAULT_FETCH_MAX_CHARS = 250_000;

/**
 * Fetch and chunk multiple files
 * Returns combined chunks with tracking info
 */
export async function fetchAndChunkFiles(
  files: Array<{ path: string; size: number }>,
  fetchContent: (path: string) => Promise<{ content: string; size: number }>,
  sha: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const maxTotalChars = options.maxTotalChars ?? DEFAULT_FETCH_MAX_CHARS;
  const maxSingleFileChars = options.maxSingleFileChars ?? DEFAULT_MAX_SINGLE_FILE_CHARS;
  const maxLinesPerChunk = options.maxLinesPerChunk ?? DEFAULT_MAX_LINES_PER_CHUNK;

  const allChunks: Chunk[] = [];
  const digests: FileDigest[] = [];
  const warnings: string[] = [];

  let totalChars = 0;
  let truncatedFiles = 0;

  for (const file of files) {
    // Check if we've hit the total limit
    if (totalChars >= maxTotalChars) {
      warnings.push(`Stopped fetching at ${digests.length} files due to character limit`);
      break;
    }

    try {
      const { content } = await fetchContent(file.path);

      // Chunk the file
      const result = chunkFile(content, file.path, sha, {
        maxLinesPerChunk,
        maxSingleFileChars: Math.min(maxSingleFileChars, maxTotalChars - totalChars),
      });

      if (result.truncated) {
        truncatedFiles++;
        warnings.push(`File truncated: ${file.path}`);
      }

      allChunks.push(...result.chunks);

      const fileChars = result.chunks.reduce((sum, c) => sum + c.content.length, 0);
      totalChars += fileChars;

      digests.push({
        path: file.path,
        sha,
        size: file.size,
        lineCount: result.totalLines,
        chunks: result.chunks.length,
      });
    } catch (error) {
      warnings.push(`Failed to fetch: ${file.path} - ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return {
    chunks: allChunks,
    digests,
    warnings,
    stats: {
      totalFiles: digests.length,
      totalChunks: allChunks.length,
      totalChars,
      truncatedFiles,
    },
  };
}
