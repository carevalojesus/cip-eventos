import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  email: string;
  role: string;
  // agrega más campos si necesitas
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'cip-auth-storage', // Nombre en localStorage
    }
  )
);