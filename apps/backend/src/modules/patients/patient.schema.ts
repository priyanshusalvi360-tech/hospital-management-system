import { z } from 'zod';

export const GenderValues = ['MALE', 'FEMALE', 'OTHER'] as const;
export const BloodGroupValues = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'] as const;
export const PatientStatusValues = ['ADMITTED', 'DISCHARGED', 'PENDING', 'CRITICAL'] as const;

export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).regex(/^[A-Za-z\s]+$/, 'First name must contain only letters and spaces'),
  lastName: z.string().min(1, 'Last name is required').max(50).regex(/^[A-Za-z\s]+$/, 'Last name must contain only letters and spaces'),
  gender: z.enum(GenderValues),
  dateOfBirth: z.string().transform((v) => new Date(v)).optional(),
  age: z.number().int().min(0).max(150),
  bloodGroup: z.enum(BloodGroupValues).optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  emergencyContactName: z.string().regex(/^[A-Za-z\s]+$/, 'Emergency contact name must contain only letters and spaces').optional().or(z.literal('')),
  emergencyContactPhone: z.string().regex(/^\d{10}$/, 'Emergency contact phone must be exactly 10 digits').optional().or(z.literal('')),
  address: z.string().optional(),
  disease: z.string().min(1),
  doctorAssigned: z.string().min(1),
  roomNumber: z.string().optional(),
  admissionDate: z.string().transform((v) => new Date(v)).optional(),
  dischargeDate: z.string().nullable().optional().transform((v) => v ? new Date(v) : null),
  status: z.enum(PatientStatusValues).optional().default('ADMITTED'),
  medicalNotes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
