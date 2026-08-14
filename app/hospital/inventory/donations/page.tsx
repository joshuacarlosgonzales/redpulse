// app/hospital/inventory/donations/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  Droplet,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Calendar,
  Minus,
  HandHeart,
  AlertCircle,
  Search,
  Filter,
  Package,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DonationRecord {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  bloodType: string;
  units: number;
  donationDate: string;
  notes: string;
  status: 'Completed' | 'Pending' | 'Scheduled' | 'Cancelled';
  hospital: string;
  createdAt: string;
  updatedAt: string;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const donationStatusColors = {
  Completed: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  Pending: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400",
  Scheduled: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  Cancelled: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
};

export default function DonationsPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDonation, setSelectedDonation] = useState<DonationRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [donationFormData, setDonationFormData] = useState({
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    bloodType: "",
    units: 1,
    donationDate: "",
    notes: "",
    status: "Completed" as const,
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getDonationStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-3 h-3" />;
      case 'Pending': return <Clock className="w-3 h-3" />;
      case 'Scheduled': return <Calendar className="w-3 h-3" />;
      case 'Cancelled': return <X className="w-3 h-3" />;
      default: return <Minus className="w-3 h-3" />;
    }
  };

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/hospital/donations?${params.toString()}`, {
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
        throw new Error('Failed to fetch donations');
      }

      const data = await response.json();
      setDonations(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (err) {
      console.error('Error fetching donations:', err);
      showToast('error', 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, bloodTypeFilter, statusFilter, pagination.page, pagination.limit, router]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleAddDonation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Validate
      if (!donationFormData.donorName.trim()) {
        showToast('error', 'Donor name is required');
        return;
      }
      if (!donationFormData.bloodType) {
        showToast('error', 'Blood type is required');
        return;
      }
      if (donationFormData.units < 1) {
        showToast('error', 'Units must be at least 1');
        return;
      }
      if (!donationFormData.donationDate) {
        showToast('error', 'Donation date is required');
        return;
      }

      const response = await fetch('/api/hospital/donations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationFormData)
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast('success', data.message || 'Donation recorded successfully! 🩸');
        setShowDonationModal(false);
        setDonationFormData({
          donorName: "",
          donorEmail: "",
          donorPhone: "",
          bloodType: "",
          units: 1,
          donationDate: "",
          notes: "",
          status: "Completed",
        });
        await fetchDonations();
      } else {
        showToast('error', data.error || 'Failed to record donation');
      }
    } catch (error) {
      console.error('Error adding donation:', error);
      showToast('error', 'Failed to record donation');
    }
  };

  // Stats
  const stats = {
    total: pagination.total,
    completed: donations.filter(d => d.status === 'Completed').length,
    pending: donations.filter(d => d.status === 'Pending').length,
    scheduled: donations.filter(d => d.status === 'Scheduled').length,
    cancelled: donations.filter(d => d.status === 'Cancelled').length,
  };

  if (loading && donations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading donations...</p>
        </div>
      </div>
    );
  }

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

      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/hospital/inventory')}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              <History className="w-8 h-8 text-blue-500" />
              Donation History
            </h1>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
              View and manage all blood donation records
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/hospital/inventory')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Package className="w-4 h-4" />
            View Inventory
          </button>
          
          <button
            onClick={() => setShowDonationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-medium shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
          >
            <HandHeart className="w-4 h-4" />
            Record Donation
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.scheduled}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cancelled</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search donations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={bloodTypeFilter}
              onChange={(e) => setBloodTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">🩸 All Blood Types</option>
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">📋 All Status</option>
              <option value="Completed">✅ Completed</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Scheduled">📅 Scheduled</option>
              <option value="Cancelled">❌ Cancelled</option>
            </select>

            <button
              onClick={fetchDonations}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Donations Table */}
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
                  Units
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
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <History className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-500 dark:text-zinc-400">No donations found</p>
                      <button
                        onClick={() => setShowDonationModal(true)}
                        className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                      >
                        <HandHeart className="w-4 h-4" />
                        Record First Donation
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                donations.map((donation) => (
                  <tr
                    key={donation.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                          {getInitials(donation.donorName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {donation.donorName}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {donation.donorEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                        <Droplet className="w-3.5 h-3.5" />
                        {donation.bloodType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {donation.units}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${donationStatusColors[donation.status as keyof typeof donationStatusColors] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                        {getDonationStatusIcon(donation.status)}
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(donation.donationDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedDonation(donation);
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

        {/* Pagination */}
        {donations.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{donations.length}</span> of{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{pagination.total}</span> donations
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
                          ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {pagination.totalPages > 5 && <span className="px-2 text-zinc-400">...</span>}
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
        )}
      </div>

      {/* Record Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <HandHeart className="w-5 h-5 text-emerald-500" />
                Record Donation
              </h3>
              <button
                onClick={() => {
                  setShowDonationModal(false);
                  setDonationFormData({
                    donorName: "",
                    donorEmail: "",
                    donorPhone: "",
                    bloodType: "",
                    units: 1,
                    donationDate: "",
                    notes: "",
                    status: "Completed",
                  });
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Donor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={donationFormData.donorName}
                  onChange={(e) => setDonationFormData({ ...donationFormData, donorName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Enter donor's full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={donationFormData.donorEmail}
                    onChange={(e) => setDonationFormData({ ...donationFormData, donorEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="donor@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={donationFormData.donorPhone}
                    onChange={(e) => setDonationFormData({ ...donationFormData, donorPhone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Blood Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={donationFormData.bloodType}
                  onChange={(e) => setDonationFormData({ ...donationFormData, bloodType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select blood type</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Units <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={donationFormData.units}
                    onChange={(e) => setDonationFormData({ ...donationFormData, units: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Donation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={donationFormData.donationDate}
                    onChange={(e) => setDonationFormData({ ...donationFormData, donationDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Status
                </label>
                <select
                  value={donationFormData.status}
                  onChange={(e) => setDonationFormData({ ...donationFormData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="Completed">✅ Completed</option>
                  <option value="Pending">⏳ Pending</option>
                  <option value="Scheduled">📅 Scheduled</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Only "Completed" donations will update inventory automatically
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={donationFormData.notes}
                  onChange={(e) => setDonationFormData({ ...donationFormData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  rows={3}
                  placeholder="Additional notes about the donation..."
                />
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Donation will automatically update inventory with expiration date 42 days from donation date.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-zinc-900">
              <button
                onClick={() => {
                  setShowDonationModal(false);
                  setDonationFormData({
                    donorName: "",
                    donorEmail: "",
                    donorPhone: "",
                    bloodType: "",
                    units: 1,
                    donationDate: "",
                    notes: "",
                    status: "Completed",
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDonation}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-2"
              >
                <HandHeart className="w-4 h-4" />
                Record Donation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Donation Details Modal */}
      {showDetailsModal && selectedDonation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Donation Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDonation(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-lg">
                  {getInitials(selectedDonation.donorName)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{selectedDonation.donorName}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedDonation.donorEmail}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedDonation.donorPhone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Blood Type</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                    <Droplet className="w-3.5 h-3.5" />
                    {selectedDonation.bloodType}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Units</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedDonation.units}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${donationStatusColors[selectedDonation.status as keyof typeof donationStatusColors] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                    {getDonationStatusIcon(selectedDonation.status)}
                    {selectedDonation.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Donation Date</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {new Date(selectedDonation.donationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hospital</p>
                <p className="text-sm text-zinc-900 dark:text-white">{selectedDonation.hospital}</p>
              </div>

              {selectedDonation.notes && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedDonation.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Recorded: {new Date(selectedDonation.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}