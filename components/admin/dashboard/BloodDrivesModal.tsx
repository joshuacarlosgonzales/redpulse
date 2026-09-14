// components/admin/dashboard/BloodDrivesModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  MapPin,
  Clock,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Droplet
} from 'lucide-react';

interface BloodDrive {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  bloodTypesNeeded: string[];
  targetDonors: number;
  registeredDonors: number;
  completedDonations: number;
  organizer: string;
  contactNumber: string;
  contactEmail: string;
  hospitalId: string;
  hospitalName: string;
  createdAt: string;
  updatedAt: string;
}

interface BloodDrivesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    upcoming: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    ongoing: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 animate-pulse',
    completed: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
    cancelled: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
  };
  return styles[status] || styles.upcoming;
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, React.ReactNode> = {
    upcoming: <Clock className="w-3 h-3" />,
    ongoing: <Heart className="w-3 h-3" />,
    completed: <Check className="w-3 h-3" />,
    cancelled: <X className="w-3 h-3" />
  };
  return icons[status] || icons.upcoming;
};

const getBloodTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'A+': 'bg-red-100 text-red-700 border-red-200',
    'A-': 'bg-pink-100 text-pink-700 border-pink-200',
    'B+': 'bg-orange-100 text-orange-700 border-orange-200',
    'B-': 'bg-amber-100 text-amber-700 border-amber-200',
    'AB+': 'bg-purple-100 text-purple-700 border-purple-200',
    'AB-': 'bg-violet-100 text-violet-700 border-violet-200',
    'O+': 'bg-green-100 text-green-700 border-green-200',
    'O-': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export default function BloodDrivesModal({ isOpen, onClose }: BloodDrivesModalProps) {
  const router = useRouter();
  const [bloodDrives, setBloodDrives] = useState<BloodDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [selectedDrive, setSelectedDrive] = useState<BloodDrive | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchBloodDrives = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/dashboard/blood-drives?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch blood drives');
      }

      const data = await response.json();
      setBloodDrives(data.drives || data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching blood drives:', error);
      setError('Failed to load blood drives');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, pagination.page, router, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchBloodDrives();
    }
  }, [fetchBloodDrives, isOpen]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this blood drive?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/dashboard/blood-drives?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('success', 'Blood drive cancelled successfully');
        fetchBloodDrives();
      } else {
        showToast('error', 'Failed to cancel blood drive');
      }
    } catch (error) {
      console.error('Error cancelling blood drive:', error);
      showToast('error', 'Failed to cancel blood drive');
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Toast */}
          {toast && (
            <div className={`absolute top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md ${
              toast.type === 'success' 
                ? 'bg-green-50 dark:bg-green-950/90 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            }`}>
              <div className="flex items-center gap-3">
                {toast.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
                {toast.type === 'error' && <XCircle className="h-5 w-5 flex-shrink-0" />}
                {toast.type === 'info' && <Info className="h-5 w-5 flex-shrink-0" />}
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-xl">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">All Blood Drives</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {pagination.total} blood drives found
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchBloodDrives}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition"
                title="Refresh"
              >
                <Loader2 className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search blood drives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={fetchBloodDrives}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
                <button
                  onClick={fetchBloodDrives}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm"
                >
                  Retry
                </button>
              </div>
            ) : bloodDrives.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50 text-zinc-400" />
                <p className="text-zinc-500 dark:text-zinc-400">No blood drives found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Drive</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Blood Types</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {bloodDrives.map((drive) => (
                      <tr key={drive.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">{drive.title}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{drive.organizer || 'No organizer'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                            <MapPin className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{drive.location}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-zinc-900 dark:text-white">
                            {new Date(drive.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {drive.startTime} - {drive.endTime}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(drive.status)}`}>
                            {getStatusIcon(drive.status)}
                            {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                              <div
                                className="bg-red-600 rounded-full h-2 transition-all"
                                style={{ width: `${drive.targetDonors > 0 ? Math.min((drive.registeredDonors / drive.targetDonors) * 100, 100) : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                              {drive.registeredDonors}/{drive.targetDonors}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {drive.bloodTypesNeeded.slice(0, 3).map((type) => (
                              <span key={type} className={`px-2 py-0.5 text-xs rounded ${getBloodTypeColor(type)}`}>
                                {type}
                              </span>
                            ))}
                            {drive.bloodTypesNeeded.length > 3 && (
                              <span className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                                +{drive.bloodTypesNeeded.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedDrive(drive);
                                setShowDetailsModal(true);
                              }}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                            </button>
                            {drive.status !== 'cancelled' && drive.status !== 'completed' && (
                              <button
                                onClick={() => handleDelete(drive.id)}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/20 rounded-lg transition"
                                title="Cancel Drive"
                              >
                                <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {bloodDrives.length > 0 && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-b-2xl">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {bloodDrives.length} of {pagination.total} blood drives
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedDrive && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 rounded-t-2xl">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Blood Drive Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedDrive.title}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedDrive.status)}`}>
                    {getStatusIcon(selectedDrive.status)}
                    {selectedDrive.status.charAt(0).toUpperCase() + selectedDrive.status.slice(1)}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">{selectedDrive.description || 'No description provided'}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Location</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDrive.location}</p>
                    {selectedDrive.address && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedDrive.address}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Date & Time</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{new Date(selectedDrive.date).toLocaleDateString()}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedDrive.startTime} - {selectedDrive.endTime}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Target</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedDrive.targetDonors}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Registered</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedDrive.registeredDonors}</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Donated</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedDrive.completedDonations}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Blood Types Needed</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDrive.bloodTypesNeeded.map((type) => (
                      <span key={type} className={`px-3 py-1 text-sm rounded-lg ${getBloodTypeColor(type)}`}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Organizer</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDrive.organizer || 'Not specified'}</p>
                  {(selectedDrive.contactNumber || selectedDrive.contactEmail) && (
                    <div className="flex gap-4 mt-1">
                      {selectedDrive.contactNumber && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">📞 {selectedDrive.contactNumber}</p>
                      )}
                      {selectedDrive.contactEmail && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">✉️ {selectedDrive.contactEmail}</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Hospital</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDrive.hospitalName || 'Unknown'}</p>
                </div>
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}