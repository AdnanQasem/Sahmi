import { describe, expect, it } from "vitest";
import {
  calculateFundingPercent,
  fundingProgressBarWidth,
  fundingProgressColor,
} from "@/lib/fundingProgress";

describe("funding progress", () => {
  it("caps overfunded percentages at 100", () => {
    expect(calculateFundingPercent(13100, 10000)).toBe(100);
    expect(calculateFundingPercent(13125, 10000)).toBe(100);
  });

  it("caps the visual bar width", () => {
    expect(fundingProgressBarWidth(131)).toBe(100);
    expect(fundingProgressBarWidth(64)).toBe(64);
  });

  it("handles invalid goals and uses the Sahmi palette tiers", () => {
    expect(calculateFundingPercent(500, 0)).toBe(0);
    expect(fundingProgressColor(0)).toBe("#F59E0B");
    expect(fundingProgressColor(34.99)).toBe("#F59E0B");
    expect(fundingProgressColor(35)).toBe("#2563EB");
    expect(fundingProgressColor(79.99)).toBe("#2563EB");
    expect(fundingProgressColor(80)).toBe("#0F8A7B");
    expect(fundingProgressColor(99.99)).toBe("#0F8A7B");
    expect(fundingProgressColor(100)).toBe("#087B6E");
    expect(fundingProgressColor(131)).toBe("#087B6E");
  });
});
