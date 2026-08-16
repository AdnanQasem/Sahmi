import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";
import VerifyEmailPage from "@/pages/VerifyEmailPage";

const services = vi.hoisted(() => ({ verifyEmail: vi.fn(), resendEmailVerification: vi.fn() }));

vi.mock("@/services/authService", () => ({
  default: {
    resendEmailVerification: services.resendEmailVerification,
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ verifyEmail: services.verifyEmail }),
}));

beforeEach(async () => {
  await changeLanguage("en");
  vi.clearAllMocks();
});

it("confirms an email from the secure registration link", async () => {
  services.verifyEmail.mockResolvedValue(undefined);
  render(<MemoryRouter initialEntries={["/verify-email?uid=user-token&token=secure-token"]}><VerifyEmailPage /></MemoryRouter>);

  expect(await screen.findByText("Email confirmed")).toBeInTheDocument();
  expect(services.verifyEmail).toHaveBeenCalledWith("user-token", "secure-token");
  expect(screen.getByRole("link", { name: "Continue to dashboard" })).toHaveAttribute("href", "/dashboard");
});

it("allows a user to request another confirmation link", async () => {
  services.verifyEmail.mockRejectedValue(new Error("expired"));
  services.resendEmailVerification.mockResolvedValue({ message: "sent" });
  render(<MemoryRouter initialEntries={["/verify-email?uid=user-token&token=expired-token"]}><VerifyEmailPage /></MemoryRouter>);

  expect(await screen.findByText("Confirmation link unavailable")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Send a new confirmation link" }));
  await waitFor(() => expect(services.resendEmailVerification).toHaveBeenCalledWith("person@example.com"));
  expect(screen.getByText("If this account needs confirmation, a new link has been sent.")).toBeInTheDocument();
});
