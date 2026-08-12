const fs = require('fs');
const path = require('path');
const p = (p) => path.join('C:/Users/Priyanshu/.gemini/antigravity/scratch/hms/apps/frontend', p);

function write(f, c) {
  fs.mkdirSync(path.dirname(p(f)), { recursive: true });
  fs.writeFileSync(p(f), c.trim());
}

write('src/components/common/AppLayout.tsx', `
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserPlus, LogOut,
  ChartBar, Settings, User as UserIcon, Stethoscope,
  Menu, Bell, Moon, Sun, Search, X
} from 'lucide-react';
import { useState } from 'react';

export default function AppLayout() {
  const { user, clearAuth } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Admissions', path: '/admissions', icon: UserPlus },
    { name: 'Discharge', path: '/discharge', icon: UserIcon },
    { name: 'Staff', path: '/staff', icon: Stethoscope },
    ...(user?.role === 'ADMIN' ? [{ name: 'Reports', path: '/reports', icon: ChartBar }] : []),
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 256 }}
        animate={{ width: collapsed ? 80 : 256 }}
        className="glass-dark border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 z-20 relative bg-white dark:bg-black"
      >
        <div className="p-4 flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-400">
              <Stethoscope className="w-6 h-6" /> HMS
            </motion.div>
          )}
          {collapsed && <Stethoscope className="w-6 h-6 text-primary-600 mx-auto" />}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 absolute -right-3 top-5 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-full shadow-sm">
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
          {navLinks.map((link) => {
            const active = location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={\`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all \${
                  active
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }\`}
                title={collapsed ? link.name : ''}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{link.name}</span>}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 text-gray-500 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 glass z-10 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/50 backdrop-blur-lg">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-semibold capitalize hidden sm:block">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
            <div className="max-w-md w-full ml-4 relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent rounded-full text-sm focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0f172a]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
`);

write('src/pages/auth/LoginPage.tsx', `
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password, true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-[#0f172a]">
      {/* Left side */}
      <div className="hidden md:flex flex-1 bg-primary-600 dark:bg-primary-900 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-black z-0 opacity-90" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 text-center max-w-md"
        >
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Hospital Management System</h1>
          <p className="text-primary-100 text-lg mb-8">Professional healthcare dashboard for managing patients, staff, and medical records efficiently.</p>
        </motion.div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md glass p-8 rounded-2xl shadow-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
        >
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-gray-500 dark:text-gray-400">Please enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <a href="#" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800" />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
            <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
              Demo Credentials:<br />
              <span className="font-semibold">admin</span> / <span className="font-semibold">Admin@123</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
`);

write('src/pages/dashboard/DashboardPage.tsx', `
import { motion } from 'framer-motion';
import { Users, BedDouble, CheckCircle, AlertCircle, Users2, Stethoscope, Heart, Phone } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  
  const stats = [
    { title: 'Total Patients', value: '1,248', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Admitted', value: '342', icon: BedDouble, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { title: 'Discharged', value: '891', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { title: 'Critical', value: '15', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
    { title: 'Total Staff', value: '312', icon: Users2, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Doctors', value: '84', icon: Stethoscope, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { title: 'Nurses', value: '162', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30' },
    { title: 'Receptionists', value: '24', icon: Phone, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good Morning, {user?.username || 'Admin'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Here's an overview of the hospital's current status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={\`w-14 h-14 rounded-full flex items-center justify-center \${stat.bg}\`}>
              <stat.icon className={\`w-7 h-7 \${stat.color}\`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 min-h-[300px] flex items-center justify-center text-gray-500">
           [Admissions Chart Placeholder]
         </div>
         <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 min-h-[300px] flex flex-col">
           <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
           <div className="flex-1 flex items-center justify-center text-gray-500">
             [Activity Feed Placeholder]
           </div>
         </div>
      </div>
    </div>
  );
}
`);
