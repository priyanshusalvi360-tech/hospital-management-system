import { prisma } from '../../config/db';

export const getPatientReport = async (filters: any) => {
  const where: any = { isDeleted: false };
  if (filters.status) where.status = filters.status;
  if (filters.startDate && filters.endDate) {
    where.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }
  return prisma.patient.findMany({ where, orderBy: { createdAt: 'desc' } });
};

export const getStaffReport = async (filters: any) => {
  const where: any = { isDeleted: false };
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;
  if (filters.department) where.department = filters.department;
  return prisma.staff.findMany({ where, orderBy: { joiningDate: 'asc' } });
};

export const getAdmissionsReport = async (filters: any) => {
  const where: any = { isDeleted: false };
  if (filters.startDate && filters.endDate) {
    where.admissionDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }
  return prisma.patient.findMany({ where, orderBy: { admissionDate: 'desc' } });
};

export const getDischargesReport = async (filters: any) => {
  const where: any = { isDeleted: false, status: 'DISCHARGED', dischargeDate: { not: null } };
  if (filters.startDate && filters.endDate) {
    where.dischargeDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }
  return prisma.patient.findMany({ where, orderBy: { dischargeDate: 'desc' } });
};
