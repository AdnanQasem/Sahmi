import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlatformFeeDisclosure from "@/components/projects/PlatformFeeDisclosure";
import {
  calculateInvestorProfit,
  calculateInvestorRepayment,
  calculatePlatformFee,
  calculateTotalRepaymentObligation,
  SAHMI_PLATFORM_FEE_PERCENT,
} from "@/lib/platformFee";

describe("Sahmi platform repayment disclosure", () => {
  it("calculates the fixed three-percent fee separately from investor repayment", () => {
    expect(SAHMI_PLATFORM_FEE_PERCENT).toBe(3);
    expect(calculatePlatformFee("10000")).toBe(300);
    expect(calculateInvestorProfit("10000", "10")).toBe(1000);
    expect(calculateInvestorRepayment("10000", "10")).toBe(11000);
    expect(calculateTotalRepaymentObligation("10000", "10")).toBe(11300);
  });

  it("calculates precisely for custom funding goals and ROI rates", () => {
    expect(calculatePlatformFee("36000")).toBe(1080);
    expect(calculateInvestorProfit("36000", "8")).toBe(2880);
    expect(calculateInvestorRepayment("36000", "8")).toBe(38880);
    expect(calculateTotalRepaymentObligation("36000", "8")).toBe(39960);
  });

  it("clearly displays the fee and complete obligation", () => {
    render(<PlatformFeeDisclosure goalAmount="10000" expectedRoi="10" />);

    expect(screen.getByText("Sahmi platform repayment: 3%")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
    expect(screen.getByText("$11,000.00")).toBeInTheDocument();
    expect(screen.getByText("$11,300.00")).toBeInTheDocument();
    expect(screen.getByText(/not deducted from the funding goal/i)).toBeInTheDocument();
  });

  it("renders the neat breakdown for $36,000 funding with 8% ROI", () => {
    render(<PlatformFeeDisclosure goalAmount="36000" expectedRoi="8" />);

    expect(screen.getByText("$36,000.00")).toBeInTheDocument();
    expect(screen.getByText("$2,880.00")).toBeInTheDocument();
    expect(screen.getByText("$38,880.00")).toBeInTheDocument();
    expect(screen.getByText("$1,080.00")).toBeInTheDocument();
    expect(screen.getByText("$39,960.00")).toBeInTheDocument();
  });
});
