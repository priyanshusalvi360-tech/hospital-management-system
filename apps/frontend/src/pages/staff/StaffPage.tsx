import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { staffService } from '../../services/staffService';
import { useAuthStore } from '../../store/authStore';
import { useDebounce } from '../../hooks/useDebounce';
import { getInitials } from '../../lib/utils';

const roleColors: Record<string, string> = {
  DOCTOR:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  NURSE:        'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  RECEPTIONIST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PHARMACIST:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  TECHNICIAN:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ADMIN_STAFF:  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  OTHER:        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function statusBadgeClass(status: string): string {
  if (status === 'ACTIVE')    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'ON_LEAVE')  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

export const StaffPage = () => {
  const { isAdmin } = useAuthStore();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['staff', { page, search, role: roleFilter }],
    queryFn: () => staffService.getAll({ page, search, role: roleFilter, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffService.delete(id),
    onSuccess: () => {
      toast.success('Staff member deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: () => toast.error('Failed to delete staff member'),
  });

  const handleSaveSuccess = (isNew: boolean) => {
    if (isNew) {
      setPage(1);
      setSearchInput('');
      setRoleFilter('');
    }
    queryClient.invalidateQueries({ queryKey: ['staff'] });
    setShowForm(false);
    setSelectedStaff(null);
  };

  const raw: any = (data as any)?.data;
  const staffList: any[] = raw?.items ?? (Array.isArray(raw) ? raw : []);
  const meta: any = raw?.meta ?? { totalPages: 1, currentPage: 1 };

  const handleEdit = (staff: any) => {
    setSelectedStaff(staff);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Directory</h1>
        {isAdmin() && (
          <button
            onClick={() => { setSelectedStaff(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            <Plus size={18} /> Add Staff
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="ADMIN_STAFF">Admin Staff</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Employee ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
                {isAdmin() && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"/><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" /></td>
                    {isAdmin() && <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto" /></td>}
                  </tr>
                ))
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff: any) => (
                  <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        {staff.employeeId || ('EMP-' + staff.id.substring(0, 6))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xs font-medium">
                          {getInitials(staff.firstName, staff.lastName)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {staff.firstName} {staff.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={'px-2.5 py-1 text-xs font-medium rounded-full ' + (roleColors[staff.role] || roleColors.OTHER)}>
                        {staff.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{staff.department || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-200">{staff.phone}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{staff.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={'px-2.5 py-1 text-xs font-medium rounded-full ' + statusBadgeClass(staff.status)}>
                        {staff.status.replace('_', ' ')}
                      </span>
                    </td>
                    {isAdmin() && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(staff)} className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(staff.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
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
                  className={'px-3 py-1 text-sm rounded border transition-colors ' + (
                    page === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <StaffFormModal
            staff={selectedStaff}
            onClose={() => setShowForm(false)}
            onSuccess={handleSaveSuccess}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StaffFormModal = ({
  staff,
  onClose,
  onSuccess,
}: {
  staff?: any;
  onClose: () => void;
  onSuccess: (isNew: boolean) => void;
}) => {
  const isEditing = !!staff;
  const { register, handleSubmit } = useForm({
    defaultValues: staff || { status: 'ACTIVE', role: 'DOCTOR' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEditing ? staffService.update(staff.id, data) : staffService.create(data),
    onSuccess: () => {
      toast.success(isEditing ? 'Staff updated successfully' : 'Staff added successfully!');
      onSuccess(!isEditing);
    },
    onError: () => toast.error(isEditing ? 'Failed to update staff' : 'Failed to create staff'),
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
            {isEditing ? 'Edit Staff' : 'Add New Staff'}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
              <select {...register('role')} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                {Object.keys(roleColors).map(role => (
                  <option key={role} value={role}>{role.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <input {...register('department')} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input type="email" {...register('email', { required: true })} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
            <input {...register('phone', { required: true })} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select {...register('status')} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default StaffPage;