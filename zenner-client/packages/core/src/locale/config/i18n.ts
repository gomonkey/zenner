import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "../en.json";
import viTranslation from "../vi.json";

const resources = {
  en: { translation: enTranslation },
  vi: { translation: viTranslation },
};

export function initI18n(defaultLang: string = "en") {
  i18n.use(initReactI18next).init({
    resources,
    lng: defaultLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
  return i18n;
}

export { i18n };
