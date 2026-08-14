import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";

const mocks = vi.hoisted(() => ({ list: vi.fn(), unreadCount: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn(), subscribe: vi.fn(() => vi.fn()) }));
vi.mock("@/services/notificationService", () => ({ default: { list: mocks.list, unreadCount: mocks.unreadCount, markRead: mocks.markRead, markAllRead: mocks.markAllRead, subscribe: mocks.subscribe } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "me", full_name: "Me", user_type: "investor", is_staff: false }, logout: vi.fn() }) }));
import DashboardLayout from "@/pages/dashboard/DashboardLayout";

const renderLayout = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><DashboardLayout roleBase="/dashboard/investor"><div>Content</div></DashboardLayout></MemoryRouter></QueryClientProvider>);
beforeEach(async () => { await changeLanguage("en"); vi.clearAllMocks(); mocks.list.mockResolvedValue({ count: 1, results: [{ id: "n1", title: "New update", body: "Details", read_at: null, created_at: "2026-01-01", notification_type: "system", target_type: "", target_id: "" }] }); mocks.unreadCount.mockResolvedValue({ unread_count: 1 }); mocks.markRead.mockResolvedValue({ read: true }); mocks.markAllRead.mockResolvedValue({ marked_all_read: true }); });

describe("notifications", () => {
  it("loads notifications and marks one read", async () => {
    renderLayout(); fireEvent.click(await screen.findByLabelText(/Notifications/));
    fireEvent.click(await screen.findByText("System notification"));
    await waitFor(() => expect(mocks.markRead).toHaveBeenCalledWith("n1"));
  });
  it("renders dashboard notifications in Arabic", async () => {
    await changeLanguage("ar");
    renderLayout();
    fireEvent.click(await screen.findByLabelText(/الإشعارات/));
    expect(await screen.findByText("إشعار النظام")).toBeInTheDocument();
  });  it("marks all notifications read", async () => {
    renderLayout(); fireEvent.click(await screen.findByLabelText(/Notifications/));
    fireEvent.click(await screen.findByText("Mark all read"));
    await waitFor(() => expect(mocks.markAllRead).toHaveBeenCalledTimes(1));
  });
});
