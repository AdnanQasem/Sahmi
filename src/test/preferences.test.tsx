import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getPreferences: vi.fn(), savePreferences: vi.fn() }));
vi.mock("@/services/notificationService", () => ({ default: { getPreferences: mocks.getPreferences, savePreferences: mocks.savePreferences } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "me", email: "me@example.com", full_name: "Me", user_type: "investor" } }) }));
vi.mock("@/pages/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
import SettingsPage from "@/pages/dashboard/SettingsPage";
const prefs = { in_app_enabled: true, email_enabled: false, message_notifications: true, project_notifications: true, investment_notifications: true, milestone_notifications: true, repayment_notifications: true };
beforeEach(() => { vi.clearAllMocks(); mocks.getPreferences.mockResolvedValue(prefs); mocks.savePreferences.mockImplementation(async (value) => value); });
it("loads and persistently saves notification preferences", async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><SettingsPage /></QueryClientProvider>);
  fireEvent.click(screen.getByText("Notifications"));
  expect(await screen.findByText("Project Updates")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Email Notifications").parentElement!.parentElement!.nextElementSibling!);
  fireEvent.click(screen.getByText("Save Changes"));
  await waitFor(() => expect(mocks.savePreferences).toHaveBeenCalledWith(expect.objectContaining({ email_enabled: true })));
});