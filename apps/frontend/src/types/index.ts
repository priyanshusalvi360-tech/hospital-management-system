export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodGroup = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG';
export type PatientStatus = 'ADMITTED' | 'DISCHARGED' | 'PENDING' | 'CRITICAL';
export type StaffRole = 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'TECHNICIAN' | 'ADMIN_STAFF' | 'OTHER';
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  bloodGroup: BloodGroup | null;
  phone: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  address: string | null;
  disease: string;
  doctorAssigned: string;
  roomNumber: string | null;
  admissionDate: string;
  dischargeDate: string | null;
  status: PatientStatus;
  medicalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  employeeId: string;
  fullName: string;
  role: StaffRole;
  department: string;
  phone: string;
  email: string;
  joiningDate: string;
  salary: number | null;
  status: StaffStatus;
  profilePhoto: string | null;
  emergencyContact: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  admittedPatients: number;
  dischargedPatients: number;
  criticalPatients: number;
  totalStaff: number;
  doctors: number;
  nurses: number;
  receptionists: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  user: { username: string; role: string };
}