import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/api";
import adminFinanceService from "@/services/adminFinanceService";
import repaymentService from "@/services/repaymentService";
import RepaymentsPage from "@/pages/dashboard/RepaymentsPage";

const state = vi.hoisted(() => ({ userType: "investor" }));
vi.mock("@/services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { user_type: state.userType } }) }));
vi.mock("@/pages/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const record = {
  id: "repayment-1", investment: "investment-1", investor_name: "Mona Investor",
  project_id: "project-1", project_title: "Olive Cooperative", amount: "25.00",
  scheduled_date: "2030-01-01", actual_payment_date: null, status: "due" as const,
  payment_method: "bank_transfer" as const, transaction_id: "", notes: "",
};

const obligation = {
  project_id: "project-1", project_slug: "olive-cooperative", project_title: "Olive Cooperative",
  investor_id: "investor-1", investor_name: "Mona Investor", investment_count: 3,
  invested_total: "500.00", expected_return: "25.00", expected_repayment_total: "525.00",
  expected_roi_percent: "5.00",
  scheduled_total: "525.00", actual_return: "0.00", remaining_total: "525.00",
  next_repayment_date: "2030-01-01", status: "scheduled" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  state.userType = "investor";
});

describe("repayment service and dashboard", () => {
  it("calls the scoped list and server summary endpoints", async () => {
    vi.mocked(api.get).mockResolvedValueOnce([record]).mockResolvedValueOnce({ paid_total: "0.00" });
    const page = await repaymentService.list({ status: "due", ordering: "scheduled_date" });
    const summary = await repaymentService.summary();
    expect(api.get).toHaveBeenNthCalledWith(1, "repayments/", { params: { status: "due", ordering: "scheduled_date" } });
    expect(api.get).toHaveBeenNthCalledWith(2, "repayments/summary/");
    expect(page.results).toEqual([record]);
    expect(summary.paid_total).toBe("0.00");
  });

  it("posts the complete admin repayment plan to the dedicated endpoint", async () => {
    const payload = {
      investment: "investment-1",
      installment_count: 3,
      first_scheduled_date: "2030-01-31",
      interval_months: 1,
      payment_method: "bank_transfer" as const,
      notes: "Monthly return plan",
    };
    vi.mocked(api.post).mockResolvedValueOnce([]);

    await adminFinanceService.createRepaymentPlan(payload);

    expect(api.post).toHaveBeenCalledWith("admin/repayments/create-plan/", payload);
  });

  it("renders the investor's schedule from server totals", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path) => path === "repayments/summary/"
      ? { obligation_total: "525.00", scheduled_total: "525.00", paid_total: "0.00", remaining_total: "525.00", unscheduled_total: "0.00", obligations: [obligation], next_repayment_date: "2030-01-01", counts: {} }
      : { count: 1, next: null, previous: null, results: [record] });
    render(<MemoryRouter><QueryClientProvider client={queryClient}><RepaymentsPage /></QueryClientProvider></MemoryRouter>);
    expect((await screen.findAllByText("Olive Cooperative")).length).toBeGreaterThan(0);
    expect(screen.getByText("Due")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("$25.00").length).toBeGreaterThan(0));
    expect(screen.getByText("Repayment plan progress")).toBeInTheDocument();
    expect(screen.getByText(/Expected ROI: 5%/)).toBeInTheDocument();
    expect(screen.getByText(/not the ROI rate/)).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getAllByText("$525.00").length).toBeGreaterThan(0);
    expect(screen.getByText("3 investments in this project")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.queryByText("Mona Investor")).not.toBeInTheDocument();
  });

  it("shows investor identity in the entrepreneur obligation view", async () => {
    state.userType = "entrepreneur";
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path) => path === "repayments/summary/"
      ? { obligation_total: "525.00", scheduled_total: "525.00", paid_total: "0.00", remaining_total: "525.00", unscheduled_total: "0.00", obligations: [obligation], next_repayment_date: null, counts: {} }
      : { count: 1, next: null, previous: null, results: [record] });
    render(<MemoryRouter><QueryClientProvider client={queryClient}><RepaymentsPage /></QueryClientProvider></MemoryRouter>);
    expect((await screen.findAllByText("Mona Investor")).length).toBeGreaterThan(0);
    expect(screen.getByText("Project repayment obligations")).toBeInTheDocument();
  });
});
