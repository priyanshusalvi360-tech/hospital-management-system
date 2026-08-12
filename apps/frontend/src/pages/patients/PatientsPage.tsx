import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, Edit2, Trash2, Eye, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { useAuthStore } from '../../store/authStore';
import { useDebounce } from '../../hooks/useDebounce';
import { getInitials, getStatusColor, cn } from '../../lib/utils';

export const PatientsPage = () => {
  const { isAdmin } = useAuthStore();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', { page, search, status: statusFilter }],
    queryFn: () => patientService.getAll({ page, search, status: statusFilter, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.delete(id),
    onSuccess: () => {
      toast.success('Patient deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: () => toast.error('Failed to delete patient'),
  });

  // Called from PatientForm after a successful create/update
  const handleSaveSuccess = (isNew: boolean) => {
    if (isNew) {
      // Reset to page 1 and clear all filters so new record is visible
      setPage(1);
      setSearchInput('');
      setStatusFilter('');
    }
    queryClient.invalidateQueries({ queryKey: ['patients'] });
    setShowForm(false);
    setSelectedPatient(null);
    toast.success(isNew ? 'Patient added successfully!' : 'Patient updated successfully!');
  };

  const patients = data?.data || [];
  const meta = data?.meta || { totalPages: 1, page: 1 };

  const handleEdit = (patient: any) => {
    setSelectedPatient(patient);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
        {isAdmin() && (
          <button
            onClick={() => { setSelectedPatient(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            <Plus size={18} /> Add Patient
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="ADMITTED">Admitted</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="CRITICAL">Critical</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
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
                        {patient.patientId || `PAT-\${patient.id.substring(0, 6)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium \${getStatusColor(patient.status).replace('bg-', 'bg-opacity-20 text-').replace('text-white', '')}`}>
                          {getInitials(patient.firstName, patient.lastName)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {patient.age}y &bull; {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.disease}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.doctorAssigned}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{patient.roomNumber || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full \${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/patients/\${patient.id}`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                          <Eye size={18} />
                        </Link>
                        {isAdmin() && (
                          <>
                            <button onClick={() => handleEdit(patient)} className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(patient.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                              <Trash2 size={18} />
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
            onClose={() => setShowForm(false)} 
            onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['patients'] }); }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PatientFormModal = ({ patient, onClose, onSuccess }: { patient?: any, onClose: () => void, onSuccess: () => void }) => {
  const isEditing = !!patient;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: patient || { status: 'PENDING', gender: 'MALE', bloodGroup: 'A+' }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEditing ? patientService.update(patient.id, data) : patientService.create(data),
    onSuccess: () => {
      toast.success(`Patient \${isEditing ? 'updated' : 'created'} successfully`);
      onSuccess();
    },
    onError: () => toast.error(`Failed to \${isEditing ? 'update' : 'create'} patient`)
  });

  const onSubmit = (data: any) => mutation.mutate(data);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
              <input {...register('firstName', { required: true })} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
              <input {...register('lastName', { required: true })} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
              <select {...register('gender')} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age *</label>
              <input type="number" {...register('age', { required: true, valueAsNumber: true })} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
              <input {...register('phone', { required: true })} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
              <select {...register('bloodGroup')} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disease/Condition *</label>
            <input {...register('disease', { required: true })} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Doctor *</label>
            <input {...register('doctorAssigned', { required: true })} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Number</label>
              <input {...register('roomNumber')} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select {...register('status')} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="PENDING">Pending</option>
                <option value="ADMITTED">Admitted</option>
                <option value="CRITICAL">Critical</option>
                <option value="DISCHARGED">Discharged</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical Notes</label>
            <textarea {...register('medicalNotes')} rows={3} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Patient'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientsPage;