import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { changeLanguage } from "@/i18n";
import ProjectRepaymentProcess from "@/components/projects/ProjectRepaymentProcess";

beforeEach(async () => {
  await changeLanguage("en");
});

it("shows the active Solar Panels repayment process and installment progress", () => {
  render(
    <ProjectRepaymentProcess
      repaymentStatus="on_track"
      nextRepaymentDate="2026-09-24"
      totalRepaid="0.00"
      repayments={[
        { id: "1", amount: 3500, scheduled_date: "2026-09-24", actual_payment_date: null, status: "pending", payment_method: "bank_transfer" },
        { id: "2", amount: 3500, scheduled_date: "2026-10-24", actual_payment_date: null, status: "pending", payment_method: "bank_transfer" },
        { id: "3", amount: 3500, scheduled_date: "2026-11-24", actual_payment_date: null, status: "pending", payment_method: "bank_transfer" },
      ]}
    />,
  );

  expect(screen.getByText("Repayment process")).toBeInTheDocument();
  expect(screen.getByText("0 of 3 installments paid")).toBeInTheDocument();
  expect(screen.getByText(/Repaying investors/).closest("article")).toHaveAttribute("aria-current", "step");
  expect(screen.getByText("Next scheduled repayment: Sep 24, 2026")).toBeInTheDocument();
  expect(screen.getByText(/\$10,500\.00/)).toBeInTheDocument();
});
