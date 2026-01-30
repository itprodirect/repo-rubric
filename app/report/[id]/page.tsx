import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClassificationBadge } from "@/components/ClassificationBadge";
import { ScoreCard, ConfidenceCard } from "@/components/ScoreCard";
import { TaskTable } from "@/components/TaskTable";
import { CitationList } from "@/components/CitationLink";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAssessment(id: string) {
  const assessment = await prisma.repoAssessment.findUnique({
    where: { id },
  });

  if (!assessment) return null;

  return {
    id: assessment.id,
    repoUrl: assessment.repoUrl,
    owner: assessment.owner,
    name: assessment.name,
    defaultBranch: assessment.defaultBranch,
    commitSha: assessment.commitSha,
    rubric: JSON.parse(assessment.rubricJson),
    createdAt: assessment.createdAt,
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const assessment = await getAssessment(id);

  if (!assessment) {
    notFound();
  }

  const { rubric } = assessment;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <a
                href="/"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
              >
                &larr; Back to Home
              </a>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {assessment.owner}/{assessment.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Commit: {assessment.commitSha.slice(0, 7)} &middot; Branch:{" "}
                {assessment.defaultBranch} &middot; Analyzed:{" "}
                {new Date(assessment.createdAt).toLocaleString()}
              </p>
            </div>
            <ClassificationBadge
              classification={rubric.classification}
              size="lg"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Scores Grid */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Assessment Scores
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ScoreCard
              label="Variability"
              score={rubric.scores.variability}
              description="Task input/output variance"
            />
            <ScoreCard
              label="Strategic Importance"
              score={rubric.scores.strategic_importance}
              description="Business value potential"
            />
            <ScoreCard
              label="Operational Impact"
              score={rubric.scores.operational_impact}
              description="Efficiency gains"
            />
            <ScoreCard
              label="Integration Readiness"
              score={rubric.scores.integration_readiness}
              description="Technical feasibility"
            />
            <ScoreCard
              label="Blast Radius Risk"
              score={rubric.scores.blast_radius_risk}
              description="Failure impact scope"
            />
            <ConfidenceCard confidence={rubric.scores.confidence} />
          </div>
        </section>

        {/* Outcomes */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Expected Outcomes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Enterprise Outcome
              </h3>
              <p className="text-gray-900 dark:text-white">
                {rubric.outcomes.enterprise_outcome}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Workflow Outcome
              </h3>
              <p className="text-gray-900 dark:text-white">
                {rubric.outcomes.workflow_outcome}
              </p>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Efficiency KPIs
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.outcomes.kpis.efficiency.map((kpi: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {kpi}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Quality KPIs
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.outcomes.kpis.quality.map((kpi: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    {kpi}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Business Impact
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.outcomes.kpis.business_impact.map((kpi: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    {kpi}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Risk & Compliance
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.outcomes.kpis.risk_compliance.map((kpi: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    {kpi}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Tasks */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Task Breakdown ({rubric.tasks.length} tasks)
          </h2>
          <TaskTable tasks={rubric.tasks} citations={rubric.citations} />
        </section>

        {/* Guardrails */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Guardrails
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                Strategic
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {rubric.guardrails.strategic.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                Operational
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {rubric.guardrails.operational.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                Implementation
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {rubric.guardrails.implementation.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pilot Plan */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pilot Plan
          </h2>
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Recommended First Task:</strong>{" "}
              {rubric.pilot.recommended_first_task_id}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Baseline Metrics
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.pilot.baseline.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Success Thresholds
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.pilot.success_thresholds.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Sandbox Plan
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.pilot.sandbox_plan.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Rollback Plan
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.pilot.rollback_plan.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Monitoring
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.pilot.monitoring.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Risks */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risks & Assumptions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                Key Risks
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.risks.key_risks.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                Unknowns
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.risks.unknowns.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Assumptions
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {rubric.risks.assumptions.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Citations */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Source Citations ({rubric.citations.length})
          </h2>
          <CitationList citations={rubric.citations} />
        </section>

        {/* Meta Info */}
        <section className="text-sm text-gray-500 dark:text-gray-400">
          <p>
            Analyzed {rubric.meta.analyzed_paths?.length || 0} files from{" "}
            <a
              href={assessment.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {assessment.repoUrl}
            </a>
          </p>
          {rubric.meta.detected_stack && rubric.meta.detected_stack.length > 0 && (
            <p className="mt-1">
              Detected stack: {rubric.meta.detected_stack.join(", ")}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
