"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileTree, SelectionSummary } from "@/components/FileTree";

interface TreeNode {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

interface SelectFilesData {
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
}

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
}

const AVG_CHARS_PER_BYTE = 1;

function RepoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("url") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SelectFilesData | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    isLimited: false,
    retryAfter: 0,
  });

  // Countdown timer for rate limit
  useEffect(() => {
    if (!rateLimit.isLimited || rateLimit.retryAfter <= 0) return;

    const timer = setInterval(() => {
      setRateLimit((prev) => {
        const newRetryAfter = prev.retryAfter - 1;
        if (newRetryAfter <= 0) {
          return { isLimited: false, retryAfter: 0 };
        }
        return { ...prev, retryAfter: newRetryAfter };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimit.isLimited, rateLimit.retryAfter]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  // Fetch file selection data
  useEffect(() => {
    if (!repoUrl) {
      setError("No repository URL provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/select-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl }),
        });

        const result = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            const retryAfter = result.retryAfter || 60;
            setRateLimit({ isLimited: true, retryAfter });
            setError(null);
            setLoading(false);
            return;
          }
          throw new Error(result.error || "Failed to fetch repository data");
        }

        if (result.success && result.data) {
          setData(result.data);
          // Initialize selection with preselected paths
          setSelectedPaths(new Set(result.data.preselected.paths));
        } else {
          throw new Error(result.error || "Invalid response");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [repoUrl]);

  // Toggle a file selection
  const toggleSelection = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Quick actions
  const selectAll = useCallback(() => {
    if (!data) return;
    const allPaths = data.tree.filter((n) => n.type === "blob").map((n) => n.path);
    setSelectedPaths(new Set(allPaths));
  }, [data]);

  const clearAll = useCallback(() => {
    setSelectedPaths(new Set());
  }, []);

  const resetToHeuristics = useCallback(() => {
    if (!data) return;
    setSelectedPaths(new Set(data.preselected.paths));
  }, [data]);

  // Calculate estimated chars for selected files
  const estimatedChars = useMemo(() => {
    if (!data) return 0;
    let total = 0;
    for (const path of selectedPaths) {
      const node = data.tree.find((n) => n.path === path);
      if (node?.size) {
        total += node.size * AVG_CHARS_PER_BYTE;
      }
    }
    return total;
  }, [data, selectedPaths]);

  // Run analysis
  const runAnalysis = async () => {
    if (!data || selectedPaths.size === 0) return;

    setAnalyzing(true);
    setAnalysisProgress("Preparing analysis...");
    setError(null);

    try {
      setAnalysisProgress("Fetching file contents...");

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          selectedPaths: Array.from(selectedPaths),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = result.retryAfter || 60;
          setRateLimit({ isLimited: true, retryAfter });
          setAnalyzing(false);
          setAnalysisProgress(null);
          return;
        }
        throw new Error(result.error || "Analysis failed");
      }

      setAnalysisProgress("Analysis complete! Redirecting...");

      if (result.assessmentId) {
        router.push(`/report/${result.assessmentId}`);
      } else {
        throw new Error("No assessment ID returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center gap-3">
              <svg
                className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-gray-600 dark:text-gray-400">
                Loading repository files...
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Error Loading Repository
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Select Files to Analyze
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            <span className="font-medium">{data.owner}/{data.repo}</span>
            <span className="mx-2">&middot;</span>
            <span className="font-mono text-sm">{data.sha.slice(0, 7)}</span>
            <span className="mx-2">&middot;</span>
            <span>{data.defaultBranch}</span>
          </p>
          {data.detected_stack.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.detected_stack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Truncation Warning */}
        {data.truncated && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Large Repository
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  The file tree was truncated by GitHub. Some files may not be visible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {data.warnings.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              {data.warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-400">*</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rate Limit Warning */}
        {rateLimit.isLimited && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Rate Limit Reached
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  Please wait{" "}
                  <span className="font-mono font-bold">
                    {formatTime(rateLimit.retryAfter)}
                  </span>{" "}
                  before trying again
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          {/* Search/Filter */}
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Filter files..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={resetToHeuristics}
              className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
            >
              Reset to Suggested
            </button>
          </div>

          {/* File Tree */}
          <FileTree
            files={data.tree}
            selected={selectedPaths}
            preselected={data.preselected.paths}
            reasons={data.preselected.reasons}
            filter={filter}
            onToggle={toggleSelection}
          />
        </div>

        {/* Selection Summary */}
        <div className="mb-6">
          <SelectionSummary
            count={selectedPaths.size}
            estimatedChars={estimatedChars}
            caps={data.estimates.caps}
          />
        </div>

        {/* Analysis Progress */}
        {analysisProgress && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                {analysisProgress}
              </p>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={runAnalysis}
          disabled={selectedPaths.size === 0 || analyzing || rateLimit.isLimited}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {analyzing
            ? "Analyzing..."
            : rateLimit.isLimited
              ? `Wait ${formatTime(rateLimit.retryAfter)}`
              : `Analyze ${selectedPaths.size} Files`}
        </button>
      </div>
    </main>
  );
}

export default function RepoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-center gap-3">
                <svg
                  className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">Loading...</span>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <RepoPageContent />
    </Suspense>
  );
}
