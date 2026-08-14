import i18n, { SupportedLanguage } from "./index";

const localeFor = (language?: string) => (language ?? i18n.resolvedLanguage) === "ar" ? "ar-PS" : "en-US";

export const formatDate = (value: string | number | Date, options: Intl.DateTimeFormatOptions = {}, language?: string) =>
  new Intl.DateTimeFormat(localeFor(language), { numberingSystem: "latn", ...options }).format(new Date(value));

export const formatNumber = (value: number | string, options: Intl.NumberFormatOptions = {}, language?: string) =>
  new Intl.NumberFormat(localeFor(language), { numberingSystem: "latn", ...options }).format(Number(value));

export const formatPercent = (value: number | string, language?: string) =>
  new Intl.NumberFormat(localeFor(language), { style: "percent", maximumFractionDigits: 1, numberingSystem: "latn" }).format(Number(value) / 100);

export const formatCurrency = (value: number | string, currency = "USD", language?: string) =>
  new Intl.NumberFormat(localeFor(language), { style: "currency", currency, currencyDisplay: "symbol", numberingSystem: "latn" }).format(Number(value));