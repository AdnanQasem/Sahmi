import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminInvestmentDialog from "@/components/admin/AdminInvestmentDialog";
import type { AdminInvestment } from "@/services/adminFinanceService";

const mockInvestment: AdminInvestment = {
  id: "inv-12345678-abcd",
  investor: "usr-1",
  investor_detail: {
    id: "usr-1",
    email: "investor@example.com",
    full_name: "Tariq Al-Masri",
    user_type: "investor",
  },
  project: "proj-1",
  project_detail: {
    id: "proj-1",
    title: "Solar Grid Jenin",
    slug: "solar-grid-jenin",
    status: "active",
  },
  amount: "36000.00",
  investment_date: "2026-08-20T10:00:00Z",
  received_at: "2026-08-20T12:00:00Z",
  status: "confirmed",
  pending_expires_at: null,
  transaction_id: "TXN-PAL-9988",
  payment_method: "bank_transfer",
  expected_return: "2880.00",
  actual_return: "0.00",
  obligation_total: "38880.00",
  scheduled_repayment_total: "0.00",
  remaining_repayment_obligation: "38880.00",
  return_received_at: null,
  notes: "Wire transfer confirmed via Bank of Palestine.",
  created_at: "2026-08-20T10:00:00Z",
  updated_at: "2026-08-20T12:00:00Z",
};

describe("AdminInvestmentDialog", () => {
  it("renders a clean financial overview card and identity details in edit mode", () => {
    render(
      <AdminInvestmentDialog
        open={true}
        investment={mockInvestment}
        users={[]}
        projects={[]}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Identity and project
    expect(screen.getByText("Tariq Al-Masri")).toBeInTheDocument();
    expect(screen.getByText("investor@example.com")).toBeInTheDocument();
    expect(screen.getByText("Solar Grid Jenin")).toBeInTheDocument();

    // Financial numbers
    expect(screen.getByText("$36,000.00")).toBeInTheDocument();
    expect(screen.getByText(/\+\s*\$2,880\.00/)).toBeInTheDocument();
    expect(screen.getByText("$38,880.00")).toBeInTheDocument();

    // Transaction ID and Notes
    expect(screen.getByDisplayValue("TXN-PAL-9988")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Wire transfer confirmed via Bank of Palestine.")).toBeInTheDocument();
  });

  it("calls onSubmit with updated fields when form is saved", () => {
    const handleSubmit = vi.fn();
    render(
      <AdminInvestmentDialog
        open={true}
        investment={mockInvestment}
        users={[]}
        projects={[]}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    const notesInput = screen.getByDisplayValue("Wire transfer confirmed via Bank of Palestine.");
    fireEvent.change(notesInput, { target: { value: "Updated verification note." } });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.calls[0][0].notes).toBe("Updated verification note.");
  });
});
