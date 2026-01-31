const CLASSIFICATION_COLORS: Record<string, string> = {
  A_NOT_AGENTIC: "bg-gray-500",
  B_LLM_ASSIST: "bg-blue-500",
  C_TASK_AGENTS: "bg-purple-500",
  D_AGENT_ORCHESTRATION: "bg-green-500",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  A_NOT_AGENTIC: "Not Agentic",
  B_LLM_ASSIST: "LLM Assist",
  C_TASK_AGENTS: "Task Agents",
  D_AGENT_ORCHESTRATION: "Agent Orchestration",
};

const CLASSIFICATION_ORDER = [
  "A_NOT_AGENTIC",
  "B_LLM_ASSIST",
  "C_TASK_AGENTS",
  "D_AGENT_ORCHESTRATION",
];

interface ClassificationDeltaProps {
  classificationA: string;
  classificationB: string;
}

export function ClassificationDelta({
  classificationA,
  classificationB,
}: ClassificationDeltaProps) {
  const indexA = CLASSIFICATION_ORDER.indexOf(classificationA);
  const indexB = CLASSIFICATION_ORDER.indexOf(classificationB);
  const isUpgrade = indexB > indexA;
  const isDowngrade = indexB < indexA;
  const isSame = indexA === indexB;

  const arrowColor = isUpgrade
    ? "text-green-600 dark:text-green-400"
    : isDowngrade
      ? "text-red-600 dark:text-red-400"
      : "text-gray-400";

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {/* Classification A Badge */}
      <div
        className={`px-4 py-2 rounded-lg ${CLASSIFICATION_COLORS[classificationA] || "bg-gray-500"} text-white font-medium`}
      >
        <div className="text-xs opacity-80">A</div>
        <div>{CLASSIFICATION_LABELS[classificationA] || classificationA}</div>
      </div>

      {/* Arrow */}
      <div className={`flex flex-col items-center ${arrowColor}`}>
        {isUpgrade && (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span className="text-xs font-medium">Upgrade</span>
          </>
        )}
        {isDowngrade && (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span className="text-xs font-medium">Downgrade</span>
          </>
        )}
        {isSame && (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            <span className="text-xs font-medium">Same</span>
          </>
        )}
      </div>

      {/* Classification B Badge */}
      <div
        className={`px-4 py-2 rounded-lg ${CLASSIFICATION_COLORS[classificationB] || "bg-gray-500"} text-white font-medium`}
      >
        <div className="text-xs opacity-80">B</div>
        <div>{CLASSIFICATION_LABELS[classificationB] || classificationB}</div>
      </div>
    </div>
  );
}
