import { TreeNode } from "./github";

// Ignore directories
const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".venv",
  "__pycache__",
  "coverage",
  "vendor",
  "logs",
  "tmp",
  ".git",
  ".cache",
  ".turbo",
]);

// Ignore file extensions (binaries)
const IGNORE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".pt", ".onnx", ".bin", ".pkl", ".h5",
  ".exe", ".dmg", ".app", ".msi",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp3", ".mp4", ".wav", ".avi", ".mov",
  ".sqlite", ".db",
  ".lock", // lockfiles are large and low-signal
]);

// Include extensions (text files)
const INCLUDE_EXTENSIONS = new Set([
  // Documentation
  ".md", ".txt", ".rst",
  // Config
  ".json", ".yml", ".yaml", ".toml", ".ini",
  // JavaScript/TypeScript
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  // Python
  ".py", ".pyi",
  // Other languages
  ".go", ".rs", ".java", ".kt", ".cs", ".rb", ".php",
  // Infrastructure
  ".sh", ".ps1", ".sql", ".tf", ".hcl",
  // Web
  ".html", ".css", ".scss",
  // Special
  ".prisma", ".graphql", ".proto",
]);

// Tier 0: Always include (weight: 100)
const TIER_0_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /^README\.md$/i, reason: "Primary project description" },
  { pattern: /^README\..+$/i, reason: "Project description" },
  { pattern: /^docs\/README\.md$/i, reason: "Documentation overview" },
  { pattern: /^docs\/overview\.md$/i, reason: "Architecture documentation" },
  { pattern: /^LICENSE(\..*)?$/i, reason: "Licensing" },
  { pattern: /^SECURITY\.md$/i, reason: "Security practices" },
  { pattern: /^CONTRIBUTING\.md$/i, reason: "Contribution guidelines" },
  { pattern: /^CODEOWNERS$/i, reason: "Ownership structure" },
  { pattern: /^\.github\/workflows\/.+\.ya?ml$/i, reason: "CI/CD pipeline" },
  { pattern: /^Dockerfile$/i, reason: "Container config" },
  { pattern: /^docker-compose\.ya?ml$/i, reason: "Container orchestration" },
];

// Tier 1: Runtime & Dependencies (weight: 80)
const TIER_1_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Node.js
  { pattern: /^package\.json$/, reason: "Dependencies and scripts" },
  { pattern: /^next\.config\.(js|mjs|ts)$/, reason: "Next.js configuration" },
  { pattern: /^tsconfig\.json$/, reason: "TypeScript config" },
  { pattern: /^app\/layout\.tsx$/, reason: "Next.js App Router root" },
  { pattern: /^app\/page\.tsx$/, reason: "Next.js homepage" },
  { pattern: /^pages\/_app\.tsx$/, reason: "Next.js Pages Router" },
  { pattern: /^pages\/index\.tsx$/, reason: "Next.js Pages Router homepage" },
  { pattern: /^src\/index\.(ts|js)$/, reason: "Entry point" },
  { pattern: /^src\/server\.(ts|js)$/, reason: "Server entry point" },
  { pattern: /^server\.(ts|js)$/, reason: "Server entry point" },
  // Python
  { pattern: /^pyproject\.toml$/, reason: "Python project config" },
  { pattern: /^requirements\.txt$/, reason: "Python dependencies" },
  { pattern: /^Pipfile$/, reason: "Pipenv config" },
  { pattern: /^setup\.py$/, reason: "Python package config" },
  { pattern: /^setup\.cfg$/, reason: "Python package config" },
  { pattern: /^main\.py$/, reason: "Python entry point" },
  { pattern: /^app\.py$/, reason: "Python entry point" },
  // Infrastructure
  { pattern: /^terraform\/[^/]+\.tf$/, reason: "Terraform config" },
  { pattern: /^serverless\.(yml|ts)$/, reason: "Serverless config" },
  { pattern: /^cdk\.json$/, reason: "AWS CDK config" },
  // Database
  { pattern: /^prisma\/schema\.prisma$/, reason: "Database schema" },
];

