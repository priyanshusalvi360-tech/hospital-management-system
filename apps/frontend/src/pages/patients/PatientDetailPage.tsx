import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit2, Trash2, UserCheck, UserX, AlertCircle, Phone, MapPin, Calendar, Clock, Stethoscope, BedDouble } from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '../../services/patientService';
import { formatDate, getStatusColor, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id!),
    enabled: !!id,
  });

  const patient = response?.data;

  const admitMutation = useMutation({
    mutationFn: () => patientService.admit(id!),
    onSuccess: () => {
      toast.success('Patient admitted successfully');
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
    onError: () => toast.error('Failed to admit patient')
  });

  const dischargeMutation = useMutation({
    mutationFn: () => patientService.discharge(id!),
    onSuccess: () => {
      toast.success('Patient discharged successfully');
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
    onError: () => toast.error('Failed to discharge patient')
  });

  const deleteMutation = useMutation({
    mutationFn: () => patientService.delete(id!),
    onSuccess: () => {
      toast.success('Patient deleted successfully');
      navigate('/patients');
    },
    onError: () => toast.error('Failed to delete patient')
  });

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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-7xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Patients
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center text-center shadow-sm h-fit">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-inner \${getStatusColor(patient.status).replace('text-white', '').replace('bg-', 'bg-opacity-20 text-')}`}>
            {getInitials(patient.firstName, patient.lastName)}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {patient.firstName} {patient.lastName}
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-mono text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
              {patient.patientId || `PAT-\${patient.id.substring(0, 6)}`}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full \${getStatusColor(patient.status)}`}>
              {patient.status}
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-100 dark:border-gray-700">
              {patient.age} years old
            </span>
            <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-100 dark:border-gray-700">
              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()}
            </span>
            {patient.bloodGroup && (
              <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm border border-red-100 dark:border-red-900/30">
                Blood: {patient.bloodGroup}
              </span>
            )}
          </div>
          
          {isAdmin() && (
            <div className="w-full grid grid-cols-2 gap-2 mt-auto">
              {patient.status !== 'ADMITTED' && patient.status !== 'DISCHARGED' && (
                <button 
                  onClick={() => admitMutation.mutate()}
                  disabled={admitMutation.isPending}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <UserCheck size={16} /> Admit
                </button>
              )}
              {patient.status === 'ADMITTED' && (
                <button 
                  onClick={() => dischargeMutation.mutate()}
                  disabled={dischargeMutation.isPending}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <UserX size={16} /> Discharge
                </button>
              )}
              <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                <Edit2 size={16} /> Edit
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Info Grids */}
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

          {/* Medical Notes */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Edit2 className="text-green-500" size={20} /> Medical Notes
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg text-gray-700 dark:text-gray-300 min-h-[100px] whitespace-pre-wrap">
              {patient.medicalNotes || <span className="text-gray-400 italic">No medical notes recorded for this patient.</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InfoRow = ({ icon, label, value, valueClass = "text-gray-900 dark:text-white" }: { icon: React.ReactNode, label: string, value: string, valueClass?: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm \${valueClass}`}>{value}</p>
    </div>
  </div>
);

export default PatientDetailPage;