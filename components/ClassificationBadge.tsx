interface ClassificationBadgeProps {
  classification: string;
  size?: "sm" | "md" | "lg";
}

const CLASSIFICATIONS: Record<string, { label: string; description: string; color: string }> = {
  A_NOT_AGENTIC: {
    label: "A",
    description: "Not Agentic",
    color: "bg-gray-500",
  },
  B_LLM_ASSIST: {
    label: "B",
    description: "LLM Assist",
    color: "bg-blue-500",
  },
  C_TASK_AGENTS: {
    label: "C",
    description: "Task Agents",
    color: "bg-purple-500",
  },
  D_AGENT_ORCHESTRATION: {
    label: "D",
    description: "Agent Orchestration",
    color: "bg-green-500",
  },
};

export function ClassificationBadge({
  classification,
  size = "md",
}: ClassificationBadgeProps) {
  const config = CLASSIFICATIONS[classification] || CLASSIFICATIONS.A_NOT_AGENTIC;

  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-12 h-12 text-2xl",
    lg: "w-16 h-16 text-3xl",
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${sizeClasses[size]} ${config.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
      >
        {config.label}
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {config.description}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Classification
        </div>
      </div>
    </div>
  );
}
