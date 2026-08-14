// app/hospital/requests/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplet,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Building,
  Calendar,
  Eye,
  Check,
  X,
  Plus,
  Loader2,
  RefreshCw,
  Trash2,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

const bloodTypes = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencyLevels = ["All", "Critical", "Urgent", "Normal"];

type TabType = 'pending' | 'approved' | 'completed';

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
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled' | 'rejected' | 'completed';
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

export default function BloodInquiriesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBloodType, setSelectedBloodType] = useState("All");
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch inquiries from API
  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedUrgency !== 'All') params.append('urgency', selectedUrgency.toLowerCase());
      
      // Fetch all requests first (we'll filter by status on client)
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
        throw new Error('Failed to fetch inquiries');
      }

      const data = await response.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      showToast('error', 'Failed to load inquiries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedUrgency, router]);

  // Update inquiry status
  const updateInquiryStatus = async (id: string, status: 'approved' | 'completed' | 'rejected') => {
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
          status: status === 'completed' ? 'fulfilled' : status 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      const statusLabel = status === 'approved' ? 'approved' : status === 'completed' ? 'marked as completed' : 'rejected';
      showToast('success', `Inquiry ${statusLabel} successfully! ✅`);
      
      // Remove the updated request from the list
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error updating inquiry:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to update inquiry status.');
    } finally {
      setProcessingId(null);
    }
  };

  // Delete inquiry
  const deleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;

    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/hospital/requests?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete inquiry');
      }

      showToast('success', 'Inquiry deleted successfully! 🗑️');
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to delete inquiry.');
    } finally {
      setProcessingId(null);
    }
  };

  // Load inquiries on mount and when filters change
  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInquiries();
    setIsRefreshing(false);
    showToast('success', 'Inquiries refreshed!');
  };

  // Get status counts
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved' || r.status === 'fulfilled').length;
  const completedCount = requests.filter(r => r.status === 'fulfilled' || r.status === 'cancelled' || r.status === 'rejected').length;

  // Filter inquiries based on active tab, blood type, and urgency
  const filteredInquiries = requests.filter(inquiry => {
    // Tab filter
    if (activeTab === 'pending' && inquiry.status !== 'pending') return false;
    if (activeTab === 'approved' && !['approved', 'fulfilled'].includes(inquiry.status)) return false;
    if (activeTab === 'completed' && !['fulfilled', 'cancelled', 'rejected'].includes(inquiry.status)) return false;

    // Blood type filter
    if (selectedBloodType !== "All" && inquiry.bloodType !== selectedBloodType) return false;

    return true;
  });

  // Sort by urgency (critical first)
  const sortedRequests = [...filteredInquiries].sort((a, b) => {
    const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
    return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
  });

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return '';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Droplet className="w-8 h-8 text-red-500" />
            Blood Inquiries
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage blood requests from donors
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition flex items-center gap-2 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
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

      {/* Tabs */}
      <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Inquiries
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`flex-1 px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${
            activeTab === 'approved'
              ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Approved Requests
          {approvedCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              {approvedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Completed Releases
          {completedCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
              {completedCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by donor, hospital, or blood type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedBloodType}
            onChange={(e) => setSelectedBloodType(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {bloodTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {urgencyLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">Loading inquiries...</p>
          </div>
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 p-12">
          <div className="flex flex-col items-center justify-center">
            <Droplet className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No inquiries found</h3>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              {activeTab === 'pending' && "No pending inquiries at the moment"}
              {activeTab === 'approved' && "No approved requests yet"}
              {activeTab === 'completed' && "No completed releases yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRequests.map((inquiry) => (
            <div
              key={inquiry.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 p-6 hover:border-red-200 dark:hover:border-red-800/60 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                          {getInitials(inquiry.donorName)}
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                          {inquiry.donorName}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(inquiry.status)}`}>
                          {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(inquiry.urgency)}`}>
                          {inquiry.urgency.charAt(0).toUpperCase() + inquiry.urgency.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                          <Droplet className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{inquiry.bloodType}</span>
                          <span className="text-zinc-400">•</span>
                          <span>{inquiry.quantity} unit{inquiry.quantity > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                          <Building className="w-4 h-4" />
                          <span className="truncate">{inquiry.hospitalName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span>Required: {formatDate(inquiry.requiredDate)}</span>
                        </div>
                        {inquiry.patientName && (
                          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                            <User className="w-4 h-4" />
                            <span>Patient: {inquiry.patientName}</span>
                            {inquiry.patientAge && (
                              <span className="text-zinc-400">• {inquiry.patientAge} yrs</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(inquiry);
                      setIsDetailsModalOpen(true);
                    }}
                    className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {inquiry.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateInquiryStatus(inquiry.id, 'approved')}
                        disabled={processingId === inquiry.id}
                        className="p-2 text-green-500 hover:text-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition disabled:opacity-50"
                        title="Approve"
                      >
                        {processingId === inquiry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteInquiry(inquiry.id)}
                        disabled={processingId === inquiry.id}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {inquiry.status === 'approved' && (
                    <>
                      <button
                        onClick={() => updateInquiryStatus(inquiry.id, 'completed')}
                        disabled={processingId === inquiry.id}
                        className="p-2 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50"
                        title="Mark as Completed"
                      >
                        {processingId === inquiry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => updateInquiryStatus(inquiry.id, 'rejected')}
                        disabled={processingId === inquiry.id}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/60 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Inquiry Details
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedRequest.id}</p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Urgency */}
              <div className="flex gap-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyColor(selectedRequest.urgency)}`}>
                  {selectedRequest.urgency.charAt(0).toUpperCase() + selectedRequest.urgency.slice(1)}
                </span>
              </div>

              {/* Donor Info */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Donor Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Name</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.donorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.donorEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Phone</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.donorPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Blood Type</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.bloodType}</p>
                  </div>
                </div>
              </div>

              {/* Blood Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Blood Type</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white">{selectedRequest.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Quantity</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white">{selectedRequest.quantity} unit{selectedRequest.quantity > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Required Date</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white">{formatDate(selectedRequest.requiredDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Created</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {/* Patient Information */}
              {selectedRequest.patientName && (
                <div>
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Name</p>
                      <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Age</p>
                      <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.patientAge || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Hospital Information */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Hospital Information</h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Hospital</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.hospitalName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Address</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.hospitalAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Department</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Doctor</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.doctorName || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Contact</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedRequest.contactNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Notes</h4>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <p className="text-zinc-700 dark:text-zinc-300">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        updateInquiryStatus(selectedRequest.id, 'approved');
                        setIsDetailsModalOpen(false);
                      }}
                      disabled={processingId === selectedRequest.id}
                      className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === selectedRequest.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                        deleteInquiry(selectedRequest.id);
                        setIsDetailsModalOpen(false);
                      }}
                      disabled={processingId === selectedRequest.id}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
                {selectedRequest.status === 'approved' && (
                  <>
                    <button
                      onClick={() => {
                        updateInquiryStatus(selectedRequest.id, 'completed');
                        setIsDetailsModalOpen(false);
                      }}
                      disabled={processingId === selectedRequest.id}
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === selectedRequest.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Mark as Completed
                    </button>
                    <button
                      onClick={() => {
                        updateInquiryStatus(selectedRequest.id, 'rejected');
                        setIsDetailsModalOpen(false);
                      }}
                      disabled={processingId === selectedRequest.id}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
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