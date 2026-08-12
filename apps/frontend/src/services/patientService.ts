import api from '../lib/axios';
import type { Patient, ApiResponse } from '../types';

export const patientService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; status?: string }) => {
    const res = await api.get<ApiResponse<Patient[]>>('/patients', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
    return res.data;
  },
  create: async (data: Partial<Patient>) => {
    const res = await api.post<ApiResponse<Patient>>('/patients', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Patient>) => {
    const res = await api.patch<ApiResponse<Patient>>(`/patients/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/patients/${id}`);
    return res.data;
  },
  admit: async (id: string) => {
    const res = await api.patch<ApiResponse<Patient>>(`/patients/${id}/admit`);
    return res.data;
  },
  discharge: async (id: string) => {
    const res = await api.patch<ApiResponse<Patient>>(`/patients/${id}/discharge`);
    return res.data;
  },
};