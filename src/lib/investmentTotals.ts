import type { Investment } from "@/services/investmentsService";

export const FUNDED_INVESTMENT_STATUSES = ["confirmed", "completed"] as const;

export const isFundedInvestment = (investment: Investment) =>
  FUNDED_INVESTMENT_STATUSES.includes(
    investment.status as (typeof FUNDED_INVESTMENT_STATUSES)[number],
  );

export const fundedInvestments = (investments: Investment[]) =>
  investments.filter(isFundedInvestment);

export const calculateInvestmentTotals = (investments: Investment[]) => {
  const funded = fundedInvestments(investments);
  const principal = funded.reduce(
    (total, investment) => total + Number(investment.amount || 0),
    0,
  );
  const expectedProfit = funded.reduce(
    (total, investment) => total + Number(investment.expected_return || 0),
    0,
  );

  return {
    funded,
    principal,
    expectedProfit,
    expectedRoiPercent: principal > 0 ? (expectedProfit / principal) * 100 : 0,
  };
};
