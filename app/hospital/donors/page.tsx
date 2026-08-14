// app/hospital/donors/page.tsx
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
  Clock,
  AlertCircle,
  Loader2,
  UserCircle,
  Weight,
  Calendar as CalendarIcon,
  IdCard,
  Activity,
  User,
  Bell,
  Send,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Check,
  AlertTriangle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  FileCheck,
  FileX,
  History,
  CalendarCheck,
  CalendarX,
  Clock as ClockIcon
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
  // Background check fields
  backgroundCheckStatus?: 'pending' | 'cleared' | 'failed' | 'in-review';
  backgroundCheckDate?: string;
  backgroundCheckNotes?: string;
  verifiedBy?: string;
  verificationDate?: string;
  // Event registration fields
  registeredEvents?: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    status: 'registered' | 'attended' | 'cancelled';
    registeredAt: string;
  }[];
  upcomingEventsCount?: number;
}

const bloodTypes = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function HospitalDonorsPage() {
  const router = useRouter();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("all");
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBackgroundCheckModal, setShowBackgroundCheckModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [backgroundCheckNotes, setBackgroundCheckNotes] = useState("");
  const [backgroundCheckStatus, setBackgroundCheckStatus] = useState<'pending' | 'cleared' | 'failed' | 'in-review'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

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

      console.log('🔍 Fetching hospital donors with params:', params.toString());

      const response = await fetch(`/api/hospital/donors?${params.toString()}`, {
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
      
      const donorsWithIds = (data.donors || []).map((donor: any) => {
        const donorId = donor.id || donor._id;
        return {
          ...donor,
          id: donorId,
          _id: donor._id || donorId,
          userId: donor.userId || '',
          backgroundCheckStatus: donor.backgroundCheckStatus || 'pending',
          registeredEvents: donor.registeredEvents || [],
          upcomingEventsCount: donor.registeredEvents?.filter((e: any) => 
            new Date(e.eventDate) > new Date() && e.status === 'registered'
          ).length || 0,
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

  const handleApprove = async (donorId: string) => {
    try {
      setProcessingId(donorId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast('error', 'Please login again');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/hospital/donors/${donorId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve' })
      });

      const data = await response.json();

      if (response.ok) {
        setDonors(prev => prev.map(d => 
          d.id === donorId 
            ? { 
                ...d, 
                status: 'active', 
                approvedAt: new Date().toISOString(), 
                digitalId: data.donor?.digitalId || d.digitalId,
                isEligible: true
              }
            : d
        ));
        showToast('success', 'Donor approved successfully! ✅');
        await fetchDonors();
      } else {
        showToast('error', data.error || 'Failed to approve donor');
      }
    } catch (error: any) {
      console.error('❌ Error approving donor:', error);
      showToast('error', error.message || 'Failed to approve donor');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (donorId: string) => {
    if (!rejectionReason.trim()) {
      showToast('error', 'Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(donorId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast('error', 'Please login again');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/hospital/donors/${donorId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'reject',
          reason: rejectionReason 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setDonors(prev => prev.map(d => 
          d.id === donorId 
            ? { ...d, status: 'inactive', rejectionReason: rejectionReason, isEligible: false }
            : d
        ));
        setShowRejectModal(false);
        setRejectionReason('');
        showToast('error', 'Donor rejected ❌');
        await fetchDonors();
      } else {
        showToast('error', data.error || 'Failed to reject donor');
      }
    } catch (error: any) {
      console.error('❌ Error rejecting donor:', error);
      showToast('error', error.message || 'Failed to reject donor');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBackgroundCheck = async (donorId: string) => {
    if (!backgroundCheckStatus) {
      showToast('error', 'Please select a background check status');
      return;
    }

    try {
      setProcessingId(donorId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast('error', 'Please login again');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/hospital/donors/${donorId}/background-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: backgroundCheckStatus,
          notes: backgroundCheckNotes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setDonors(prev => prev.map(d => 
          d.id === donorId 
            ? { 
                ...d, 
                backgroundCheckStatus: backgroundCheckStatus,
                backgroundCheckDate: new Date().toISOString(),
                backgroundCheckNotes: backgroundCheckNotes || d.backgroundCheckNotes,
                verifiedBy: 'Hospital Admin',
                verificationDate: new Date().toISOString()
              }
            : d
        ));
        setShowBackgroundCheckModal(false);
        setBackgroundCheckNotes('');
        setBackgroundCheckStatus('pending');
        showToast('success', `Background check ${backgroundCheckStatus} for donor ✅`);
        await fetchDonors();
      } else {
        showToast('error', data.error || 'Failed to update background check');
      }
    } catch (error: any) {
      console.error('❌ Error updating background check:', error);
      showToast('error', error.message || 'Failed to update background check');
    } finally {
      setProcessingId(null);
    }
  };

  // Helper functions
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

  const getBackgroundCheckColor = (status?: string) => {
    const statusMap: Record<string, string> = {
      cleared: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
      pending: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
      'in-review': "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
      failed: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
    };
    return statusMap[status || 'pending'] || statusMap.pending;
  };

  const getBackgroundCheckIcon = (status?: string) => {
    switch (status) {
      case 'cleared':
        return <ShieldCheck className="w-3 h-3" />;
      case 'failed':
        return <ShieldAlert className="w-3 h-3" />;
      case 'in-review':
        return <ShieldQuestion className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  const getBackgroundCheckLabel = (status?: string) => {
    const labels: Record<string, string> = {
      cleared: 'Cleared ✅',
      pending: 'Pending ⏳',
      'in-review': 'In Review 🔍',
      failed: 'Failed ❌',
    };
    return labels[status || 'pending'] || 'Pending';
  };

  const getEventRegistrationColor = (status?: string) => {
    const statusMap: Record<string, string> = {
      registered: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
      attended: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
      cancelled: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
    };
    return statusMap[status || 'registered'] || statusMap.registered;
  };

  const getEventRegistrationLabel = (status?: string) => {
    const labels: Record<string, string> = {
      registered: 'Registered 📋',
      attended: 'Attended ✅',
      cancelled: 'Cancelled ❌',
    };
    return labels[status || 'registered'] || 'Registered';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Check component for status icon
  const Check = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  // Loading state
  if (loading && donors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading donors...</p>
        </div>
      </div>
    );
  }

  // Error state
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md animate-in slide-in-from-right-5 ${
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-red-500" />
            Donors
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            View and manage blood donors with background checks and event registrations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => {/* Implement export */}}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Donors</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{pagination.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Donors</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {donors.filter(d => d.status === 'active' || d.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pending</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {donors.filter(d => d.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Background Cleared</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {donors.filter(d => d.backgroundCheckStatus === 'cleared').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Event Registered</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {donors.filter(d => d.upcomingEventsCount && d.upcomingEventsCount > 0).length}
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

            <button
              onClick={fetchDonors}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
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
                  Background Check
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Events
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {donors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-500 dark:text-zinc-400">No donors found</p>
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
                      {donor.isEligible && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                          Eligible
                        </span>
                      )}
                      {donor.rejectionReason && donor.status === 'inactive' && (
                        <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={donor.rejectionReason}>
                          {donor.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getBackgroundCheckColor(donor.backgroundCheckStatus)}`}>
                        {getBackgroundCheckIcon(donor.backgroundCheckStatus)}
                        {getBackgroundCheckLabel(donor.backgroundCheckStatus)}
                      </span>
                      {donor.backgroundCheckDate && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                          {new Date(donor.backgroundCheckDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {donor.upcomingEventsCount && donor.upcomingEventsCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <CalendarCheck className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {donor.upcomingEventsCount}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedDonor(donor);
                              setShowEventsModal(true);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 underline"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">No events</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Background Check Button */}
                        <button
                          onClick={() => {
                            setSelectedDonor(donor);
                            setBackgroundCheckStatus(donor.backgroundCheckStatus || 'pending');
                            setBackgroundCheckNotes(donor.backgroundCheckNotes || '');
                            setShowBackgroundCheckModal(true);
                          }}
                          className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-950/30 rounded-lg transition group"
                          title="Background Check"
                        >
                          <Shield className="w-4 h-4 text-purple-500 group-hover:text-purple-600" />
                        </button>
                        
                        {/* Approve/Reject buttons for pending donors */}
                        {donor.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(donor.id)}
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
                                setSelectedDonor(donor);
                                setShowRejectModal(true);
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
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{pagination.total}</span> donors
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
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
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
                    <MapPin className="w-4 h-4" /> Address
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.address || 'Not specified'}</p>
                </div>
              </div>

              {/* Background Check Section */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4" /> Background Check
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getBackgroundCheckColor(selectedDonor.backgroundCheckStatus)}`}>
                      {getBackgroundCheckIcon(selectedDonor.backgroundCheckStatus)}
                      {getBackgroundCheckLabel(selectedDonor.backgroundCheckStatus)}
                    </span>
                  </div>
                  {selectedDonor.backgroundCheckDate && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Checked On</p>
                      <p className="text-sm text-zinc-900 dark:text-white">
                        {new Date(selectedDonor.backgroundCheckDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedDonor.verifiedBy && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Verified By</p>
                      <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.verifiedBy}</p>
                    </div>
                  )}
                  {selectedDonor.backgroundCheckNotes && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</p>
                      <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.backgroundCheckNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Registrations Section */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" /> Event Registrations
                </h4>
                {selectedDonor.registeredEvents && selectedDonor.registeredEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDonor.registeredEvents.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{event.eventTitle}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getEventRegistrationColor(event.status)}`}>
                          {event.status === 'registered' && <CalendarCheck className="w-3 h-3" />}
                          {event.status === 'attended' && <CheckCircle className="w-3 h-3" />}
                          {event.status === 'cancelled' && <CalendarX className="w-3 h-3" />}
                          {getEventRegistrationLabel(event.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No event registrations</p>
                )}
              </div>

              {/* Donor Statistics */}
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
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Next Eligible</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {selectedDonor.nextEligible || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              {(selectedDonor.medicalConditions || selectedDonor.currentMedications) && (
                <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4" /> Medical Information
                  </h4>
                  <div className="space-y-2">
                    {selectedDonor.medicalConditions && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Medical Conditions</p>
                        <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.medicalConditions}</p>
                      </div>
                    )}
                    {selectedDonor.currentMedications && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Medications</p>
                        <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.currentMedications}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {(selectedDonor.emergencyContact || selectedDonor.emergencyName) && (
                <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                    <Phone className="w-4 h-4" /> Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDonor.emergencyName && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Name</p>
                        <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.emergencyName}</p>
                      </div>
                    )}
                    {selectedDonor.emergencyContact && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Contact Number</p>
                        <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.emergencyContact}</p>
                      </div>
                    )}
                    {selectedDonor.emergencyRelationship && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Relationship</p>
                        <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.emergencyRelationship}</p>
                      </div>
                    )}
                  </div>
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
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-lg shadow-red-200 dark:shadow-red-900/30 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    Reject Donor
                  </button>
                </div>
              )}

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

              {/* Registered Date */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Registered on {new Date(selectedDonor.createdAt).toLocaleString()}
                  {selectedDonor.updatedAt && ` • Last updated ${new Date(selectedDonor.updatedAt).toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDonor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Reject Donor</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedDonor(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  Are you sure you want to reject <span className="font-semibold">{selectedDonor.fullName}</span>?
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Rejection <span className="text-red-500">*</span>
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
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedDonor(null);
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedDonor.id)}
                disabled={processingId === selectedDonor.id || !rejectionReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingId === selectedDonor.id ? (
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

      {/* Background Check Modal */}
      {showBackgroundCheckModal && selectedDonor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                Background Check
              </h3>
              <button
                onClick={() => {
                  setShowBackgroundCheckModal(false);
                  setBackgroundCheckNotes('');
                  setBackgroundCheckStatus('pending');
                  setSelectedDonor(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Update background check status for <span className="font-semibold text-zinc-900 dark:text-white">{selectedDonor.fullName}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={backgroundCheckStatus}
                  onChange={(e) => setBackgroundCheckStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="in-review">🔍 In Review</option>
                  <option value="cleared">✅ Cleared</option>
                  <option value="failed">❌ Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={backgroundCheckNotes}
                  onChange={(e) => setBackgroundCheckNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                  placeholder="Add notes about the background check..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBackgroundCheckModal(false);
                  setBackgroundCheckNotes('');
                  setBackgroundCheckStatus('pending');
                  setSelectedDonor(null);
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBackgroundCheck(selectedDonor.id)}
                disabled={processingId === selectedDonor.id}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingId === selectedDonor.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Update Background Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events Modal */}
      {showEventsModal && selectedDonor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Event Registrations
              </h3>
              <button
                onClick={() => {
                  setShowEventsModal(false);
                  setSelectedDonor(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Event registrations for <span className="font-semibold text-zinc-900 dark:text-white">{selectedDonor.fullName}</span>
                </p>
              </div>

              {selectedDonor.registeredEvents && selectedDonor.registeredEvents.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedDonor.registeredEvents.map((event, index) => (
                    <div key={index} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{event.eventTitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(event.eventDate).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {new Date(event.registeredAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getEventRegistrationColor(event.status)}`}>
                          {event.status === 'registered' && <CalendarCheck className="w-3 h-3" />}
                          {event.status === 'attended' && <CheckCircle className="w-3 h-3" />}
                          {event.status === 'cancelled' && <CalendarX className="w-3 h-3" />}
                          {getEventRegistrationLabel(event.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarX className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No event registrations</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end">
              <button
                onClick={() => {
                  setShowEventsModal(false);
                  setSelectedDonor(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}