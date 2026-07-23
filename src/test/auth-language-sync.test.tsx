import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthProvider } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), logout: vi.fn() }));
vi.mock("@/services/authService", () => ({ default: {
  getCurrentUser: mocks.getCurrentUser, logout: mocks.logout,
  login: vi.fn(), register: vi.fn(),
} }));

const Probe = () => { const { t } = useTranslation(); return <span>{t("nav.home")}</span>; };

beforeEach(async () => { localStorage.clear(); localStorage.setItem("accessToken", "token"); await changeLanguage("en"); });

it("synchronizes the authenticated preference before exposing the signed-in language", async () => {
  mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@example.com", full_name: "A", user_type: "investor", is_staff: false, preferred_language: "ar" });
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(await screen.findByText("الرئيسية")).toBeInTheDocument();
  await waitFor(() => expect(document.documentElement.dir).toBe("rtl"));
});