import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Plus, Filter, Edit2, Trash2, Eye, X, Loader2, 
  RotateCcw, CheckCircle2, History, AlertCircle, Sparkles, UserCheck 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { useAuthStore } from '../../store/authStore';
import { useDebounce } from '../../hooks/useDebounce';
import { getInitials, getStatusColor, formatDate, cn } from '../../lib/utils';

export const PatientsPage = () => {
  const { isAdmin } = useAuthStore();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [initialReAdmitPatient, setInitialReAdmitPatient] = useState<any>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Listen for navigation actions (e.g. ?action=readmit&patientId=...)
  useEffect(() => {
    const action = searchParams.get('action');
    const patientId = searchParams.get('patientId');
    if (action === 'readmit' && patientId) {
      patientService.getById(patientId)
        .then((res: any) => {
          const p = res?.data || res;
          if (p && p.id) {
            setSelectedPatient(null);
            setInitialReAdmitPatient(p);
            setShowForm(true);
          }
        })
        .catch(() => {
          toast.error('Could not locate patient for re-admission');
        })
        .finally(() => {
          setSearchParams({}, { replace: true });
        });
    } else if (action === 'add') {
      setSelectedPatient(null);
      setInitialReAdmitPatient(null);
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', { page, search, status: statusFilter }],
    queryFn: () => patientService.getAll({ page, search, status: statusFilter, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.delete(id),
    onSuccess: () => {
      toast.success('Patient deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-chart'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
    onError: () => toast.error('Failed to delete patient'),
  });

  const patients = useMemo(() => {
    const raw = data?.data || [];
    const statusPriority: Record<string, number> = {
      ADMITTED: 1,
      CRITICAL: 2,
      PENDING: 3,
      DISCHARGED: 4,
    };
    return [...raw].sort((a: any, b: any) => {
      const rankA = statusPriority[a.status] ?? 99;
      const rankB = statusPriority[b.status] ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [data]);
  const meta = data?.meta || { totalPages: 1, page: 1 };

  const handleEdit = (patient: any) => {
    setInitialReAdmitPatient(null);
    setSelectedPatient(patient);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage in-patient and out-patient medical directories</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => { 
              setSelectedPatient(null); 
              setInitialReAdmitPatient(null); 
              setShowForm(true); 
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium transition-colors text-sm"
          >
            <Plus size={18} /> Add Patient
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search patients by name, ID, phone, or disease..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none dark:text-white text-sm"
          >
            <option value="">All Statuses</option>
            <option value="ADMITTED">Admitted</option>
            <option value="CRITICAL">Critical</option>
            <option value="PENDING">Pending</option>
            <option value="DISCHARGED">Discharged</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Patient ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Age/Gender</th>
                <th className="px-6 py-4 font-medium">Disease</th>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Room</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"/><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient: any) => (
                  <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        {patient.patientId || `PAT-${patient.id.substring(0, 6)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getStatusColor(patient.status).replace('bg-', 'bg-opacity-20 text-').replace('text-white', '')}`}>
                          {getInitials(patient.firstName, patient.lastName)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {patient.age}y • {patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.disease}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.doctorAssigned}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.roomNumber || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin() && patient.status === 'DISCHARGED' && (
                          <button
                            onClick={() => {
                              setSelectedPatient(null);
                              setInitialReAdmitPatient(patient);
                              setShowForm(true);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Re-admit for new disease / treatment"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <Link
                          to={`/patients/${patient.id}`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View patient profile"
                        >
                          <Eye size={16} />
                        </Link>
                        {isAdmin() && (
                          <>
                            <button
                              onClick={() => handleEdit(patient)}
                              className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                              title="Edit patient"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(patient.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete patient"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <PatientFormModal 
            patient={selectedPatient} 
            initialReAdmitPatient={initialReAdmitPatient}
            onClose={() => { 
              setShowForm(false); 
              setSelectedPatient(null);
              setInitialReAdmitPatient(null);
            }} 
            onSuccess={() => { 
              setShowForm(false); 
              setSelectedPatient(null);
              setInitialReAdmitPatient(null);
              setPage(1);
              setSearchInput('');
              setStatusFilter('');
              queryClient.invalidateQueries({ queryKey: ['patients'] }); 
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); 
              queryClient.invalidateQueries({ queryKey: ['admissions-chart'] }); 
              queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface PatientFormModalProps {
  patient?: any;
  initialReAdmitPatient?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PatientFormModal: React.FC<PatientFormModalProps> = ({ 
  patient, 
  initialReAdmitPatient, 
  onClose, 
  onSuccess 
}) => {
  const isEditing = !!patient;

  // Returning / Re-admission state
  const [isReturningMode, setIsReturningMode] = useState<boolean>(!!initialReAdmitPatient);
  const [selectedPrevPatient, setSelectedPrevPatient] = useState<any>(initialReAdmitPatient || null);
  const [prevSearch, setPrevSearch] = useState<string>('');
  const [saveMode, setSaveMode] = useState<'RE_ADMIT' | 'NEW_RECORD'>('RE_ADMIT');

  // Helper to parse notes and preserved daily reports
  const parseNotes = (rawNotes?: string) => {
    let generalNotes = rawNotes || '';
    let dailyReports: any[] = [];
    try {
      const parsed = JSON.parse(rawNotes || '');
      if (parsed && typeof parsed === 'object') {
        generalNotes = parsed.generalNotes || '';
        dailyReports = Array.isArray(parsed.dailyReports) ? parsed.dailyReports : [];
      }
    } catch (_) {}
    return { generalNotes, dailyReports };
  };

  const initialParsed = parseNotes(patient?.medicalNotes);
  const preservedDailyReports = initialParsed.dailyReports;

  // React Hook Form initialization
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: patient 
      ? { ...patient, medicalNotes: initialParsed.generalNotes }
      : initialReAdmitPatient
      ? {
          firstName: initialReAdmitPatient.firstName || '',
          lastName: initialReAdmitPatient.lastName || '',
          gender: initialReAdmitPatient.gender || 'MALE',
          age: initialReAdmitPatient.age || '',
          dateOfBirth: initialReAdmitPatient.dateOfBirth ? new Date(initialReAdmitPatient.dateOfBirth).toISOString().substring(0, 10) : '',
          bloodGroup: initialReAdmitPatient.bloodGroup || 'A_POS',
          phone: initialReAdmitPatient.phone || '',
          emergencyContactName: initialReAdmitPatient.emergencyContactName || '',
          emergencyContactPhone: initialReAdmitPatient.emergencyContactPhone || '',
          address: initialReAdmitPatient.address || '',
          disease: '', // Intentionally blank for the new condition
          doctorAssigned: initialReAdmitPatient.doctorAssigned || '',
          roomNumber: '',
          status: 'ADMITTED',
          medicalNotes: `[Re-admission for new condition] Previous diagnosis: ${initialReAdmitPatient.disease} (Discharged: ${initialReAdmitPatient.dischargeDate ? formatDate(initialReAdmitPatient.dischargeDate) : 'N/A'}).`,
        }
      : { status: 'PENDING', gender: 'MALE', bloodGroup: 'A_POS' }
  });

  // Query all patients for previous lookup (only in Add mode)
  const { data: allPatientsData, isLoading: loadingAllPatients } = useQuery({
    queryKey: ['all-patients-lookup'],
    queryFn: () => patientService.getAll({ limit: 100 }),
    enabled: !isEditing,
  });

  // Candidate list for auto-fill
  const candidatePatients = useMemo(() => {
    const raw = (allPatientsData as any)?.data;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
    if (!list.length) return [];

    if (!prevSearch.trim()) {
      // Prioritize discharged patients first, then newest
      return [...list].sort((a, b) => {
        if (a.status === 'DISCHARGED' && b.status !== 'DISCHARGED') return -1;
        if (b.status === 'DISCHARGED' && a.status !== 'DISCHARGED') return 1;
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }).slice(0, 6);
    }

    const q = prevSearch.toLowerCase();
    return list.filter(p =>
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.disease?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [allPatientsData, prevSearch]);

  // Load previous patient details into form
  const handleSelectPreviousPatient = (prev: any) => {
    setSelectedPrevPatient(prev);
    setSaveMode('RE_ADMIT');

    let dobStr = '';
    if (prev.dateOfBirth) {
      try {
        dobStr = new Date(prev.dateOfBirth).toISOString().substring(0, 10);
      } catch (_) {}
    }

    const parsed = parseNotes(prev.medicalNotes);
    const reAdmitNote = `[Re-admission for new condition] Previous diagnosis: ${prev.disease} (Discharged: ${prev.dischargeDate ? formatDate(prev.dischargeDate) : 'N/A'}).` + 
      (parsed.generalNotes ? `\nPrevious notes: ${parsed.generalNotes}` : '');

    reset({
      firstName: prev.firstName || '',
      lastName: prev.lastName || '',
      gender: prev.gender || 'MALE',
      age: prev.age || '',
      dateOfBirth: dobStr,
      bloodGroup: prev.bloodGroup || 'A_POS',
      phone: prev.phone || '',
      emergencyContactName: prev.emergencyContactName || '',
      emergencyContactPhone: prev.emergencyContactPhone || '',
      address: prev.address || '',
      disease: '', // Blank so user fills the new disease directly!
      doctorAssigned: prev.doctorAssigned || '',
      roomNumber: '', // Blank for new room assignment
      status: 'ADMITTED', // Set to Admitted for the new treatment
      medicalNotes: reAdmitNote,
    });

    toast.info(`Details loaded for ${prev.firstName} ${prev.lastName} (${prev.patientId}). Enter new disease & room to proceed.`);
  };

  // Reset form to blank
  const handleClearAutofill = () => {
    setSelectedPrevPatient(null);
    reset({
      firstName: '',
      lastName: '',
      gender: 'MALE',
      age: '' as any,
      dateOfBirth: '',
      bloodGroup: 'A_POS',
      phone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      address: '',
      disease: '',
      doctorAssigned: '',
      roomNumber: '',
      status: 'PENDING',
      medicalNotes: '',
    });
    toast.info('Form cleared for new patient entry.');
  };

  // Mutation for creating / updating
  const mutation = useMutation({
    mutationFn: async (args: { isUpdate: boolean; id?: string; payload: any; isReAdmit?: boolean; name: string }) => {
      if (args.isUpdate && args.id) {
        return patientService.update(args.id, args.payload);
      }
      return patientService.create(args.payload);
    },
    onSuccess: (_, variables) => {
      if (variables.isReAdmit) {
        toast.success(`Patient ${variables.name} re-admitted successfully for their new treatment!`);
      } else if (variables.isUpdate) {
        toast.success('Patient details updated successfully');
      } else {
        toast.success(`Patient ${variables.name} registered successfully`);
      }
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save patient record');
    }
  });

  const onSubmit = (data: any) => {
    const payload = { ...data };
    if (payload.age !== undefined && payload.age !== '') {
      payload.age = Number(payload.age);
    }
    if (!payload.dateOfBirth && payload.age) {
      const birthYear = new Date().getFullYear() - payload.age;
      payload.dateOfBirth = `${birthYear}-01-01`;
    }

    if (isEditing) {
      // Normal edit
      if (preservedDailyReports.length > 0) {
        payload.medicalNotes = JSON.stringify({
          generalNotes: payload.medicalNotes || '',
          dailyReports: preservedDailyReports,
        });
      }
      mutation.mutate({
        isUpdate: true,
        id: patient.id,
        payload,
        name: `${payload.firstName} ${payload.lastName}`,
      });
    } else if (selectedPrevPatient && saveMode === 'RE_ADMIT') {
      // Re-admission mode on existing record
      const prevNotes = parseNotes(selectedPrevPatient.medicalNotes);
      payload.status = payload.status || 'ADMITTED';
      payload.admissionDate = new Date().toISOString();
      payload.dischargeDate = null; // Clear old discharge date
      
      if (prevNotes.dailyReports.length > 0) {
        payload.medicalNotes = JSON.stringify({
          generalNotes: payload.medicalNotes || '',
          dailyReports: prevNotes.dailyReports,
        });
      }

      mutation.mutate({
        isUpdate: true,
        id: selectedPrevPatient.id,
        payload,
        isReAdmit: true,
        name: `${payload.firstName} ${payload.lastName}`,
      });
    } else {
      // Brand new record
      mutation.mutate({
        isUpdate: false,
        payload,
        name: `${payload.firstName} ${payload.lastName}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {isEditing ? (
                'Edit Patient'
              ) : selectedPrevPatient && saveMode === 'RE_ADMIT' ? (
                <>
                  <RotateCcw className="text-emerald-500" size={20} />
                  <span>Re-admit Patient</span>
                </>
              ) : (
                'Add New Patient'
              )}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isEditing 
                ? 'Update patient demographic and medical records' 
                : selectedPrevPatient 
                ? `Continuing care under ${selectedPrevPatient.patientId}`
                : 'Register a new patient or load previously admitted records'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Previously Admitted / Returning Patient Lookup Option (Only in Add mode) */}
          {!isEditing && (
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    <RotateCcw size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      Already Admitted Previously?
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Auto-fill personal details for returning / discharged patients
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturningMode(!isReturningMode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    isReturningMode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isReturningMode ? 'Hide Search' : '+ Search Previous'}
                </button>
              </div>

              {/* Search and Selector Box */}
              {isReturningMode && !selectedPrevPatient && (
                <div className="space-y-2 pt-1 border-t border-blue-100 dark:border-blue-900/50">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={prevSearch}
                      onChange={(e) => setPrevSearch(e.target.value)}
                      placeholder="Search previous patient by name, PAT-ID, phone, or disease..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100 dark:divide-gray-800">
                    {loadingAllPatients ? (
                      <div className="py-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 size={13} className="animate-spin" /> Loading patient records...
                      </div>
                    ) : candidatePatients.length === 0 ? (
                      <div className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                        No previous patients matched your search.
                      </div>
                    ) : (
                      candidatePatients.map((candidate: any) => (
                        <div
                          key={candidate.id}
                          className="pt-1.5 flex items-center justify-between gap-2 p-2 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {candidate.firstName} {candidate.lastName}
                              </span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                {candidate.patientId}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${getStatusColor(candidate.status)}`}>
                                {candidate.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              Last condition: <span className="font-medium text-gray-700 dark:text-gray-300">{candidate.disease}</span> • Phone: {candidate.phone}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectPreviousPatient(candidate)}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shrink-0 shadow-sm transition-colors"
                          >
                            Auto-fill
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Selected Previous Patient Info & Mode Banner */}
              {selectedPrevPatient && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Loaded: <strong>{selectedPrevPatient.firstName} {selectedPrevPatient.lastName}</strong> ({selectedPrevPatient.patientId})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAutofill}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-medium"
                    >
                      Reset / Clear Form
                    </button>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Previous diagnosis: <strong>{selectedPrevPatient.disease}</strong></span>
                    <span>Previous status: <strong className="uppercase">{selectedPrevPatient.status}</strong></span>
                    {selectedPrevPatient.dischargeDate && (
                      <span>Discharged: <strong>{formatDate(selectedPrevPatient.dischargeDate)}</strong></span>
                    )}
                  </div>

                  {/* Mode Selector */}
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 text-[11px] font-medium">Save Action:</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="saveMode"
                          checked={saveMode === 'RE_ADMIT'}
                          onChange={() => setSaveMode('RE_ADMIT')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Re-admit ({selectedPrevPatient.patientId})
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="saveMode"
                          checked={saveMode === 'NEW_RECORD'}
                          onChange={() => setSaveMode('NEW_RECORD')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        New Patient ID
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">First Name (Letters only) *</label>
              <input 
                {...register('firstName', { 
                  required: 'First name is required',
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: 'First name must contain only letters and spaces'
                  }
                })} 
                placeholder="e.g. John"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setValue('firstName', val, { shouldValidate: true });
                }}
                className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {errors.firstName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.firstName.message as string}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Last Name (Letters only) *</label>
              <input 
                {...register('lastName', { 
                  required: 'Last name is required',
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: 'Last name must contain only letters and spaces'
                  }
                })} 
                placeholder="e.g. Doe"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setValue('lastName', val, { shouldValidate: true });
                }}
                className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {errors.lastName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.lastName.message as string}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
              <select {...register('gender')} className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Age *</label>
              <input type="number" {...register('age', { required: true, valueAsNumber: true })} className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone (10 Digits) *</label>
              <input 
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^\d{10}$/,
                    message: 'Phone number must be exactly 10 digits'
                  }
                })} 
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10 digit number e.g. 9876543210"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setValue('phone', val, { shouldValidate: true });
                }}
                className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {errors.phone && (
                <p className="text-red-500 text-[11px] mt-1">{errors.phone.message as string}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
              <select {...register('bloodGroup')} className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                {([['A_POS','A+'],['A_NEG','A-'],['B_POS','B+'],['B_NEG','B-'],['AB_POS','AB+'],['AB_NEG','AB-'],['O_POS','O+'],['O_NEG','O-']]).map(([val,label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
          </div>

          {/* Disease / Condition */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Disease / Condition *
              {selectedPrevPatient && (
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-normal ml-2">
                  (Previous Diagnosis: {selectedPrevPatient.disease})
                </span>
              )}
            </label>
            <input 
              {...register('disease', { required: true })} 
              placeholder={selectedPrevPatient ? "Enter new disease or reason for re-admission..." : "e.g. Acute Bronchitis, Type 2 Diabetes"}
              className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          {/* Doctor Assigned */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Assigned Doctor *</label>
            <input {...register('doctorAssigned', { required: true })} placeholder="e.g. Dr. Sarah Adams" className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Room Number & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Room Number</label>
              <input {...register('roomNumber')} placeholder="e.g. Room 204" className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select {...register('status')} className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="ADMITTED">Admitted</option>
                <option value="PENDING">Pending</option>
                <option value="CRITICAL">Critical</option>
                <option value="DISCHARGED">Discharged</option>
              </select>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Emergency Contact Name (Letters only)</label>
              <input 
                {...register('emergencyContactName', {
                  pattern: {
                    value: /^[A-Za-z\s]*$/,
                    message: 'Emergency contact name must contain only letters and spaces'
                  }
                })} 
                placeholder="e.g. Jane Doe" 
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setValue('emergencyContactName', val, { shouldValidate: true });
                }}
                className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {errors.emergencyContactName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.emergencyContactName.message as string}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Emergency Phone (10 Digits)</label>
              <input 
                {...register('emergencyContactPhone', {
                  validate: (val) => !val || /^\d{10}$/.test(val) || 'Emergency phone must be exactly 10 digits'
                })} 
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10 digit number e.g. 9123456780" 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setValue('emergencyContactPhone', val, { shouldValidate: true });
                }}
                className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {errors.emergencyContactPhone && (
                <p className="text-red-500 text-[11px] mt-1">{errors.emergencyContactPhone.message as string}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Residential Address</label>
            <input {...register('address')} placeholder="e.g. 742 Evergreen Terrace, Springfield" className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          {/* Medical Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Medical Notes & History</label>
            <textarea {...register('medicalNotes')} rows={3} placeholder="Add clinical observations, allergies, or previous admission history..." className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 shadow-sm"
            >
              {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
              {isEditing 
                ? 'Save Changes' 
                : selectedPrevPatient && saveMode === 'RE_ADMIT'
                ? `Save & Re-admit Patient (${selectedPrevPatient.patientId})`
                : 'Add Patient'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientsPage;