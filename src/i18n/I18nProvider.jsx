import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { directionFor, LOCALE_STORAGE_KEY, normalizeLocale, readLocale, translate } from "./locale.js";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      return readLocale(window.localStorage);
    } catch {
      return "ar";
    }
  });
  const value = useMemo(() => ({
    locale,
    dir: directionFor(locale),
    setLocale: (next) => setLocaleState(normalizeLocale(next)),
    t: (key, values) => translate(locale, key, values),
  }), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = directionFor(locale);
    document.title = translate(locale, "app.title");
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // The selector still works when browser storage is unavailable.
    }
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n requires I18nProvider");
  return context;
}
