// app/hospital/requests/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  RefreshCw,
  MessageSquare,
  Send,
  Package,
  ArrowUpRight
} from "lucide-react";
import ReleaseBloodModal, { ReleaseData } from "@/components/releaseblood/ReleaseBloodModal";

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
  rejectionReason?: string;
}

interface InventoryCheck {
  available: boolean;
  availableUnits: number;
  requestedUnits: number;
  bloodType: string;
  message: string;
}

export default function BloodInquiriesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBloodType, setSelectedBloodType] = useState("All");
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [approveRequestId, setApproveRequestId] = useState<string | null>(null);
  const [inventoryCheck, setInventoryCheck] = useState<InventoryCheck | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  
  // State for Release Blood Modal
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseRequestData, setReleaseRequestData] = useState<ReleaseData | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch inventory for the release modal
  const fetchInventory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/hospital/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  }, []);

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
      
      // Also fetch inventory for the release modal
      await fetchInventory();
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      showToast('error', 'Failed to load inquiries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedUrgency, router, fetchInventory]);

  // Check inventory before approving
  const checkInventory = async (request: BloodRequest) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/hospital/inventory/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bloodType: request.bloodType,
          units: request.quantity
        })
      });

      const data = await response.json();
      setInventoryCheck(data);
      return data;
    } catch (error) {
      console.error('Error checking inventory:', error);
      showToast('error', 'Failed to check inventory availability');
      return null;
    }
  };

  // Update inquiry status - ONLY accepts 'approved' or 'rejected'
  const updateInquiryStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    // Validate status before making the API call
    if (status !== 'approved' && status !== 'rejected') {
      console.error('Invalid status:', status);
      showToast('error', `Invalid status: ${status}. Only 'approved' or 'rejected' are allowed.`);
      return;
    }

    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      const body: any = { status };
      
      if (status === 'rejected' && reason) {
        body.rejectionReason = reason;
      }

      // If approving, find the request to get details
      if (status === 'approved') {
        const request = requests.find(r => r.id === id);
        if (request) {
          // Check inventory first
          const inventoryData = await checkInventory(request);
          if (!inventoryData || !inventoryData.available) {
            showToast('warning', `⚠️ Insufficient inventory for ${request.bloodType}. Available: ${inventoryData?.availableUnits || 0} units`);
            setProcessingId(null);
            return;
          }

          // Add release data to the approval
          body.releaseData = {
            patientName: request.patientName || 'Unknown Patient',
            patientAge: request.patientAge,
            hospitalWard: request.department || 'General Ward',
            doctorName: request.doctorName || 'Unknown Doctor',
            reason: `Blood request approved - ${request.urgency} need`,
            releaseDate: new Date().toISOString(),
            notes: request.notes || '',
            requestId: request.id,
            donorName: request.donorName,
            donorEmail: request.donorEmail,
            donorPhone: request.donorPhone,
            donorBloodType: request.donorBloodType || request.bloodType
          };
        }
      }
      
      const response = await fetch(`/api/hospital/requests?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }
      
      const statusLabel = status === 'approved' ? 'approved and released' : 'rejected';
      showToast('success', `✅ Inquiry ${statusLabel} successfully!`);
      
      // If approved, show release info
      if (status === 'approved' && data.release) {
        showToast('info', `🩸 ${data.release.units} unit(s) of ${data.release.bloodType} released from inventory for ${data.release.patientName}`);
        
        // Show donor notification sent
        if (data.notificationSent) {
          showToast('success', `📧 Receipt sent to donor: ${data.release.donorEmail}`);
        }
      }
      
      // If rejected, show donor notified
      if (status === 'rejected' && data.notificationSent) {
        showToast('info', `📧 Rejection notification sent to donor`);
      }
      
      setRequests(prev => prev.filter(r => r.id !== id));
      setIsConfirmModalOpen(false);
      setApproveRequestId(null);
      setInventoryCheck(null);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to update inquiry status.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle approve click - show confirmation modal with inventory check
  const handleApproveClick = async (id: string) => {
    const request = requests.find(r => r.id === id);
    if (!request) return;
    
    // Check inventory first
    const inventoryData = await checkInventory(request);
    if (!inventoryData || !inventoryData.available) {
      showToast('warning', `⚠️ Insufficient inventory for ${request.bloodType}. Available: ${inventoryData?.availableUnits || 0} units`);
      return;
    }

    // Open release modal with pre-filled data
    setReleaseRequestData({
      bloodType: request.bloodType,
      units: request.quantity,
      patientName: request.patientName || '',
      patientAge: request.patientAge,
      hospitalWard: request.department || '',
      doctorName: request.doctorName || '',
      reason: `Blood request approved - ${request.urgency} need`,
      releaseDate: new Date().toISOString().split('T')[0],
      notes: request.notes || '',
      requestId: request.id,
      donorName: request.donorName,
      donorEmail: request.donorEmail,
      donorPhone: request.donorPhone,
      donorBloodType: request.donorBloodType || request.bloodType
    });
    setShowReleaseModal(true);
  };

  // Handle release from modal - THIS IS WHERE THE STATUS IS SET
  const handleReleaseFromModal = async (releaseData: ReleaseData) => {
    try {
      // Call the API to release blood and approve request
      const token = localStorage.getItem('token');
      
      const body: any = {
        status: 'approved', // ✅ This is the correct status
        releaseData: releaseData
      };

      const response = await fetch(`/api/hospital/requests?id=${releaseData.requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      showToast('success', `✅ Request approved and ${releaseData.units} unit(s) released!`);
      
      if (data.notificationSent) {
        showToast('success', `📧 Receipt sent to donor: ${releaseData.donorEmail}`);
      }

      // Remove the request from the list
      setRequests(prev => prev.filter(r => r.id !== releaseData.requestId));
      setShowReleaseModal(false);
      setReleaseRequestData(null);
      
      // Refresh inventory
      await fetchInventory();
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to approve request');
      throw error;
    }
  };

  // Handle reject with reason
  const handleRejectClick = (id: string) => {
    setRejectRequestId(id);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast('error', 'Please provide a reason for rejection.');
      return;
    }
    
    if (rejectRequestId) {
      // ✅ Passing 'rejected' as the status
      await updateInquiryStatus(rejectRequestId, 'rejected', rejectReason.trim());
      setIsRejectModalOpen(false);
      setRejectReason("");
      setRejectRequestId(null);
    }
  };

  // Handle marking as completed - THIS IS WHERE THE ISSUE WAS
  // The API doesn't accept 'completed' as a status, so we need to handle this differently
  // The API only accepts 'approved' or 'rejected' for the PUT endpoint
  // So we need to either remove this functionality or implement it differently
  const handleMarkAsCompleted = async (id: string) => {
    // Since the API only accepts 'approved' or 'rejected', 
    // we'll just show a message that this feature is not available
    // or we could update the status in the local state only
    showToast('info', 'Completed status is managed automatically when blood is released.');
    // Optionally, you could call a different API endpoint here if one exists
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
    if (activeTab === 'pending' && inquiry.status !== 'pending') return false;
    if (activeTab === 'approved' && !['approved', 'fulfilled'].includes(inquiry.status)) return false;
    if (activeTab === 'completed' && !['fulfilled', 'cancelled', 'rejected'].includes(inquiry.status)) return false;
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
            : toast.type === 'warning'
            ? 'bg-yellow-50 dark:bg-yellow-950/90 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
            : 'bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
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
            Manage blood requests from donors with automatic inventory deduction
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
                        {inquiry.status === 'rejected' && inquiry.rejectionReason && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                        {inquiry.status === 'approved' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Released
                          </span>
                        )}
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
                      {inquiry.status === 'rejected' && inquiry.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                          <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span><span className="font-medium">Rejection reason:</span> {inquiry.rejectionReason}</span>
                          </p>
                        </div>
                      )}
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
                        onClick={() => handleApproveClick(inquiry.id)}
                        disabled={processingId === inquiry.id}
                        className="p-2 text-green-500 hover:text-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition disabled:opacity-50"
                        title="Approve & Release"
                      >
                        {processingId === inquiry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectClick(inquiry.id)}
                        disabled={processingId === inquiry.id}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* REMOVED: The "Mark as Completed" button because the API doesn't accept 'completed' status */}
                  {/* We only show actions for pending requests */}
                  {inquiry.status === 'approved' && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      Release completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Release Blood Modal */}
      <ReleaseBloodModal
        isOpen={showReleaseModal}
        onClose={() => {
          setShowReleaseModal(false);
          setReleaseRequestData(null);
        }}
        inventoryItems={inventory}
        onRelease={handleReleaseFromModal}
        isReleasing={processingId !== null}
        releaseData={releaseRequestData || undefined}
      />

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

              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Rejection Reason
                  </h4>
                  <p className="text-red-700 dark:text-red-400">{selectedRequest.rejectionReason}</p>
                </div>
              )}

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
                        setIsDetailsModalOpen(false);
                        handleApproveClick(selectedRequest.id);
                      }}
                      disabled={processingId === selectedRequest.id}
                      className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === selectedRequest.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve & Release
                    </button>
                    <button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleRejectClick(selectedRequest.id);
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

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Reject Inquiry
                </h2>
                <button
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectReason("");
                    setRejectRequestId(null);
                  }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Please provide a respectful reason for rejecting this inquiry. This will be shared with the donor.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="E.g., We currently have sufficient supply of this blood type. Thank you for your willingness to help!"
                  rows={4}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  This reason will be visible to the donor.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Inquiry
                </button>
                <button
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectReason("");
                    setRejectRequestId(null);
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