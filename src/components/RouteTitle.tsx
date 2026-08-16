import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const RouteTitle = () => {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    let title = "Sahmi";
    if (pathname === "/") title = t("nav.home");
    else if (pathname === "/projects") title = t("projects.title");
    else if (pathname.startsWith("/projects/") && pathname.endsWith("/edit")) title = t("projects.editTitle");
    else if (pathname.startsWith("/projects/")) title = t("projects.projectDetails");
    else if (pathname === "/start-project") title = t("projects.startTitle");
    else if (pathname === "/about") title = t("info.aboutTitle");
    else if (pathname === "/contact") title = t("info.contactTitle");
    else if (pathname === "/how-it-works") title = t("home.howTitle");
    else if (pathname === "/privacy") title = t("legal.privacy.title");
    else if (pathname === "/terms") title = t("legal.terms.title");
    else if (pathname === "/login") title = t("auth.loginTitle");
    else if (pathname === "/register") title = t("auth.registerTitle");
    else if (pathname.includes("/messages")) title = t("messages.title");
    else if (pathname.includes("/notifications")) title = t("notifications.title");
    else if (pathname.includes("/settings")) title = t("settings.title");
    else if (pathname.includes("/funds")) title = t("funds.title");
    else if (pathname.includes("/dashboard/admin/investments")) title = t("admin.investments");
    else if (pathname.includes("/investments")) title = t("dashboard.myInvestments");
    else if (pathname.includes("/milestones")) title = t("settings.milestones");
    else if (pathname.includes("/repayments")) title = t("repaymentDashboard.title");
    else if (pathname.includes("/analytics")) title = t("dashboard.analytics");
    else if (pathname.includes("/investors")) title = t("dashboard.investors");
    else if (pathname.includes("/dashboard")) title = t("nav.dashboard");
    document.title = title === "Sahmi" ? title : `${title} | Sahmi`;
  }, [i18n.resolvedLanguage, pathname, t]);

  return null;
};

export default RouteTitle;
