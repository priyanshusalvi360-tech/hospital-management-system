import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, User, Clock, Info, LogOut } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

export const SettingsPage = () => {
  const { isDark, toggle } = useThemeStore();
  const { clearAuth, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark mode on or off.</p>
            </div>
          </div>
          <button 
            onClick={toggle}
            className={`w-14 h-7 rounded-full p-1 transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
          >
            <motion.div 
              className="w-5 h-5 bg-white rounded-full"
              layout
              animate={{ x: isDark ? 28 : 0 }}
            />
          </button>
        </div>

        <Link to="/profile" className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Settings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile and password.</p>
            </div>
          </div>
        </Link>

        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Timeout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your session will automatically timeout after 15 minutes of inactivity for security reasons.</p>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <Info size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">HMS v1.0.0 — Hospital Management System</p>
          </div>
        </div>

        {/* Account Logout Section */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-50/30 dark:bg-red-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Logout</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Logged in as <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.username || 'User'}</span> ({user?.role === 'ADMIN' ? 'Administrator' : 'Staff'}). End your current session.
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm shrink-0"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;