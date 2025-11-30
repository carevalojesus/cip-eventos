import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  logout: () => void;
  updateToken: (token: string) => void;
  updateUser: (user: Partial<User>) => void;
}

// Storage personalizado que funciona tanto en SSR como en el cliente
// Por defecto usa sessionStorage, pero puede cambiar a localStorage
let currentStorageType: 'session' | 'local' = 'session';

const createBrowserStorage = () => {
  // En SSR, retornar un storage vacío
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  // En el cliente, usar el storage según la preferencia actual
  return currentStorageType === 'local' ? localStorage : sessionStorage;
};

// Función para cambiar el tipo de storage y migrar los datos
const switchStorageType = (useLocalStorage: boolean) => {
  if (typeof window === 'undefined') return;

  const newStorageType = useLocalStorage ? 'local' : 'session';
  if (currentStorageType === newStorageType) return;

  const oldStorage = currentStorageType === 'local' ? localStorage : sessionStorage;
  const newStorage = newStorageType === 'local' ? localStorage : sessionStorage;

  // Migrar datos del storage antiguo al nuevo
  const data = oldStorage.getItem('cip-auth-storage');
  if (data) {
    newStorage.setItem('cip-auth-storage', data);
    oldStorage.removeItem('cip-auth-storage');
  }

  currentStorageType = newStorageType;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      // El refresh token ahora se maneja via cookies httpOnly (más seguro)
      login: (token, user, rememberMe = false) => {
        // Cambiar el tipo de storage según la preferencia del usuario
        switchStorageType(rememberMe);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        // Al hacer logout, limpiar ambos storages y volver a sessionStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cip-auth-storage');
          sessionStorage.removeItem('cip-auth-storage');
          currentStorageType = 'session';
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateToken: (token) => set({ token }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'cip-auth-storage',
      // Usamos sessionStorage para el access token por defecto
      // El refresh token se maneja via cookies httpOnly del servidor
      storage: createJSONStorage(() => createBrowserStorage()),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Configuración de hidratación
      skipHydration: false,
    }
  )
);
