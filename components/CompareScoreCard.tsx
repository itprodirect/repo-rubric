import { DeltaIndicator } from "./DeltaIndicator";

interface CompareScoreCardProps {
  label: string;
  scoreA: number;
  scoreB: number;
  maxScore?: number;
}

function getScoreColor(score: number, maxScore: number): string {
  const percentage = score / maxScore;
  if (percentage >= 0.8) return "bg-green-500";
  if (percentage >= 0.6) return "bg-lime-500";
  if (percentage >= 0.4) return "bg-yellow-500";
  if (percentage >= 0.2) return "bg-orange-500";
  return "bg-red-500";
}

export function CompareScoreCard({
  label,
  scoreA,
  scoreB,
  maxScore = 5,
}: CompareScoreCardProps) {
  const percentageA = (scoreA / maxScore) * 100;
  const percentageB = (scoreB / maxScore) * 100;
  const colorA = getScoreColor(scoreA, maxScore);
  const colorB = getScoreColor(scoreB, maxScore);
  const delta = scoreB - scoreA;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {label}
      </div>

      <div className="flex items-center gap-3">
        {/* Score A */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">A</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {scoreA}/{maxScore}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${colorA} transition-all duration-300`}
              style={{ width: `${percentageA}%` }}
            />
          </div>
        </div>

        {/* Delta Indicator */}
        <div className="flex-shrink-0 px-2">
          <DeltaIndicator value={delta} size="sm" />
        </div>

        {/* Score B */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">B</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {scoreB}/{maxScore}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${colorB} transition-all duration-300`}
              style={{ width: `${percentageB}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
