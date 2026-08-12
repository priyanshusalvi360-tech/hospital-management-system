import api from '../lib/axios';

export const reportService = {
  getPatients: async (params?: any) => { const r = await api.get('/reports/patients', { params }); return r.data; },
  getStaff: async (params?: any) => { const r = await api.get('/reports/staff', { params }); return r.data; },
  getAdmissions: async (params?: any) => { const r = await api.get('/reports/admissions', { params }); return r.data; },
  getDischarges: async (params?: any) => { const r = await api.get('/reports/discharges', { params }); return r.data; },
};
