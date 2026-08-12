import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Key, Shield, User, LogOut, CheckCircle, AlertCircle, Users, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { getInitials } from '../../lib/utils';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter (A-Z)')
    .regex(/[0-9]/, 'Must contain at least one number (0-9)'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match — please retype to confirm",
  path: ['confirmPassword'],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: 'New password must be different from your current password',
  path: ['newPassword'],
});

function PwStrengthBar({ value }: { value: string }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { label: 'Very weak',   color: 'bg-red-500' },
    { label: 'Weak',        color: 'bg-orange-500' },
    { label: 'Fair',        color: 'bg-yellow-500' },
    { label: 'Strong',      color: 'bg-green-500' },
    { label: 'Very strong', color: 'bg-emerald-600' },
  ];
  const lvl = levels[Math.max(0, score - 1)];
  const pct = `${score * 20}%`;

  return (
    <div className="mt-1.5">
      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${lvl.color}`}
          style={{ width: pct }}
        />
      </div>
      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{lvl.label}</p>
    </div>
  );
}

export const ProfilePage = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwErrorMsg, setPwErrorMsg] = useState('');
  const [newPwValue, setNewPwValue] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const watchNewPw = watch('newPassword', '');

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setPwErrorMsg('');
    setPwSuccess(false);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPwSuccess(true);
      reset();
      setNewPwValue('');
      toast.success('Password changed successfully!');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to change password';
      setPwErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const roleColor = user?.role === 'ADMIN'
    ? 'from-blue-600 to-purple-600'
    : 'from-purple-600 to-cyan-600';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${roleColor} flex items-center justify-center text-3xl font-bold text-white shadow-lg shrink-0`}>
            {getInitials(user?.username || 'U')}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.username}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center sm:justify-start gap-2 text-sm">
              <User size={14} /> {user?.email}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800/50">
              <Shield size={13} /> {user?.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}
            </div>

            {/* Account info grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Username</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.username}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Role</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Status</p>
                <p className="font-semibold text-green-600 dark:text-green-400">● Active</p>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shrink-0"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Key className="text-blue-500" size={20} /> Change Password
        </h3>

        {/* Success banner */}
        {pwSuccess && (
          <div className="flex items-center gap-3 mb-5 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
            <CheckCircle size={16} className="shrink-0" />
            Password updated! Your new password is active immediately.
          </div>
        )}

        {/* Error banner */}
        {pwErrorMsg && (
          <div className="flex items-center gap-3 mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm font-medium">
            <AlertCircle size={16} className="shrink-0" />
            {pwErrorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? 'text' : 'password'}
                {...register('currentPassword')}
                onChange={() => { setPwErrorMsg(''); setPwSuccess(false); }}
                placeholder="Enter your current password"
                className="w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
              <button type="button" onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{(errors.currentPassword as any).message}</p>}
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? 'text' : 'password'}
                {...register('newPassword')}
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                className="w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
              <button type="button" onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PwStrengthBar value={watchNewPw} />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{(errors.newPassword as any).message}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Repeat new password"
                className="w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
              <button type="button" onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{(errors.confirmPassword as any).message}</p>}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Must be at least <strong>8 characters</strong> with an <strong>uppercase letter</strong> and a <strong>number</strong>.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60 text-sm"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => { reset(); setPwErrorMsg(''); setPwSuccess(false); }}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProfilePage;