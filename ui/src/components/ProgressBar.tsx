interface ProgressBarProps {
  progress: number;
  total: number;
  wpm?: number;
  accuracy?: number;
  color?: string;
  showStats?: boolean;
}

export function ProgressBar({
  progress,
  total,
  wpm,
  accuracy,
  color = 'bg-primary-500',
  showStats = true,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">
          {Math.round(percentage)}% complete
        </span>
        {showStats && (
          <div className="flex gap-4">
            {wpm !== undefined && (
              <span className="text-primary-400">
                <span className="font-bold">{wpm}</span> WPM
              </span>
            )}
            {accuracy !== undefined && (
              <span className={accuracy >= 95 ? 'text-green-400' : accuracy >= 85 ? 'text-yellow-400' : 'text-red-400'}>
                <span className="font-bold">{accuracy}%</span> accuracy
              </span>
            )}
          </div>
        )}
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} progress-bar rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
