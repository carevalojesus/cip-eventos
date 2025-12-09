import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/eventos', '/dashboard', '/en/events', '/en/dashboard'];

  // Verificar si la ruta actual comienza con alguna de las rutas protegidas
  const isProtectedRoute = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Verificar si existe el refresh_token (indicador de sesión activa)
    // El access token está en memoria/sessionStorage, pero el refresh_token está en cookie httpOnly
    const hasSession = cookies.has('refresh_token');

    if (!hasSession) {
      // Si no hay sesión, redirigir al login correspondiente al idioma
      const isEnglish = url.pathname.startsWith('/en');
      return redirect(isEnglish ? '/en/login' : '/iniciar-sesion');
    }
  }

  // Continuar con la petición
  return next();
});
