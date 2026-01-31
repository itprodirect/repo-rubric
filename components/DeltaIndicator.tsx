interface DeltaIndicatorProps {
  value: number;
  size?: "sm" | "md";
}

export function DeltaIndicator({ value, size = "md" }: DeltaIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isZero = value === 0;

  const sizeClasses = size === "sm" ? "text-xs" : "text-sm";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  const colorClass = isPositive
    ? "text-green-600 dark:text-green-400"
    : isNegative
      ? "text-red-600 dark:text-red-400"
      : "text-gray-500 dark:text-gray-400";

  const displayValue = isPositive
    ? `+${value}`
    : isNegative
      ? value.toString()
      : "0";

  return (
    <div className={`flex items-center gap-1 font-medium ${sizeClasses} ${colorClass}`}>
      {isPositive && (
        <svg
          className={iconSize}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      )}
      {isNegative && (
        <svg
          className={iconSize}
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
      )}
      {isZero && (
        <svg
          className={iconSize}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14"
          />
        </svg>
      )}
      <span>{displayValue}</span>
    </div>
  );
}
