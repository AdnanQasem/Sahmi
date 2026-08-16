import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  login: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useScroll: () => ({ scrollYProgress: 0 }),
    useTransform: () => 0,
  };
});

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.login.mockReset();
  authState.login.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderLogin = () => render(
  <MemoryRouter initialEntries={[{
    pathname: "/login",
    state: { from: { pathname: "/projects/example-project" } },
  }]}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<div>Dashboard landing</div>} />
      <Route path="/projects/:slug" element={<div>Previous protected page</div>} />
    </Routes>
  </MemoryRouter>,
);

describe("login dashboard destination", () => {
  it("always sends a successful login to the dashboard", async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(authState.login).toHaveBeenCalledWith("person@example.com", "password");
      expect(screen.getByText("Dashboard landing")).toBeInTheDocument();
    });
    expect(screen.queryByText("Previous protected page")).not.toBeInTheDocument();
  });

  it("sends an already authenticated visitor away from login to the dashboard", () => {
    authState.isAuthenticated = true;
    renderLogin();

    expect(screen.getByText("Dashboard landing")).toBeInTheDocument();
    expect(screen.queryByText("Previous protected page")).not.toBeInTheDocument();
  });
});
