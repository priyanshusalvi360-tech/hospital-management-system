import { z } from 'zod';

export const StaffRoleValues = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'TECHNICIAN', 'ADMIN_STAFF', 'OTHER'] as const;
export const StaffStatusValues = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const;

export const createStaffSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100).regex(/^[A-Za-z\s]+$/, 'Full name must contain only letters and spaces'),
  role: z.enum(StaffRoleValues),
  department: z.string().optional().default('General'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  email: z.string().email(),
  joiningDate: z.string().transform((v) => new Date(v)).optional(),
  salary: z.number().positive().optional(),
  status: z.enum(StaffStatusValues).optional().default('ACTIVE'),
  profilePhoto: z.string().url().optional(),
  emergencyContact: z.string().regex(/^\d{10}$/, 'Emergency contact must be a 10-digit phone number').optional().or(z.literal('')),
});

export const updateStaffSchema = createStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
