import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, FileText, FileSpreadsheet, Activity, Users, BedDouble, 
  CheckCircle, Calendar, Stethoscope, Search, Filter, Eye, Heart, 
  Thermometer, TrendingUp, AlertCircle, Clock 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { reportService } from '../../services/reportService';
import { formatDate, getStatusColor } from '../../lib/utils';
import type { DailyReport } from '../patients/PatientDetailPage';

const conditionColorMap: Record<string, { badge: string; text: string; score: number }> = {
  Critical: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', text: 'text-red-500', score: 20 },
  Serious:  { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800', text: 'text-orange-500', score: 40 },
  Stable:   { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', text: 'text-blue-500', score: 60 },
  Improving:{ badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800', text: 'text-teal-500', score: 80 },
  Normal:   { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800', text: 'text-green-500', score: 100 },
};

interface FlatDailyReportRecord extends DailyReport {
  patientDbId: string;
  patientIdCode: string;
  patientName: string;
  disease: string;
  roomNumber?: string | null;
  patientStatus: string;
}

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<'daily-reports' | 'patients' | 'staff' | 'admissions' | 'discharges'>('daily-reports');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch Patients for daily reports and patient reports
  const { data: patientsResponse, isLoading: loadingPatients } = useQuery({
    queryKey: ['reports-patients'],
    queryFn: () => reportService.getPatients(),
  });

  const { data: staffResponse, isLoading: loadingStaff } = useQuery({
    queryKey: ['reports-staff'],
    queryFn: () => reportService.getStaff(),
    enabled: activeTab === 'staff',
  });

  const { data: admissionsResponse, isLoading: loadingAdmissions } = useQuery({
    queryKey: ['reports-admissions'],
    queryFn: () => reportService.getAdmissions(),
    enabled: activeTab === 'admissions',
  });

  const { data: dischargesResponse, isLoading: loadingDischarges } = useQuery({
    queryKey: ['reports-discharges'],
    queryFn: () => reportService.getDischarges(),
    enabled: activeTab === 'discharges',
  });

  const rawPatients: any[] = patientsResponse?.data || [];
  const rawStaff: any[] = staffResponse?.data || [];
  const rawAdmissions: any[] = admissionsResponse?.data || [];
  const rawDischarges: any[] = dischargesResponse?.data || [];

  // Extract all daily reports across all patients
  const { allReports, patientsWithReports } = useMemo(() => {
    const reportsList: FlatDailyReportRecord[] = [];
    const patientsMap = new Map<string, { id: string; name: string; code: string; count: number }>();

    rawPatients.forEach((patient: any) => {
      if (patient.medicalNotes) {
        try {
          const parsed = JSON.parse(patient.medicalNotes);
          if (parsed && Array.isArray(parsed.dailyReports) && parsed.dailyReports.length > 0) {
            patientsMap.set(patient.id, {
              id: patient.id,
              name: `${patient.firstName} ${patient.lastName}`,
              code: patient.patientId || `PAT-${patient.id.substring(0, 6)}`,
              count: parsed.dailyReports.length,
            });

            parsed.dailyReports.forEach((rep: DailyReport) => {
              reportsList.push({
                ...rep,
                patientDbId: patient.id,
                patientIdCode: patient.patientId || `PAT-${patient.id.substring(0, 6)}`,
                patientName: `${patient.firstName} ${patient.lastName}`,
                disease: patient.disease,
                roomNumber: patient.roomNumber,
                patientStatus: patient.status,
              });
            });
          }
        } catch (_) {
          // Not a JSON medicalNotes
        }
      }
    });

    reportsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      allReports: reportsList,
      patientsWithReports: Array.from(patientsMap.values()),
    };
  }, [rawPatients]);

  // Filtered reports according to filters
  const filteredReports = useMemo(() => {
    return allReports.filter(r => {
      const matchPatient = selectedPatientId === 'all' || r.patientDbId === selectedPatientId;
      const matchCondition = conditionFilter === 'all' || r.condition === conditionFilter;
      const matchSearch = !searchQuery.trim() || 
        r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.patientIdCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nurseReview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.conditionNotes && r.conditionNotes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPatient && matchCondition && matchSearch;
    });
  }, [allReports, selectedPatientId, conditionFilter, searchQuery]);

  // Graph data sorted chronologically
  const chartData = useMemo(() => {
    // If a specific patient is selected or we plot the filtered reports chronologically
    const target = (selectedPatientId !== 'all' 
      ? allReports.filter(r => r.patientDbId === selectedPatientId)
      : filteredReports
    );

    return [...target]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        formattedDate: formatDate(r.date, 'MMM dd'),
        rawDate: r.date,
        score: r.conditionScore,
        condition: r.condition,
        patientName: r.patientName,
        nurseReview: r.nurseReview,
        temp: r.vitals?.temperature,
        bp: r.vitals?.bloodPressure,
        hr: r.vitals?.heartRate,
      }));
  }, [allReports, filteredReports, selectedPatientId]);

  const handleExport = (type: string) => {
    toast.info(`Export feature (${type}) — coming soon!`);
  };

  const selectedPatientObj = patientsWithReports.find(p => p.id === selectedPatientId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Health trajectory curves, nurse daily observations, and department summaries
          </p>
        </div>

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

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('daily-reports')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'daily-reports' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Activity size={18} /> Daily Patient Reports
          {allReports.length > 0 && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'daily-reports' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
              {allReports.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'patients' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users size={18} /> Patients Directory
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'staff' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Stethoscope size={18} /> Staff Report
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'admissions' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <BedDouble size={18} /> Admissions
        </button>

        <button
          onClick={() => setActiveTab('discharges')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'discharges' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <CheckCircle size={18} /> Discharges
        </button>
      </div>

      {/* ── TAB 1: DAILY PATIENT REPORTS & GRAPH ── */}
      {activeTab === 'daily-reports' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Daily Entries</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{allReports.length}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Patients Tracked</span>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{patientsWithReports.length}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Average Condition Score</span>
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                {allReports.length > 0
                  ? Math.round(allReports.reduce((acc, curr) => acc + curr.conditionScore, 0) / allReports.length) + '%'
                  : '—'}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Latest Recorded Condition</span>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-2">
                {allReports[0] ? (
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${conditionColorMap[allReports[0].condition]?.badge}`}>
                    {allReports[0].condition} ({allReports[0].conditionScore}%)
                  </span>
                ) : '—'}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              {/* Select Patient Dropdown */}
              <div className="min-w-[220px]">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Filter by Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Patients ({allReports.length} reports)</option>
                  {patientsWithReports.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — {p.count} reports
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition Filter */}
              <div className="min-w-[150px]">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Condition Level
                </label>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Conditions</option>
                  <option value="Critical">Critical</option>
                  <option value="Serious">Serious</option>
                  <option value="Stable">Stable</option>
                  <option value="Improving">Improving</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>

              {/* Search text */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Search Observations / Nurse Notes
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search nurse review, symptoms, name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {selectedPatientId !== 'all' && (
              <button
                onClick={() => setSelectedPatientId('all')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline self-end md:self-center"
              >
                Clear Patient Filter
              </button>
            )}
          </div>

          {/* Condition Progress Curve (Graph) */}
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-blue-600 dark:text-blue-400" size={18} />
                  Condition Progress Curve
                  {selectedPatientObj && (
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      — {selectedPatientObj.name} ({selectedPatientObj.code})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Visual recovery trajectory plotting condition scores over time
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Stable</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Normal</span>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportConditionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                    <XAxis 
                      dataKey="formattedDate" 
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      ticks={[20, 40, 60, 80, 100]}
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => {
                        if (val <= 20) return 'Crit';
                        if (val <= 40) return 'Ser';
                        if (val <= 60) return 'Stab';
                        if (val <= 80) return 'Imp';
                        return 'Norm';
                      }}
                    />
                    <Tooltip content={<ReportChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#2563EB" 
                      strokeWidth={2.5} 
                      fill="url(#reportConditionGrad)" 
                      dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#06B6D4' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <Activity size={36} className="mx-auto text-gray-400 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No report data matches the filter</p>
                <p className="text-xs text-gray-500 mt-1">Try selecting a different patient or clearing filters above.</p>
              </div>
            )}
          </div>

          {/* Daily Reports & Nurse Reviews Table / List */}
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="text-teal-600 dark:text-teal-400" size={18} />
                  Nurse Review Log & Patient Reports ({filteredReports.length})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Detailed daily records with nurse observation notes and recorded vitals
                </p>
              </div>
            </div>

            {filteredReports.length > 0 ? (
              <div className="space-y-3.5">
                {filteredReports.map((report) => {
                  const cond = conditionColorMap[report.condition] || conditionColorMap.Stable;
                  return (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Link 
                            to={`/patients/${report.patientDbId}`}
                            className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                          >
                            {report.patientName}
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-normal">
                              {report.patientIdCode}
                            </span>
                          </Link>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                            {report.disease} {report.roomNumber ? `(Room ${report.roomNumber})` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <Calendar size={13} className="text-gray-400" />
                            {formatDate(report.date, 'MMMM dd, yyyy')}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cond.badge}`}>
                            {report.condition} ({report.conditionScore}%)
                          </span>
                          <Link
                            to={`/patients/${report.patientDbId}`}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="View Patient Details"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </div>

                      {/* Vitals & Condition Notes */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {report.vitals?.temperature && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                            <Thermometer size={12} className="text-red-500" /> {report.vitals.temperature}
                          </span>
                        )}
                        {report.vitals?.bloodPressure && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                            <Heart size={12} className="text-rose-500" /> BP: {report.vitals.bloodPressure}
                          </span>
                        )}
                        {report.vitals?.heartRate && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                            <Activity size={12} className="text-indigo-500" /> {report.vitals.heartRate}
                          </span>
                        )}
                        {report.conditionNotes && (
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            <strong className="text-gray-800 dark:text-gray-200">Symptoms:</strong> {report.conditionNotes}
                          </span>
                        )}
                      </div>

                      {/* Nurse Review Blockquote */}
                      <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-500 text-xs space-y-1">
                        <p className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                          <Stethoscope size={13} /> Nurse Review of the Day:
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                          "{report.nurseReview}"
                        </p>
                      </div>

                      {report.recordedBy && (
                        <p className="text-[10px] text-gray-400 text-right">
                          Logged by {report.recordedBy} on {formatDate(report.createdAt, 'MMM dd, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <Stethoscope size={36} className="mx-auto text-gray-400 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Daily Patient Reports Found</p>
                <p className="text-xs text-gray-500 mt-1">
                  Add reports by opening any patient's page and clicking "Add Daily Report".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: PATIENTS DIRECTORY TABLE ── */}
      {activeTab === 'patients' && (
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Patients Directory Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Age / Gender</th>
                  <th className="px-4 py-3">Disease</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rawPatients.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-mono text-xs">{p.patientId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{p.age}y • {p.gender}</td>
                    <td className="px-4 py-3">{p.disease}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.doctorAssigned}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/patients/${p.id}`} className="text-blue-600 hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: STAFF DIRECTORY TABLE ── */}
      {activeTab === 'staff' && (
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Staff Report Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rawStaff.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-mono text-xs">{s.employeeId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.fullName}</td>
                    <td className="px-4 py-3">{s.role}</td>
                    <td className="px-4 py-3 text-gray-500">{s.department}</td>
                    <td className="px-4 py-3">{s.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: ADMISSIONS PREVIEW ── */}
      {activeTab === 'admissions' && (
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Admissions Report Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Disease</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Admission Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rawAdmissions.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-mono text-xs">{p.patientId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3">{p.disease}</td>
                    <td className="px-4 py-3 text-gray-500">{p.roomNumber || '—'}</td>
                    <td className="px-4 py-3">{formatDate(p.admissionDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/patients/${p.id}`} className="text-blue-600 hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: DISCHARGES PREVIEW ── */}
      {activeTab === 'discharges' && (
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Discharges Report Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Disease</th>
                  <th className="px-4 py-3">Discharge Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rawDischarges.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-mono text-xs">{p.patientId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3">{p.disease}</td>
                    <td className="px-4 py-3">{formatDate(p.dischargeDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/patients/${p.id}`} className="text-blue-600 hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ReportChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const cond = conditionColorMap[data.condition] || conditionColorMap.Stable;
    return (
      <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl text-xs space-y-1.5 max-w-xs">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-1">
          <span className="font-bold text-gray-900 dark:text-white">{data.formattedDate}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cond.badge}`}>
            {data.condition} ({data.score}%)
          </span>
        </div>
        <p className="font-semibold text-blue-600 dark:text-blue-400">{data.patientName}</p>
        {data.temp && <p className="text-gray-500">🌡️ Temp: <span className="font-semibold text-gray-800 dark:text-gray-200">{data.temp}</span></p>}
        {data.bp && <p className="text-gray-500">💓 BP: <span className="font-semibold text-gray-800 dark:text-gray-200">{data.bp}</span></p>}
        <p className="text-gray-600 dark:text-gray-300 italic line-clamp-2">"{data.nurseReview}"</p>
      </div>
    );
  }
  return null;
};

export default ReportsPage;