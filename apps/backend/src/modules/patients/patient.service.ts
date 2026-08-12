import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { generatePatientId } from '../../utils/generateId';
import { CreatePatientInput, UpdatePatientInput } from './patient.schema';


export const getPatients = async (query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = { isDeleted: false };
  if (query.status) where.status = query.status;
  if (query.doctorAssigned) where.doctorAssigned = query.doctorAssigned;
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { patientId: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.patient.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.patient.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getPatientById = async (id: string) => {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient || patient.isDeleted) throw new ApiError(404, 'Patient not found');
  return patient;
};

export const createPatient = async (data: CreatePatientInput) => {
  const patientId = await generatePatientId();
  return prisma.patient.create({ data: { ...data, patientId } });
};

export const updatePatient = async (id: string, data: UpdatePatientInput) => {
  await getPatientById(id);
  return prisma.patient.update({ where: { id }, data });
};

export const deletePatient = async (id: string) => {
  await getPatientById(id);
  await prisma.patient.update({ where: { id }, data: { isDeleted: true } });
};

export const admitPatient = async (id: string) => {
  await getPatientById(id);
  return prisma.patient.update({ where: { id }, data: { status: 'ADMITTED', admissionDate: new Date() } });
};

export const dischargePatient = async (id: string) => {
  await getPatientById(id);
  return prisma.patient.update({ where: { id }, data: { status: 'DISCHARGED', dischargeDate: new Date() } });
};

export const getDashboardStats = async () => {
  const stats = await prisma.patient.groupBy({
    by: ['status'],
    where: { isDeleted: false },
    _count: { _all: true },
  });
  return stats;
};
