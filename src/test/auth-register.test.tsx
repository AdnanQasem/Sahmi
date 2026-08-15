import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/services/authService", () => ({
  default: {
    register: mocks.register,
    getCurrentUser: mocks.getCurrentUser,
    logout: mocks.logout,
    login: vi.fn(),
  },
}));

const Probe = () => {
  const { register, user } = useAuth();
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
      <span>{user?.email ?? "signed out"}</span>
    </div>
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

it("stores registration tokens and signs the new user in", async () => {
  mocks.register.mockResolvedValue({
    access: "new-access-token",
    refresh: "new-refresh-token",
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

  expect(await screen.findByText("new@example.com")).toBeInTheDocument();
  await waitFor(() => {
    expect(localStorage.getItem("accessToken")).toBe("new-access-token");
    expect(localStorage.getItem("refreshToken")).toBe("new-refresh-token");
  });
});
