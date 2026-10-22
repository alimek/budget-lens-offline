import type { Language } from "@budget-lens/core";
import { createInstance, type i18n, type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import { formatMonthName } from "./format-month-name";
import { resources as bundledResources, defaultNS } from "./resources";

/** An initialized i18next instance; init is synchronous because every resource is bundled. */
export function createI18n(language: Language, resources: Resource = bundledResources): i18n {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "en",
    supportedLngs: ["en", "pl"],
    defaultNS,
    initAsync: false,
    // Empty placeholders (e.g. written by `i18next-cli extract` for Polish) fall back to English too.
    returnEmptyString: false,
    interpolation: { escapeValue: false },
  });
  // Registered once for every namespace: `{{month, monthName(case: genitive)}}` (#63, decision 5).
  instance.services.formatter?.add("monthName", formatMonthName);
  return instance;
}
