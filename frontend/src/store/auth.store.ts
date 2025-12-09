import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, ROLE_LABELS, ROLE_LABELS_EN } from '@/constants/roles';

export interface User {
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

/** Obtiene el label del rol en el idioma especificado */
export function getRoleLabel(role: UserRole, locale: 'es' | 'en' = 'es'): string {
  return locale === 'en' ? ROLE_LABELS_EN[role] : ROLE_LABELS[role];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => Promise<void>;
  updateToken: (token: string) => void;
  updateUser: (user: Partial<User>) => void;
}

type StorageType = 'session' | 'local';
const STORAGE_KEY = 'cip-auth-storage';

// Storage preferido para ESCRIBIR (basado en rememberMe)
// Se usa solo para setItem - getItem siempre busca en ambos
let writeStorageType: StorageType = 'session';

const clearAllStorages = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
};

const setStoragePreference = (useLocalStorage: boolean) => {
  if (typeof window === 'undefined') return;
  writeStorageType = useLocalStorage ? 'local' : 'session';
  // Limpiar el storage que NO se va a usar
  const otherStorage = useLocalStorage ? sessionStorage : localStorage;
  otherStorage.removeItem(STORAGE_KEY);
};

const dynamicJSONStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;

    // SIEMPRE buscar en ambos storages para leer
    // Prioridad: localStorage primero (rememberMe=true), luego sessionStorage
    let raw = localStorage.getItem(name);
    if (raw) {
      writeStorageType = 'local';
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }

    raw = sessionStorage.getItem(name);
    if (raw) {
      writeStorageType = 'session';
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }

    return null;
  },
  setItem: (name: string, value: unknown) => {
    if (typeof window === 'undefined') return;
    const storage = writeStorageType === 'local' ? localStorage : sessionStorage;
    storage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    // Remover de ambos por seguridad
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      // El refresh token ahora se maneja via cookies httpOnly (más seguro)
      login: (token, user, rememberMe = false) => {
        setStoragePreference(rememberMe);
        set({ token, user, isAuthenticated: true });
      },
      logout: async () => {
        // Solicitar al backend que invalide la sesión y limpie la cookie httpOnly
        if (typeof window !== 'undefined') {
          const baseUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';
          try {
            await fetch(`${baseUrl}/auth/logout`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (error) {
            console.error('Logout request failed', error);
          }
        }

        clearAllStorages();
        writeStorageType = 'session';
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateToken: (token) => set({ token }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: dynamicJSONStorage,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: false,
    }
  )
);
