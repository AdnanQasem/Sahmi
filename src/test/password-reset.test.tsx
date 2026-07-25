import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";

const mocks = vi.hoisted(() => ({ request: vi.fn(), confirm: vi.fn() }));
vi.mock("@/services/authService", () => ({
  default: {
    requestPasswordReset: mocks.request,
    confirmPasswordReset: mocks.confirm,
  },
}));

import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

beforeEach(async () => {
  await changeLanguage("en");
  vi.clearAllMocks();
});

describe("password reset", () => {
  it("requests a reset link without exposing account existence", async () => {
    mocks.request.mockResolvedValue({ message: "sent" });
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(mocks.request).toHaveBeenCalledWith("user@example.com"));
    expect(await screen.findByText(/If an active account exists/)).toBeInTheDocument();
  });

  it("submits the uid, token, and matching new password", async () => {
    mocks.confirm.mockResolvedValue({ message: "Password reset successfully." });
    render(<MemoryRouter initialEntries={["/reset-password?uid=user-id&token=one-time-token"]}><ResetPasswordPage /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "NewStrongPassword456!" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "NewStrongPassword456!" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith({
      uid: "user-id",
      token: "one-time-token",
      new_password: "NewStrongPassword456!",
      confirm_password: "NewStrongPassword456!",
    }));
    expect(await screen.findByText(/Your password has been reset/)).toBeInTheDocument();
  });
});
