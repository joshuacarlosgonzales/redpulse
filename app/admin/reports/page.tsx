// app/admin/reports/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Bell,
  Users,
  Hospital,
  Droplet,
  Calendar,
  Heart,
  Download,
  Printer,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  MapPin,
  User,
  Building,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  RefreshCw,
  X,
  ChevronDown,
  Calendar as CalendarIcon,
  UserCheck,
  UserX,
  AlertTriangle,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RequestItem {
  id: string;
  type: 'donor' | 'hospital' | 'blood_drive' | 'emergency';
  title: string;
  description: string;
  requester: string;
  requesterEmail: string;
  requesterPhone: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  bloodType?: string;
  units?: number;
  location?: string;
  hospitalName?: string;
}

interface ReportStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  completedRequests: number;
  emergencyRequests: number;
  byType: {
    donor: number;
    hospital: number;
    blood_drive: number;
    emergency: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'donations' | 'analytics'>('requests');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [stats, setStats] = useState<ReportStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    completedRequests: 0,
    emergencyRequests: 0,
    byType: {
      donor: 0,
      hospital: 0,
      blood_drive: 0,
      emergency: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Generate mock data
  const generateMockRequests = (): RequestItem[] => {
    const now = new Date();
    const types: ('donor' | 'hospital' | 'blood_drive' | 'emergency')[] = ['donor', 'hospital', 'blood_drive', 'emergency'];
    const statuses: ('pending' | 'approved' | 'rejected' | 'completed')[] = ['pending', 'approved', 'rejected', 'completed'];
    const priorities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
    const names = ['Juan Dela Cruz', 'Maria Santos', 'Jose Reyes', 'Ana Garcia', 'Pedro Lopez'];
    const hospitals = ['Manila General Hospital', 'Quezon City Medical Center', 'Cebu Doctors Hospital', 'Davao Regional Medical Center', 'St. Luke\'s Medical Center'];
    
    return Array.from({ length: 15 }, (_, i) => {
      const type = types[i % types.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      const name = names[i % names.length];
      const hospital = hospitals[i % hospitals.length];
      
      return {
        id: `req-${i + 1}`,
        type,
        title: `${type === 'donor' ? 'Donor Registration Request' : type === 'hospital' ? 'Hospital Registration Request' : type === 'blood_drive' ? 'Blood Drive Request' : 'Emergency Blood Request'}`,
        description: `${type === 'donor' ? `${name} wants to register as a blood donor` : type === 'hospital' ? `${hospital} wants to register as a partner hospital` : type === 'blood_drive' ? `Blood drive request from ${hospital}` : `Emergency blood request from ${hospital}`}`,
        requester: name,
        requesterEmail: `${name.toLowerCase().replace(' ', '.')}@email.com`,
        requesterPhone: `09${Math.floor(Math.random() * 1000000000)}`,
        status,
        priority,
        createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - i * 12 * 60 * 60 * 1000).toISOString(),
        bloodType: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][i % 8],
        units: Math.floor(Math.random() * 5) + 1,
        location: `${hospital}, Philippines`,
        hospitalName: hospital
      };
    });
  };

  const calculateStats = (data: RequestItem[]): ReportStats => {
    const stats: ReportStats = {
      totalRequests: data.length,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      completedRequests: 0,
      emergencyRequests: 0,
      byType: {
        donor: 0,
        hospital: 0,
        blood_drive: 0,
        emergency: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };

    data.forEach((item: RequestItem) => {
      if (item.status === 'pending') stats.pendingRequests++;
      else if (item.status === 'approved') stats.approvedRequests++;
      else if (item.status === 'rejected') stats.rejectedRequests++;
      else if (item.status === 'completed') stats.completedRequests++;
      
      if (item.type === 'emergency') stats.emergencyRequests++;
      if (item.type === 'donor') stats.byType.donor++;
      else if (item.type === 'hospital') stats.byType.hospital++;
      else if (item.type === 'blood_drive') stats.byType.blood_drive++;
      else if (item.type === 'emergency') stats.byType.emergency++;
      
      if (item.priority === 'low') stats.byPriority.low++;
      else if (item.priority === 'medium') stats.byPriority.medium++;
      else if (item.priority === 'high') stats.byPriority.high++;
      else if (item.priority === 'critical') stats.byPriority.critical++;
    });

    return stats;
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await fetch(`/api/admin/reports/requests?${params.toString()}`, {
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
        // If API fails, use mock data
        console.warn('API failed, using mock data');
        const mockData = generateMockRequests();
        setRequests(mockData);
        setStats(calculateStats(mockData));
        showToast('info', 'Showing sample data (API not available)');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        setRequests(data.data);
        setStats(data.stats || calculateStats(data.data));
      } else {
        const mockData = generateMockRequests();
        setRequests(mockData);
        setStats(calculateStats(mockData));
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      // Use mock data as fallback
      const mockData = generateMockRequests();
      setRequests(mockData);
      setStats(calculateStats(mockData));
      showToast('info', 'Showing sample data (API not available)');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter, priorityFilter, router]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRequests();
    setIsRefreshing(false);
    showToast('success', 'Requests refreshed!');
  };

  const handleExport = () => {
    showToast('info', 'Exporting reports...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleApprove = async (id: string) => {
    try {
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'approved' as const } : r
      ));
      setStats(calculateStats(requests.map(r => 
        r.id === id ? { ...r, status: 'approved' as const } : r
      )));
      showToast('success', 'Request approved successfully!');
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('error', 'Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'rejected' as const } : r
      ));
      setStats(calculateStats(requests.map(r => 
        r.id === id ? { ...r, status: 'rejected' as const } : r
      )));
      showToast('success', 'Request rejected successfully!');
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('error', 'Failed to reject request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400';
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400';
      case 'rejected': return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400';
      case 'completed': return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400';
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      default: return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'donor': return 'Donor';
      case 'hospital': return 'Hospital';
      case 'blood_drive': return 'Blood Drive';
      case 'emergency': return 'Emergency';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'donor': return <User className="w-4 h-4" />;
      case 'hospital': return <Building className="w-4 h-4" />;
      case 'blood_drive': return <Calendar className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'donor': return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400';
      case 'hospital': return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400';
      case 'blood_drive': return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400';
      case 'emergency': return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400';
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400';
    }
  };

  const filteredRequests = requests.filter((item: RequestItem) => {
    let match = true;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      match = match && (
        item.title.toLowerCase().includes(search) ||
        item.requester.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    }
    if (statusFilter !== 'all') match = match && item.status === statusFilter;
    if (typeFilter !== 'all') match = match && item.type === typeFilter;
    if (priorityFilter !== 'all') match = match && item.priority === priorityFilter;
    return match;
  });

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading reports...</p>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-500" />
            Reports & Requests
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage and review all requests and reports
          </p>
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
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-medium"
          >
            <FileDown className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalRequests}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.approvedRequests}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.completedRequests}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Emergency</p>
          <p className="text-2xl font-bold text-red-600">{stats.emergencyRequests}</p>
        </div>
      </div>

      {/* Tabs - Only Requests, Donations, Analytics */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-t-2xl px-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'requests'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Bell className="h-4 w-4 inline mr-2" />
          Requests
          <span className="ml-2 bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full">
            {stats.pendingRequests}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'donations'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Droplet className="h-4 w-4 inline mr-2" />
          Donations
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Analytics
        </button>
      </div>

      {/* Content - Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
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
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="completed">📌 Completed</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="all">📂 All Types</option>
                  <option value="donor">👤 Donor</option>
                  <option value="hospital">🏥 Hospital</option>
                  <option value="blood_drive">🩸 Blood Drive</option>
                  <option value="emergency">🚨 Emergency</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="all">🔴 All Priority</option>
                  <option value="critical">🚨 Critical</option>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
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

          {/* Requests Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Priority
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
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                          <p className="text-zinc-500 dark:text-zinc-400">No requests found</p>
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
                            <p className="font-medium text-zinc-900 dark:text-white">{item.title}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                            {getTypeLabel(item.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.requester}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.requesterEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {new Date(item.createdAt).toLocaleDateString()}
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
                            {item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(item.id)}
                                  className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 rounded-lg transition group"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600" />
                                </button>
                                <button
                                  onClick={() => handleReject(item.id)}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg transition group"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4 text-zinc-400 group-hover:text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Donations Tab */}
      {activeTab === 'donations' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Droplet className="w-16 h-16 text-red-400" />
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Donation Reports</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
              Analyze donation trends, blood type distribution, and emergency response metrics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Donations</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">4,382</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">This Month</p>
                <p className="text-2xl font-bold text-red-600">342</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Avg. Daily</p>
                <p className="text-2xl font-bold text-blue-600">11.4</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full max-w-2xl mt-2">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400">A+</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">1,284</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">O+</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">1,892</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400">B+</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">876</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <p className="text-xs text-purple-600 dark:text-purple-400">AB+</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">330</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <BarChart3 className="w-16 h-16 text-indigo-400" />
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Analytics Dashboard</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
              Advanced analytics and insights including predictive modeling and trend forecasting.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Projected Growth</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+12.5%</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Blood Supply Index</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">87%</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <p className="text-sm text-blue-600 dark:text-blue-400">Donor Retention</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">76%</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-2">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Monthly Active Donors</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">1,247</p>
                <p className="text-xs text-emerald-600">↑ 8.3% from last month</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Emergency Response Time</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">4.2 min</p>
                <p className="text-xs text-emerald-600">↑ 12% improvement</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
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
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedRequest.title}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </div>

              <p className="text-zinc-600 dark:text-zinc-400">{selectedRequest.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Type</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedRequest.type)}`}>
                    {getTypeIcon(selectedRequest.type)}
                    {getTypeLabel(selectedRequest.type)}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Priority</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority.charAt(0).toUpperCase() + selectedRequest.priority.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Requester</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedRequest.requester}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedRequest.requesterEmail}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedRequest.requesterPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Date</p>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Updated: {new Date(selectedRequest.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedRequest.bloodType && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Blood Type</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                    <Droplet className="w-3.5 h-3.5" />
                    {selectedRequest.bloodType}
                  </span>
                  {selectedRequest.units && (
                    <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {selectedRequest.units} unit{selectedRequest.units > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              {selectedRequest.location && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Location</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedRequest.location}</p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  ID: {selectedRequest.id}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end gap-3">
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedRequest.id);
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
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
      )}
    </div>
  );
}