import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserPlus, LogOut,
  ChartBar, Settings, User as UserIcon, Stethoscope,
  Menu, Bell, Moon, Sun, Search, X, AlertTriangle,
  CheckCircle, Info, UserCheck
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../../services/patientService';

// ── Notification helpers ──────────────────────────────────
interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'critical' | 'discharge' | 'admit' | 'info';
}

function buildNotifications(patients: any[]): Notification[] {
  const list: Notification[] = [];

  patients.filter(p => p.status === 'CRITICAL').forEach(p => {
    list.push({
      id: `crit-${p.id}`,
      icon: '🔴',
      title: `${p.firstName} ${p.lastName} — CRITICAL`,
      body: `Room ${p.roomNumber || '?'} · ${p.disease || ''}`,
      time: `Admitted ${p.admissionDate ? new Date(p.admissionDate).toLocaleDateString() : '—'}`,
      read: false,
      type: 'critical',
    });
  });

  patients
    .filter(p => p.status === 'DISCHARGED' && p.dischargeDate)
    .slice(0, 2)
    .forEach(p => {
      list.push({
        id: `dis-${p.id}`,
        icon: '✅',
        title: `${p.firstName} ${p.lastName} discharged`,
        body: `${p.disease} · ${p.doctorAssigned || ''}`,
        time: `Discharged ${new Date(p.dischargeDate).toLocaleDateString()}`,
        read: true,
        type: 'discharge',
      });
    });

  patients
    .filter(p => p.status === 'ADMITTED')
    .slice(0, 2)
    .forEach(p => {
      list.push({
        id: `adm-${p.id}`,
        icon: '🏥',
        title: `${p.firstName} ${p.lastName} admitted`,
        body: `${p.disease} · Room ${p.roomNumber || '—'}`,
        time: `${p.admissionDate ? new Date(p.admissionDate).toLocaleDateString() : '—'}`,
        read: true,
        type: 'admit',
      });
    });

  return list.slice(0, 8);
}

export default function AppLayout() {
  const { user, clearAuth } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch patients to build real notifications
  const { data: patData } = useQuery({
    queryKey: ['patients-notif'],
    queryFn: () => patientService.getAll({ limit: 50 }),
    staleTime: 60_000,
  });

  const rawPat: any = (patData as any)?.data;
  const allPatients: any[] = rawPat?.items ?? (Array.isArray(rawPat) ? rawPat : []);
  const notifications = buildNotifications(allPatients);
  const unreadCount = notifications.filter(n => !n.read && !readIds.has(n.id)).length;

  // Close notif panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  // Header search: navigate to correct page and pass query
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      const path = location.pathname;
      if (path.startsWith('/staff')) {
        navigate(`/staff?q=${encodeURIComponent(searchValue.trim())}`);
      } else {
        navigate(`/patients?q=${encodeURIComponent(searchValue.trim())}`);
      }
    }
  };

  const navLinks = [
    { name: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard, section: 'MAIN' },
    { name: 'Patients',   path: '/patients',   icon: Users,           section: 'MAIN' },
    { name: 'Admissions', path: '/admissions', icon: UserPlus,        section: 'MAIN' },
    { name: 'Discharge',  path: '/discharge',  icon: UserCheck,       section: 'MAIN' },
    { name: 'Staff',      path: '/staff',      icon: Stethoscope,     section: 'MANAGE' },
    ...(user?.role === 'ADMIN' ? [{ name: 'Reports', path: '/reports', icon: ChartBar, section: 'MANAGE' }] : []),
    { name: 'Profile',    path: '/profile',    icon: UserIcon,        section: 'ACCOUNT' },
    { name: 'Settings',   path: '/settings',   icon: Settings,        section: 'ACCOUNT' },
  ];

  const sections = ['MAIN', 'MANAGE', 'ACCOUNT'];
  const sectionLabel: Record<string, string> = { MAIN: 'Main Menu', MANAGE: 'Management', ACCOUNT: 'Account' };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────── */}
      <motion.aside
        initial={{ width: 256 }}
        animate={{ width: collapsed ? 80 : 256 }}
        className="border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 z-20 relative bg-white dark:bg-black"
      >
        <div className="p-4 flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
              <Stethoscope className="w-6 h-6" /> HMS
            </motion.div>
          )}
          {collapsed && <Stethoscope className="w-6 h-6 text-blue-600 mx-auto" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 absolute -right-3 top-5 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-full shadow-sm"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-0.5 px-3">
          {sections.map(sec => {
            const links = navLinks.filter(l => l.section === sec);
            return (
              <div key={sec}>
                {!collapsed && (
                  <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                    {sectionLabel[sec]}
                  </p>
                )}
                {links.map(link => {
                  const active = location.pathname.startsWith(link.path);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        active
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title={collapsed ? link.name : ''}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span className="text-sm">{link.name}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar bottom — user + logout */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${user?.role === 'ADMIN' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{user?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ── Main ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 z-10 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/50 backdrop-blur-lg shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-semibold capitalize hidden sm:block text-gray-900 dark:text-white">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
            {/* Functional search bar */}
            <div className="max-w-sm w-full ml-4 relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, staff… (Enter)"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent rounded-full text-sm focus:bg-white dark:focus:bg-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* ── Notification Bell ─────────────────── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => setReadIds(new Set(notifications.map(n => n.id)))}
                          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Items */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                          🎉 All caught up!
                        </div>
                      ) : (
                        notifications.map(n => {
                          const isRead = n.read || readIds.has(n.id);
                          return (
                            <button
                              key={n.id}
                              onClick={() => setReadIds(r => new Set([...r, n.id]))}
                              className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            >
                              <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.body}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                              </div>
                              {!isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 text-center">
                      <Link
                        to="/patients"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View all patients →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${user?.role === 'ADMIN' ? 'bg-blue-600' : 'bg-purple-600'}`}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0f172a]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
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