import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";
import TransactionDetailsDialog from "@/components/dashboard/TransactionDetailsDialog";
import type { Investment } from "@/services/investmentsService";

const investment = (projectStatus: "fundraising" | "implementation" | "completed", actualReturn = "0.00") => ({
  id: "investment-1",
  investor: "Current Investor",
  project: "project-1",
  project_detail: {
    id: "project-1",
    slug: "solar-panels",
    title: "Solar panels",
    short_description: "Solar project",
    status: projectStatus,
    category: "energy",
    location: "Gaza",
    goal_amount: "10000.00",
    expected_roi: "5.00",
  },
  amount: "500.00",
  quantity: 1,
  investment_date: "2026-05-07T12:00:00Z",
  status: projectStatus === "completed" ? "completed" : "confirmed",
  pending_expires_at: null,
  transaction_id: "INV-500",
  payment_method: "bank_transfer",
  expected_return: "25.00",
  actual_return: actualReturn,
  return_received_at: actualReturn === "0.00" ? null : "2026-09-24T00:00:00Z",
  notes: "",
  created_at: "2026-05-07T12:00:00Z",
  updated_at: "2026-05-07T12:00:00Z",
} as Investment);

beforeEach(async () => {
  await changeLanguage("en");
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

it("explains why actual return is empty before project completion", () => {
  render(<MemoryRouter><TransactionDetailsDialog investment={investment("fundraising")} onOpenChange={() => {}} /></MemoryRouter>);
  expect(screen.getByText("Project is still fundraising")).toBeInTheDocument();
});

it("shows the amount actually paid after a repayment is recorded", () => {
  render(<MemoryRouter><TransactionDetailsDialog investment={investment("completed", "175.00")} onOpenChange={() => {}} /></MemoryRouter>);
  expect(screen.getByText("$175.00")).toBeInTheDocument();
  expect(screen.queryByText("Project completed — awaiting repayment")).not.toBeInTheDocument();
});
