import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, FileText, FileSpreadsheet, Activity, Users, BedDouble, 
  CheckCircle, Calendar, Stethoscope, Search, Eye, Heart, 
  Thermometer, TrendingUp, AlertCircle, Clock, UserCheck, 
  ChevronRight, Printer, Sparkles, Filter 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { reportService } from '../../services/reportService';
import { formatDate, getStatusColor, getInitials } from '../../lib/utils';
import type { DailyReport } from '../patients/PatientDetailPage';

const conditionColorMap: Record<string, { badge: string; text: string; score: number }> = {
  Critical: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', text: 'text-red-500', score: 20 },
  Serious:  { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800', text: 'text-orange-500', score: 40 },
  Stable:   { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', text: 'text-blue-500', score: 60 },
  Improving:{ badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800', text: 'text-teal-500', score: 80 },
  Normal:   { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800', text: 'text-green-500', score: 100 },
};

function parseMedicalNotes(rawNotes?: string | null): { generalNotes: string; dailyReports: DailyReport[] } {
  if (!rawNotes) return { generalNotes: '', dailyReports: [] };
  try {
    const parsed = JSON.parse(rawNotes);
    if (parsed && typeof parsed === 'object') {
      return {
        generalNotes: typeof parsed.generalNotes === 'string' ? parsed.generalNotes : '',
        dailyReports: Array.isArray(parsed.dailyReports) ? parsed.dailyReports : [],
      };
    }
  } catch (_) {}
  return { generalNotes: rawNotes, dailyReports: [] };
}

interface EnrichedPatient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  bloodGroup: string | null;
  phone: string;
  disease: string;
  doctorAssigned: string;
  roomNumber?: string | null;
  admissionDate: string;
  dischargeDate?: string | null;
  status: string;
  medicalNotes?: string | null;
  generalNotes: string;
  dailyReports: DailyReport[];
}

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<'individual-patient' | 'combined-reports' | 'patients' | 'staff' | 'admissions' | 'discharges'>('individual-patient');
  
  // Patient status filter: ALL, CRITICAL, DISCHARGED, ADMITTED, PENDING
  const [patientStatusFilter, setPatientStatusFilter] = useState<string>('ALL');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');

  // 1. Fetch Patients data
  const { data: patientsResponse, isLoading: loadingPatients } = useQuery({
    queryKey: ['reports-patients'],
    queryFn: () => reportService.getPatients(),
  });

  const { data: staffResponse } = useQuery({
    queryKey: ['reports-staff'],
    queryFn: () => reportService.getStaff(),
    enabled: activeTab === 'staff',
  });

  const { data: admissionsResponse } = useQuery({
    queryKey: ['reports-admissions'],
    queryFn: () => reportService.getAdmissions(),
    enabled: activeTab === 'admissions',
  });

  const { data: dischargesResponse } = useQuery({
    queryKey: ['reports-discharges'],
    queryFn: () => reportService.getDischarges(),
    enabled: activeTab === 'discharges',
  });

  const rawPatients: any[] = patientsResponse?.data || [];
  const rawStaff: any[] = staffResponse?.data || [];
  const rawAdmissions: any[] = admissionsResponse?.data || [];
  const rawDischarges: any[] = dischargesResponse?.data || [];

  // Parse and enrich all patients
  const enrichedPatients: EnrichedPatient[] = useMemo(() => {
    return rawPatients.map((p: any) => {
      const parsed = parseMedicalNotes(p.medicalNotes);
      return {
        ...p,
        generalNotes: parsed.generalNotes,
        dailyReports: parsed.dailyReports,
      };
    });
  }, [rawPatients]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: enrichedPatients.length,
      critical: enrichedPatients.filter(p => p.status === 'CRITICAL').length,
      discharged: enrichedPatients.filter(p => p.status === 'DISCHARGED').length,
      admitted: enrichedPatients.filter(p => p.status === 'ADMITTED').length,
      pending: enrichedPatients.filter(p => p.status === 'PENDING').length,
      withReports: enrichedPatients.filter(p => p.dailyReports.length > 0).length,
    };
  }, [enrichedPatients]);

  // Patients filtered by status and search
  const filteredPatients = useMemo(() => {
    return enrichedPatients.filter(p => {
      const matchStatus = patientStatusFilter === 'ALL' || p.status === patientStatusFilter;
      const matchSearch = !patientSearchQuery.trim() || 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.patientId.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.disease.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.doctorAssigned.toLowerCase().includes(patientSearchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [enrichedPatients, patientStatusFilter, patientSearchQuery]);

  // Auto-select first matching patient if none selected or selected patient not in filtered list
  useEffect(() => {
    if (filteredPatients.length > 0) {
      const isCurrentValid = filteredPatients.some(p => p.id === selectedPatientId);
      if (!isCurrentValid) {
        // Prefer patient who has reports if available, otherwise first
        const withReports = filteredPatients.find(p => p.dailyReports.length > 0);
        setSelectedPatientId(withReports ? withReports.id : filteredPatients[0].id);
      }
    } else {
      setSelectedPatientId('');
    }
  }, [filteredPatients, selectedPatientId]);

  // Selected Patient details
  const activePatient = useMemo(() => {
    return enrichedPatients.find(p => p.id === selectedPatientId);
  }, [enrichedPatients, selectedPatientId]);

  // Active Patient's Chart Data
  const patientChartData = useMemo(() => {
    if (!activePatient || activePatient.dailyReports.length === 0) return [];
    return [...activePatient.dailyReports]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        formattedDate: formatDate(r.date, 'MMM dd'),
        rawDate: r.date,
        score: r.conditionScore,
        condition: r.condition,
        nurseReview: r.nurseReview,
        temp: r.vitals?.temperature,
        bp: r.vitals?.bloodPressure,
        hr: r.vitals?.heartRate,
      }));
  }, [activePatient]);

  // All reports flattened for the combined tab
  const allReportsCombined = useMemo(() => {
    const list: (DailyReport & { patient: EnrichedPatient })[] = [];
    enrichedPatients.forEach(p => {
      p.dailyReports.forEach(r => {
        list.push({ ...r, patient: p });
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [enrichedPatients]);

  const handleExport = (type: string) => {
    toast.info(`Export feature (${type}) — coming soon!`);
  };

  const handlePrintPatientReport = () => {
    if (!activePatient) return;
    toast.success(`Preparing printable medical report for ${activePatient.firstName} ${activePatient.lastName}...`);
    window.print();
  };

  const handleDownloadPatientReport = () => {
    if (!activePatient) return;

    const vitalsRows = (activePatient.dailyReports || [])
      .map(r => `
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 500;">${formatDate(r.date, 'MMM dd, yyyy - hh:mm a')}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">${r.condition} (${r.conditionScore}/100)</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${r.vitals?.temperature ? r.vitals.temperature + '°F' : '—'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${r.vitals?.bloodPressure || '—'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${r.vitals?.heartRate ? r.vitals.heartRate + ' bpm' : '—'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${r.conditionNotes || (r as any).symptoms || '—'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-style: italic; color: #334155;">"${r.nurseReview || '—'}"</td>
        </tr>
      `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medical Report - ${activePatient.firstName} ${activePatient.lastName} (${activePatient.patientId})</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #0f172a; background: #ffffff; line-height: 1.5; }
    .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .hospital-title { font-size: 22px; font-weight: 800; color: #1e3a8a; margin: 0; letter-spacing: -0.5px; }
    .hospital-sub { font-size: 12px; color: #64748b; margin: 3px 0 0 0; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-cell { font-size: 12px; }
    .meta-label { color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .meta-val { font-weight: 600; color: #0f172a; margin-top: 2px; }
    .section-head { font-size: 14px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 24px 0 14px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-bottom: 16px; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; padding: 8px 10px; border: 1px solid #cbd5e1; }
    .notes-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-size: 12px; white-space: pre-line; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; }
    .sign-box { text-align: center; width: 220px; }
    .sign-line { border-top: 1px solid #0f172a; margin-bottom: 4px; }
    .print-btn-bar { text-align: right; margin-bottom: 20px; }
    .btn-print { background: #2563eb; color: #fff; padding: 8px 18px; border: none; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; }
    @media print {
      body { margin: 0; }
      .print-btn-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="btn-print" onclick="window.print()">🖨️ Print Dossier / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <h1 class="hospital-title">HOSPITAL MANAGEMENT SYSTEM</h1>
      <p class="hospital-sub">Department of Inpatient Care & Medical Records</p>
      <p class="hospital-sub">Confidential Individual Patient Progress Report</p>
    </div>
    <div style="text-align: right;">
      <span class="status-badge">${activePatient.status}</span>
      <p style="font-family: monospace; font-size: 12px; font-weight: bold; margin: 5px 0 0 0; color: #1e293b;">${activePatient.patientId}</p>
      <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Report Date: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-cell">
      <div class="meta-label">Patient Name</div>
      <div class="meta-val">${activePatient.firstName} ${activePatient.lastName}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Age / Gender</div>
      <div class="meta-val">${activePatient.age} yrs • ${activePatient.gender}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Blood Group</div>
      <div class="meta-val">${activePatient.bloodGroup ? activePatient.bloodGroup.replace('_', ' ') : 'N/A'}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Contact Phone</div>
      <div class="meta-val">${activePatient.phone}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Primary Diagnosis</div>
      <div class="meta-val">${activePatient.disease}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Attending Doctor</div>
      <div class="meta-val">Dr. ${activePatient.doctorAssigned}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Allocated Ward / Room</div>
      <div class="meta-val">${activePatient.roomNumber || 'Not Assigned'}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Admission / Discharge</div>
      <div class="meta-val">
        ${formatDate(activePatient.admissionDate, 'MMM dd, yyyy')}
        ${activePatient.dischargeDate ? ' → ' + formatDate(activePatient.dischargeDate, 'MMM dd, yyyy') : ''}
      </div>
    </div>
  </div>

  <div class="section-head">Clinical Condition & Nurse Reviews Log (${activePatient.dailyReports.length} Recorded Entries)</div>
  ${activePatient.dailyReports.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Observation Time</th>
          <th style="width: 14%;">Condition (Score)</th>
          <th style="width: 9%;">Temp</th>
          <th style="width: 10%;">Blood Pressure</th>
          <th style="width: 9%;">Heart Rate</th>
          <th style="width: 15%;">Symptoms</th>
          <th style="width: 25%;">Nurse Review & Notes</th>
        </tr>
      </thead>
      <tbody>
        ${vitalsRows}
      </tbody>
    </table>
  ` : `
    <p style="font-style: italic; color: #64748b; font-size: 12px; margin-bottom: 20px;">No daily condition reports or nurse observations recorded yet for this patient stay.</p>
  `}

  <div class="section-head">General Medical Notes & Clinical History</div>
  <div class="notes-box">
    ${activePatient.generalNotes ? activePatient.generalNotes : 'No additional medical history entered.'}
  </div>

  <div class="footer">
    <div>
      <p style="margin: 0; font-weight: 700; color: #0f172a;">OFFICIAL MEDICAL RECORD</p>
      <p style="margin: 2px 0 0 0;">Hospital Management System • Confidential Healthcare Documentation</p>
    </div>
    <div class="sign-box">
      <div class="sign-line"></div>
      <p style="margin: 0; font-weight: 700; color: #0f172a;">Dr. ${activePatient.doctorAssigned}</p>
      <p style="margin: 2px 0 0 0; font-size: 10px;">Attending Physician / Authorized Signature</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medical_Report_${activePatient.patientId}_${activePatient.firstName}_${activePatient.lastName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded official report for ${activePatient.firstName} ${activePatient.lastName}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Clinical Analytics</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Individual patient condition progress curves, discharge summaries, critical monitoring, and nurse review logs
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

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm no-print print:hidden">
        <button
          onClick={() => setActiveTab('individual-patient')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'individual-patient' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Activity size={18} /> Individual Patient Reports
        </button>

        <button
          onClick={() => setActiveTab('combined-reports')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'combined-reports' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Stethoscope size={18} /> All Nurse Reviews Log
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'combined-reports' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
            {allReportsCombined.length}
          </span>
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

      {/* ── TAB 1: INDIVIDUAL PATIENT REPORT DOSSIER (DEFAULT) ── */}
      {activeTab === 'individual-patient' && (
        <div className="space-y-6">
          {/* Patient Status Filter Pills Bar */}
          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm space-y-3 no-print print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14} className="text-blue-500" /> Filter Patients by Clinical Status:
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredPatients.length} of {enrichedPatients.length} patients
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPatientStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  patientStatusFilter === 'ALL'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                All Statuses
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 dark:bg-white/20">
                  {statusCounts.all}
                </span>
              </button>

              <button
                onClick={() => setPatientStatusFilter('ADMITTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  patientStatusFilter === 'ADMITTED'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100'
                }`}
              >
                <BedDouble size={13} />
                Admitted
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200/60 dark:bg-blue-800/60">
                  {statusCounts.admitted}
                </span>
              </button>

              <button
                onClick={() => setPatientStatusFilter('CRITICAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  patientStatusFilter === 'CRITICAL'
                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400/30'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-100'
                }`}
              >
                <AlertCircle size={13} />
                Critical
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-200/60 dark:bg-red-800/60">
                  {statusCounts.critical}
                </span>
              </button>

              <button
                onClick={() => setPatientStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  patientStatusFilter === 'PENDING'
                    ? 'bg-yellow-600 text-white shadow-sm ring-2 ring-yellow-400/30'
                    : 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/40 hover:bg-yellow-100'
                }`}
              >
                <Clock size={13} />
                Pending
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-yellow-200/60 dark:bg-yellow-800/60">
                  {statusCounts.pending}
                </span>
              </button>

              <button
                onClick={() => setPatientStatusFilter('DISCHARGED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  patientStatusFilter === 'DISCHARGED'
                    ? 'bg-green-600 text-white shadow-sm ring-2 ring-green-400/30'
                    : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40 hover:bg-green-100'
                }`}
              >
                <CheckCircle size={13} />
                Discharged
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-green-200/60 dark:bg-green-800/60">
                  {statusCounts.discharged}
                </span>
              </button>
            </div>
          </div>

          {/* ── Two-Pane Individual Patient Report Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Pane: Selectable Patients List (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-4 space-y-3 no-print print:hidden">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patient, ID, disease..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => {
                    const isSelected = p.id === selectedPatientId;
                    const hasReports = p.dailyReports.length > 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm ring-1 ring-blue-500/20'
                            : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getStatusColor(p.status).replace('text-white', '').replace('bg-', 'bg-opacity-20 text-')}`}>
                          {getInitials(p.firstName, p.lastName)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {p.firstName} {p.lastName}
                            </p>
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${getStatusColor(p.status)}`}>
                              {p.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="font-mono">{p.patientId}</span>
                            <span>•</span>
                            <span className="truncate">{p.disease}</span>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-800/60">
                            <span className="text-[10px] text-gray-400">
                              Dr. {p.doctorAssigned}
                            </span>
                            {hasReports ? (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Activity size={11} /> {p.dailyReports.length} {p.dailyReports.length === 1 ? 'Report' : 'Reports'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No reports</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No patients match status: <strong>{patientStatusFilter}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Selected Patient's Separate Report Dossier (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {activePatient ? (
                <div id="printable-patient-dossier" className="space-y-6">
                  {/* Printable Official Letterhead (Visible ONLY during window.print) */}
                  <div className="hidden print:block print-only mb-6 border-b-2 border-gray-900 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">HOSPITAL MANAGEMENT SYSTEM</h1>
                        <p className="text-xs text-gray-700 font-semibold mt-0.5">Department of Inpatient Care & Medical Records</p>
                        <p className="text-[11px] text-gray-500">Official Clinical Summary & Medical Progress Report</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-800 text-gray-900 uppercase">
                          {activePatient.status}
                        </span>
                        <p className="font-mono font-bold text-xs mt-1 text-gray-900">{activePatient.patientId}</p>
                        <p className="text-[10px] text-gray-500">Report Date: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Patient Clinical Header Card */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${getStatusColor(activePatient.status).replace('text-white', '').replace('bg-', 'bg-opacity-20 text-')}`}>
                          {getInitials(activePatient.firstName, activePatient.lastName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                              {activePatient.firstName} {activePatient.lastName}
                            </h2>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getStatusColor(activePatient.status)}`}>
                              {activePatient.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                            <span className="font-mono font-medium">{activePatient.patientId}</span>
                            <span>•</span>
                            <span>{activePatient.age} yrs • {activePatient.gender}</span>
                            {activePatient.bloodGroup && (
                              <>
                                <span>•</span>
                                <span className="text-red-500 font-semibold">Blood: {activePatient.bloodGroup.replace('_', ' ')}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 no-print print:hidden">
                        <Link
                          to={`/patients/${activePatient.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye size={14} /> Open Profile
                        </Link>
                        <button
                          onClick={handlePrintPatientReport}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
                          title="Print Patient Report"
                        >
                          <Printer size={14} /> Print
                        </button>
                        <button
                          onClick={handleDownloadPatientReport}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                          title="Download Patient Medical Report"
                        >
                          <Download size={14} /> Download Report
                        </button>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Primary Diagnosis</span>
                        <span className="font-semibold text-gray-900 dark:text-white mt-0.5 block">{activePatient.disease}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Attending Doctor</span>
                        <span className="font-semibold text-gray-900 dark:text-white mt-0.5 block">{activePatient.doctorAssigned}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Room / Ward</span>
                        <span className="font-semibold text-gray-900 dark:text-white mt-0.5 block">{activePatient.roomNumber || 'Not Assigned'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Admission / Discharge</span>
                        <span className="font-semibold text-gray-900 dark:text-white mt-0.5 block">
                          {formatDate(activePatient.admissionDate, 'MMM dd, yyyy')}
                          {activePatient.dischargeDate ? ` → ${formatDate(activePatient.dischargeDate, 'MMM dd')}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Separate Patient Condition Progress Graph ── */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="text-blue-600 dark:text-blue-400" size={18} />
                          Clinical Condition Progress Curve — {activePatient.firstName} {activePatient.lastName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Daily health trajectory curve plotting condition ratings from admission to discharge
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                          {activePatient.dailyReports.length} {activePatient.dailyReports.length === 1 ? 'Daily Report' : 'Daily Reports'}
                        </span>
                      </div>
                    </div>

                    {patientChartData.length > 0 ? (
                      <div className="h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={patientChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="singlePatientGrad" x1="0" y1="0" x2="0" y2="1">
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
                            <Tooltip content={<SinglePatientTooltip patientName={`${activePatient.firstName} ${activePatient.lastName}`} />} />
                            <Area 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#2563EB" 
                              strokeWidth={2.5} 
                              fill="url(#singlePatientGrad)" 
                              dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#ffffff' }}
                              activeDot={{ r: 6, fill: '#06B6D4' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="py-10 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        <Activity size={32} className="mx-auto text-gray-400 mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          No daily reports logged yet for {activePatient.firstName} {activePatient.lastName}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                          Open the patient's profile and click "Add Daily Report" to log condition and nurse reviews.
                        </p>
                        <Link
                          to={`/patients/${activePatient.id}`}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <Activity size={13} /> Add Report for this Patient
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* ── Patient's Nurse Reviews Log History ── */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Stethoscope className="text-teal-600 dark:text-teal-400" size={18} />
                          Daily Nurse Review Log ({activePatient.dailyReports.length})
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Daily nurse reviews, vitals, and condition notes for this patient
                        </p>
                      </div>
                    </div>

                    {activePatient.dailyReports.length > 0 ? (
                      <div className="space-y-3">
                        {[...activePatient.dailyReports]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((report) => {
                            const cond = conditionColorMap[report.condition] || conditionColorMap.Stable;
                            return (
                              <div
                                key={report.id}
                                className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                      <Calendar size={13} className="text-gray-400" />
                                      {formatDate(report.date, 'MMMM dd, yyyy')}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cond.badge}`}>
                                      {report.condition} ({report.conditionScore}%)
                                    </span>
                                  </div>

                                  {report.recordedBy && (
                                    <span className="text-[10px] text-gray-400">By {report.recordedBy}</span>
                                  )}
                                </div>

                                {/* Vitals */}
                                {report.vitals && (report.vitals.temperature || report.vitals.bloodPressure || report.vitals.heartRate) && (
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {report.vitals.temperature && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                        <Thermometer size={12} className="text-red-500" /> {report.vitals.temperature}
                                      </span>
                                    )}
                                    {report.vitals.bloodPressure && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                        <Heart size={12} className="text-rose-500" /> BP: {report.vitals.bloodPressure}
                                      </span>
                                    )}
                                    {report.vitals.heartRate && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                        <Activity size={12} className="text-indigo-500" /> {report.vitals.heartRate}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Symptoms */}
                                {report.conditionNotes && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300">
                                    <strong className="text-gray-800 dark:text-gray-200">Symptoms:</strong> {report.conditionNotes}
                                  </p>
                                )}

                                {/* Nurse Review Blockquote */}
                                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-500 text-xs space-y-1">
                                  <p className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                    <Stethoscope size={13} /> Nurse Review of the Day:
                                  </p>
                                  <p className="text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                                    "{report.nurseReview}"
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No nurse review logs recorded yet for this patient.</p>
                    )}
                  </div>

                  {/* General Medical Notes */}
                  {activePatient.generalNotes && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} className="text-green-500" /> Additional Medical Notes
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg whitespace-pre-wrap">
                        {activePatient.generalNotes}
                      </p>
                    </div>
                  )}

                  {/* Printable Doctor Signature & Certification Block (Visible ONLY during window.print) */}
                    <div className="hidden print:block print-only pt-8 mt-8 border-t border-gray-400">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs font-bold text-gray-900">CONFIDENTIAL MEDICAL DOCUMENT</p>
                          <p className="text-[10px] text-gray-600">This clinical dossier contains protected health information issued by HMS.</p>
                        </div>
                        <div className="text-center min-w-[200px]">
                          <div className="border-b border-gray-900 w-44 mb-1 mx-auto" />
                          <p className="text-xs font-bold text-gray-900">Dr. {activePatient.doctorAssigned}</p>
                          <p className="text-[10px] text-gray-600">Attending Physician / Authorized Signature</p>
                        </div>
                      </div>
                    </div>
                  </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <Users size={36} className="mx-auto text-gray-400 mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select a patient on the left to view their report</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ALL NURSE REVIEWS LOG (COMBINED FEED) ── */}
      {activeTab === 'combined-reports' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="text-blue-600 dark:text-blue-400" size={18} />
                All Hospital Nurse Reviews Feed ({allReportsCombined.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Consolidated chronological feed of nurse reviews across all admitted and discharged patients
              </p>
            </div>
          </div>

          {allReportsCombined.length > 0 ? (
            <div className="space-y-3.5">
              {allReportsCombined.map((report) => {
                const cond = conditionColorMap[report.condition] || conditionColorMap.Stable;
                return (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Link 
                          to={`/patients/${report.patient.id}`}
                          className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                        >
                          {report.patient.firstName} {report.patient.lastName}
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-normal">
                            {report.patient.patientId}
                          </span>
                        </Link>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${getStatusColor(report.patient.status)}`}>
                          {report.patient.status}
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
                          to={`/patients/${report.patient.id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Patient Details"
                        >
                          <Eye size={16} />
                        </Link>
                      </div>
                    </div>

                    {/* Vitals */}
                    {report.vitals && (report.vitals.temperature || report.vitals.bloodPressure || report.vitals.heartRate) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {report.vitals.temperature && (
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
                      </div>
                    )}

                    {/* Nurse Review Blockquote */}
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-500 text-xs space-y-1">
                      <p className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <Stethoscope size={13} /> Nurse Review of the Day:
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                        "{report.nurseReview}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-400">
              No daily nurse reviews recorded yet.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PATIENTS DIRECTORY TABLE ── */}
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

      {/* ── TAB 4: STAFF DIRECTORY TABLE ── */}
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

      {/* ── TAB 5: ADMISSIONS PREVIEW ── */}
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

      {/* ── TAB 6: DISCHARGES PREVIEW ── */}
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

const SinglePatientTooltip = ({ active, payload, patientName }: any) => {
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
        <p className="font-semibold text-blue-600 dark:text-blue-400">{patientName}</p>
        {data.temp && <p className="text-gray-500">🌡️ Temp: <span className="font-semibold text-gray-800 dark:text-gray-200">{data.temp}</span></p>}
        {data.bp && <p className="text-gray-500">💓 BP: <span className="font-semibold text-gray-800 dark:text-gray-200">{data.bp}</span></p>}
        <p className="text-gray-600 dark:text-gray-300 italic line-clamp-2">"{data.nurseReview}"</p>
      </div>
    );
  }
  return null;
};

export default ReportsPage;