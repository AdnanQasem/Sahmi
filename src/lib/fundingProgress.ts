export const calculateFundingPercent = (raisedAmount: number, fundingGoal: number) => {
  if (!Number.isFinite(raisedAmount) || !Number.isFinite(fundingGoal) || fundingGoal <= 0) return 0;
  return Math.min(Math.max((raisedAmount / fundingGoal) * 100, 0), 100);
};

export const fundingProgressBarWidth = (percent: number) => Math.min(Math.max(percent, 0), 100);

export const fundingProgressColor = (percent: number) => {
  if (percent >= 100) return "#087B6E";
  if (percent >= 80) return "#0F8A7B";
  if (percent >= 35) return "#2563EB";
  return "#F59E0B";
};
