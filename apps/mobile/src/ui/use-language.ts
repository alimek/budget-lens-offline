import type { Language } from "@budget-lens/core";
import { useAppLanguage } from "@/i18n";

/** The app language for `Intl` formatting: `pl` when the UI is Polish, `en` otherwise. */
export function useLanguage(): Language {
  return useAppLanguage().language;
}
