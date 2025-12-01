import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
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

// Determinar con qué storage hidratar según los datos existentes
const detectStorageType = (): StorageType => {
  if (typeof window === 'undefined') return 'session';
  return localStorage.getItem(STORAGE_KEY) ? 'local' : 'session';
};

let currentStorageType: StorageType = detectStorageType();

const getBrowserStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return currentStorageType === 'local' ? localStorage : sessionStorage;
};

const clearAllStorages = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
};

const setStoragePreference = (useLocalStorage: boolean) => {
  if (typeof window === 'undefined') return;

  const newType: StorageType = useLocalStorage ? 'local' : 'session';
  if (currentStorageType !== newType) {
    const prevStorage = getBrowserStorage();
    const data = prevStorage.getItem(STORAGE_KEY);

    currentStorageType = newType;
    const nextStorage = getBrowserStorage();
    if (data) {
      nextStorage.setItem(STORAGE_KEY, data);
      prevStorage.removeItem(STORAGE_KEY);
    }
  } else {
    currentStorageType = newType;
  }

  // Evitar que queden datos huérfanos en el otro storage
  const otherStorage = newType === 'local' ? sessionStorage : localStorage;
  otherStorage.removeItem(STORAGE_KEY);
};

const dynamicJSONStorage = {
  getItem: (name: string) => {
    const storage = getBrowserStorage();
    const raw = storage.getItem(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: unknown) => {
    const storage = getBrowserStorage();
    storage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    const storage = getBrowserStorage();
    storage.removeItem(name);
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
          const baseUrl = import.meta.env.PUBLIC_API_URL || '';
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
        currentStorageType = 'session';
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
