import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";

vi.hoisted(() => vi.stubEnv("VITE_DEMO_MODE", "true"));

const services = vi.hoisted(() => ({
  create: vi.fn(),
  project: {
    id: "project-1", title: "Olive Project", status: "implementation",
    funded_amount: "10000.00", goal_amount: "10000.00", funding_finalized_at: "2026-01-01T00:00:00Z",
    funding_account: { secured: "10000.00", available: "10000.00", released: "0.00", refunded: "0.00" },
    milestones: [{ id: "milestone-1", title: "Install equipment", status: "in_progress", order: 1, percentage_of_project: "100.00", funding_released: "0.00" }],
  },
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "owner-1", user_type: "entrepreneur", is_staff: false } }) }));
vi.mock("@/pages/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/services/projectsService", () => ({ default: { listMyProjects: vi.fn().mockResolvedValue({ count: 1, results: [services.project] }) } }));
vi.mock("@/services/adminProjectsService", () => ({ default: { listProjects: vi.fn(), finalizeFunding: vi.fn(), finalizeCompletion: vi.fn() } }));
vi.mock("@/services/fundsService", () => ({ default: { list: vi.fn().mockResolvedValue({ count: 0, results: [] }), create: services.create, submitMilestoneCompletion: vi.fn(), reviewMilestoneCompletion: vi.fn(), approveMilestoneCompletion: vi.fn(), rejectMilestoneCompletion: vi.fn(), requestMilestoneCompletionRevision: vi.fn(), cancel: vi.fn() } }));

import FundsPage from "@/pages/dashboard/FundsPage";

it("fills the milestone release string fields without submitting", async () => {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><FundsPage /></MemoryRouter></QueryClientProvider>);
  const fill = await screen.findByRole("button", { name: "Fill Dummy Data" });
  await waitFor(() => expect(fill).toBeEnabled());
  fireEvent.click(fill);
  expect(screen.getByLabelText("Amount")).toHaveValue(500);
  expect((screen.getByLabelText("Milestone evidence") as HTMLTextAreaElement).value).toContain("Supplier quotation");
  expect((screen.getByLabelText("Purpose and planned expenses") as HTMLTextAreaElement).value).toContain("approved milestone materials");
  expect(services.create).not.toHaveBeenCalled();
});
