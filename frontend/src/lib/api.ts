import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Inyectar Token automáticamente
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;