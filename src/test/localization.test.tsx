import React from "react";
import { useTranslation } from "react-i18next";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n, { changeLanguage, LANGUAGE_STORAGE_KEY } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/dashboard/StatusBadge";


const auth = vi.hoisted(() => ({ updateCurrentUser: vi.fn() }));
vi.mock("@/services/authService", () => ({ default: { updateCurrentUser: auth.updateCurrentUser } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, isAuthenticated: false, logout: vi.fn() }) }));

const LocalizedForm = () => {
  const { t } = useTranslation();
  return <form><label htmlFor="localized-email">{t("auth.email")}</label><input id="localized-email" placeholder={t("auth.email")} /></form>;
};
beforeEach(async () => {
  localStorage.clear();
  auth.updateCurrentUser.mockReset();
  await changeLanguage("en");
});

describe("English and Arabic localization", () => {
  it("switches both directions, updates document metadata, and persists", async () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: "العربية" }));
    await waitFor(() => expect(document.documentElement.lang).toBe("ar"));
    expect(document.documentElement.dir).toBe("rtl");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ar");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    await waitFor(() => expect(document.documentElement.lang).toBe("en"));
    expect(document.documentElement.dir).toBe("ltr");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
  });

  it("renders Arabic navigation and enum labels", async () => {
    await changeLanguage("ar");
    render(<MemoryRouter><Navbar /><StatusBadge status="pending" /></MemoryRouter>);
    expect(screen.getAllByText("الرئيسية").length).toBeGreaterThan(0);
    expect(screen.getByText("قيد الانتظار")).toBeInTheDocument();
  });


  it("renders an authentication form in Arabic", async () => {
    await changeLanguage("ar");
    render(<LocalizedForm />);
    expect(screen.getByLabelText("البريد الإلكتروني")).toBeInTheDocument();
  });
  it("keeps the persisted locale available to a refreshed application", async () => {
    await changeLanguage("ar");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ar");
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    await i18n.changeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)!);
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });
});