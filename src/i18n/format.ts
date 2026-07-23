import i18n, { SupportedLanguage } from "./index";

const localeFor = (language?: string) => (language ?? i18n.resolvedLanguage) === "ar" ? "ar-PS" : "en-US";

export const formatDate = (value: string | number | Date, options: Intl.DateTimeFormatOptions = {}, language?: SupportedLanguage) =>
  new Intl.DateTimeFormat(localeFor(language), options).format(new Date(value));

export const formatNumber = (value: number | string, options: Intl.NumberFormatOptions = {}, language?: SupportedLanguage) =>
  new Intl.NumberFormat(localeFor(language), options).format(Number(value));

export const formatPercent = (value: number | string, language?: SupportedLanguage) =>
  new Intl.NumberFormat(localeFor(language), { style: "percent", maximumFractionDigits: 1 }).format(Number(value) / 100);

export const formatCurrency = (value: number | string, currency = "USD", language?: SupportedLanguage) =>
  new Intl.NumberFormat(localeFor(language), { style: "currency", currency, currencyDisplay: "symbol" }).format(Number(value));