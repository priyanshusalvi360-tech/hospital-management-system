import { z } from 'zod';

export const GenderValues = ['MALE', 'FEMALE', 'OTHER'] as const;
export const BloodGroupValues = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'] as const;
export const PatientStatusValues = ['ADMITTED', 'DISCHARGED', 'PENDING', 'CRITICAL'] as const;

export const createPatientSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  gender: z.enum(GenderValues),
  dateOfBirth: z.string().transform((v) => new Date(v)),
  age: z.number().int().min(0).max(150),
  bloodGroup: z.enum(BloodGroupValues).optional(),
  phone: z.string().min(7).max(20),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  address: z.string().optional(),
  disease: z.string().min(1),
  doctorAssigned: z.string().min(1),
  roomNumber: z.string().optional(),
  admissionDate: z.string().transform((v) => new Date(v)).optional(),
  status: z.enum(PatientStatusValues).optional().default('ADMITTED'),
  medicalNotes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
