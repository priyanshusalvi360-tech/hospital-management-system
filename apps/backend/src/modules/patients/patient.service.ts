import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { generatePatientId } from '../../utils/generateId';
import { CreatePatientInput, UpdatePatientInput } from './patient.schema';


const STATUS_PRIORITY: Record<string, number> = {
  ADMITTED: 1,
  CRITICAL: 2,
  PENDING: 3,
  DISCHARGED: 4,
};

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
      { disease: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // Fetch all matching records' minimal metadata for prioritized sorting
  const allMatching = await prisma.patient.findMany({
    where,
    select: { id: true, status: true, createdAt: true },
  });

  allMatching.sort((a, b) => {
    const rankA = STATUS_PRIORITY[a.status] ?? 99;
    const rankB = STATUS_PRIORITY[b.status] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const total = allMatching.length;
  const pageIds = allMatching.slice(skip, skip + limit).map((p) => p.id);

  let data: any[] = [];
  if (pageIds.length > 0) {
    const fullPatients = await prisma.patient.findMany({
      where: { id: { in: pageIds } },
    });
    const patientMap = new Map(fullPatients.map((p) => [p.id, p]));
    data = pageIds.map((id) => patientMap.get(id)).filter(Boolean);
  }

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getPatientById = async (id: string) => {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient || patient.isDeleted) throw new ApiError(404, 'Patient not found');
  return patient;
};

export const createPatient = async (data: CreatePatientInput) => {
  const patientId = await generatePatientId();
  const dateOfBirth = data.dateOfBirth || new Date(new Date().getFullYear() - (data.age || 30), 0, 1);
  return prisma.patient.create({ data: { ...data, dateOfBirth, patientId } });
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
