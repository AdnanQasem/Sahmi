import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ listConversations: vi.fn(), listMessages: vi.fn(), sendMessage: vi.fn(), markRead: vi.fn() }));
vi.mock("@/services/messagingService", () => ({ default: { listConversations: mocks.listConversations, listMessages: mocks.listMessages, sendMessage: mocks.sendMessage, markRead: mocks.markRead, unreadCount: vi.fn() } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "me", full_name: "Me", user_type: "investor" } }) }));
vi.mock("@/pages/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

import MessagesPage from "@/pages/dashboard/MessagesPage";

const conversation = { id: "c1", kind: "direct", title: "", project: null, created_by: { id: "me", full_name: "Me", user_type: "investor" }, participants: [{ id: "p1", user: { id: "other", full_name: "Other User", user_type: "entrepreneur" }, joined_at: "2026-01-01", last_read_at: null, is_muted: false, is_archived: false }], last_message_preview: null, unread_count: 1, last_message_at: null, created_at: "2026-01-01" };
const renderPage = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MessagesPage /></QueryClientProvider>);

beforeEach(() => { vi.clearAllMocks(); mocks.markRead.mockResolvedValue({ marked_read: true }); mocks.listMessages.mockResolvedValue({ count: 0, results: [] }); });

describe("MessagesPage", () => {
  it("shows a loading state then loads conversations", async () => {
    let resolve!: (value: unknown) => void;
    mocks.listConversations.mockReturnValue(new Promise((done) => { resolve = done; }));
    renderPage();
    expect(screen.getByText(/Loading conversations/)).toBeInTheDocument();
    resolve({ count: 1, results: [conversation] });
    expect(await screen.findByText("Other User")).toBeInTheDocument();
  });

  it("sends a persistent message and prevents duplicate submits", async () => {
    mocks.listConversations.mockResolvedValue({ count: 1, results: [conversation] });
    let finish!: (value: unknown) => void;
    mocks.sendMessage.mockReturnValue(new Promise((done) => { finish = done; }));
    renderPage();
    fireEvent.click(await screen.findByText("Other User"));
    const input = await screen.findByLabelText("Message");
    fireEvent.change(input, { target: { value: "Hello" } });
    const button = screen.getByLabelText("Send message");
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(mocks.sendMessage).toHaveBeenCalledTimes(1));
    expect(mocks.sendMessage).toHaveBeenCalledWith("c1", "Hello");
    finish({ id: "m1", body: "Hello" });
    await waitFor(() => expect(input).toHaveValue(""));
  });
});