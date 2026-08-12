import { prisma } from '../config/db';

export const generatePatientId = async (): Promise<string> => {
  const count = await prisma.patient.count();
  const padded = String(count + 1).padStart(6, '0');
  return `PAT-${padded}`;
};

export const generateEmployeeId = async (): Promise<string> => {
  const count = await prisma.staff.count();
  const padded = String(count + 1).padStart(6, '0');
  return `EMP-${padded}`;
};
