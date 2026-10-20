import type { Language } from "@budget-lens/core";
import { useTranslation } from "react-i18next";

/** The app language for `Intl` formatting: `pl` when the UI is Polish, `en` otherwise. */
export function useLanguage(): Language {
  const { i18n } = useTranslation();
  return i18n.language === "pl" ? "pl" : "en";
}
