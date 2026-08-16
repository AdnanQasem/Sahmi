import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock("@/services/authService", () => ({
  default: {
    register: mocks.register,
    getCurrentUser: mocks.getCurrentUser,
    logout: mocks.logout,
    login: vi.fn(),
    verifyEmail: mocks.verifyEmail,
  },
}));

const Probe = () => {
  const { register, verifyEmail, user } = useAuth();
  return (
    <div>
      <button
        onClick={() => register({
          email: "new@example.com",
          full_name: "New User",
          password: "password",
          user_type: "investor",
        })}
      >
        Register
      </button>
      <button onClick={() => verifyEmail("pending-id", "verification-token")}>Verify</button>
      <span>{user?.email ?? "signed out"}</span>
    </div>
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

it("keeps registration signed out until the email link is verified", async () => {
  mocks.register.mockResolvedValue({
    message: "Check your email",
    email_confirmation_sent: true,
  });
  mocks.verifyEmail.mockResolvedValue({
    access: "new-access-token",
    refresh: "new-refresh-token",
    message: "verified",
    user: {
      id: "user-1",
      username: "new@example.com",
      email: "new@example.com",
      full_name: "New User",
      user_type: "investor",
      is_staff: false,
      preferred_language: "en",
    },
  });

  render(<AuthProvider><Probe /></AuthProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Register" }));

  await waitFor(() => expect(mocks.register).toHaveBeenCalled());
  expect(screen.getByText("signed out")).toBeInTheDocument();
  expect(localStorage.getItem("accessToken")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Verify" }));
  expect(await screen.findByText("new@example.com")).toBeInTheDocument();
  await waitFor(() => {
    expect(localStorage.getItem("accessToken")).toBe("new-access-token");
    expect(localStorage.getItem("refreshToken")).toBe("new-refresh-token");
  });
});
