import { messages } from "./messages.js";

export const LOCALE_STORAGE_KEY = "aghr.locale";
export const DEFAULT_LOCALE = "ar";

export function normalizeLocale(locale) {
  return locale === "en" ? "en" : DEFAULT_LOCALE;
}

export function readLocale(storage) {
  try {
    return normalizeLocale(storage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function directionFor(locale) {
  return normalizeLocale(locale) === "ar" ? "rtl" : "ltr";
}

export function translate(locale, key, values = {}) {
  const message = messages[key]?.[normalizeLocale(locale)];
  if (message == null) return key;
  // Function replacement keeps dollar signs and other user content literal.
  return message.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : match
  );
}
