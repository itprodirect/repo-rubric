"use client";

import { useState, useEffect, useRef } from "react";

const CLASSIFICATION_COLORS: Record<string, string> = {
  A_NOT_AGENTIC: "bg-gray-500",
  B_LLM_ASSIST: "bg-blue-500",
  C_TASK_AGENTS: "bg-purple-500",
  D_AGENT_ORCHESTRATION: "bg-green-500",
};

interface Assessment {
  id: string;
  owner: string;
  name: string;
  commitSha: string;
  createdAt: string;
  classification: string;
}

interface AssessmentPickerProps {
  excludeId?: string;
  onSelect: (id: string) => void;
}

export function AssessmentPicker({ excludeId, onSelect }: AssessmentPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && assessments.length === 0) {
      setLoading(true);
      fetch("/api/assessments?limit=20")
        .then((res) => res.json())
        .then((data) => {
          if (data.assessments) {
            setAssessments(
              data.assessments.filter(
                (a: Assessment) => a.id !== excludeId
              )
            );
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, excludeId, assessments.length]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Compare with...
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="animate-spin h-5 w-5 mx-auto mb-2"
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
              Loading assessments...
            </div>
          ) : assessments.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No other assessments available
            </div>
          ) : (
            <ul>
              {assessments.map((assessment) => (
                <li key={assessment.id}>
                  <button
                    onClick={() => {
                      onSelect(assessment.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div
                      className={`w-6 h-6 rounded-full ${
                        CLASSIFICATION_COLORS[assessment.classification] ||
                        "bg-gray-500"
                      } flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                    >
                      {assessment.classification?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {assessment.owner}/{assessment.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {assessment.commitSha} &middot;{" "}
                        {new Date(assessment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
