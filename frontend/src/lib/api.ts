import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { getCurrentLocale, routes } from '@/lib/routes';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante: enviar cookies en todas las peticiones
});

// Flag para saber si el store ya está hidratado
let isHydrated = false;

// Esperar a que el store se hidrate
const waitForHydration = (): Promise<void> => {
  if (isHydrated) return Promise.resolve();

  return new Promise((resolve) => {
    // Verificar si ya está hidratado
    if (useAuthStore.persist?.hasHydrated?.()) {
      isHydrated = true;
      resolve();
      return;
    }

    // Esperar a que se hidrate
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      isHydrated = true;
      unsub?.();
      resolve();
    });

    // Timeout de seguridad (2 segundos)
    setTimeout(() => {
      isHydrated = true;
      resolve();
    }, 2000);
  });
};

// Interceptor: Inyectar Token automáticamente
api.interceptors.request.use(async (config) => {
  // Esperar hidratación antes de cualquier petición
  await waitForHydration();

  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh Token Logic
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Verificar si debemos intentar refresh (solo si hay token guardado)
const shouldAttemptRefresh = (): boolean => {
  const { token, isAuthenticated } = useAuthStore.getState();
  return !!(token || isAuthenticated);
};

// Interceptor: Manejar errores de respuesta (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Solo intentar refresh si:
    // 1. Es un 401
    // 2. No es un retry
    // 3. No es la misma petición de refresh
    // 4. El usuario estaba autenticado
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshEndpoint &&
      shouldAttemptRefresh()
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // El refresh token se envía automáticamente via cookie httpOnly
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;

        useAuthStore.getState().updateToken(access_token);

        api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
        originalRequest.headers['Authorization'] = 'Bearer ' + access_token;

        processQueue(null, access_token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Solo hacer logout si el refresh falló con 401 o 403
        // (significa que el refresh token es inválido/expirado)
        const refreshStatus = (refreshError as { response?: { status?: number } })?.response?.status;
        if (refreshStatus === 401 || refreshStatus === 403) {
          await useAuthStore.getState().logout();
          if (typeof window !== 'undefined') {
            const locale = getCurrentLocale();
            const loginPath = routes[locale].login;
            if (!window.location.pathname.includes('iniciar-sesion') && !window.location.pathname.includes('/login')) {
              window.location.href = loginPath;
            }
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
