// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import es from "./locales/es.json";
import en from "./locales/en.json";

// Definimos los recursos
const resources = {
  es: {
    translation: es,
  },
  en: {
    translation: en,
  },
};

i18n
  .use(LanguageDetector) // Detecta idioma del navegador
  .use(initReactI18next) // Pasa la instancia a React
  .init({
    resources,
    fallbackLng: "es",
    debug: import.meta.env.DEV, // Debug en desarrollo
    detection: {
      order: ["localStorage", "navigator"], // Primero localStorage, luego navegador
      caches: ["localStorage"], // Persistir en localStorage
    },
    interpolation: {
      escapeValue: false, // React ya protege contra XSS
    },
  });

export default i18n;
