import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, FileSpreadsheet, Activity, Users, BedDouble, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { reportService } from '../../services/reportService';
import { formatDate } from '../../lib/utils';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('patients');

  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['reports-patients'],
    queryFn: () => reportService.getPatients(),
    enabled: activeTab === 'patients',
  });

  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ['reports-staff'],
    queryFn: () => reportService.getStaff(),
    enabled: activeTab === 'staff',
  });

  const { data: admissionsData, isLoading: loadingAdmissions } = useQuery({
    queryKey: ['reports-admissions'],
    queryFn: () => reportService.getAdmissions(),
    enabled: activeTab === 'admissions',
  });

  const { data: dischargesData, isLoading: loadingDischarges } = useQuery({
    queryKey: ['reports-discharges'],
    queryFn: () => reportService.getDischarges(),
    enabled: activeTab === 'discharges',
  });

  const handleExport = (type: string) => {
    toast.info(`Export feature (\${type}) — coming soon!`);
  };

  const renderTabButton = (id: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all \${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm font-medium transition-colors">
            <FileText size={16} /> PDF
          </button>
          <button onClick={() => handleExport('Excel')} className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 rounded-lg text-sm font-medium transition-colors">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button onClick={() => handleExport('CSV')} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
        {renderTabButton('patients', 'Patients', <Users size={18} />)}
        {renderTabButton('staff', 'Staff', <Users size={18} />)}
        {renderTabButton('admissions', 'Admissions', <BedDouble size={18} />)}
        {renderTabButton('discharges', 'Discharges', <CheckCircle size={18} />)}
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date Range</label>
            <select className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white outline-none">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
          </div>
        </div>

        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <Activity className="mx-auto text-gray-400 mb-3" size={32} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Report Data Ready</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              Select an export option above to download the {activeTab} report, or scroll down for a preview.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportsPage;