"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CompareScoreCard } from "@/components/CompareScoreCard";
import { ClassificationDelta } from "@/components/ClassificationDelta";
import { DeltaIndicator } from "@/components/DeltaIndicator";

interface Assessment {
  id: string;
  repoUrl: string;
  owner: string;
  name: string;
  defaultBranch: string;
  commitSha: string;
  createdAt: string;
  rubric: {
    classification: string;
    scores: {
      variability: number;
      strategic_importance: number;
      operational_impact: number;
      integration_readiness: number;
      blast_radius_risk: number;
      confidence: number;
    };
    tasks: Array<{
      id: string;
      name: string;
      recommendation: string;
    }>;
    outcomes: {
      kpis: {
        efficiency: string[];
        quality: string[];
        business_impact: string[];
        risk_compliance: string[];
      };
    };
  };
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const idA = searchParams.get("a");
  const idB = searchParams.get("b");

  const [assessmentA, setAssessmentA] = useState<Assessment | null>(null);
  const [assessmentB, setAssessmentB] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idA || !idB) {
      setError("Missing assessment IDs. Use ?a=<id>&b=<id>");
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/assessments/${idA}`).then((res) => res.json()),
      fetch(`/api/assessments/${idB}`).then((res) => res.json()),
    ])
      .then(([dataA, dataB]) => {
        if (dataA.error) throw new Error(`Assessment A: ${dataA.error}`);
        if (dataB.error) throw new Error(`Assessment B: ${dataB.error}`);
        setAssessmentA(dataA);
        setAssessmentB(dataB);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [idA, idB]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-16">
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
              Loading assessments...
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
          <a
            href="/"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
            &larr; Back to Home
          </a>
        </div>
      </main>
    );
  }

  if (!assessmentA || !assessmentB) {
    return null;
  }

  const rubricA = assessmentA.rubric;
  const rubricB = assessmentB.rubric;

  // Calculate task count differences
  const taskCountA = rubricA.tasks.length;
  const taskCountB = rubricB.tasks.length;
  const taskCountDelta = taskCountB - taskCountA;

  // Identify recommendation changes
  const taskMapA = new Map(rubricA.tasks.map((t) => [t.id, t.recommendation]));
  const changedRecommendations = rubricB.tasks.filter((t) => {
    const prevRec = taskMapA.get(t.id);
    return prevRec && prevRec !== t.recommendation;
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <a
            href="/"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            &larr; Back to Home
          </a>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Assessment Comparison
          </h1>

          {/* Two-column header */}
          <div className="grid grid-cols-2 gap-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Assessment A
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {assessmentA.owner}/{assessmentA.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {assessmentA.commitSha.slice(0, 7)} &middot;{" "}
                {new Date(assessmentA.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Assessment B
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {assessmentB.owner}/{assessmentB.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {assessmentB.commitSha.slice(0, 7)} &middot;{" "}
                {new Date(assessmentB.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Classification Delta */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Classification
          </h2>
          <ClassificationDelta
            classificationA={rubricA.classification}
            classificationB={rubricB.classification}
          />
        </section>

        {/* Scores Grid */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Score Comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompareScoreCard
              label="Variability"
              scoreA={rubricA.scores.variability}
              scoreB={rubricB.scores.variability}
            />
            <CompareScoreCard
              label="Strategic Importance"
              scoreA={rubricA.scores.strategic_importance}
              scoreB={rubricB.scores.strategic_importance}
            />
            <CompareScoreCard
              label="Operational Impact"
              scoreA={rubricA.scores.operational_impact}
              scoreB={rubricB.scores.operational_impact}
            />
            <CompareScoreCard
              label="Integration Readiness"
              scoreA={rubricA.scores.integration_readiness}
              scoreB={rubricB.scores.integration_readiness}
            />
            <CompareScoreCard
              label="Blast Radius Risk"
              scoreA={rubricA.scores.blast_radius_risk}
              scoreB={rubricB.scores.blast_radius_risk}
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Confidence
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      A
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {Math.round(rubricA.scores.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${rubricA.scores.confidence * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0 px-2">
                  <DeltaIndicator
                    value={Math.round(
                      (rubricB.scores.confidence - rubricA.scores.confidence) *
                        100
                    )}
                    size="sm"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      B
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {Math.round(rubricB.scores.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${rubricB.scores.confidence * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tasks Summary */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tasks Summary
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Task Count
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {taskCountA}
                </span>
                <DeltaIndicator value={taskCountDelta} />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {taskCountB}
                </span>
              </div>
            </div>
            {changedRecommendations.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Recommendation Changes
                </div>
                <div className="space-y-2">
                  {changedRecommendations.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="font-medium">{task.name}</span>:{" "}
                      <span className="text-gray-500">
                        {taskMapA.get(task.id)}
                      </span>{" "}
                      &rarr;{" "}
                      <span className="text-blue-600 dark:text-blue-400">
                        {task.recommendation}
                      </span>
                    </div>
                  ))}
                  {changedRecommendations.length > 3 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      +{changedRecommendations.length - 3} more changes
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* KPIs Comparison */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            KPIs Comparison
          </h2>
          <div className="grid grid-cols-2 gap-8">
            {/* Assessment A KPIs */}
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                Assessment A
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    Efficiency
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {rubricA.outcomes.kpis.efficiency.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500">-</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Quality
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {rubricA.outcomes.kpis.quality.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500">-</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                    Business Impact
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {rubricA.outcomes.kpis.business_impact.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-500">-</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                    Risk & Compliance
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {rubricA.outcomes.kpis.risk_compliance.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-orange-500">-</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Assessment B KPIs */}
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                Assessment B
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    Efficiency
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {rubricB.outcomes.kpis.efficiency.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500">-</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Quality
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {rubricB.outcomes.kpis.quality.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500">-</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                    Business Impact
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {rubricB.outcomes.kpis.business_impact.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-500">-</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                    Risk & Compliance
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {rubricB.outcomes.kpis.risk_compliance.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-orange-500">-</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Links to Individual Reports */}
        <section className="flex justify-center gap-4">
          <a
            href={`/report/${assessmentA.id}`}
            className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Assessment A Full Report &rarr;
          </a>
          <a
            href={`/report/${assessmentB.id}`}
            className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Assessment B Full Report &rarr;
          </a>
        </section>
      </div>
    </main>
  );
}
