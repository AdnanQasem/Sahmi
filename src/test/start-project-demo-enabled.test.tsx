import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";

vi.hoisted(() => {
  vi.stubEnv("VITE_DEMO_MODE", "true");
});

const services = vi.hoisted(() => ({ listCategories: vi.fn(), createProject: vi.fn() }));

vi.mock("@/services/projectsService", async (loadOriginal) => {
  const original = await loadOriginal<typeof import("@/services/projectsService")>();
  return {
    ...original,
    default: {
      ...original.default,
      listCategories: services.listCategories,
      createProject: services.createProject,
    },
  };
});

import StartProject from "@/pages/StartProject";

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

it("fills the selected example without submitting or inventing a category", async () => {
  window.scrollTo = vi.fn();
  services.listCategories.mockResolvedValue([{ id: "category-from-backend", name: "Agriculture", slug: "agriculture" }]);
  services.createProject.mockResolvedValue({ id: "project-1", slug: "modern-community-olive-press" });
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <StartProject />
      </QueryClientProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText("Demo Examples")).toBeInTheDocument();
  const fillButton = screen.getByRole("button", { name: "Fill Demo Data" });
  await waitFor(() => expect(fillButton).toBeEnabled());
  expect(fillButton).toHaveAttribute("type", "button");
  fireEvent.click(fillButton);

  expect(screen.getByLabelText(/Project title/i)).toHaveValue("Modern Community Olive Press");
  expect(screen.getByLabelText(/Category/i)).toHaveValue("category-from-backend");
  expect(services.createProject).not.toHaveBeenCalled();

  for (let step = 0; step < 4; step += 1) {
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
  }
  expect(screen.getByText("olive-press-business-plan.pdf")).toBeInTheDocument();
  expect(screen.getByText("olive-press-financial-projections.pdf")).toBeInTheDocument();
  expect(screen.getByText("olive-press-ownership-proof.pdf")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Next/i }));
  fireEvent.click(screen.getByRole("button", { name: /Next/i }));
  screen.getAllByRole("checkbox").forEach((checkbox) => fireEvent.click(checkbox));
  fireEvent.click(screen.getByRole("button", { name: /Submit for review/i }));

  await waitFor(() => expect(services.createProject).toHaveBeenCalledTimes(1));
  const payload = services.createProject.mock.calls[0][0];
  expect(payload.category).toBe("category-from-backend");
  expect(payload.business_plan).toEqual(expect.objectContaining({ name: "olive-press-business-plan.pdf", type: "application/pdf" }));
  expect(payload.financial_projections).toEqual(expect.objectContaining({ name: "olive-press-financial-projections.pdf", type: "application/pdf" }));
  expect(payload.ownership_proof).toEqual(expect.objectContaining({ name: "olive-press-ownership-proof.pdf", type: "application/pdf" }));
});

it("still fills demo fields when the clean database has no categories", async () => {
  services.listCategories.mockResolvedValue([]);

  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <StartProject />
      </QueryClientProvider>
    </MemoryRouter>,
  );

  const fillButton = await screen.findByRole("button", { name: "Fill Demo Data" });
  await waitFor(() => expect(fillButton).toBeEnabled());
  fireEvent.click(fillButton);

  expect(screen.getByLabelText(/Project title/i)).toHaveValue("Modern Community Olive Press");
  expect(screen.getByLabelText(/Category/i)).toHaveValue("");
  expect(screen.getByText(/administrator must create at least one project category/i)).toBeInTheDocument();
  expect(services.createProject).not.toHaveBeenCalled();
});
