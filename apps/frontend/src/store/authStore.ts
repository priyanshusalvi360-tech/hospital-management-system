import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

// Clear any previously persisted auth storage so refreshing always requires re-login
try {
  localStorage.removeItem('hms-auth');
  sessionStorage.removeItem('hms-auth');
} catch (_) {}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  isAuthenticated: () => !!get().user && !!get().accessToken,
  isAdmin: () => get().user?.role === 'ADMIN',
}));