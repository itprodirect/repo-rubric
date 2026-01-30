import { CitationLink } from "./CitationLink";

interface TaskScores {
  variability: number;
  criticality: number;
  risk: number;
}

interface Task {
  task_id: string;
  name: string;
  current_actor: string;
  inputs: string[];
  outputs: string[];
  scores: TaskScores;
  recommendation: string;
  rationale: string;
  citations: string[];
}

interface Citation {
  id: string;
  path: string;
  commit_sha: string;
  line_start: number;
  line_end: number;
  url: string;
}

interface TaskTableProps {
  tasks: Task[];
  citations: Citation[];
}

function getRecommendationBadge(recommendation: string) {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    RULES_AUTOMATION: {
      bg: "bg-gray-100 dark:bg-gray-700",
      text: "text-gray-800 dark:text-gray-200",
      label: "Rules",
    },
    LLM_ASSIST: {
      bg: "bg-blue-100 dark:bg-blue-900",
      text: "text-blue-800 dark:text-blue-200",
      label: "LLM Assist",
    },
    TASK_AGENT: {
      bg: "bg-purple-100 dark:bg-purple-900",
      text: "text-purple-800 dark:text-purple-200",
      label: "Task Agent",
    },
    HUMAN: {
      bg: "bg-orange-100 dark:bg-orange-900",
      text: "text-orange-800 dark:text-orange-200",
      label: "Human",
    },
  };

  const badge = badges[recommendation] || badges.HUMAN;

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}
    >
      {badge.label}
    </span>
  );
}

function ScorePill({ score, label }: { score: number; label: string }) {
  const colors = [
    "bg-green-100 text-green-800",
    "bg-lime-100 text-lime-800",
    "bg-yellow-100 text-yellow-800",
    "bg-orange-100 text-orange-800",
    "bg-red-100 text-red-800",
  ];
  const colorIndex = Math.min(score - 1, 4);

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded ${colors[colorIndex]}`}
      title={label}
    >
      {label[0]}:{score}
    </span>
  );
}

export function TaskTable({ tasks, citations }: TaskTableProps) {
  const citationMap = new Map(citations.map((c) => [c.id, c]));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Task
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Current Actor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Scores
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recommendation
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Citations
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((task) => (
            <tr key={task.task_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {task.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                  {task.rationale.slice(0, 100)}
                  {task.rationale.length > 100 ? "..." : ""}
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                {task.current_actor}
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-1">
                  <ScorePill score={task.scores.variability} label="Variability" />
                  <ScorePill score={task.scores.criticality} label="Criticality" />
                  <ScorePill score={task.scores.risk} label="Risk" />
                </div>
              </td>
              <td className="px-4 py-4">
                {getRecommendationBadge(task.recommendation)}
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                  {task.citations.slice(0, 3).map((citId) => {
                    const citation = citationMap.get(citId);
                    if (!citation) return null;
                    return (
                      <CitationLink
                        key={citId}
                        citation={citation}
                        compact
                      />
                    );
                  })}
                  {task.citations.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{task.citations.length - 3}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
