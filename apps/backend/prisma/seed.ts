import { PrismaClient, UserRole, StaffRole, StaffStatus, Gender, BloodGroup, PatientStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hash = async (pwd: string) => bcrypt.hash(pwd, 12);

const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const now = new Date();
const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

async function main() {
  console.log('🌱 Starting HMS seed...');

  // Clean DB
  await prisma.auditLog.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.user.deleteMany();

  // ─── AUTH USERS ──────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      { username: 'admin', email: 'admin@hms.com', password: await hash('Admin@123'), role: UserRole.ADMIN },
      { username: 'staff', email: 'staff@hms.com', password: await hash('Staff@123'), role: UserRole.STAFF },
    ],
  });
  console.log('✅ Auth users created: admin / staff');

  // ─── STAFF MEMBERS ───────────────────────────────────────────────
  const staffData = [
    { fullName: 'Dr. James Wilson', role: StaffRole.DOCTOR, department: 'Cardiology', phone: '555-0101', email: 'jwilson@hms.com', salary: 120000 },
    { fullName: 'Dr. Sarah Chen', role: StaffRole.DOCTOR, department: 'Neurology', phone: '555-0102', email: 'schen@hms.com', salary: 130000 },
    { fullName: 'Dr. Robert Martinez', role: StaffRole.DOCTOR, department: 'Orthopedics', phone: '555-0103', email: 'rmartinez@hms.com', salary: 115000 },
    { fullName: 'Nurse Emily Davis', role: StaffRole.NURSE, department: 'ICU', phone: '555-0104', email: 'edavis@hms.com', salary: 65000 },
    { fullName: 'Nurse Michael Brown', role: StaffRole.NURSE, department: 'General Ward', phone: '555-0105', email: 'mbrown@hms.com', salary: 62000 },
    { fullName: 'Nurse Jessica Taylor', role: StaffRole.NURSE, department: 'Pediatrics', phone: '555-0106', email: 'jtaylor@hms.com', salary: 63000 },
    { fullName: 'Alice Johnson', role: StaffRole.RECEPTIONIST, department: 'Front Desk', phone: '555-0107', email: 'ajohnson@hms.com', salary: 42000 },
    { fullName: 'Thomas Anderson', role: StaffRole.PHARMACIST, department: 'Pharmacy', phone: '555-0108', email: 'tanderson@hms.com', salary: 75000 },
    { fullName: 'Dr. Priya Patel', role: StaffRole.DOCTOR, department: 'Emergency', phone: '555-0109', email: 'ppatel@hms.com', salary: 125000 },
    { fullName: 'Nurse Daniel Kim', role: StaffRole.NURSE, department: 'Emergency', phone: '555-0110', email: 'dkim@hms.com', salary: 68000 },
  ];

  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i];
    await prisma.staff.create({
      data: {
        employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
        fullName: s.fullName,
        role: s.role,
        department: s.department,
        phone: s.phone,
        email: s.email,
        joiningDate: randomDate(new Date('2020-01-01'), new Date('2024-06-01')),
        salary: s.salary,
        status: StaffStatus.ACTIVE,
      },
    });
  }
  console.log(`✅ ${staffData.length} staff members created`);

  // ─── PATIENTS ────────────────────────────────────────────────────
  const doctors = ['Dr. James Wilson', 'Dr. Sarah Chen', 'Dr. Robert Martinez', 'Dr. Priya Patel'];
  const diseases = [
    'Hypertension', 'Type 2 Diabetes', 'Cardiac Arrhythmia', 'Acute Appendicitis',
    'Pneumonia', 'Fractured Femur', 'Migraine', 'Kidney Stones',
    'Anemia', 'Asthma', 'Sepsis', 'Stroke', 'Dengue Fever', 'COVID-19',
    'Chronic Back Pain', 'Gallstones', 'Gastroenteritis', 'Urinary Tract Infection',
    'Thyroid Disorder', 'Arthritis',
  ];
  const firstNames = [
    'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
    'William', 'Barbara', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah',
    'Thomas', 'Karen', 'Charles', 'Lisa',
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
    'Thompson', 'Robinson', 'Clark', 'Lewis',
  ];
  const bloodGroups = Object.values(BloodGroup);
  const statuses = [
    PatientStatus.ADMITTED, PatientStatus.ADMITTED, PatientStatus.ADMITTED,
    PatientStatus.DISCHARGED, PatientStatus.DISCHARGED,
    PatientStatus.CRITICAL,
    PatientStatus.PENDING,
  ];

  for (let i = 1; i <= 25; i++) {
    const admissionDate = randomDate(twelveMonthsAgo, now);
    const status = statuses[i % statuses.length];
    const dob = randomDate(new Date('1950-01-01'), new Date('2000-12-31'));
    const age = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365));

    await prisma.patient.create({
      data: {
        patientId: `PAT-${String(i).padStart(6, '0')}`,
        firstName: firstNames[i - 1] ?? `Patient${i}`,
        lastName: lastNames[i - 1] ?? `Surname${i}`,
        gender: i % 3 === 0 ? Gender.FEMALE : i % 5 === 0 ? Gender.OTHER : Gender.MALE,
        dateOfBirth: dob,
        age,
        bloodGroup: bloodGroups[i % bloodGroups.length],
        phone: `555-${String(1000 + i).padStart(4, '0')}`,
        emergencyContactName: `Emergency Contact ${i}`,
        emergencyContactPhone: `555-${String(2000 + i).padStart(4, '0')}`,
        address: `${i * 10} Oak Street, Springfield, IL`,
        disease: diseases[(i - 1) % diseases.length],
        doctorAssigned: doctors[(i - 1) % doctors.length],
        roomNumber: status === PatientStatus.ADMITTED || status === PatientStatus.CRITICAL ? `${Math.floor(i / 5) + 1}0${i % 10}` : null,
        admissionDate,
        dischargeDate: status === PatientStatus.DISCHARGED ? new Date(admissionDate.getTime() + (Math.random() * 10 + 2) * 86400000) : null,
        status,
        medicalNotes: `Patient admitted with ${diseases[(i - 1) % diseases.length].toLowerCase()}. Monitoring vital signs. Treatment plan in progress.`,
      },
    });
  }
  console.log('✅ 25 patients created');
  console.log('\n🏥 HMS Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Admin login  → admin / Admin@123');
  console.log('🔑 Staff login  → staff / Staff@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
