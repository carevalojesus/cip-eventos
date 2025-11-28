// Configuración de rutas según idioma
export const LOCALES = ['es', 'en'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'es';

// Rutas por idioma
export const routes = {
  es: {
    home: '/',
    login: '/iniciar-sesion',
    events: '/eventos',
    eventsNew: '/eventos/nuevo',
    eventsEdit: (id: string) => `/eventos/${id}/editar`,
  },
  en: {
    home: '/en',
    login: '/en/login',
    events: '/en/events',
    eventsNew: '/en/events/new',
    eventsEdit: (id: string) => `/en/events/${id}/edit`,
  },
} as const;

// Obtener idioma actual desde la URL o localStorage
export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const path = window.location.pathname;
  if (path.startsWith('/en')) return 'en';

  const stored = localStorage.getItem('i18nextLng');
  if (stored && LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  return DEFAULT_LOCALE;
}

// Obtener ruta según idioma actual
export function getRoute(key: keyof typeof routes.es, locale?: Locale): string {
  const lang = locale || getCurrentLocale();
  const route = routes[lang][key];
  return typeof route === 'function' ? '' : route;
}

// Obtener ruta con parámetros
export function getRouteWithParams(
  key: 'eventsEdit',
  params: { id: string },
  locale?: Locale
): string {
  const lang = locale || getCurrentLocale();
  return routes[lang][key](params.id);
}

// Navegar a ruta manteniendo el idioma
export function navigateTo(path: string): void {
  if (typeof window === 'undefined') return;
  window.location.href = path;
}

// Mapeo de rutas inversas (URL → clave de ruta)
export const routePatterns = {
  // Español (default)
  '/': { key: 'home', locale: 'es' },
  '/iniciar-sesion': { key: 'login', locale: 'es' },
  '/eventos': { key: 'events', locale: 'es' },
  '/eventos/nuevo': { key: 'eventsNew', locale: 'es' },
  // Inglés
  '/en': { key: 'home', locale: 'en' },
  '/en/login': { key: 'login', locale: 'en' },
  '/en/events': { key: 'events', locale: 'en' },
  '/en/events/new': { key: 'eventsNew', locale: 'en' },
} as const;

// Detectar qué página es según la URL
export function getPageFromPath(path: string): { key: string; locale: Locale } | null {
  // Normalizar path
  const normalizedPath = path.endsWith('/') && path !== '/'
    ? path.slice(0, -1)
    : path;

  // Buscar coincidencia exacta
  const exactMatch = routePatterns[normalizedPath as keyof typeof routePatterns];
  if (exactMatch) return { ...exactMatch, locale: exactMatch.locale as Locale };

  // Buscar patrones con parámetros
  if (normalizedPath.match(/^\/eventos\/[^/]+\/editar$/)) {
    return { key: 'eventsEdit', locale: 'es' };
  }
  if (normalizedPath.match(/^\/en\/events\/[^/]+\/edit$/)) {
    return { key: 'eventsEdit', locale: 'en' };
  }

  return null;
}

// Cambiar idioma y redirigir a la misma página en otro idioma
export function switchLocale(newLocale: Locale): void {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  const currentPage = getPageFromPath(currentPath);

  if (!currentPage) {
    // Si no se reconoce la ruta, ir al home del nuevo idioma
    navigateTo(routes[newLocale].home);
    return;
  }

  // Obtener la ruta equivalente en el nuevo idioma
  const newRoute = routes[newLocale][currentPage.key as keyof typeof routes.es];
  if (typeof newRoute === 'string') {
    localStorage.setItem('i18nextLng', newLocale);
    navigateTo(newRoute);
  } else {
    navigateTo(routes[newLocale].home);
  }
}
