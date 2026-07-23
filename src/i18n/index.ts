import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import ar from "./locales/ar/common.json";

export type SupportedLanguage = "en" | "ar";
export const LANGUAGE_STORAGE_KEY = "sahmi.language";
export const supportedLanguages: SupportedLanguage[] = ["en", "ar"];

const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const initialLanguage: SupportedLanguage = stored === "ar" ? "ar" : "en";

const applyDocumentLanguage = (language: string) => {
  const normalized: SupportedLanguage = language.startsWith("ar") ? "ar" : "en";
  document.documentElement.lang = normalized;
  document.documentElement.dir = normalized === "ar" ? "rtl" : "ltr";
  document.documentElement.dataset.language = normalized;
};

void i18n.use(initReactI18next).init({
  resources: { en: { common: en }, ar: { common: ar } },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  defaultNS: "common",
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentLanguage(initialLanguage);
i18n.on("languageChanged", (language) => {
  const normalized: SupportedLanguage = language.startsWith("ar") ? "ar" : "en";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  applyDocumentLanguage(normalized);
});

export const changeLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language);
};

export default i18n;