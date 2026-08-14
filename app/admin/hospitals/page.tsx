// app/admin/hospitals/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Check,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  Loader2,
  Home,
  Users,
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
  Hospital,
  Droplet,
  Award,
  Globe,
  Shield,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  User // ✅ Added missing User import
} from "lucide-react";
import { useRouter } from "next/navigation";

interface HospitalData {
  id: string;
  hospitalName: string;
  hospitalLicense: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalType: string;
  hospitalCapacity: number;
  hospitalEmail: string;
  hospitalWebsite: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  rejectionReason?: string;
  approvedAt?: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  createdAt: string;
  updatedAt: string;
}

const hospitalTypes = ["All", "General Hospital", "Specialty Hospital", "Teaching Hospital", "Community Hospital", "Private Hospital", "Public Hospital", "Military Hospital", "Other"];
const statuses = ["All", "pending", "active", "inactive", "rejected"];

export default function AdminHospitalsPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchHospitals = useCallback(async () => {
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
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      console.log('🔍 Fetching hospitals with params:', params.toString());

      const response = await fetch(`/api/admin/hospitals?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch hospitals (${response.status})`);
      }

      const data = await response.json();
      console.log('📦 Fetched hospitals:', data);
      setHospitals(data.hospitals || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (err) {
      console.error('❌ Error fetching hospitals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hospitals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter, pagination.page, router]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleApprove = async (hospitalId: string) => {
    try {
      setProcessingId(hospitalId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      console.log('✅ Approving hospital:', hospitalId);

      const response = await fetch(`/api/admin/hospitals/${hospitalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve hospital');
      }

      setHospitals(prev => prev.map(h => 
        h.id === hospitalId 
          ? { ...h, status: 'active', approvedAt: new Date().toISOString() }
          : h
      ));

      alert('✅ Hospital approved successfully!');
      fetchHospitals();

    } catch (error: any) {
      console.error('❌ Error approving hospital:', error);
      alert(error.message || 'Failed to approve hospital. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (hospitalId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(hospitalId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      console.log('❌ Rejecting hospital:', hospitalId);

      const response = await fetch(`/api/admin/hospitals/${hospitalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject hospital');
      }

      setHospitals(prev => prev.map(h => 
        h.id === hospitalId 
          ? { ...h, status: 'rejected', rejectionReason: rejectionReason }
          : h
      ));

      setShowRejectModal(null);
      setRejectionReason('');
      alert('❌ Hospital rejected');
      fetchHospitals();

    } catch (error: any) {
      console.error('❌ Error rejecting hospital:', error);
      alert(error.message || 'Failed to reject hospital. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
      inactive: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400",
      pending: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
      rejected: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
    };
    return statusMap[status] || "";
  };

  const getStatusIcon = (status: string) => {
    if (status === "active") return <Check className="w-3 h-3" />;
    if (status === "pending") return <Clock className="w-3 h-3" />;
    if (status === "rejected") return <X className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
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

  const getTypeColor = (type: string) => {
    const typeMap: Record<string, string> = {
      'General Hospital': 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
      'Specialty Hospital': 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
      'Teaching Hospital': 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400',
      'Community Hospital': 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
      'Private Hospital': 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400',
      'Public Hospital': 'bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400',
      'Military Hospital': 'bg-slate-100 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400',
      'Other': 'bg-zinc-100 dark:bg-zinc-950/30 text-zinc-700 dark:text-zinc-400',
    };
    return typeMap[type] || 'bg-zinc-100 dark:bg-zinc-950/30 text-zinc-700 dark:text-zinc-400';
  };

  if (loading && hospitals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading hospitals...</p>
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
            onClick={fetchHospitals}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Hospital className="w-8 h-8 text-red-500" />
            Hospital Management
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            Manage hospital registrations and oversee hospital partners
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {hospitals.filter(h => h.status === 'pending').length} Pending
            </span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {hospitals.filter(h => h.status === 'active').length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Hospitals</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{pagination.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {hospitals.filter(h => h.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Hospitals</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {hospitals.filter(h => h.status === 'active').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Rejected</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {hospitals.filter(h => h.status === 'rejected').length}
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
              placeholder="Search by hospital name, license, address..."
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
              {statuses.map(status => (
                <option key={status} value={status.toLowerCase()}>
                  {status === 'All' ? '📋 All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              {hospitalTypes.map(type => (
                <option key={type} value={type.toLowerCase()}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hospitals Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Hospital
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Type
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
              {hospitals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Hospital className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-500 dark:text-zinc-400">No hospitals found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                hospitals.map((hospital) => (
                  <tr
                    key={hospital.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(hospital.hospitalName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {hospital.hospitalName}
                          </p>
                          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                            License: {hospital.hospitalLicense}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          {hospital.adminEmail}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          {hospital.adminPhone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(hospital.hospitalType)}`}>
                        {hospital.hospitalType || 'Not specified'}
                      </span>
                      {hospital.hospitalCapacity > 0 && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {hospital.hospitalCapacity} beds
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(hospital.status)}`}>
                        {getStatusIcon(hospital.status)}
                        {getStatusLabel(hospital.status)}
                      </span>
                      {hospital.status === 'rejected' && hospital.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={hospital.rejectionReason}>
                          {hospital.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(hospital.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hospital.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(hospital.id)}
                              disabled={processingId === hospital.id}
                              className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 rounded-lg transition group"
                              title="Approve Hospital"
                            >
                              {processingId === hospital.id ? (
                                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
                              )}
                            </button>
                            <button
                              onClick={() => setShowRejectModal(hospital.id)}
                              disabled={processingId === hospital.id}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg transition group"
                              title="Reject Hospital"
                            >
                              <UserX className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedHospital(hospital);
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
              Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{hospitals.length}</span> of{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{pagination.total}</span> hospitals
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

      {/* View Details Modal */}
      {showDetailsModal && selectedHospital && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Hospital Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Hospital Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 -m-6 p-6 text-white mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                    {getInitials(selectedHospital.hospitalName)}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">{selectedHospital.hospitalName}</h1>
                    <p className="text-blue-100">License: {selectedHospital.hospitalLicense}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedHospital.status)}`}>
                        {getStatusIcon(selectedHospital.status)}
                        {getStatusLabel(selectedHospital.status)}
                      </span>
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        {selectedHospital.hospitalType || 'Not specified'}
                      </span>
                      {selectedHospital.hospitalCapacity > 0 && (
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                          🏥 {selectedHospital.hospitalCapacity} beds
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hospital Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Hospital Name</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.hospitalName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">License Number</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.hospitalLicense}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Type</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.hospitalType || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Capacity</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.hospitalCapacity > 0 ? `${selectedHospital.hospitalCapacity} beds` : 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Address</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.hospitalAddress}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Phone</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.hospitalPhone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.hospitalEmail || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Website</p>
                  {selectedHospital.hospitalWebsite ? (
                    <a href={selectedHospital.hospitalWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      {selectedHospital.hospitalWebsite}
                    </a>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Not specified</p>
                  )}
                </div>
              </div>

              {/* Admin Information */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <User className="w-4 h-4" /> Administrator Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Admin Name</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.adminName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Admin Email</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.adminEmail}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Admin Phone</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedHospital.adminPhone}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Registered</p>
                    <p className="text-sm text-zinc-900 dark:text-white">
                      {new Date(selectedHospital.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedHospital.approvedAt && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Approved At</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        {new Date(selectedHospital.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedHospital.rejectionReason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{selectedHospital.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {selectedHospital.status === 'pending' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    onClick={() => {
                      handleApprove(selectedHospital.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={processingId === selectedHospital.id}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 flex items-center gap-2"
                  >
                    {processingId === selectedHospital.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    Approve Hospital
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRejectModal(selectedHospital.id);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-lg shadow-red-200 dark:shadow-red-900/30 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    Reject Hospital
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
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Reject Hospital</h3>
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
                Please provide a reason for rejecting this hospital application.
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
                Reject Hospital
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}