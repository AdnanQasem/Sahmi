import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EditProject from "@/pages/EditProject";
import type { Project } from "@/services/projectsService";

const projectServiceMocks = vi.hoisted(() => ({
  getProject: vi.fn(),
  listCategories: vi.fn(),
  updateProject: vi.fn(),
}));
const authState = vi.hoisted(() => ({
  user: { id: "owner-1", user_type: "entrepreneur", is_staff: false },
}));

vi.mock("@/services/projectsService", async () => {
  const actual = await vi.importActual<typeof import("@/services/projectsService")>(
    "@/services/projectsService",
  );
  return {
    ...actual,
    default: {
      ...actual.default,
      getProject: projectServiceMocks.getProject,
      listCategories: projectServiceMocks.listCategories,
      updateProject: projectServiceMocks.updateProject,
    },
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
  }),
}));

const project = (title: string): Project => ({
  id: "project-1",
  entrepreneur: {
    id: "owner-1",
    email: "owner@example.com",
    full_name: "Owner",
  },
  title,
  slug: "green-workshop",
  description: "Project description",
  short_description: "Short description",
  category: "category-1",
  category_detail: { id: "category-1", name: "Technology", slug: "technology" },
  location: "Hebron",
  goal_amount: "10000.00",
  funded_amount: "0.00",
  minimum_investment: "100.00",
  expected_roi: "10.00",
  cost_items: [
    { name: "1", description: "Equipment", quantity: "1", unit_cost: "10000.00" },
  ],
  milestones: [
    {
      id: "milestone-1",
      title: "Launch",
      description: "Launch the project",
      target_date: "2027-02-01",
      status: "pending",
      deliverables: "Operational project",
      percentage_of_project: "100.00",
      funding_released: "0.00",
      order: 1,
    },
  ],
  funding_period_days: 30,
  status: "draft",
  is_verified: false,
  investor_count: 0,
  days_left: 30,
  funding_percent: 0,
  created_at: "2026-08-11T00:00:00Z",
});

afterEach(() => {
  cleanup();
  focusManager.setFocused(undefined);
  vi.clearAllMocks();
  authState.user = { id: "owner-1", user_type: "entrepreneur", is_staff: false };
});

describe("project edit draft preservation", () => {
  it("does not overwrite unsaved input when a focus refetch returns fresh server data", async () => {
    projectServiceMocks.getProject
      .mockResolvedValueOnce(project("Original title"))
      .mockResolvedValueOnce(project("Server-refreshed title"));
    projectServiceMocks.listCategories.mockResolvedValue([
      { id: "category-1", name: "Technology", slug: "technology" },
    ]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/projects/green-workshop/edit"]}>
          <Routes>
            <Route path="/projects/:id/edit" element={<EditProject />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const titleInput = await screen.findByLabelText("Project title");
    fireEvent.change(titleInput, { target: { value: "My unsaved title" } });

    focusManager.setFocused(false);
    focusManager.setFocused(true);
    await waitFor(() => expect(projectServiceMocks.getProject).toHaveBeenCalledTimes(2));

    expect(titleInput).toHaveValue("My unsaved title");
    queryClient.clear();
  });

  it("redirects a non-staff user who does not own the project", async () => {
    authState.user = { id: "different-owner", user_type: "entrepreneur", is_staff: false };
    projectServiceMocks.getProject.mockResolvedValue(project("Private project"));
    projectServiceMocks.listCategories.mockResolvedValue([]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/projects/green-workshop/edit"]}>
          <Routes>
            <Route path="/projects/:id/edit" element={<EditProject />} />
            <Route path="/projects" element={<div>Projects index</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Projects index")).toBeInTheDocument();
    queryClient.clear();
  });
});
