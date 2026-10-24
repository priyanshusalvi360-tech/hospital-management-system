import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Edit2, Trash2, UserCheck, UserX, AlertCircle, Phone, MapPin, 
  Calendar, Clock, Stethoscope, BedDouble, Activity, FileText, Plus, X, 
  Loader2, Heart, Thermometer, TrendingUp, CheckCircle2, RotateCcw,
  Printer, Download 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { toast } from 'sonner';
import { patientService } from '../../services/patientService';
import { formatDate, getStatusColor, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export interface DailyReport {
  id: string;
  date: string;
  condition: 'Critical' | 'Serious' | 'Stable' | 'Improving' | 'Normal';
  conditionScore: number;
  conditionNotes?: string;
  nurseReview: string;
  vitals?: {
    temperature?: string;
    bloodPressure?: string;
    heartRate?: string;
  };
  recordedBy?: string;
  createdAt: string;
}

interface ParsedMedicalNotes {
  generalNotes: string;
  dailyReports: DailyReport[];
}

function parseMedicalNotes(rawNotes?: string | null): ParsedMedicalNotes {
  if (!rawNotes) return { generalNotes: '', dailyReports: [] };
  try {
    const parsed = JSON.parse(rawNotes);
    if (parsed && typeof parsed === 'object') {
      return {
        generalNotes: typeof parsed.generalNotes === 'string' ? parsed.generalNotes : '',
        dailyReports: Array.isArray(parsed.dailyReports) ? parsed.dailyReports : [],
      };
    }
  } catch (_) {
    // Legacy plain text notes
  }
  return { generalNotes: rawNotes, dailyReports: [] };
}

const conditionColorMap: Record<string, { badge: string; text: string; score: number }> = {
  Critical: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', text: 'text-red-500', score: 20 },
  Serious:  { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800', text: 'text-orange-500', score: 40 },
  Stable:   { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', text: 'text-blue-500', score: 60 },
  Improving:{ badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800', text: 'text-teal-500', score: 80 },
  Normal:   { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800', text: 'text-green-500', score: 100 },
};

export const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id!),
    enabled: !!id,
  });

  const patient = response?.data;
  const parsedNotes = parseMedicalNotes(patient?.medicalNotes);

  const admitMutation = useMutation({
    mutationFn: () => patientService.admit(id!),
    onSuccess: () => {
      toast.success('Patient admitted successfully! Bed assigned.');
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-chart'] });
    },
    onError: () => toast.error('Failed to admit patient')
  });

  const dischargeMutation = useMutation({
    mutationFn: () => patientService.discharge(id!),
    onSuccess: () => {
      toast.success('Patient discharged successfully! Bed freed.');
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-chart'] });
    },
    onError: () => toast.error('Failed to discharge patient')
  });

  const deleteMutation = useMutation({
    mutationFn: () => patientService.delete(id!),
    onSuccess: () => {
      toast.success('Patient deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/patients');
    },
    onError: () => toast.error('Failed to delete patient')
  });

  const updateNotesMutation = useMutation({
    mutationFn: (newMedicalNotes: string) => patientService.update(id!, { medicalNotes: newMedicalNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update patient record');
    }
  });

  const handleSaveDailyReport = (reportData: Omit<DailyReport, 'id' | 'createdAt'>) => {
    const newReport: DailyReport = {
      ...reportData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      recordedBy: user?.username || 'Admin',
    };

    const updatedReports = [...parsedNotes.dailyReports, newReport].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const serialized = JSON.stringify({
      generalNotes: parsedNotes.generalNotes,
      dailyReports: updatedReports,
    });

    updateNotesMutation.mutate(serialized, {
      onSuccess: () => {
        toast.success('Daily report recorded and progress graph updated!');
        setShowReportModal(false);
      }
    });
  };

  const handleDeleteDailyReport = (reportId: string) => {
    if (!window.confirm('Delete this daily report entry?')) return;
    const updatedReports = parsedNotes.dailyReports.filter(r => r.id !== reportId);
    const serialized = JSON.stringify({
      generalNotes: parsedNotes.generalNotes,
      dailyReports: updatedReports,
    });
    updateNotesMutation.mutate(serialized, {
      onSuccess: () => {
        toast.success('Daily report entry removed.');
      }
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="md:col-span-2 space-y-6">
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <AlertCircle size={64} className="text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400">The patient you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/patients')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          Back to Patients
        </button>
      </div>
    );
  }

  // Prepare graph data sorted chronologically
  const chartData = [...parsedNotes.dailyReports]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      rawDate: r.date,
      formattedDate: formatDate(r.date, 'MMM dd'),
      score: r.conditionScore,
      condition: r.condition,
      nurseReview: r.nurseReview,
      temp: r.vitals?.temperature,
      bp: r.vitals?.bloodPressure,
      hr: r.vitals?.heartRate,
    }));

  // Reverse reports for the history timeline (newest first)
  const historyReports = [...parsedNotes.dailyReports].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handlePrintReport = () => {
    if (!patient) return;
    toast.success(`Preparing printable medical report for ${patient.firstName} ${patient.lastName}...`);
    window.print();
  };

  const handleDownloadReport = () => {
    if (!patient) return;

    const vitalsRows = (parsedNotes.dailyReports || [])
      .map((r: any) => `
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
  <title>Medical Dossier - ${patient.firstName} ${patient.lastName} (${patient.patientId})</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #0f172a; background: #ffffff; line-height: 1.5; }
    .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .hospital-title { font-size: 22px; font-weight: 800; color: #1e3a8a; margin: 0; }
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
    @media print { body { margin: 0; } .print-btn-bar { display: none !important; } }
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
      <p class="hospital-sub">Official Patient Medical Progress Report</p>
    </div>
    <div style="text-align: right;">
      <span class="status-badge">${patient.status}</span>
      <p style="font-family: monospace; font-size: 12px; font-weight: bold; margin: 5px 0 0 0; color: #1e293b;">${patient.patientId}</p>
      <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Report Date: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
  <div class="meta-grid">
    <div class="meta-cell"><div class="meta-label">Patient Name</div><div class="meta-val">${patient.firstName} ${patient.lastName}</div></div>
    <div class="meta-cell"><div class="meta-label">Age / Gender</div><div class="meta-val">${patient.age} yrs • ${patient.gender}</div></div>
    <div class="meta-cell"><div class="meta-label">Blood Group</div><div class="meta-val">${patient.bloodGroup ? patient.bloodGroup.replace('_', ' ') : 'N/A'}</div></div>
    <div class="meta-cell"><div class="meta-label">Phone</div><div class="meta-val">${patient.phone}</div></div>
    <div class="meta-cell"><div class="meta-label">Primary Diagnosis</div><div class="meta-val">${patient.disease}</div></div>
    <div class="meta-cell"><div class="meta-label">Attending Doctor</div><div class="meta-val">Dr. ${patient.doctorAssigned}</div></div>
    <div class="meta-cell"><div class="meta-label">Ward / Room</div><div class="meta-val">${patient.roomNumber || 'Not Assigned'}</div></div>
    <div class="meta-cell"><div class="meta-label">Admission Date</div><div class="meta-val">${formatDate(patient.admissionDate, 'MMM dd, yyyy')}</div></div>
  </div>
  <div class="section-head">Clinical Condition & Nurse Reviews Log (${parsedNotes.dailyReports.length} Recorded Entries)</div>
  ${parsedNotes.dailyReports.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Observation Time</th>
          <th>Condition (Score)</th>
          <th>Temp</th>
          <th>Blood Pressure</th>
          <th>Heart Rate</th>
          <th>Symptoms</th>
          <th>Nurse Review & Notes</th>
        </tr>
      </thead>
      <tbody>
        ${vitalsRows}
      </tbody>
    </table>
  ` : '<p style="font-style: italic; color: #64748b; font-size: 12px;">No daily condition reports recorded yet.</p>'}
  <div class="section-head">General Medical Notes & Clinical History</div>
  <div class="notes-box">${parsedNotes.generalNotes ? parsedNotes.generalNotes : 'No additional medical history entered.'}</div>
  <div class="footer">
    <div>
      <p style="margin: 0; font-weight: 700; color: #0f172a;">OFFICIAL MEDICAL RECORD</p>
      <p style="margin: 2px 0 0 0;">Hospital Management System • Confidential Healthcare Documentation</p>
    </div>
    <div class="sign-box">
      <div class="sign-line"></div>
      <p style="margin: 0; font-weight: 700; color: #0f172a;">Dr. ${patient.doctorAssigned}</p>
      <p style="margin: 2px 0 0 0; font-size: 10px;">Attending Physician / Authorized Signature</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medical_Report_${patient.patientId}_${patient.firstName}_${patient.lastName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded official report for ${patient.firstName} ${patient.lastName}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
        <button 
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Back to Patients
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
            title="Print Patient Report"
          >
            <Printer size={15} /> Print
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            title="Download Patient Medical Report"
          >
            <Download size={15} /> Download Report
          </button>
          {isAdmin() && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm text-sm font-medium transition-all w-fit"
            >
              <Activity size={16} /> Add Daily Report
            </button>
          )}
        </div>
      </div>

      <div id="printable-patient-dossier" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center text-center shadow-sm h-fit">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-inner ${getStatusColor(patient.status).replace('text-white', '').replace('bg-', 'bg-opacity-20 text-')}`}>
            {getInitials(patient.firstName, patient.lastName)}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {patient.firstName} {patient.lastName}
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-mono text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
              {patient.patientId || `PAT-${patient.id.substring(0, 6)}`}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(patient.status)}`}>
              {patient.status}
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-100 dark:border-gray-700">
              {patient.age} years old
            </span>
            <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-100 dark:border-gray-700">
              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()}
            </span>
            {patient.bloodGroup && (
              <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm border border-red-100 dark:border-red-900/30">
                Blood: {patient.bloodGroup.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          {isAdmin() && (
            <div className="w-full space-y-2 mt-auto">
              <button 
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-lg text-sm font-semibold transition-colors border border-indigo-100 dark:border-indigo-800"
              >
                <Activity size={16} /> Add Daily Report
              </button>

              <div className="grid grid-cols-2 gap-2">
                {patient.status !== 'ADMITTED' && patient.status !== 'DISCHARGED' && (
                  <button 
                    onClick={() => admitMutation.mutate()}
                    disabled={admitMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <UserCheck size={16} /> Admit
                  </button>
                )}
                {patient.status === 'DISCHARGED' && (
                  <button 
                    onClick={() => navigate(`/patients?action=readmit&patientId=${patient.id}`)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 rounded-lg text-sm font-semibold transition-colors border border-emerald-200 dark:border-emerald-800 col-span-2 shadow-sm"
                  >
                    <RotateCcw size={16} /> Re-admit Patient (New Disease)
                  </button>
                )}
                {(patient.status === 'ADMITTED' || patient.status === 'CRITICAL') && (
                  <button 
                    onClick={() => dischargeMutation.mutate()}
                    disabled={dischargeMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <UserX size={16} /> Discharge
                  </button>
                )}
                <button 
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm font-medium transition-colors col-span-2"
                >
                  <Trash2 size={16} /> Delete Patient
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Info Grids & Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserCheck className="text-blue-500" size={20} /> Personal Information
              </h3>
              <div className="space-y-4">
                <InfoRow icon={<Calendar size={18} />} label="Date of Birth" value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'N/A'} />
                <InfoRow icon={<Phone size={18} />} label="Phone" value={patient.phone} />
                <InfoRow icon={<MapPin size={18} />} label="Address" value={patient.address || 'N/A'} />
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase font-semibold tracking-wider">Emergency Contact</p>
                  <InfoRow icon={<Phone size={18} />} label={patient.emergencyContactName || 'Name'} value={patient.emergencyContactPhone || 'N/A'} />
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="text-purple-500" size={20} /> Medical Details
              </h3>
              <div className="space-y-4">
                <InfoRow icon={<Stethoscope size={18} />} label="Primary Disease" value={patient.disease} valueClass="font-semibold text-gray-900 dark:text-white" />
                <InfoRow icon={<UserCheck size={18} />} label="Assigned Doctor" value={patient.doctorAssigned} />
                <InfoRow icon={<BedDouble size={18} />} label="Room Number" value={patient.roomNumber || 'Not assigned'} />
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                  <InfoRow icon={<Clock size={18} />} label="Admission Date" value={patient.admissionDate ? formatDate(patient.admissionDate) : 'Not admitted'} />
                  {patient.status === 'DISCHARGED' && (
                    <InfoRow icon={<Clock size={18} />} label="Discharge Date" value={patient.dischargeDate ? formatDate(patient.dischargeDate) : 'N/A'} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Daily Reports & Graph Section ── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="text-blue-600 dark:text-blue-400" size={20} />
                  Patient Condition & Nurse Review Reports
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Daily health trajectory curve and nurse observations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                  {parsedNotes.dailyReports.length} {parsedNotes.dailyReports.length === 1 ? 'Report' : 'Reports'}
                </span>
                {isAdmin() && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus size={14} /> Add Entry
                  </button>
                )}
              </div>
            </div>

            {/* Condition Progress Graph */}
            {chartData.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-blue-500" /> Condition Progress Curve
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Stable</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Normal</span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="conditionGradient" x1="0" y1="0" x2="0" y2="1">
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
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#2563EB" 
                        strokeWidth={2.5} 
                        fill="url(#conditionGradient)" 
                        dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 6, fill: '#06B6D4' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
                <Activity className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No Daily Reports Yet</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Log the patient's daily health condition and nurse reviews to generate visual progress graphs and tracking history.
                </p>
                {isAdmin() && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus size={14} /> Add First Report
                  </button>
                )}
              </div>
            )}

            {/* Daily Reports Timeline / List */}
            {historyReports.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                  Report History & Nurse Reviews
                </span>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {historyReports.map((report) => {
                    const cond = conditionColorMap[report.condition] || conditionColorMap.Stable;
                    return (
                      <div 
                        key={report.id}
                        className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                              <Calendar size={13} className="text-gray-400" />
                              {formatDate(report.date, 'MMMM dd, yyyy')}
                            </span>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cond.badge}`}>
                              {report.condition} ({report.conditionScore}%)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {report.recordedBy && (
                              <span className="text-[10px] text-gray-400">By {report.recordedBy}</span>
                            )}
                            {isAdmin() && (
                              <button
                                onClick={() => handleDeleteDailyReport(report.id)}
                                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Optional Vitals Pills */}
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

                        {/* Condition Notes */}
                        {report.conditionNotes && (
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-white">Condition Summary: </span>
                            {report.conditionNotes}
                          </p>
                        )}

                        {/* Nurse Review Blockquote */}
                        <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-500 text-xs space-y-1">
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
              </div>
            )}
          </div>

          {/* General Medical Notes */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="text-green-500" size={20} /> General Medical Notes
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg text-gray-700 dark:text-gray-300 min-h-[80px] whitespace-pre-wrap text-sm">
              {parsedNotes.generalNotes || <span className="text-gray-400 italic">No general medical notes recorded for this patient.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Daily Report Modal ── */}
      <AnimatePresence>
        {showReportModal && (
          <AddDailyReportModal
            onClose={() => setShowReportModal(false)}
            onSave={handleSaveDailyReport}
            isSaving={updateNotesMutation.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CustomChartTooltip = ({ active, payload }: any) => {
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
        {data.temp && <p className="text-gray-500">🌡️ Temp: <span className="font-semibold text-gray-800 dark:text-gray-200">{data.temp}</span></p>}
        {data.bp && <p className="text-gray-500">💓 BP: <span className="font-semibold text-gray-800 dark:text-gray-200">{data.bp}</span></p>}
        <p className="text-gray-600 dark:text-gray-300 italic line-clamp-2">"{data.nurseReview}"</p>
      </div>
    );
  }
  return null;
};

const AddDailyReportModal = ({
  onClose,
  onSave,
  isSaving,
}: {
  onClose: () => void;
  onSave: (data: Omit<DailyReport, 'id' | 'createdAt'>) => void;
  isSaving: boolean;
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState<'Critical' | 'Serious' | 'Stable' | 'Improving' | 'Normal'>('Stable');
  const [conditionScore, setConditionScore] = useState<number>(60);
  const [conditionNotes, setConditionNotes] = useState('');
  const [nurseReview, setNurseReview] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');

  const handleConditionSelect = (cond: 'Critical' | 'Serious' | 'Stable' | 'Improving' | 'Normal') => {
    setCondition(cond);
    setConditionScore(conditionColorMap[cond].score);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nurseReview.trim()) {
      toast.error("Please enter the nurse's review of the day.");
      return;
    }
    onSave({
      date,
      condition,
      conditionScore,
      conditionNotes: conditionNotes.trim() || undefined,
      nurseReview: nurseReview.trim(),
      vitals: {
        temperature: temperature.trim() || undefined,
        bloodPressure: bloodPressure.trim() || undefined,
        heartRate: heartRate.trim() || undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="text-blue-600" size={20} />
              Add Daily Patient Report
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Log daily condition & nurse review to update the health trajectory graph
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Report Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          {/* Condition Select Cards */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Patient Condition *
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['Critical', 'Serious', 'Stable', 'Improving', 'Normal'] as const).map((cond) => {
                const active = condition === cond;
                const colors = conditionColorMap[cond];
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => handleConditionSelect(cond)}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                      active
                        ? `${colors.badge} shadow-sm ring-2 ring-blue-500/30`
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recovery / Health Score Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Recovery / Condition Score
              </label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {conditionScore} / 100%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={conditionScore}
              onChange={(e) => setConditionScore(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>Critical (20%)</span>
              <span>Stable (60%)</span>
              <span>Recovered (100%)</span>
            </div>
          </div>

          {/* Condition Summary */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Condition Summary / Symptoms (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Mild fever subsided, ambulatory, normal appetite"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          {/* Nurse Review of the Day */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nurse Review of the Day *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Vitals monitored every 4 hours. Patient administered evening medication. Resting comfortably without signs of distress."
              value={nurseReview}
              onChange={(e) => setNurseReview(e.target.value)}
              required
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Optional Vitals */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
              Vitals (Optional)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Temperature</label>
                <input
                  type="text"
                  placeholder="e.g. 98.6 °F"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Blood Pressure</label>
                <input
                  type="text"
                  placeholder="e.g. 120/80"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Heart Rate</label>
                <input
                  type="text"
                  placeholder="e.g. 72 bpm"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-70"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              Save & Plot on Graph
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, valueClass = "text-gray-900 dark:text-white" }: { icon: React.ReactNode, label: string, value: string, valueClass?: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm ${valueClass}`}>{value}</p>
    </div>
  </div>
);

export default PatientDetailPage;