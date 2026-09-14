// app/hospital/requests/pending/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Droplet,
  Eye,
  CheckCircle,
  XCircle,
  Check,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Building,
  Phone,
  MapPin,
  X,
  AlertTriangle,
  UserCircle,
  Mail,
  Syringe,
  Bug,
  Building2
} from "lucide-react";

interface BloodRequest {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorBloodType: string;
  bloodType: string;
  quantity: number;
  urgency: 'critical' | 'urgent' | 'normal';
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled' | 'rejected';
  requestDate: string;
  requiredDate: string;
  hospitalName: string;
  hospitalAddress: string;
  patientName?: string;
  patientAge?: number;
  notes?: string;
  requestMethod?: 'emergency' | 'scheduled' | 'routine';
  department?: string;
  doctorName?: string;
  contactNumber?: string;
  createdAt: string;
  updatedAt: string;
}

const urgencyLevels = [
  { value: 'critical', label: '🚨 Critical' },
  { value: 'urgent', label: '⚡ Urgent' },
  { value: 'normal', label: '📋 Normal' }
];

export default function PendingRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      params.append('status', 'pending');
      if (searchQuery) params.append('search', searchQuery);
      if (urgencyFilter !== 'all') params.append('urgency', urgencyFilter);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch requests');
      }

      const data = await response.json();
      console.log('📊 Fetched data:', data);
      console.log('📋 Requests count:', data.data?.length || 0);
      
      setRequests(data.data || []);
      setDebugInfo(`Found ${data.data?.length || 0} pending requests`);
      
      if (data.debug) {
        console.log('🔍 Debug info:', data.debug);
        setDebugInfo(prev => prev + ` | ${data.debug.message || ''}`);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      showToast('error', 'Failed to fetch requests');
      setDebugInfo(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, urgencyFilter, router]);

  // ✅ FIXED: Added fetchRequests to dependency array
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRequests();
    setIsRefreshing(false);
    showToast('success', 'Requests refreshed!');
  };

  // ✅ handleApprove - sends 'approved' status (correct)
  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/hospital/requests?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' }) // ✅ Correct status
      });

      const data = await response.json();

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
        showToast('success', 'Request approved successfully! ✅');
        setDebugInfo(`Approved request ${id}`);
      } else {
        showToast('error', data.error || 'Failed to approve request');
        setDebugInfo(`Failed to approve: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('error', 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ handleReject - sends 'rejected' status (correct)
  const handleReject = async (id: string) => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/hospital/requests?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'rejected', // ✅ Correct status
          rejectionReason: rejectionReason || 'Request rejected by hospital'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
        showToast('info', 'Request rejected ❌');
        setShowRejectModal(false);
        setRejectionReason("");
        setDebugInfo(`Rejected request ${id}`);
      } else {
        showToast('error', data.error || 'Failed to reject request');
        setDebugInfo(`Failed to reject: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('error', 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'urgent': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
      case 'normal': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      default: return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800';
    }
  };

  // ✅ FIXED: Added null/undefined check for getInitials
  const getInitials = (name: string | undefined | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const filteredRequests = requests.filter((r: BloodRequest): boolean => {
    let matchesSearch: boolean = true;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      matchesSearch = !!(
        (r.donorName || '').toLowerCase().includes(search) ||
        (r.hospitalName || '').toLowerCase().includes(search) ||
        (r.bloodType || '').toLowerCase().includes(search) ||
        (r.patientName ? r.patientName.toLowerCase().includes(search) : false) ||
        (r.donorEmail ? r.donorEmail.toLowerCase().includes(search) : false) ||
        (r.department ? r.department.toLowerCase().includes(search) : false) ||
        (r.doctorName ? r.doctorName.toLowerCase().includes(search) : false)
      );
    }
    
    let matchesUrgency: boolean = true;
    if (urgencyFilter !== 'all') {
      matchesUrgency = r.urgency === urgencyFilter;
    }
    
    return matchesSearch && matchesUrgency;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  const totalPending = requests.length;
  const criticalCount = requests.filter(r => r.urgency === 'critical').length;
  const urgentCount = requests.filter(r => r.urgency === 'urgent').length;
  const normalCount = requests.filter(r => r.urgency === 'normal').length;

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading pending requests...</p>
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
                <Clock className="w-8 h-8 text-yellow-500" />
                Pending Requests
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Review and manage blood requests from donors
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
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Pending</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalPending}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Critical</p>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Urgent</p>
          <p className="text-2xl font-bold text-orange-600">{urgentCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Normal</p>
          <p className="text-2xl font-bold text-blue-600">{normalCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by donor, hospital, blood type, patient, or doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="all">🔴 All Urgency</option>
              {urgencyLevels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>

            <button
              onClick={fetchRequests}
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
                  Donor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Hospital
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Required By
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {sortedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {searchQuery || urgencyFilter !== 'all' 
                          ? 'No requests match your filters' 
                          : 'No pending requests found'}
                      </p>
                      {(searchQuery || urgencyFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setUrgencyFilter("all");
                          }}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRequests.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                          {getInitials(item.donorName)}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{item.donorName || 'Unknown'}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.donorEmail || ''}</p>
                        </div>
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
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.hospitalName || 'Unknown Hospital'}</p>
                        {item.patientName && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Patient: {item.patientName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(item.urgency)}`}>
                        {item.urgency ? item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1) : 'Normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {item.requiredDate ? new Date(item.requiredDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={processingId === item.id}
                          className="p-1.5 bg-emerald-100 dark:bg-emerald-950/30 hover:bg-emerald-200 dark:hover:bg-emerald-950/50 rounded-lg transition group disabled:opacity-50"
                          title="Approve"
                        >
                          {processingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(item);
                            setShowRejectModal(true);
                          }}
                          disabled={processingId === item.id}
                          className="p-1.5 bg-red-100 dark:bg-red-950/30 hover:bg-red-200 dark:hover:bg-red-950/50 rounded-lg transition group disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
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
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(selectedRequest.urgency)}`}>
                  {selectedRequest.urgency ? selectedRequest.urgency.charAt(0).toUpperCase() + selectedRequest.urgency.slice(1) : 'Normal'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Donor</p>
                  <div className="flex items-center gap-2 mt-1">
                    <UserCircle className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-zinc-900 dark:text-white">{selectedRequest.donorName || 'Unknown'}</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedRequest.donorEmail || ''}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedRequest.donorPhone || ''}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hospital</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.hospitalName || 'Unknown Hospital'}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedRequest.hospitalAddress || ''}</p>
                </div>
              </div>

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
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Required Date</p>
                    <p className="text-sm text-zinc-900 dark:text-white">
                      {selectedRequest.requiredDate ? new Date(selectedRequest.requiredDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {selectedRequest.department && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Department</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedRequest.department}</p>
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

              <div className="flex gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <button
                  onClick={() => {
                    handleApprove(selectedRequest.id);
                    setShowDetailsModal(false);
                  }}
                  disabled={processingId === selectedRequest.id}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedRequest.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowRejectModal(true);
                  }}
                  disabled={processingId === selectedRequest.id}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Reject Request</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Donor</p>
                <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.donorName || 'Unknown'}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedRequest.bloodType || 'N/A'} - {selectedRequest.quantity || 0} unit{selectedRequest.quantity > 1 ? 's' : ''}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Please provide a reason for rejecting this request..."
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={processingId === selectedRequest.id}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedRequest.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}