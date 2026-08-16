import { describe, expect, it } from "vitest";
import { calculateFundingSummary } from "@/lib/funding";

describe("funding dashboard summary", () => {
  it("shows finalized funding as available plus released plus refunded", () => {
    const summary = calculateFundingSummary([
      {
        status: "implementation",
        funded_amount: "10000.00",
        funding_finalized_at: "2026-08-15T10:00:00Z",
        funding_account: {
          secured: "99999.00",
          available: "99999.00",
          released: "2500.00",
          refunded: "500.00",
        },
      },
      {
        status: "implementation",
        funded_amount: "50000.00",
        funding_finalized_at: "2026-08-15T10:00:00Z",
        funding_account: {
          secured: "35000.00",
          available: "35000.00",
          released: "15000.00",
          refunded: "0.00",
        },
      },
    ]);

    expect(summary).toEqual({
      totalFunding: 60000,
      available: 42000,
      released: 17500,
      refunded: 500,
    });
    expect(summary.totalFunding).toBe(
      summary.available + summary.released + summary.refunded,
    );
  });

  it("does not count fundraising balances as secured project money", () => {
    const summary = calculateFundingSummary([
      {
        status: "fundraising",
        funded_amount: "700.00",
        funding_finalized_at: null,
        funding_account: {
          secured: "0.00",
          available: "0.00",
          released: "0.00",
          refunded: "0.00",
        },
      },
    ]);

    expect(summary.totalFunding).toBe(0);
  });
});
