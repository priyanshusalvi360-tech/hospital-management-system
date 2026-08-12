import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, PlusCircle, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { useDebounce } from '../../hooks/useDebounce';
import { getInitials, getStatusColor } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

/** Calculate days between two ISO date strings */
function calcDaysStay(admissionDate?: string, dischargeDate?: string): string {
  if (!admissionDate || !dischargeDate) return '—';
  const a = new Date(admissionDate);
  const d = new Date(dischargeDate);
  if (isNaN(a.getTime()) || isNaN(d.getTime())) return '—';
  const diff = Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? `${diff} day${diff === 1 ? '' : 's'}` : '—';
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

export const DischargePage = () => {
  const { isAdmin } = useAuthStore();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', { page, search, status: 'DISCHARGED' }],
    queryFn: () => patientService.getAll({ page, search, status: 'DISCHARGED', limit: 10 }),
  });

  const rawData: any = (data as any)?.data;
  const patients: any[] = rawData?.items ?? (Array.isArray(rawData) ? rawData : []);
  const meta: any = rawData?.meta ?? { totalPages: 1, currentPage: page };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discharged Patients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Patients who have completed their treatment</p>
        </div>
        {isAdmin() && (
          <Link
            to="/patients?action=add"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <PlusCircle size={16} />
            Add Patient
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search discharged patients..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Patient ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Disease</th>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Room</th>
                <th className="px-6 py-4 font-medium">Admitted</th>
                <th className="px-6 py-4 font-medium">Discharged</th>
                <th className="px-6 py-4 font-medium">
                  <span className="flex items-center gap-1"><CalendarCheck size={14} /> Days Stay</span>
                </th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(9).fill(0).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <CalendarCheck size={32} className="text-gray-300 dark:text-gray-600" />
                      <span>No discharged patients found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient: any) => {
                  const days = calcDaysStay(patient.admissionDate, patient.dischargeDate);
                  return (
                    <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          {patient.patientId || `PAT-${patient.id.substring(0, 6)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-xs font-semibold text-green-700 dark:text-green-400 shrink-0">
                            {getInitials(patient.firstName, patient.lastName)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {patient.firstName} {patient.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.disease}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.doctorAssigned}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.roomNumber || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">{fmtDate(patient.admissionDate)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">{fmtDate(patient.dischargeDate)}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{days}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="p-1.5 inline-block text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={18} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {meta.currentPage} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    page === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DischargePage;