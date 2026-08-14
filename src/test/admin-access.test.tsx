import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardRedirect from "@/pages/dashboard/DashboardRedirect";

const authState = vi.hoisted(() => ({
  isAuthenticated: true,
  loading: false,
  user: {
    id: "user-1",
    username: "user",
    email: "user@example.com",
    full_name: "Test User",
    user_type: "investor" as const,
    is_staff: false,
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

afterEach(() => {
  cleanup();
  authState.isAuthenticated = true;
  authState.loading = false;
  authState.user.is_staff = false;
});

describe("admin route access", () => {
  it("allows a backend-confirmed staff user into the admin route", () => {
    authState.user.is_staff = true;

    render(
      <MemoryRouter initialEntries={["/dashboard/admin"]}>
        <Routes>
          <Route element={<ProtectedRoute requireStaff redirectTo="/dashboard" />}>
            <Route path="/dashboard/admin" element={<div>Admin workspace content</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Role dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin workspace content")).toBeInTheDocument();
  });

  it("redirects a non-staff user away from the admin route", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/admin"]}>
        <Routes>
          <Route element={<ProtectedRoute requireStaff redirectTo="/dashboard" />}>
            <Route path="/dashboard/admin" element={<div>Admin workspace content</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Role dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Role dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin workspace content")).not.toBeInTheDocument();
  });

  it("sends staff users to the admin workspace even when their account type is investor", () => {
    authState.user.is_staff = true;

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard/admin" element={<div>Admin landing page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin landing page")).toBeInTheDocument();
  });
});
