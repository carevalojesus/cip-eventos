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
  login: (token: string, user: User) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      // El refresh token ahora se maneja via cookies httpOnly (más seguro)
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateToken: (token) => set({ token }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'cip-auth-storage',
      // Usamos sessionStorage solo para el access token (corta duración)
      // El refresh token se maneja via cookies httpOnly del servidor
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);