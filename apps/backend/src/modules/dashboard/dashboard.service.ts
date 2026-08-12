import { prisma } from '../../config/db';

export const getStats = async () => {
  const [totalPatients, admittedPatients, dischargedPatients, criticalPatients, totalStaff, doctors, nurses, receptionists] = await Promise.all([
    prisma.patient.count({ where: { isDeleted: false } }),
    prisma.patient.count({ where: { isDeleted: false, status: 'ADMITTED' } }),
    prisma.patient.count({ where: { isDeleted: false, status: 'DISCHARGED' } }),
    prisma.patient.count({ where: { isDeleted: false, status: 'CRITICAL' } }),
    prisma.staff.count({ where: { isDeleted: false, status: 'ACTIVE' } }),
    prisma.staff.count({ where: { isDeleted: false, status: 'ACTIVE', role: 'DOCTOR' } }),
    prisma.staff.count({ where: { isDeleted: false, status: 'ACTIVE', role: 'NURSE' } }),
    prisma.staff.count({ where: { isDeleted: false, status: 'ACTIVE', role: 'RECEPTIONIST' } }),
  ]);
  
  return { totalPatients, admittedPatients, dischargedPatients, criticalPatients, totalStaff, doctors, nurses, receptionists };
};

export const getAdmissionsChart = async () => {
  const now = new Date();
  // Build an array of the last 12 months (oldest → newest)
  const months: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    months.push({ key, label });
  }

  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const patients = await prisma.patient.findMany({
    where: { isDeleted: false, admissionDate: { gte: startDate } },
    select: { admissionDate: true },
  });

  const counts: Record<string, number> = {};
  patients.forEach((p) => {
    const key = `${p.admissionDate.getFullYear()}-${String(p.admissionDate.getMonth() + 1).padStart(2, '0')}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  return months.map(({ key, label }) => ({ month: label, count: counts[key] || 0 }));
};

export const getStaffDistribution = async () => {
  const data = await prisma.staff.groupBy({
    by: ['role'],
    where: { isDeleted: false, status: 'ACTIVE' },
    _count: { _all: true },
  });
  return data.map(d => ({ role: d.role, count: d._count._all }));
};

export const getRecentActivity = async (limit = 10) => {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { username: true } } },
  });
};
