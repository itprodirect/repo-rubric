"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Assessment {
  id: string;
  repoUrl: string;
  owner: string;
  name: string;
  commitSha: string;
  createdAt: string;
  classification: string;
}

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  A_NOT_AGENTIC: "bg-gray-500",
  B_LLM_ASSIST: "bg-blue-500",
  C_TASK_AGENTS: "bg-purple-500",
  D_AGENT_ORCHESTRATION: "bg-green-500",
};

export default function Home() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    isLimited: false,
    retryAfter: 0,
  });
  const [quickMode, setQuickMode] = useState(false);

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

  useEffect(() => {
    // Fetch recent assessments
    fetch("/api/assessments?limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (data.assessments) {
          setRecentAssessments(data.assessments);
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If not in quick mode, navigate to file picker
    if (!quickMode) {
      router.push(`/repo?url=${encodeURIComponent(repoUrl)}`);
      return;
    }

    // Quick mode: run analysis directly with heuristics
    setIsLoading(true);
    setProgress("Parsing repository URL...");

    try {
      setProgress("Fetching repository tree...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 60;
          setRateLimit({ isLimited: true, retryAfter });
          setError(null);
          setIsLoading(false);
          setProgress(null);
          return;
        }
        throw new Error(data.error || "Analysis failed");
      }

      setProgress("Analysis complete! Redirecting...");

      // Redirect to report page
      router.push(`/report/${data.assessmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            RepoRubric
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Agentic Workflow Assessment for GitHub Repositories
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="repoUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                GitHub Repository URL
              </label>
              <input
                type="url"
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                required
                disabled={isLoading}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={quickMode}
                onChange={(e) => setQuickMode(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Skip file selection (use auto-detect)
              </span>
            </label>

            {rateLimit.isLimited && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
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

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {progress && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
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
                    {progress}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || rateLimit.isLimited}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading
                ? "Analyzing..."
                : rateLimit.isLimited
                  ? `Wait ${formatTime(rateLimit.retryAfter)}`
                  : quickMode
                    ? "Quick Analyze"
                    : "Select Files & Analyze"}
            </button>
          </form>
        </div>

        {/* Recent Assessments */}
        {recentAssessments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Assessments
            </h2>
            <div className="space-y-3">
              {recentAssessments.map((assessment) => (
                <a
                  key={assessment.id}
                  href={`/report/${assessment.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${
                        CLASSIFICATION_COLORS[assessment.classification] ||
                        "bg-gray-500"
                      } flex items-center justify-center text-white text-sm font-bold`}
                    >
                      {assessment.classification?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {assessment.owner}/{assessment.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {assessment.commitSha} &middot;{" "}
                        {new Date(assessment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Analyzes public GitHub repositories to assess agentic AI workflow
            potential.
          </p>
          <p className="mt-1">
            Requires{" "}
            <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
              OPENAI_API_KEY
            </code>{" "}
            to be configured.
          </p>
        </div>
      </div>
    </main>
  );
}
