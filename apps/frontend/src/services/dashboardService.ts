import api from '../lib/axios';
import type { DashboardStats, AuditLog, ApiResponse } from '../types';

interface DashboardData {
  stats: DashboardStats;
  admissionsChart: { month: string; count: number }[];
  staffDistribution: { role: string; count: number }[];
  recentActivity: AuditLog[];
}

// Single endpoint fetches everything
const getDashboardAll = async (): Promise<DashboardData> => {
  const res = await api.get<ApiResponse<DashboardData>>('/dashboard');
  return res.data.data;
};

export const dashboardService = {
  getStats: async () => {
    const d = await getDashboardAll();
    return { data: d.stats, success: true, message: 'ok' };
  },
  getAdmissionsChart: async () => {
    const d = await getDashboardAll();
    return { data: d.admissionsChart, success: true, message: 'ok' };
  },
  getStaffDistribution: async () => {
    const d = await getDashboardAll();
    return { data: d.staffDistribution, success: true, message: 'ok' };
  },
  getRecentActivity: async () => {
    const d = await getDashboardAll();
    return { data: d.recentActivity, success: true, message: 'ok' };
  },
};