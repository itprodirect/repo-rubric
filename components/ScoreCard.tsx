interface ScoreCardProps {
  label: string;
  score: number;
  maxScore?: number;
  description?: string;
}

function getScoreColor(score: number, maxScore: number): string {
  const percentage = score / maxScore;
  if (percentage >= 0.8) return "bg-green-500";
  if (percentage >= 0.6) return "bg-lime-500";
  if (percentage >= 0.4) return "bg-yellow-500";
  if (percentage >= 0.2) return "bg-orange-500";
  return "bg-red-500";
}

export function ScoreCard({ label, score, maxScore = 5, description }: ScoreCardProps) {
  const percentage = (score / maxScore) * 100;
  const colorClass = getScoreColor(score, maxScore);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {score}/{maxScore}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {description && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}

interface ConfidenceCardProps {
  confidence: number;
}

export function ConfidenceCard({ confidence }: ConfidenceCardProps) {
  const percentage = Math.round(confidence * 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Confidence
        </span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