// Tier 2: Architecture & Workflows (weight: 50)
const TIER_2_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /^docs\/[^/]+\.md$/, reason: "Documentation" },
  { pattern: /^docs\/adr\/[^/]+\.md$/, reason: "Architecture decision" },
  { pattern: /^docs\/decisions\/[^/]+\.md$/, reason: "Architecture decision" },
  { pattern: /^openapi\.ya?ml$/, reason: "API specification" },
  { pattern: /^swagger\.json$/, reason: "API specification" },
  { pattern: /^\.env\.example$/, reason: "Environment variables" },
  { pattern: /^config\/[^/]+\.(yml|json)$/, reason: "Configuration" },
  { pattern: /^src\/.*routes.*\.(ts|js)$/i, reason: "Route definitions" },
  { pattern: /^src\/.*controllers.*\.(ts|js)$/i, reason: "Controller logic" },
  { pattern: /^src\/.*services.*\.(ts|js)$/i, reason: "Service layer" },
  { pattern: /^app\/api\/.*\/route\.(ts|js)$/, reason: "API route" },
  { pattern: /^lib\/[^/]+\.(ts|js)$/, reason: "Library code" },
];

// Tier 3: Testing (weight: 30)
const TIER_3_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /^jest\.config\.(js|ts|mjs)$/, reason: "Test configuration" },
  { pattern: /^vitest\.config\.(js|ts|mjs)$/, reason: "Test configuration" },
  { pattern: /^pytest\.ini$/, reason: "Python test configuration" },
  { pattern: /^playwright\.config\.(js|ts)$/, reason: "E2E test configuration" },
  { pattern: /\.test\.(ts|tsx|js|jsx)$/, reason: "Test file" },
  { pattern: /\.spec\.(ts|tsx|js|jsx)$/, reason: "Test file" },
  { pattern: /_test\.py$/, reason: "Python test file" },
  { pattern: /test_.*\.py$/, reason: "Python test file" },
];

export interface SelectedFile {
  path: string;
  weight: number;
  tier: 0 | 1 | 2 | 3 | 4;
  size: number;
  reason: string;
}

export interface SelectionResult {
  selected: SelectedFile[];
  detected_stack: string[];
  truncated: boolean;
  warnings: string[];
  stats: {
    total_candidates: number;
    selected_count: number;
    estimated_chars: number;
  };
}

interface SelectionOptions {
  maxFiles?: number;
  maxTotalChars?: number;
}

const DEFAULT_MAX_FILES = 25;
const DEFAULT_MAX_TOTAL_CHARS = 250_000;
const AVG_CHARS_PER_BYTE = 1; // Rough estimate for text files

function getExtension(path: string): string {
  const match = path.match(/\.[^./]+$/);
  return match ? match[0].toLowerCase() : "";
}

function getDepth(path: string): number {
  return path.split("/").length - 1;
}

function isInIgnoredDir(path: string): boolean {
  const parts = path.split("/");
  return parts.some((part) => IGNORE_DIRS.has(part));
}

function shouldIncludeFile(node: TreeNode): boolean {
  if (node.type !== "blob") return false;
  if (isInIgnoredDir(node.path)) return false;

  const ext = getExtension(node.path);

  // Explicitly ignored extensions
  if (IGNORE_EXTENSIONS.has(ext)) return false;

  // Check if it's a known text extension
  if (INCLUDE_EXTENSIONS.has(ext)) return true;

  // Special files without extensions
  const filename = node.path.split("/").pop() || "";
  if (["Dockerfile", "Makefile", "Procfile", "CODEOWNERS", "LICENSE"].includes(filename)) {
    return true;
  }

  // Default: exclude unknown extensions
  return false;
}

function getTierAndWeight(path: string): { tier: 0 | 1 | 2 | 3 | 4; weight: number; reason: string } {
  // Check Tier 0
  for (const { pattern, reason } of TIER_0_PATTERNS) {
    if (pattern.test(path)) {
      return { tier: 0, weight: 100, reason };
    }
  }

  // Check Tier 1
  for (const { pattern, reason } of TIER_1_PATTERNS) {
    if (pattern.test(path)) {
      return { tier: 1, weight: 80, reason };
    }
  }

  // Check Tier 2
  for (const { pattern, reason } of TIER_2_PATTERNS) {
    if (pattern.test(path)) {
      return { tier: 2, weight: 50, reason };
    }
  }

  // Check Tier 3
  for (const { pattern, reason } of TIER_3_PATTERNS) {
    if (pattern.test(path)) {
      return { tier: 3, weight: 30, reason };
    }
  }

  // Tier 4: Everything else
  return { tier: 4, weight: 10, reason: "General code" };
}

