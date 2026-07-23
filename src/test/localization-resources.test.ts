import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ar from "@/i18n/locales/ar/common.json";
import en from "@/i18n/locales/en/common.json";

const majorWorkflows = [
  "src/components/Navbar.tsx", "src/components/Footer.tsx", "src/pages/HomePage.tsx",
  "src/pages/BrowseProjects.tsx", "src/pages/ProjectDetails.tsx", "src/pages/LoginPage.tsx",
  "src/pages/RegisterPage.tsx", "src/pages/StartProject.tsx", "src/pages/EditProject.tsx",
  "src/pages/dashboard/InvestorDashboard.tsx", "src/pages/dashboard/EntrepreneurDashboard.tsx",
  "src/pages/dashboard/InvestorTransactionsPage.tsx", "src/pages/dashboard/MessagesPage.tsx",
  "src/pages/dashboard/SettingsPage.tsx", "src/pages/dashboard/DashboardLayout.tsx",
];

describe("localization resource coverage", () => {
  it("has matching major namespaces and no legacy placeholder arrays", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    const source = majorWorkflows.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/mockConversations|mockMessages|recentNotifications/);
    for (const file of majorWorkflows) expect(readFileSync(file, "utf8")).toContain("useTranslation");
  });
});