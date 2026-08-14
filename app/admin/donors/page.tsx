"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  X,
  Check,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  Loader2,
  PhoneCall,
  Clipboard,
  UserCircle,
  Weight,
  Calendar as CalendarIcon,
  IdCard,
  Activity,
  User,
  Bell,
  Send,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Donor {
  id: string;
  _id?: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  status: "active" | "inactive" | "pending" | "approved" | "rejected";
  location: string;
  lastDonation: string;
  totalDonations: number;
  registered: string;
  nextEligible: string;
  digitalId: string;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  dateOfBirth: string;
  gender: string;
  weight: number;
  emergencyContact: string;
  medicalConditions: string;
  currentMedications: string;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  isEligible?: boolean;
  points?: number;
  emergencyName?: string;
  emergencyRelationship?: string;
}

const bloodTypes = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AdminDonorsPage() {
  const router = useRouter();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("all");
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationSubject, setNotificationSubject] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      console.log('🔍 Fetching donors with params:', params.toString());

      const response = await fetch(`/api/admin/donors?${params.toString()}`, {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch donors (${response.status})`);
      }

      const data = await response.json();
      console.log('📦 Fetched donors data:', JSON.stringify(data, null, 2));
      
      // Ensure each donor has the correct id
      const donorsWithIds = (data.donors || []).map((donor: any) => {
        const donorId = donor.id || donor._id;
        console.log(`📌 Donor: ${donor.fullName}, ID: ${donorId}, _id: ${donor._id}, userId: ${donor.userId}`);
        return {
          ...donor,
          id: donorId,
          _id: donor._id || donorId,
          userId: donor.userId || ''
        };
      });
      
      setDonors(donorsWithIds);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (err) {
      console.error('❌ Error fetching donors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load donors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, bloodTypeFilter, pagination.page, router]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  // ============ HANDLER FUNCTIONS ============
  
  const handleApprove = async (donorId: string) => {
    console.log('🟢 ====== APPROVE DONOR ======');
    console.log('🟢 Donor ID received:', donorId);
    console.log('🟢 Type of ID:', typeof donorId);
    console.log('🟢 All donors in state:', donors.map(d => ({ 
      id: d.id, 
      name: d.fullName,
      userId: d.userId,
      _id: d._id
    })));
    
    try {
      setProcessingId(donorId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      // Find the donor by ID
      const donor = donors.find(d => d.id === donorId);
      console.log('🟢 Found donor:', donor);
      
      if (!donor) {
        console.error('❌ Donor not found in state. Available IDs:', donors.map(d => d.id));
        alert('Donor not found. Please refresh the page and try again.');
        setProcessingId(null);
        return;
      }

      console.log('✅ Sending approval request for:', {
        donorId: donorId,
        donorName: donor.fullName,
        donorEmail: donor.email,
        donorStatus: donor.status
      });

      // ✅ FIXED: Use dynamic route instead of static
      const response = await fetch(`/api/admin/donors/${donorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'approve'  // Removed donorId from body, now in URL
        })
      });

      console.log('🟢 Response status:', response.status);

      let data;
      try {
        const text = await response.text();
        console.log('🟢 Raw response:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve donor');
      }

      // Update local state
      setDonors(prev => prev.map(d => 
        d.id === donorId 
          ? { 
              ...d, 
              status: 'active', 
              approvedAt: new Date().toISOString(), 
              digitalId: data.donor?.digitalId || d.digitalId 
            }
          : d
      ));

      alert('✅ Donor approved successfully!');
      await fetchDonors();

    } catch (error: any) {
      console.error('❌ Error approving donor:', error);
      alert(error.message || 'Failed to approve donor. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (donorId: string) => {
    console.log('🔴 ====== REJECT DONOR ======');
    console.log('🔴 Donor ID received:', donorId);
    
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(donorId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      const donor = donors.find(d => d.id === donorId);
      if (!donor) {
        console.error('❌ Donor not found with ID:', donorId);
        alert('Donor not found. Please refresh the page and try again.');
        setProcessingId(null);
        return;
      }

      console.log('❌ Rejecting donor:', {
        donorId: donorId,
        donorName: donor.fullName
      });

      // ✅ FIXED: Use dynamic route instead of static
      const response = await fetch(`/api/admin/donors/${donorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'reject',  // Removed donorId from body, now in URL
          reason: rejectionReason
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject donor');
      }

      setDonors(prev => prev.map(d => 
        d.id === donorId 
          ? { ...d, status: 'inactive', rejectionReason: rejectionReason }
          : d
      ));

      setShowRejectModal(null);
      setRejectionReason('');
      alert('❌ Donor rejected');
      await fetchDonors();

    } catch (error: any) {
      console.error('❌ Error rejecting donor:', error);
      alert(error.message || 'Failed to reject donor. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendNotification = async (donorId: string) => {
    console.log('🔔 ====== SEND NOTIFICATION ======');
    console.log('🔔 Donor ID received:', donorId);
    
    if (!notificationSubject.trim() || !notificationMessage.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    try {
      setProcessingId(donorId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      // Find the donor by ID
      const donor = donors.find(d => d.id === donorId);
      if (!donor) {
        console.error('❌ Donor not found with ID:', donorId);
        alert('Donor not found. Please refresh the page and try again.');
        setProcessingId(null);
        return;
      }

      console.log('🔔 Sending notification to donor:', {
        donorId: donorId,
        donorName: donor.fullName,
        donorEmail: donor.email
      });

      const response = await fetch('/api/admin/donors/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donorId: donorId,
          subject: notificationSubject,
          message: notificationMessage,
          donorEmail: donor.email,
          donorName: donor.fullName,
          type: notificationSubject.toLowerCase().includes('eligible') ? 'success' : 'info'
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setShowNotifyModal(null);
      setNotificationSubject('');
      setNotificationMessage('');
      alert('✅ Notification sent successfully!');

    } catch (error: any) {
      console.error('❌ Error sending notification:', error);
      alert(error.message || 'Failed to send notification. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ============ HELPER FUNCTIONS ============

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
      inactive: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400",
      pending: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
      approved: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
      rejected: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
    };
    return statusMap[status] || "";
  };

  const getStatusIcon = (status: string) => {
    if (status === "active" || status === "approved") return <Check className="w-3 h-3" />;
    if (status === "pending") return <Clock className="w-3 h-3" />;
    return <X className="w-3 h-3" />;
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // ============ LOADING & ERROR STATES ============

  if (loading && donors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading donor registrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchDonors}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-red-500" />
            Donor Approvals
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            Review and approve donor registrations from the community
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {donors.filter(d => d.status === 'pending').length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Registrations</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{pagination.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {donors.filter(d => d.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Approved</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {donors.filter(d => d.status === 'active' || d.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Rejected</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {donors.filter(d => d.status === 'inactive' || d.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
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
              <option value="pending">⏳ Pending</option>
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
            </select>

            <select
              value={bloodTypeFilter}
              onChange={(e) => setBloodTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              {bloodTypes.map(type => (
                <option key={type} value={type.toLowerCase()}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {donors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-500 dark:text-zinc-400">No donor registrations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                donors.map((donor) => (
                  <tr
                    key={donor.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(donor.fullName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {donor.fullName}
                          </p>
                          {donor.digitalId && (
                            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                              ID: {donor.digitalId}
                            </p>
                          )}
                          <p className="text-xs text-zinc-400">
                            ID: {donor.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          {donor.email}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          {donor.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                        <Droplet className="w-3 h-3 mr-1" />
                        {donor.bloodType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(donor.status)}`}>
                        {getStatusIcon(donor.status)}
                        {getStatusLabel(donor.status)}
                      </span>
                      {donor.status === 'inactive' && donor.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={donor.rejectionReason}>
                          {donor.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {donor.registered}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Bell Icon - Send Notification */}
                        {(donor.status === 'active' || donor.status === 'approved') && (
                          <button
                            onClick={() => {
                              setSelectedDonor(donor);
                              setShowNotifyModal(donor.id);
                              setNotificationSubject(`🩸 Blood Donation Eligibility - ${donor.fullName}`);
                              setNotificationMessage(`Dear ${donor.fullName},\n\nWe are pleased to inform you that you are eligible to donate blood. Your next donation can help save lives.\n\nBlood Type: ${donor.bloodType}\nNext Eligible Date: ${donor.nextEligible || 'Not set'}\n\nPlease schedule your donation at your earliest convenience.\n\nThank you for being a valued RedPulse donor!`);
                            }}
                            disabled={processingId === donor.id}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-950/30 rounded-lg transition group"
                            title="Send Eligibility Notification"
                          >
                            <Bell className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                          </button>
                        )}
                        {donor.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                console.log('🟢 Approve button clicked for donor:', donor.id);
                                handleApprove(donor.id);
                              }}
                              disabled={processingId === donor.id}
                              className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 rounded-lg transition group"
                              title="Approve Donor"
                            >
                              {processingId === donor.id ? (
                                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                console.log('🔴 Reject button clicked for donor:', donor.id);
                                setShowRejectModal(donor.id);
                              }}
                              disabled={processingId === donor.id}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg transition group"
                              title="Reject Donor"
                            >
                              <UserX className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedDonor(donor);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{donors.length}</span> of{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{pagination.total}</span> registrations
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                      pagination.page === pageNum
                        ? 'text-white bg-red-600 hover:bg-red-700 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {pagination.totalPages > 5 && (
                <span className="px-2 text-zinc-400">...</span>
              )}
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MODALS ============ */}

      {/* View Details Modal */}
      {showDetailsModal && selectedDonor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Donor Profile</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 -m-6 p-6 text-white mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                    {getInitials(selectedDonor.fullName)}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">{selectedDonor.fullName}</h1>
                    <p className="text-red-100">{selectedDonor.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        {selectedDonor.bloodType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedDonor.status === 'active' || selectedDonor.status === 'approved'
                          ? 'bg-green-500/30' 
                          : selectedDonor.status === 'pending'
                          ? 'bg-yellow-500/30'
                          : 'bg-red-500/30'
                      }`}>
                        {selectedDonor.status === 'active' || selectedDonor.status === 'approved' ? 'Active' : 
                         selectedDonor.status === 'pending' ? 'Pending' : 'Inactive'}
                      </span>
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        ID: {selectedDonor.digitalId}
                      </span>
                      {selectedDonor.isEligible !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedDonor.isEligible 
                            ? 'bg-green-500/30' 
                            : 'bg-red-500/30'
                        }`}>
                          {selectedDonor.isEligible ? '✅ Eligible' : '⛔ Not Eligible'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/admin/donors/${selectedDonor.id}/digital-id`}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition backdrop-blur-sm border border-white/30">
                      <IdCard className="h-4 w-4" />
                      View ID
                    </button>
                  </Link>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <User className="w-4 h-4" /> Full Name
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.fullName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Mail className="w-4 h-4" /> Email
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Phone
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Droplet className="w-4 h-4" /> Blood Type
                  </p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                    {selectedDonor.bloodType}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" /> Date of Birth
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    {selectedDonor.dateOfBirth ? new Date(selectedDonor.dateOfBirth).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <UserCircle className="w-4 h-4" /> Gender
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.gender || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Weight className="w-4 h-4" /> Weight
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.weight ? `${selectedDonor.weight} kg` : 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <PhoneCall className="w-4 h-4" /> Emergency Contact
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.emergencyContact || 'Not specified'}</p>
                </div>
              </div>

              {/* Address Section */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4" /> Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Barangay</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.barangay || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Municipality</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.municipality || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Province</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.province || 'Not specified'}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Full Address</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.address || 'Not specified'}</p>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <Clipboard className="w-4 h-4" /> Medical Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Medical Conditions</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.medicalConditions || 'None reported'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Medications</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.currentMedications || 'None reported'}</p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4" /> Donor Statistics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Donations</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedDonor.totalDonations || 0}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Points Earned</p>
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{selectedDonor.points || 0}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Last Donation</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {selectedDonor.lastDonation ? new Date(selectedDonor.lastDonation).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason if any */}
              {selectedDonor.rejectionReason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{selectedDonor.rejectionReason}</p>
                </div>
              )}

              {/* Approval Info */}
              {selectedDonor.approvedAt && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Approved At
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {new Date(selectedDonor.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Admin Actions */}
              {selectedDonor.status === 'pending' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    onClick={() => {
                      handleApprove(selectedDonor.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={processingId === selectedDonor.id}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 flex items-center gap-2"
                  >
                    {processingId === selectedDonor.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    Approve Donor
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRejectModal(selectedDonor.id);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-lg shadow-red-200 dark:shadow-red-900/30 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    Reject Donor
                  </button>
                </div>
              )}

              {/* Send Notification Button in Details */}
              {(selectedDonor.status === 'active' || selectedDonor.status === 'approved') && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    onClick={() => {
                      setShowNotifyModal(selectedDonor.id);
                      setNotificationSubject(`🩸 Blood Donation Eligibility - ${selectedDonor.fullName}`);
                      setNotificationMessage(`Dear ${selectedDonor.fullName},\n\nWe are pleased to inform you that you are eligible to donate blood. Your next donation can help save lives.\n\nBlood Type: ${selectedDonor.bloodType}\nNext Eligible Date: ${selectedDonor.nextEligible || 'Not set'}\n\nPlease schedule your donation at your earliest convenience.\n\nThank you for being a valued RedPulse donor!`);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-lg shadow-blue-200 dark:shadow-blue-900/30 flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Send Notification
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Reject Donor</h3>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Please provide a reason for rejecting this donor application.
              </p>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  placeholder="Enter reason for rejection..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={processingId === showRejectModal || !rejectionReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingId === showRejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                Reject Donor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  Send Eligibility Notification
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Notify donor about their eligibility status
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNotifyModal(null);
                  setNotificationSubject('');
                  setNotificationMessage('');
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={notificationSubject}
                  onChange={(e) => setNotificationSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Enter notification subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Enter notification message..."
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Use {'{donor_name}'} and {'{blood_type}'} as placeholders
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Preview
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{notificationSubject || 'Subject will appear here'}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                    {notificationMessage || 'Message will appear here...'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNotifyModal(null);
                  setNotificationSubject('');
                  setNotificationMessage('');
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendNotification(showNotifyModal)}
                disabled={processingId === showNotifyModal || !notificationSubject.trim() || !notificationMessage.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingId === showNotifyModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}