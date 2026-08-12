import api from '../lib/axios';
import type { DashboardStats, AuditLog, ApiResponse } from '../types';

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