import { describe, expect, it } from "vitest";
import { createDemoRepaymentReference } from "@/demo/formDemoData";

describe("repayment demo references", () => {
  it("creates a fresh transaction reference for every dummy fill", () => {
    const first = createDemoRepaymentReference();
    const second = createDemoRepaymentReference();

    expect(first).toMatch(/^DEMO-REPAY-\d{17}-[A-Z0-9]{8}$/);
    expect(second).toMatch(/^DEMO-REPAY-\d{17}-[A-Z0-9]{8}$/);
    expect(second).not.toBe(first);
    expect(first.length).toBeLessThanOrEqual(120);
  });
});
