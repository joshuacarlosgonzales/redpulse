// app/hospital/requests/history/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Droplet,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Check,
  AlertCircle,
  Calendar,
  User,
  Building,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  X
} from "lucide-react";

interface BloodRequest {
  id: string;
  bloodType: string;
  quantity: number;
  urgency: 'critical' | 'urgent' | 'normal';
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled' | 'rejected';
  requestDate: string;
  requiredDate: string;
  patientName?: string;
  patientAge?: number;
  notes?: string;
  department?: string;
  doctorName?: string;
  contactNumber?: string;
  hospitalName: string;
  hospitalAddress: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      params.append('status', 'all');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/hospital/requests?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      
      const historyData = (data.data || []).filter(
        (r: BloodRequest) => r.status !== 'pending'
      );
      
      setRequests(historyData);
    } catch (err) {
      console.error('Error fetching history:', err);
      showToast('error', 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
    showToast('success', 'History refreshed!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400';
      case 'approved': return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400';
      case 'rejected': return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400';
      case 'cancelled': return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400';
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled': return <Check className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // ✅ FIXED: Added null/undefined check for getStatusLabel
  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredRequests = requests.filter((r: BloodRequest) => {
    let match = true;
    
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const hospitalMatch = (r.hospitalName || '').toLowerCase().includes(search);
      const patientMatch = r.patientName ? r.patientName.toLowerCase().includes(search) : false;
      const bloodTypeMatch = (r.bloodType || '').toLowerCase().includes(search);
      const doctorMatch = r.doctorName ? r.doctorName.toLowerCase().includes(search) : false;
      const donorMatch = r.donorName ? r.donorName.toLowerCase().includes(search) : false;
      
      match = match && (hospitalMatch || patientMatch || bloodTypeMatch || doctorMatch || donorMatch);
    }
    
    if (statusFilter !== 'all') {
      match = match && (r.status === statusFilter);
    }
    
    return match;
  });

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md ${
          toast.type === 'success' 
            ? 'bg-green-50 dark:bg-green-950/90 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : toast.type === 'error'
            ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'info' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/hospital/requests">
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-zinc-500" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                Request History
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                View all completed and historical blood requests
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-medium disabled:opacity-50"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total History</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{requests.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Approved</p>
          <p className="text-2xl font-bold text-blue-600">{requests.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Fulfilled</p>
          <p className="text-2xl font-bold text-emerald-600">{requests.filter(r => r.status === 'fulfilled').length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Rejected/Cancelled</p>
          <p className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="all">📋 All Status</option>
              <option value="approved">✅ Approved</option>
              <option value="fulfilled">✔️ Fulfilled</option>
              <option value="rejected">❌ Rejected</option>
              <option value="cancelled">🚫 Cancelled</option>
            </select>

            <button
              onClick={fetchHistory}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Request Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-500 dark:text-zinc-400">No history found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{item.hospitalName || 'Unknown Hospital'}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.patientName ? `Patient: ${item.patientName}` : 'No patient'}
                          {item.department && ` • ${item.department}`}
                        </p>
                        {item.donorName && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            Donor: {item.donorName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                        <Droplet className="w-3.5 h-3.5" />
                        {item.bloodType || 'N/A'}
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {item.quantity || 0} unit{item.quantity > 1 ? 's' : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedRequest(item);
                          setShowDetailsModal(true);
                        }}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Request Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {selectedRequest.bloodType || 'N/A'} - {selectedRequest.quantity || 0} unit{selectedRequest.quantity > 1 ? 's' : ''}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {getStatusLabel(selectedRequest.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hospital</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedRequest.hospitalName || 'Unknown Hospital'}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedRequest.hospitalAddress || ''}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Requested On</p>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    {selectedRequest.requestDate ? new Date(selectedRequest.requestDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedRequest.donorName && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Donor</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedRequest.donorName}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedRequest.donorEmail || ''}</p>
                </div>
              )}

              {selectedRequest.patientName && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Patient</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedRequest.patientName}</p>
                    {selectedRequest.patientAge && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Age: {selectedRequest.patientAge}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Department</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedRequest.department || 'N/A'}</p>
                  </div>
                </div>
              )}

              {selectedRequest.doctorName && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Doctor</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedRequest.doctorName}</p>
                  {selectedRequest.contactNumber && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">📞 {selectedRequest.contactNumber}</p>
                  )}
                </div>
              )}

              {selectedRequest.notes && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedRequest.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  ID: {selectedRequest.id}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}