export function detectStack(tree: TreeNode[]): string[] {
  const pathsArray = tree.map((n) => n.path);
  const pathsSet = new Set(pathsArray);
  const detected: string[] = [];

  // Next.js
  if (
    pathsArray.some((p) => /^next\.config\.(js|mjs|ts)$/.test(p)) ||
    pathsSet.has("app/layout.tsx") ||
    pathsSet.has("pages/_app.tsx")
  ) {
    detected.push("next.js");
  }

  // React (if not Next.js)
  if (!detected.includes("next.js") && pathsSet.has("package.json")) {
    detected.push("react"); // Will verify with package.json content later
  }

  // Python frameworks
  if (pathsSet.has("requirements.txt") || pathsSet.has("pyproject.toml")) {
    if (pathsArray.some((p) => p === "manage.py" || p.endsWith("/manage.py"))) {
      detected.push("django");
    }
    // FastAPI/Flask detection would need file content
    detected.push("python");
  }

  // Docker
  if (pathsSet.has("Dockerfile") || pathsSet.has("docker-compose.yml") || pathsSet.has("docker-compose.yaml")) {
    detected.push("docker");
  }

  // Terraform
  if (pathsArray.some((p) => p.endsWith(".tf"))) {
    detected.push("terraform");
  }

  // TypeScript
  if (pathsSet.has("tsconfig.json")) {
    detected.push("typescript");
  }

  // Prisma
  if (pathsSet.has("prisma/schema.prisma")) {
    detected.push("prisma");
  }

  return detected;
}

export function selectFiles(
  tree: TreeNode[],
  options: SelectionOptions = {}
): SelectionResult {
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxTotalChars = options.maxTotalChars ?? DEFAULT_MAX_TOTAL_CHARS;

  const warnings: string[] = [];

  // Filter to candidate files
  const candidates = tree.filter(shouldIncludeFile);
  const totalCandidates = candidates.length;

  if (totalCandidates === 0) {
    warnings.push("No candidate files found in repository");
    return {
      selected: [],
      detected_stack: detectStack(tree),
      truncated: false,
      warnings,
      stats: {
        total_candidates: 0,
        selected_count: 0,
        estimated_chars: 0,
      },
    };
  }

  if (totalCandidates < 5) {
    warnings.push("Very few files found - assessment confidence may be low");
  }

  // Check for README
  const hasReadme = candidates.some((c) => /^README\.md$/i.test(c.path));
  if (!hasReadme) {
    warnings.push("No README.md found");
  }

  // Assign weights and tiers
  const weighted: SelectedFile[] = candidates.map((node) => {
    const { tier, weight, reason } = getTierAndWeight(node.path);
    return {
      path: node.path,
      weight,
      tier,
      size: node.size ?? 0,
      reason,
    };
  });

  // Sort by: weight desc, depth asc, size asc, alphabetical
  weighted.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    const depthA = getDepth(a.path);
    const depthB = getDepth(b.path);
    if (depthA !== depthB) return depthA - depthB;
    if (a.size !== b.size) return a.size - b.size;
    return a.path.localeCompare(b.path);
  });

  // Apply caps
  const selected: SelectedFile[] = [];
  let totalChars = 0;
  let truncated = false;

  // Limit test files to 3
  let testFileCount = 0;
  const MAX_TEST_FILES = 3;

  for (const file of weighted) {
    // Check file count cap
    if (selected.length >= maxFiles) {
      truncated = true;
      break;
    }

    // Estimate chars
    const estimatedChars = file.size * AVG_CHARS_PER_BYTE;

    // Check total chars cap
    if (totalChars + estimatedChars > maxTotalChars) {
      truncated = true;
      continue; // Try smaller files
    }

    // Limit test files
    if (file.tier === 3) {
      if (testFileCount >= MAX_TEST_FILES) {
        continue;
      }
      testFileCount++;
    }

    selected.push(file);
    totalChars += estimatedChars;
  }

  if (truncated) {
    warnings.push("Selection truncated due to limits; consider adding specific files manually");
  }

  // Large repo warning
  if (tree.length > 1000) {
    warnings.push("Large repository (>1000 files); some files may be missed");
  }

  return {
    selected,
    detected_stack: detectStack(tree),
    truncated,
    warnings,
    stats: {
      total_candidates: totalCandidates,
      selected_count: selected.length,
      estimated_chars: totalChars,
    },
  };
}
