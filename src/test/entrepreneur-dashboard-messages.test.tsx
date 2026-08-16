import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, expect, it, vi } from "vitest";
import EntrepreneurDashboard from "@/pages/dashboard/EntrepreneurDashboard";

const services = vi.hoisted(() => ({
  listProjects: vi.fn().mockResolvedValue({ count: 0, results: [] }),
  listInvestments: vi.fn().mockResolvedValue({ count: 0, results: [] }),
  listConversations: vi.fn().mockResolvedValue({
    count: 1,
    results: [{
      id: "conversation-1",
      kind: "direct",
      title: "",
      project: null,
      created_by: { id: "investor-1", full_name: "Alice Backend", user_type: "investor" },
      participants: [
        { id: "participant-1", user: { id: "owner-1", full_name: "Owner", user_type: "entrepreneur" }, joined_at: "2026-01-01", last_read_at: null, is_muted: false, is_archived: false },
        { id: "participant-2", user: { id: "investor-1", full_name: "Alice Backend", user_type: "investor" }, joined_at: "2026-01-01", last_read_at: null, is_muted: false, is_archived: false },
      ],
      last_message_preview: { id: "message-1", sender_id: "investor-1", preview: "A real backend message", created_at: new Date().toISOString() },
      unread_count: 2,
      last_message_at: new Date().toISOString(),
      created_at: "2026-01-01",
    }],
  }),
}));

vi.mock("@/services/projectsService", () => ({ default: { listMyProjects: services.listProjects } }));
vi.mock("@/services/investmentsService", () => ({ default: { listInvestments: services.listInvestments } }));
vi.mock("@/services/messagingService", () => ({ default: { listConversations: services.listConversations } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "owner-1", full_name: "Owner", user_type: "entrepreneur" } }) }));
vi.mock("@/pages/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

it("renders entrepreneur dashboard messages from backend conversations", async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EntrepreneurDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  expect(await screen.findByText("Alice Backend")).toBeInTheDocument();
  expect(screen.getByText("A real backend message")).toBeInTheDocument();
  expect(services.listConversations).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Alice Backend").closest("a"))
    .toHaveAttribute("href", "/dashboard/entrepreneur/messages?conversation=conversation-1");
  queryClient.clear();
});
