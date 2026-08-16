import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";
import StartProject from "@/pages/StartProject";

const services = vi.hoisted(() => ({
  listCategories: vi.fn(),
  createProject: vi.fn(),
}));

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

beforeEach(async () => {
  await changeLanguage("en");
  sessionStorage.clear();
  vi.clearAllMocks();
  services.listCategories.mockResolvedValue([{ id: "loaded-category", name: "Agriculture", slug: "agriculture" }]);
});

it("shows demo controls only under the exact flag and never submits while filling", async () => {
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <StartProject />
      </QueryClientProvider>
    </MemoryRouter>,
  );

  const enabled = import.meta.env.VITE_DEMO_MODE === "true";
  if (!enabled) {
    expect(screen.queryByText("Demo Examples")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fill Demo Data" })).not.toBeInTheDocument();
    return;
  }

  expect(await screen.findByText("Demo Examples")).toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Fill Demo Data" });
  await waitFor(() => expect(button).toBeEnabled());
  expect(button).toHaveAttribute("type", "button");
  fireEvent.click(button);

  expect(screen.getByLabelText("Project Title")).toHaveValue("Modern Community Olive Press");
  expect(screen.getByLabelText("Category")).toHaveValue("loaded-category");
  expect(services.createProject).not.toHaveBeenCalled();
});
