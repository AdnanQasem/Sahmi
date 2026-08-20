import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";
import AdminRepaymentsPage from "@/pages/dashboard/admin/AdminRepaymentsPage";

const services = vi.hoisted(() => ({
  listRepayments: vi.fn().mockResolvedValue({ count: 0, next: null, previous: null, results: [] }),
  listInvestmentOptions: vi.fn().mockResolvedValue([]),
  summary: vi.fn().mockResolvedValue({
    obligation_total: "0.00",
    scheduled_total: "0.00",
    paid_total: "0.00",
    counts: {},
  }),
  listTransfers: vi.fn().mockResolvedValue({ count: 0, next: null, previous: null, results: [] }),
  listPlans: vi.fn().mockResolvedValue({ count: 1, next: null, previous: null, results: [{
    id: "plan-1", investment: "investment-1", investor_id: "investor-1", investor_name: "Mona Investor",
    project_id: "project-1", project_title: "Olive Cooperative", principal: "100.00",
    expected_return: "10.00", obligation_total: "110.00", status: "submitted", notes: "",
    review_notes: "", submitted_at: "2030-01-01T00:00:00Z", reviewed_at: null,
    installments: [{ id: "item-1", amount: "110.00", scheduled_date: "2030-04-15", payment_method: "bank_transfer" }],
  }] }),
}));

vi.mock("@/services/adminFinanceService", () => ({
  default: {
    listRepayments: services.listRepayments,
    listInvestmentOptions: services.listInvestmentOptions,
    createRepayment: vi.fn(),
    createRepaymentPlan: vi.fn(),
    updateRepayment: vi.fn(),
    deleteRepayment: vi.fn(),
    cancelRepayment: vi.fn(),
  },
}));
vi.mock("@/services/repaymentService", () => ({
  default: {
    summary: services.summary,
    listTransfers: services.listTransfers,
    listPlans: services.listPlans,
    approvePlan: vi.fn(),
    requestPlanRevision: vi.fn(),
    rejectPlan: vi.fn(),
    reviewTransfer: vi.fn(),
    verifyTransfer: vi.fn(),
    rejectTransfer: vi.fn(),
    disburseTransfer: vi.fn(),
  },
}));
vi.mock("@/pages/dashboard/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

beforeEach(async () => {
  vi.clearAllMocks();
  await changeLanguage("en");
});

it("lets the admin review an entrepreneur-submitted investor repayment plan", async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminRepaymentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  expect(await screen.findByText("Mona Investor")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Review plan" }));
  expect(screen.getByRole("dialog", { name: "Review repayment plan" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Approve plan" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Request changes" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Reject plan" })).toBeDisabled();

  queryClient.clear();
});

it.each([
  ["under_review" as const, "Reconcile", "Bank reconciliation notes", /^Demo bank statement matched/],
  ["verified" as const, "Record investor payout", "Outbound payout reference", /^DEMO-PAYOUT-/],
])("fills demo data for a %s repayment transfer", async (status, openLabel, fieldLabel, expectedValue) => {
  const fundingTransfer = {
    id: "transfer-1",
    status,
    inbound_reference: "BANK-IN-1",
    outbound_reference: "",
  };
  services.listRepayments.mockResolvedValueOnce({
    count: 1,
    next: null,
    previous: null,
    results: [{
      id: "repayment-1",
      plan: "plan-1",
      investment: "investment-1",
      investor_detail: { id: "investor-1", full_name: "Mona Investor", email: "mona@example.com" },
      project_detail: { id: "project-1", title: "Olive Cooperative" },
      amount: "110.00",
      scheduled_date: "2030-04-15",
      actual_payment_date: null,
      status: "due",
      payment_method: "bank_transfer",
      transaction_id: "",
      notes: "",
      created_at: "2030-01-01T00:00:00Z",
      updated_at: "2030-01-01T00:00:00Z",
      funding_transfer: fundingTransfer,
    }],
  });
  services.listTransfers.mockResolvedValueOnce({
    count: 1,
    next: null,
    previous: null,
    results: [{
      ...fundingTransfer,
      repayment: "repayment-1",
      submitted_by: "owner-1",
      submitted_by_name: "Project Owner",
      amount: "110.00",
      currency: "USD",
      inbound_transfer_date: "2030-04-15",
      receipt_url: null,
      source_of_funds_declaration: "",
      agreement_version: "repayment-funding-v1",
      agreement_accepted_at: "2030-04-15T00:00:00Z",
      reviewed_at: null,
      review_notes: "",
      disbursed_at: null,
      created_at: "2030-04-15T00:00:00Z",
    }],
  });
  services.listPlans.mockResolvedValueOnce({ count: 0, next: null, previous: null, results: [] });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><AdminRepaymentsPage /></MemoryRouter>
    </QueryClientProvider>,
  );

  fireEvent.click((await screen.findAllByRole("button", { name: openLabel }))[0]);
  const dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Fill Demo Data" }));

  const field = within(dialog).getByLabelText(fieldLabel) as HTMLInputElement | HTMLTextAreaElement;
  expect(field.value).toMatch(expectedValue);
  if (status === "under_review") {
    expect(within(dialog).getByRole("button", { name: "Verify inbound funds" })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "Reject" })).toBeEnabled();
  } else {
    expect(within(dialog).getByRole("button", { name: "Record investor payout" })).toBeEnabled();
  }

  queryClient.clear();
});
