import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { type PropsWithChildren, useState } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pl from "./locales/pl.json";

export function I18nProvider({ children }: PropsWithChildren) {
  const [i18n] = useState(() => {
    const instance = createInstance();
    void instance.use(initReactI18next).init({
      resources: { en: { translation: en }, pl: { translation: pl } },
      lng: getLocales()[0]?.languageCode ?? "en",
      fallbackLng: "en",
      supportedLngs: ["en", "pl"],
      initAsync: false,
      interpolation: { escapeValue: false },
    });
    return instance;
  });
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
