interface FundingProgressBarProps {
  raised: number;
  goal: number;
  showLabels?: boolean;
  size?: "sm" | "md";
}

const FundingProgressBar = ({
  raised,
  goal,
  showLabels = true,
  size = "md",
}: FundingProgressBarProps) => {
  const percent = Math.min(Math.round((raised / goal) * 100), 100);
  const barHeight = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className="w-full">
      {showLabels && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            ${raised.toLocaleString()}{" "}
            <span className="font-normal text-muted-foreground">
              of ${goal.toLocaleString()}
            </span>
          </span>
          <span className="font-bold text-primary">{percent}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/50 ${barHeight}`}
      >
        <div
          className={`${barHeight} rounded-full bg-primary transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export default FundingProgressBar;
