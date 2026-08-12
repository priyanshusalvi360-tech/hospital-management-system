import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { generateEmployeeId } from '../../utils/generateId';
import { CreateStaffInput, UpdateStaffInput } from './staff.schema';

export const getStaff = async (query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = { isDeleted: false };
  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;
  if (query.department) where.department = query.department;
  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { employeeId: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.staff.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.staff.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getStaffById = async (id: string) => {
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff || staff.isDeleted) throw new ApiError(404, 'Staff not found');
  return staff;
};

export const createStaff = async (data: CreateStaffInput) => {
  const employeeId = await generateEmployeeId();
  return prisma.staff.create({ data: { ...data, employeeId } });
};

export const updateStaff = async (id: string, data: UpdateStaffInput) => {
  await getStaffById(id);
  return prisma.staff.update({ where: { id }, data });
};

export const deleteStaff = async (id: string) => {
  await getStaffById(id);
  await prisma.staff.update({ where: { id }, data: { isDeleted: true } });
};
