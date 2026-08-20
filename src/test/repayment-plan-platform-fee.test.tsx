import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import RepaymentPlanSubmissionDialog from "@/components/repayments/RepaymentPlanSubmissionDialog";
import { changeLanguage } from "@/i18n";

beforeEach(async () => {
  await changeLanguage("en");
});

it("adds the fixed dated 3% Sahmi repayment separately from investor installments", async () => {
  const onSubmit = vi.fn();
  render(
    <RepaymentPlanSubmissionDialog
      open
      investments={[{
        id: "investment-1",
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
      }]}
      pending={false}
      onOpenChange={vi.fn()}
      onSubmit={onSubmit}
    />,
  );

  expect(await screen.findByText("Sahmi platform repayment (3%)")).toBeInTheDocument();
  expect(screen.getByText("$3.00")).toBeInTheDocument();
  expect(screen.getByText("$113.00")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "110.00" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit for admin review" }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0].installments).toEqual(expect.arrayContaining([
    expect.objectContaining({ amount: "110.00", recipient: "investor" }),
    expect.objectContaining({ amount: "3.00", recipient: "platform", scheduled_date: "2030-01-01" }),
  ]));
});
