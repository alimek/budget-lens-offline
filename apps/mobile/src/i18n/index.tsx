import type { Language, LanguagePreference } from "@budget-lens/core";
import { useLocales } from "expo-localization";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "./create-i18n";
import { resolveLanguage } from "./language";

/** Where the language preference is kept; settings persistence (#78) and the `bl.lang` mirror (#36) provide it. */
type LanguagePreferenceStore = {
  load(): LanguagePreference | undefined;
  save(preference: LanguagePreference): void;
};

type AppLanguage = {
  /** The resolved UI language. */
  readonly language: Language;
  readonly preference: LanguagePreference;
  /** Switches the UI language at runtime, without a restart. */
  readonly setLanguagePreference: (preference: LanguagePreference) => void;
};

const AppLanguageContext = createContext<AppLanguage | null>(null);

/** Without a `preferenceStore` the preference starts as `"system"` and lives in memory only. */
export function I18nProvider({
  children,
  preferenceStore,
}: PropsWithChildren<{ preferenceStore?: LanguagePreferenceStore }>) {
  const deviceLanguageCode = useLocales()[0]?.languageCode;
  const [preference, setPreference] = useState<LanguagePreference>(
    () => preferenceStore?.load() ?? "system",
  );
  const language = resolveLanguage(preference, deviceLanguageCode);
  const [i18n] = useState(() => createI18n(language));
  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [i18n, language]);
  const setLanguagePreference = useCallback(
    (next: LanguagePreference) => {
      preferenceStore?.save(next);
      // Switch before the re-render so `t()` and `language` change in the same frame.
      void i18n.changeLanguage(resolveLanguage(next, deviceLanguageCode));
      setPreference(next);
    },
    [i18n, deviceLanguageCode, preferenceStore],
  );
  const value = useMemo(
    () => ({ language, preference, setLanguagePreference }),
    [language, preference, setLanguagePreference],
  );
  return (
    <AppLanguageContext.Provider value={value}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </AppLanguageContext.Provider>
  );
}

/** The UI language, the user's preference (`"system"`, `"en"` or `"pl"`) and the setter for the in-app override. */
export function useAppLanguage(): AppLanguage {
  const value = useContext(AppLanguageContext);
  if (value === null) throw new Error("useAppLanguage must be used inside I18nProvider");
  return value;
}
