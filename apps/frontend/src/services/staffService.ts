import api from '../lib/axios';
import type { Staff, ApiResponse } from '../types';

export const staffService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const res = await api.get<ApiResponse<Staff[]>>('/staff', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Staff>>(`/staff/${id}`);
    return res.data;
  },
  create: async (data: Partial<Staff>) => {
    const res = await api.post<ApiResponse<Staff>>('/staff', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Staff>) => {
    const res = await api.patch<ApiResponse<Staff>>(`/staff/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/staff/${id}`);
    return res.data;
  },
};