const fs = require('fs');
const path = require('path');
const p = (p) => path.join('C:/Users/Priyanshu/.gemini/antigravity/scratch/hms/apps/frontend', p);

function write(f, c) {
  fs.mkdirSync(path.dirname(p(f)), { recursive: true });
  fs.writeFileSync(p(f), c.trim());
}

write('src/main.tsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
`);

write('src/App.tsx', `
import { Toaster } from 'sonner';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  );
}
`);

write('src/lib/axios.ts', `
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post('http://localhost:5000/api/v1/auth/refresh', {}, {
          withCredentials: true,
        });
        const newToken = res.data.data.accessToken;
        useAuthStore.getState().setToken(newToken);
        originalRequest.headers.Authorization = \`Bearer \${newToken}\`;
        return api(originalRequest);
      } catch (err) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
`);

write('src/lib/utils.ts', `
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null, fmt = 'MMM dd, yyyy') {
  if (!date) return 'N/A';
  return format(new Date(date), fmt);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    ADMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DISCHARGED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    ON_LEAVE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
`);

write('src/store/authStore.ts', `
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      isAuthenticated: () => !!get().user && !!get().accessToken,
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    { name: 'hms-auth' }
  )
);
`);

write('src/store/themeStore.ts', `
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        const newDark = !get().isDark;
        document.documentElement.classList.toggle('dark', newDark);
        set({ isDark: newDark });
      },
      setDark: (dark) => {
        document.documentElement.classList.toggle('dark', dark);
        set({ isDark: dark });
      },
    }),
    { name: 'hms-theme' }
  )
);
`);

write('src/types/index.ts', `
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodGroup = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG';
export type PatientStatus = 'ADMITTED' | 'DISCHARGED' | 'PENDING' | 'CRITICAL';
export type StaffRole = 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'TECHNICIAN' | 'ADMIN_STAFF' | 'OTHER';
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  bloodGroup: BloodGroup | null;
  phone: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  address: string | null;
  disease: string;
  doctorAssigned: string;
  roomNumber: string | null;
  admissionDate: string;
  dischargeDate: string | null;
  status: PatientStatus;
  medicalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  employeeId: string;
  fullName: string;
  role: StaffRole;
  department: string;
  phone: string;
  email: string;
  joiningDate: string;
  salary: number | null;
  status: StaffStatus;
  profilePhoto: string | null;
  emergencyContact: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  admittedPatients: number;
  dischargedPatients: number;
  criticalPatients: number;
  totalStaff: number;
  doctors: number;
  nurses: number;
  receptionists: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  user: { username: string; role: string };
}
`);

write('src/services/authService.ts', `
import api from '../lib/axios';
import { User, ApiResponse } from '../types';

export const authService = {
  login: async (data: { username: string; password: string; rememberMe?: boolean }) => {
    const res = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', data);
    return res.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  refresh: async () => {
    const res = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.patch<ApiResponse<null>>('/auth/change-password', data);
    return res.data;
  },
};
`);

write('src/services/patientService.ts', `
import api from '../lib/axios';
import { Patient, ApiResponse } from '../types';

export const patientService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; status?: string }) => {
    const res = await api.get<ApiResponse<Patient[]>>('/patients', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Patient>>(\`/patients/\${id}\`);
    return res.data;
  },
  create: async (data: Partial<Patient>) => {
    const res = await api.post<ApiResponse<Patient>>('/patients', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Patient>) => {
    const res = await api.patch<ApiResponse<Patient>>(\`/patients/\${id}\`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(\`/patients/\${id}\`);
    return res.data;
  },
  admit: async (id: string) => {
    const res = await api.patch<ApiResponse<Patient>>(\`/patients/\${id}/admit\`);
    return res.data;
  },
  discharge: async (id: string) => {
    const res = await api.patch<ApiResponse<Patient>>(\`/patients/\${id}/discharge\`);
    return res.data;
  },
};
`);

write('src/services/staffService.ts', `
import api from '../lib/axios';
import { Staff, ApiResponse } from '../types';

export const staffService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const res = await api.get<ApiResponse<Staff[]>>('/staff', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Staff>>(\`/staff/\${id}\`);
    return res.data;
  },
  create: async (data: Partial<Staff>) => {
    const res = await api.post<ApiResponse<Staff>>('/staff', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Staff>) => {
    const res = await api.patch<ApiResponse<Staff>>(\`/staff/\${id}\`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(\`/staff/\${id}\`);
    return res.data;
  },
};
`);

write('src/services/dashboardService.ts', `
import api from '../lib/axios';
import { DashboardStats, AuditLog, ApiResponse } from '../types';

export const dashboardService = {
  getStats: async () => {
    const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data;
  },
  getAdmissionsChart: async () => {
    const res = await api.get<ApiResponse<{ month: string; count: number }[]>>('/dashboard/charts/admissions');
    return res.data;
  },
  getStaffDistribution: async () => {
    const res = await api.get<ApiResponse<{ role: string; count: number }[]>>('/dashboard/charts/staff-distribution');
    return res.data;
  },
  getRecentActivity: async () => {
    const res = await api.get<ApiResponse<AuditLog[]>>('/dashboard/activity');
    return res.data;
  },
};
`);

write('src/hooks/useAuth.ts', `
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useAuth = () => {
  const { user, accessToken, setAuth, clearAuth, isAuthenticated, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const login = async (username: string, password: string, rememberMe = false) => {
    const res = await authService.login({ username, password, rememberMe });
    setAuth(res.data.user as any, res.data.accessToken);
    toast.success(\`Welcome back, \${res.data.user.username}!\`);
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearAuth();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return { user, accessToken, login, logout, isAuthenticated, isAdmin };
};
`);

write('src/hooks/useDebounce.ts', `
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
`);

write('src/hooks/useIdleTimeout.ts', `
import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimeout(onTimeout: () => void, timeoutMs = 15 * 60 * 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>( null as any);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onTimeout, timeoutMs);
  }, [onTimeout, timeoutMs]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timerRef.current);
    };
  }, [reset]);
}
`);

write('src/router/AppRouter.tsx', `
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import PatientsPage from '../pages/patients/PatientsPage';
import PatientDetailPage from '../pages/patients/PatientDetailPage';
import StaffPage from '../pages/staff/StaffPage';
import ReportsPage from '../pages/reports/ReportsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import AdmissionsPage from '../pages/admissions/AdmissionsPage';
import DischargePage from '../pages/discharge/DischargePage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';
import AppLayout from '../components/common/AppLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export default function AppRouter() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated() ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/401" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/admissions" element={<AdmissionsPage />} />
            <Route path="/discharge" element={<DischargePage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/reports" element={<ProtectedRoute requiredRole="ADMIN"><ReportsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
`);

write('src/components/auth/ProtectedRoute.tsx', `
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'ADMIN' | 'STAFF';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/401" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
`);

console.log("All generated files written.");
