export const SAHMI_PLATFORM_FEE_RATE = 0.03;
export const SAHMI_PLATFORM_FEE_PERCENT = 3;

const cents = (value: number) => Math.round(value * 100) / 100;

export const calculatePlatformFee = (investment: string | number) =>
  cents(Math.max(Number(investment) || 0, 0) * SAHMI_PLATFORM_FEE_RATE);

export const calculateInvestorProfit = (investment: string | number, roiPercent: string | number) => {
  const principal = Math.max(Number(investment) || 0, 0);
  const roi = Math.max(Number(roiPercent) || 0, 0) / 100;
  return cents(principal * roi);
};

export const calculateInvestorRepayment = (investment: string | number, roiPercent: string | number) => {
  const principal = Math.max(Number(investment) || 0, 0);
  const roi = Math.max(Number(roiPercent) || 0, 0) / 100;
  return cents(principal + principal * roi);
};

export const calculateTotalRepaymentObligation = (investment: string | number, roiPercent: string | number) =>
  cents(calculateInvestorRepayment(investment, roiPercent) + calculatePlatformFee(investment));

