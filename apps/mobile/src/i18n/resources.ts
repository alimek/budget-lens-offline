import enItems from "./locales/en/items.json";
import enTranslation from "./locales/en/translation.json";
import plItems from "./locales/pl/items.json";
import plTranslation from "./locales/pl/translation.json";

/** The namespace `useTranslation()` uses when none is given; it holds the app shell and shared strings. */
export const defaultNS = "translation";

/**
 * Bundled resources, one JSON file per language and namespace (`locales/<language>/<namespace>.json`). English is the
 * source of truth and defines the typed keys; Polish may lag behind, and its missing keys fall back to English.
 * A feature namespace is registered here for both languages.
 */
export const resources = {
  en: { translation: enTranslation, items: enItems },
  pl: { translation: plTranslation, items: plItems },
} as const;
