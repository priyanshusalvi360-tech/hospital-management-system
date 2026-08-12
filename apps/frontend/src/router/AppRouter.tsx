import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import PatientsPage from '../pages/patients/PatientsPage';
import PatientDetailPage from '../pages/patients/PatientDetailPage';
import StaffPage from '../pages/staff/StaffPage';
import ReportsPage from '../pages/reports/ReportsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import AdmissionsPage from '../pages/admissions/AdmissionsPage';
import DischargePage from '../pages/discharge/DischargePage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';
import AppLayout from '../components/common/AppLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export default function AppRouter() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated() ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/401" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/admissions" element={<AdmissionsPage />} />
            <Route path="/discharge" element={<DischargePage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/reports" element={<ProtectedRoute requiredRole="ADMIN"><ReportsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}