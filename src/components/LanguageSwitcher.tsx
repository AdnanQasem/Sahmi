import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { changeLanguage, SupportedLanguage } from "@/i18n";
import authService from "@/services/authService";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps { compact?: boolean; className?: string; }

const LanguageSwitcher = ({ compact = false, className }: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation();
  const current: SupportedLanguage = i18n.resolvedLanguage === "ar" ? "ar" : "en";
  const select = async (language: SupportedLanguage) => {
    if (language === current) return;
    await changeLanguage(language);
    if (localStorage.getItem("accessToken")) {
      try { await authService.updateCurrentUser({ preferred_language: language }); } catch { /* local fallback remains active */ }
    }
  };
  return <div dir="ltr" className={cn("inline-flex shrink-0 flex-row items-center gap-1 rounded-lg border border-border bg-background p-1", className)} role="group" aria-label={t("language.switchTo")}>
    {!compact && <Languages className="mx-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />}
    {(["ar", "en"] as const).map((language) => <button key={language} type="button" lang={language} dir={language === "ar" ? "rtl" : "ltr"} aria-pressed={current === language} onClick={() => void select(language)} className={cn("rounded-md px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", current === language ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{language === "en" ? t("language.english") : t("language.arabic")}</button>)}
  </div>;
};

export default LanguageSwitcher;