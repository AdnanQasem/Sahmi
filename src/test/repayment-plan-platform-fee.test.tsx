import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import RepaymentPlanSubmissionDialog from "@/components/repayments/RepaymentPlanSubmissionDialog";
import { changeLanguage } from "@/i18n";

beforeEach(async () => {
  await changeLanguage("en");
  Element.prototype.scrollIntoView = vi.fn();
});

const targets = [{
  id: "investment-1",
  recipient: "investor" as const,
  investor_id: "investor-1",
  investor_name: "Mona Investor",
  project_id: "project-1",
  project_title: "Olive Cooperative",
  principal: "100.00",
  expected_return: "10.00",
  obligation_total: "110.00",
  platform_fee: "3.00",
  total_with_platform_fee: "113.00",
  earliest_repayment_date: "2030-01-01",
}, {
  id: "platform:project-1",
  recipient: "platform" as const,
  investor_id: null,
  investor_name: "Sahmi platform",
  project_id: "project-1",
  project_title: "Olive Cooperative",
  principal: "100.00",
  expected_return: "0.00",
  obligation_total: "3.00",
  platform_fee: "3.00",
  total_with_platform_fee: "3.00",
  earliest_repayment_date: "2030-01-01",
}];

it("keeps an investor plan separate and removes the combined Sahmi total", async () => {
  const onSubmit = vi.fn();
  render(
    <RepaymentPlanSubmissionDialog
      open
      investments={targets}
      pending={false}
      onOpenChange={vi.fn()}
      onSubmit={onSubmit}
    />,
  );

  expect(await screen.findByText("Select repayment")).toBeInTheDocument();
  expect(screen.queryByText("Total including Sahmi fee")).not.toBeInTheDocument();
  expect(screen.queryByText("$113.00")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "110.00" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit for admin review" }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0]).toEqual(expect.objectContaining({
    recipient: "investor",
    investment: "investment-1",
    project: "project-1",
    installments: [expect.objectContaining({ amount: "110.00", recipient: "investor" })],
  }));
});

it("offers Sahmi 3% as its own repayment selection and submits only that fee", async () => {
  const onSubmit = vi.fn();
  render(<RepaymentPlanSubmissionDialog open investments={targets} pending={false} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

  fireEvent.click(screen.getByLabelText("Select repayment"));
  fireEvent.click(await screen.findByRole("option", { name: /Sahmi platform repayment \(3%\).*Olive Cooperative/ }));
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "3.00" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit for admin review" }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0]).toEqual(expect.objectContaining({
    recipient: "platform",
    investment: null,
    project: "project-1",
    installments: [expect.objectContaining({ amount: "3.00", recipient: "platform" })],
  }));
});
