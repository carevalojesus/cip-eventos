// Utilidades para usar i18n en componentes no-React (Astro, etc.)
import i18n from "./index";

/**
 * Obtiene una traducción en el idioma actual
 * @param key - La clave de traducción (ej: "login.title")
 * @param options - Opciones de interpolación (ej: { name: "Juan" })
 */
export function t(key: string, options?: Record<string, unknown>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return i18n.t(key, options as any);
}

/**
 * Cambia el idioma de la aplicación
 * @param lng - Código de idioma (ej: "es", "en")
 */
export function changeLanguage(lng: string) {
  return i18n.changeLanguage(lng);
}

/**
 * Obtiene el idioma actual
 */
export function getCurrentLanguage() {
  return i18n.language;
}

/**
 * Obtiene todos los idiomas disponibles
 */
export function getAvailableLanguages() {
  return Object.keys(i18n.options.resources || {});
}
