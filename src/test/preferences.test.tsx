import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";
const mocks = vi.hoisted(() => ({
  user: { id: "me", email: "me@example.com", full_name: "Me", user_type: "investor" as const, preferred_language: "en" as const },
  getPreferences: vi.fn(), savePreferences: vi.fn(), updateCurrentUser: vi.fn(), changePassword: vi.fn(), uploadProfilePicture: vi.fn(),
}));
vi.mock("@/services/authService", () => ({ default: { updateCurrentUser: mocks.updateCurrentUser, changePassword: mocks.changePassword, uploadProfilePicture: mocks.uploadProfilePicture } }));
vi.mock("@/services/notificationService", () => ({ default: { getPreferences: mocks.getPreferences, savePreferences: mocks.savePreferences } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/pages/dashboard/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
import SettingsPage from "@/pages/dashboard/SettingsPage";
const prefs = { in_app_enabled: true, email_enabled: false, message_notifications: true, project_notifications: true, investment_notifications: true, milestone_notifications: true, repayment_notifications: true };
beforeEach(async () => { vi.clearAllMocks(); await changeLanguage("en"); mocks.user.preferred_language = "en"; mocks.getPreferences.mockResolvedValue(prefs); mocks.savePreferences.mockImplementation(async (value) => value); mocks.updateCurrentUser.mockImplementation(async (value) => ({ ...mocks.user, ...value })); mocks.changePassword.mockResolvedValue({ message: "ok" }); });
it("loads and persistently saves notification preferences", async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><SettingsPage /></QueryClientProvider>);
  fireEvent.click(screen.getByText("Notifications"));
  expect(await screen.findByText("Project Updates")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("switch", { name: "Email Notifications" }));
  fireEvent.click(screen.getByText("Save Changes"));
  await waitFor(() => expect(mocks.savePreferences).toHaveBeenCalledWith(expect.objectContaining({ email_enabled: true })));
});
it("persists the selected language from settings", async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><SettingsPage /></QueryClientProvider>);
  fireEvent.click(screen.getByText("Account"));
  const language = await screen.findByLabelText("Language");
  fireEvent.change(language, { target: { value: "ar" } });
  await waitFor(() => expect(mocks.updateCurrentUser).toHaveBeenCalledWith({ preferred_language: "ar" }));
  expect(document.documentElement.lang).toBe("ar");
  expect(document.documentElement.dir).toBe("rtl");
});
it("persists profile and account fields through the authenticated user API", async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><SettingsPage /></QueryClientProvider>);
  fireEvent.change(screen.getByDisplayValue("Me"), { target: { value: "Updated Name" } });
  fireEvent.click(screen.getByText("Save Changes"));
  await waitFor(() => expect(mocks.updateCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ full_name: "Updated Name", risk_preference: "medium" })));

  fireEvent.click(screen.getByText("Account"));
  fireEvent.change(screen.getByDisplayValue("me@example.com"), { target: { value: "new@example.com" } });
  fireEvent.click(screen.getByText("Save Changes"));
  await waitFor(() => expect(mocks.updateCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com", timezone: "Asia/Hebron" })));
});
it("changes passwords through the backend and does not show unsupported billing or 2FA", async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><SettingsPage /></QueryClientProvider>);
  expect(screen.queryByText("Billing")).not.toBeInTheDocument();
  expect(screen.queryByText("Two-Factor Authentication")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Security"));
  const passwords = screen.getAllByDisplayValue("");
  fireEvent.change(passwords[0], { target: { value: "OldStrongPassword123!" } });
  fireEvent.change(passwords[1], { target: { value: "NewStrongPassword456!" } });
  fireEvent.change(passwords[2], { target: { value: "NewStrongPassword456!" } });
  fireEvent.click(screen.getByText("Save Changes"));
  await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith(expect.objectContaining({ current_password: "OldStrongPassword123!", new_password: "NewStrongPassword456!" })));
});
