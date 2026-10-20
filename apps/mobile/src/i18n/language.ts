import type { Language, LanguagePreference } from "@budget-lens/core";

const isLanguage = (code: string | null | undefined): code is Language =>
  code === "en" || code === "pl";

/**
 * The UI language for a preference: an explicit choice wins; `"system"` follows the device (per-app) language and
 * falls back to English when the device language is not supported.
 */
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguageCode: string | null | undefined,
): Language {
  if (preference !== "system") return preference;
  return isLanguage(deviceLanguageCode) ? deviceLanguageCode : "en";
}
