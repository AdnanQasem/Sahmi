import { describe, expect, it } from "vitest";
import { calculateInvestmentTotals } from "@/lib/investmentTotals";
import type { Investment } from "@/services/investmentsService";

const investment = (
  status: Investment["status"],
  amount: string,
  expectedReturn: string,
) => ({ status, amount, expected_return: expectedReturn }) as Investment;

describe("investment money totals", () => {
  it("counts confirmed and completed records but excludes non-funded states", () => {
    const totals = calculateInvestmentTotals([
      investment("confirmed", "100.00", "5.00"),
      investment("completed", "50.00", "2.50"),
      investment("pending", "1000.00", "50.00"),
      investment("cancelled", "2000.00", "100.00"),
      investment("failed", "3000.00", "150.00"),
      investment("refunded", "4000.00", "200.00"),
    ]);

    expect(totals.funded).toHaveLength(2);
    expect(totals.principal).toBe(150);
    expect(totals.expectedProfit).toBe(7.5);
    expect(totals.expectedRoiPercent).toBe(5);
  });
});
