// components/admin/dashboard/RegistrationsModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  X, Loader2, Search, Filter, User, Calendar, Droplet,
  ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle,
  AlertCircle, Info, Mail, Phone, UsersRound
} from 'lucide-react';

interface Registration {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorBloodType: string;
  bloodDriveId: string;
  bloodDriveTitle: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: string;
  attendedAt?: string;
  cancelledAt?: string;
  notes?: string;
}

interface RegistrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    registered: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
    attended: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
  };
  return styles[status] || styles.registered;
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

export default function RegistrationsModal({ isOpen, onClose }: RegistrationsModalProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/dashboard/blood-drive-registrations?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || data.data || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, pagination.page, isOpen]);

  useEffect(() => {
    if (isOpen) fetchRegistrations();
  }, [fetchRegistrations, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-xl">
                <UsersRound className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">All Registrations</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{pagination.total} registrations found</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
              <X className="h-5 w-5 text-zinc-500" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search donors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="registered">Registered</option>
                  <option value="attended">Attended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={fetchRegistrations}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
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
                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-12">
                <UsersRound className="h-12 w-12 mx-auto mb-3 opacity-50 text-zinc-400" />
                <p className="text-zinc-500 dark:text-zinc-400">No registrations found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition border-l-4 border-purple-400 dark:border-purple-600">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-950/30">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-white truncate">{reg.donorName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getBloodTypeColor(reg.donorBloodType)}`}>
                            {reg.donorBloodType}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                            {reg.bloodDriveTitle}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(reg.status)}`}>
                            {reg.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedRegistration(reg);
                          setShowDetailsModal(true);
                        }}
                        className="mt-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {registrations.length > 0 && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-b-2xl">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {registrations.length} of {pagination.total} registrations
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRegistration && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl">
              <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Registration Details</h3>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-950/30">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRegistration.donorName}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedRegistration.donorEmail}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Blood Type</p>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${getBloodTypeColor(selectedRegistration.donorBloodType)}`}>
                      {selectedRegistration.donorBloodType}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(selectedRegistration.status)}`}>
                      {selectedRegistration.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Blood Drive</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedRegistration.bloodDriveTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Registered At</p>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    {new Date(selectedRegistration.registeredAt).toLocaleString()}
                  </p>
                </div>
                {selectedRegistration.attendedAt && (
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Attended At</p>
                    <p className="text-sm text-zinc-900 dark:text-white">
                      {new Date(selectedRegistration.attendedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedRegistration.notes && (
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Notes</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedRegistration.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}