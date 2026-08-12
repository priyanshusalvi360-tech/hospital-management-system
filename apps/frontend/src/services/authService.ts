import api from '../lib/axios';
import type { User, ApiResponse } from '../types';

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