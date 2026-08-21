import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";
import FundsPage from "@/pages/dashboard/FundsPage";

const services = vi.hoisted(() => {
  const request = {
    id: "withdrawal-1",
    project: "project-1",
    project_title: "Olive Harvest",
    project_status: "implementation" as const,
    milestone: "milestone-1",
    milestone_title: "Prepare the land",
    requested_by: "owner-1",
    amount: "1250.00",
    evidence_description: "Supplier quotation and site preparation evidence.",
    planned_expenses: "Equipment rental and initial materials.",
    evidence_file: "https://example.test/evidence.pdf",
    status: "requested" as const,
    review_notes: "",
    reviewed_by: null,
    reviewed_at: null,
    released_by: null,
    released_at: null,
    payout_reference: "",
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  };

  return {
    request,
    listProjects: vi.fn().mockResolvedValue({ count: 0, results: [] }),
    listWithdrawals: vi.fn().mockResolvedValue({ count: 1, results: [request] }),
    startReview: vi.fn().mockImplementation(async () => ({ ...request, status: "under_review" as const })),
    startCompletionReview: vi.fn(),
  };
});

vi.mock("@/services/adminProjectsService", () => ({
  default: {
    listProjects: services.listProjects,
    finalizeFunding: vi.fn(),
    finalizeCompletion: vi.fn(),
  },
}));
vi.mock("@/services/projectsService", () => ({ default: { listMyProjects: vi.fn() } }));
vi.mock("@/services/fundsService", () => ({
  default: {
    list: services.listWithdrawals,
    review: services.startReview,
    approve: vi.fn(),
    reject: vi.fn(),
    requestRevision: vi.fn(),
    release: vi.fn(),
    cancel: vi.fn(),
    reviewMilestoneCompletion: services.startCompletionReview,
    approveMilestoneCompletion: vi.fn(),
    rejectMilestoneCompletion: vi.fn(),
    requestMilestoneCompletionRevision: vi.fn(),
  },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "admin-1", user_type: "admin", is_staff: true } }) }));
vi.mock("@/pages/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

beforeEach(async () => {
  await changeLanguage("en");
  services.startReview.mockClear();
  services.startCompletionReview.mockReset();
});

it("keeps an admin focused in a dialog throughout a withdrawal review", async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FundsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  const queue = await screen.findByRole("region", { name: "Approvals needing review" });
  expect(within(queue).getByText("Action required")).toBeInTheDocument();
  expect(within(queue).getAllByText("Withdrawal approvals", { exact: false })).toHaveLength(2);

  fireEvent.click(await screen.findByRole("button", { name: "Start review" }));
  await waitFor(() => expect(services.startReview).toHaveBeenCalledWith("withdrawal-1"));

  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("Review withdrawal request")).toBeInTheDocument();
  expect(within(dialog).getByText("Olive Harvest", { exact: false })).toBeInTheDocument();
  expect(within(dialog).getByText("Supplier quotation and site preparation evidence.")).toBeInTheDocument();
  expect(within(dialog).getByText("Equipment rental and initial materials.")).toBeInTheDocument();

  expect(within(dialog).queryByRole("button", { name: "Start review" })).not.toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Approve" })).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Require revision" })).toBeDisabled();
  expect(within(dialog).getByRole("button", { name: "Reject" })).toBeDisabled();
  queryClient.clear();
});

it("opens milestone completion decisions directly in a review dialog", async () => {
  const milestone = {
    id: "milestone-1",
    title: "Prepare the land",
    description: "Prepare the growing area.",
    target_date: "2026-08-10",
    status: "in_progress" as const,
    deliverables: "Prepared land",
    percentage_of_project: "100.00",
    funding_released: "1000.00",
    order: 1,
    completion_status: "submitted" as const,
    completion_summary: "The land was prepared and inspected.",
    completion_evidence: "https://example.test/completion.pdf",
    completion_submitted_at: "2026-08-15T11:00:00Z",
  };
  services.listProjects.mockResolvedValueOnce({ count: 1, results: [{
    id: "project-1",
    title: "Olive Harvest",
    status: "implementation",
    funded_amount: "1000.00",
    goal_amount: "1000.00",
    milestones: [milestone],
  }] });
  services.startCompletionReview.mockResolvedValue({ ...milestone, completion_status: "under_review" });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><FundsPage /></MemoryRouter>
    </QueryClientProvider>,
  );

  fireEvent.click(await screen.findByRole("button", { name: "Start completion review" }));
  await waitFor(() => expect(services.startCompletionReview).toHaveBeenCalledWith("milestone-1"));

  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("Review milestone completion")).toBeInTheDocument();
  expect(within(dialog).getByText("The land was prepared and inspected.")).toBeInTheDocument();
  expect(within(dialog).queryByRole("button", { name: "Start completion review" })).not.toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Approve and complete milestone" })).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Require revision" })).toBeDisabled();
  expect(within(dialog).getByRole("button", { name: "Reject" })).toBeDisabled();
  queryClient.clear();
});
