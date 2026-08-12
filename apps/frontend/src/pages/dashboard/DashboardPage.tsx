import React from 'react';
import { motion } from 'framer-motion';
import { Users, BedDouble, CheckCircle, AlertCircle, Users2, Stethoscope, Heart, Phone, Clock, Activity, TrendingUp, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      </div>
    </div>
  </div>
);

const pieColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#84cc16'];

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const DashboardPage = () => {
  const { user, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: admissionsData, isLoading: loadingAdmissions } = useQuery({
    queryKey: ['admissions-chart'],
    queryFn: () => dashboardService.getAdmissionsChart(),
  });

  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ['staff-distribution'],
    queryFn: () => dashboardService.getStaffDistribution(),
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => dashboardService.getRecentActivity(),
  });

  const stats: any = (statsData as any)?.data ?? {};
  const admissions = admissionsData?.data || [];
  const staffDistribution = staffData?.data || [];
  const activities = activityData?.data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getTimeOfDay()}, {user?.username || 'User'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening at your hospital today.
          </p>
        </div>
        {isAdmin() && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/patients')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Plus size={18} /> Add Patient
            </button>
            <button
              onClick={() => navigate('/staff')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus size={18} /> Add Staff
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          Array(8).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Patients" value={stats.totalPatients || 0} icon={<Users className="text-blue-500" />} bg="bg-blue-100 dark:bg-blue-900/30" />
            <StatCard title="Admitted" value={stats.admittedPatients || 0} icon={<BedDouble className="text-purple-500" />} bg="bg-purple-100 dark:bg-purple-900/30" />
            <StatCard title="Discharged" value={stats.dischargedPatients || 0} icon={<CheckCircle className="text-green-500" />} bg="bg-green-100 dark:bg-green-900/30" />
            <StatCard title="Critical" value={stats.criticalPatients || 0} icon={<AlertCircle className="text-red-500" />} bg="bg-red-100 dark:bg-red-900/30" />
            
            <StatCard title="Total Staff" value={stats.totalStaff || 0} icon={<Users2 className="text-indigo-500" />} bg="bg-indigo-100 dark:bg-indigo-900/30" />
            <StatCard title="Doctors" value={stats.doctors || 0} icon={<Stethoscope className="text-teal-500" />} bg="bg-teal-100 dark:bg-teal-900/30" />
            <StatCard title="Available Beds" value={stats.availableBeds || 0} icon={<Heart className="text-pink-500" />} bg="bg-pink-100 dark:bg-pink-900/30" />
            <StatCard title="Today's Activity" value={stats.todaysActivity || 0} icon={<Activity className="text-orange-500" />} bg="bg-orange-100 dark:bg-orange-900/30" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-500" size={20} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Monthly Admissions</h2>
          </div>
          <div className="h-80">
            {loadingAdmissions ? (
              <div className="w-full h-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={admissions} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `\${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#1f2937' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAdmissions)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-purple-500" size={20} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Staff Distribution</h2>
          </div>
          <div className="h-80">
            {loadingStaff ? (
              <div className="w-full h-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-full scale-75" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={staffDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="role"
                  >
                    {staffDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-\${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="text-orange-500" size={20} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          {loadingActivity ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))
          ) : activities.length > 0 ? (
            activities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                  {activity.user?.username.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{activity.user?.username}</span>{' '}
                    {activity.action.replace(/_/g, ' ').toLowerCase()}{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{activity.entity}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity found.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon, bg }: { title: string; value: number | string; icon: React.ReactNode; bg: string }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-full \${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default DashboardPage;