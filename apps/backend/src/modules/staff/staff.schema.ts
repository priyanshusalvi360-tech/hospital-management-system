import { z } from 'zod';

export const StaffRoleValues = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'TECHNICIAN', 'ADMIN_STAFF', 'OTHER'] as const;
export const StaffStatusValues = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const;

export const createStaffSchema = z.object({
  fullName: z.string().min(1).max(100),
  role: z.enum(StaffRoleValues),
  department: z.string().min(1),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  joiningDate: z.string().transform((v) => new Date(v)),
  salary: z.number().positive().optional(),
  status: z.enum(StaffStatusValues).optional().default('ACTIVE'),
  profilePhoto: z.string().url().optional(),
  emergencyContact: z.string().optional(),
});

export const updateStaffSchema = createStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
