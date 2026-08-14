// app/admin/dashboard/page.tsx
'use client';

import { useRoleGuard } from '@/hooks/useRoleGuard';
import { 
  LogOut, 
  Users, 
  Building, 
  Heart, 
  Calendar, 
  Settings, 
  Bell, 
  Activity, 
  Loader2, 
  AlertTriangle, 
  UserCheck, 
  UserX, 
  Clock,
  Mail,
  Phone,
  MapPin,
  Droplet,
  PlusCircle,
  Search,
  Filter,
  ChevronDown,
  Menu,
  X,
  Home,
  User,
  Hospital,
  FileText,
  BarChart3,
  Shield,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdminData {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UserStats {
  totalUsers: number;
  totalDonors: number;
  totalHospitals: number;
  pendingApprovals: number;
  pendingHospitals: number;
  pendingDonors: number;
  totalDonations: number;
  activeUsers: number;
  monthlyDonations: number[];
  recentActivities: Activity[];
}

interface Activity {
  id: string;
  type: 'user_registered' | 'donor_approved' | 'hospital_registered' | 'donation_made' | 'emergency_request' | 'account_suspended' | 'hospital_approved' | 'donor_rejected' | 'hospital_rejected';
  message: string;
  timestamp: string;
  user?: string;
  status?: 'pending' | 'completed' | 'failed';
  entityId?: string;
  entityType?: 'donor' | 'hospital';
}

interface PendingApproval {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  type: 'donor' | 'hospital';
  registeredAt: string;
  status: 'pending';
  bloodType?: string;
  hospitalName?: string;
  hospitalLicense?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { loading, isAuthorized } = useRoleGuard(['admin']);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalDonors: 0,
    totalHospitals: 0,
    pendingApprovals: 0,
    pendingHospitals: 0,
    pendingDonors: 0,
    totalDonations: 0,
    activeUsers: 0,
    monthlyDonations: [],
    recentActivities: []
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          // FIX: Redirect to landing page instead of login
          router.replace('/');
          return;
        }

        let parsedUser;
        try {
          parsedUser = JSON.parse(userStr);
        } catch (parseError) {
          localStorage.removeItem('user');
          router.replace('/');
          return;
        }

        if (parsedUser.role !== 'admin') {
          router.replace('/');
          return;
        }

        setAdminData(parsedUser);

        // Fetch real data from API
        await fetchDashboardData(token);
        await fetchPendingApprovals(token);

      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('Failed to load admin data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthorized) {
      fetchAdminData();
    } else if (!loading) {
      // FIX: Redirect to landing page instead of login
      router.replace('/');
    }
  }, [router, loading, isAuthorized]);

  const fetchDashboardData = async (token: string) => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard stats response:', data);
        
        // Handle different response formats
        const statsData = data.data || data || {};
        
        setStats({
          totalUsers: statsData.totalUsers || statsData.totalHospitals || 0,
          totalDonors: statsData.totalDonors || 0,
          totalHospitals: statsData.totalHospitals || 0,
          pendingApprovals: statsData.pendingApprovals || statsData.pendingHospitals || 0,
          pendingHospitals: statsData.pendingHospitals || 0,
          pendingDonors: statsData.pendingDonors || 0,
          totalDonations: statsData.totalDonations || 0,
          activeUsers: statsData.activeUsers || 0,
          monthlyDonations: statsData.monthlyDonations || [],
          recentActivities: statsData.recentActivities || []
        });
      } else {
        console.warn('Failed to fetch stats, using fallback data');
        setStats({
          totalUsers: 0,
          totalDonors: 0,
          totalHospitals: 0,
          pendingApprovals: 0,
          pendingHospitals: 0,
          pendingDonors: 0,
          totalDonations: 0,
          activeUsers: 0,
          monthlyDonations: [],
          recentActivities: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchPendingApprovals = async (token: string) => {
    try {
      // Fetch pending donors
      try {
        const donorsResponse = await fetch('/api/admin/donors?status=pending&limit=20', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (donorsResponse.ok) {
          const donorsData = await donorsResponse.json();
          console.log('👤 Pending donors response:', donorsData);
          
          // Handle different response formats
          const donors = donorsData.donors || donorsData.data || [];
          const pendingDonors = donors.map((d: any) => ({
            id: d.id || d._id,
            fullName: d.fullName || d.name || 'Unknown Donor',
            email: d.email || '',
            phone: d.phone || '',
            type: 'donor' as const,
            registeredAt: d.createdAt || d.registered || new Date().toISOString(),
            status: 'pending' as const,
            bloodType: d.bloodType || 'N/A'
          }));
          setPendingApprovals(pendingDonors);
        }
      } catch (error) {
        console.error('Error fetching pending donors:', error);
      }

      // Fetch pending hospitals
      try {
        const hospitalsResponse = await fetch('/api/admin/hospitals?status=pending&limit=20', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (hospitalsResponse.ok) {
          const hospitalsData = await hospitalsResponse.json();
          console.log('🏥 Pending hospitals response:', hospitalsData);
          
          // Handle different response formats
          const hospitals = hospitalsData.hospitals || hospitalsData.data || [];
          const pendingHospitals = hospitals.map((h: any) => ({
            id: h.id || h._id,
            fullName: h.adminName || h.fullName || h.hospitalName || 'Unknown Hospital',
            email: h.email || h.hospitalEmail || '',
            phone: h.phone || h.hospitalPhone || '',
            type: 'hospital' as const,
            registeredAt: h.createdAt || new Date().toISOString(),
            status: 'pending' as const,
            hospitalName: h.hospitalName || h.name || 'Unknown Hospital',
            hospitalLicense: h.hospitalLicense || ''
          }));
          setPendingApprovals(prev => [...prev, ...pendingHospitals]);
        }
      } catch (error) {
        console.error('Error fetching pending hospitals:', error);
      }

    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const handleApprove = async (id: string, type: 'donor' | 'hospital') => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again');
        return;
      }

      const endpoint = `/api/admin/${type}s/${id}/approve`;
      console.log(`🔵 Approving ${type} with ID: ${id}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (response.ok && data.success) {
        setPendingApprovals(prev => prev.filter(p => p.id !== id));
        
        // Add activity to recent activities
        const typeName = type === 'donor' ? 'Donor' : 'Hospital';
        const item = pendingApprovals.find(p => p.id === id);
        const name = type === 'donor' 
          ? item?.fullName 
          : item?.hospitalName || item?.fullName;
        
        const newActivity: Activity = {
          id: `activity-${Date.now()}`,
          type: type === 'donor' ? 'donor_approved' : 'hospital_approved',
          message: `${typeName} account approved: ${name}`,
          timestamp: new Date().toISOString(),
          user: name,
          status: 'completed',
          entityId: id,
          entityType: type
        };

        setStats(prev => ({
          ...prev,
          recentActivities: [newActivity, ...prev.recentActivities]
        }));

        // Refresh stats
        await fetchDashboardData(token);
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} approved successfully!`);
        
        // Refresh pending approvals
        await fetchPendingApprovals(token);
      } else {
        alert(data.error || `Failed to approve ${type}`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, type: 'donor' | 'hospital') => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again');
        return;
      }

      const endpoint = `/api/admin/${type}s/${id}/reject`;
      console.log(`🔵 Rejecting ${type} with ID: ${id}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Application rejected by admin' })
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (response.ok && data.success) {
        setPendingApprovals(prev => prev.filter(p => p.id !== id));
        
        // Add activity to recent activities
        const typeName = type === 'donor' ? 'Donor' : 'Hospital';
        const item = pendingApprovals.find(p => p.id === id);
        const name = type === 'donor' 
          ? item?.fullName 
          : item?.hospitalName || item?.fullName;
        
        const newActivity: Activity = {
          id: `activity-${Date.now()}`,
          type: type === 'donor' ? 'donor_rejected' : 'hospital_rejected',
          message: `${typeName} account rejected: ${name}`,
          timestamp: new Date().toISOString(),
          user: name,
          status: 'failed',
          entityId: id,
          entityType: type
        };

        setStats(prev => ({
          ...prev,
          recentActivities: [newActivity, ...prev.recentActivities]
        }));

        // Refresh stats
        await fetchDashboardData(token);
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} rejected successfully!`);
        
        // Refresh pending approvals
        await fetchPendingApprovals(token);
      } else {
        alert(data.error || `Failed to reject ${type}`);
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // FIXED: Logout handler - redirects to landing page
  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Clear cookies if any
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    
    // Use window.location for a hard redirect to ensure all state is cleared
    window.location.href = '/';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
      completed: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
      failed: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
    };
    return styles[status] || styles.pending;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      user_registered: <User className="h-4 w-4 text-blue-500" />,
      donor_approved: <CheckCircle className="h-4 w-4 text-emerald-500" />,
      hospital_registered: <Hospital className="h-4 w-4 text-green-500" />,
      donation_made: <Heart className="h-4 w-4 text-red-500" />,
      emergency_request: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      account_suspended: <UserX className="h-4 w-4 text-red-500" />,
      hospital_approved: <Building className="h-4 w-4 text-emerald-500" />,
      donor_rejected: <UserX className="h-4 w-4 text-red-500" />,
      hospital_rejected: <Building className="h-4 w-4 text-red-500" />
    };
    return icons[type] || <Activity className="h-4 w-4 text-gray-500" />;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
          <button 
            onClick={handleLogout}
            className="mt-2 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No admin data</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Please try logging in again.</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Admin Profile Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {adminData?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white">
                  {adminData?.fullName || 'Admin'}
                </h2>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium">
                  ✅ Administrator
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {adminData?.email || 'No email'}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Joined: {adminData?.createdAt ? new Date(adminData.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Users</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-lg">
                <Heart className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Donors</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.totalDonors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-lg">
                <Building className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Hospitals</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.totalHospitals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-950/30 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Donations</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.totalDonations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg">
                <UserCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Active</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {pendingApprovals && pendingApprovals.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-yellow-500" />
                Pending Approvals
                <span className="ml-2 bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                  {pendingApprovals.length}
                </span>
              </h2>
              <Link href="/admin/donors">
                <button className="text-sm text-red-600 hover:text-red-700 font-medium transition">
                  View All
                </button>
              </Link>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingApprovals.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      item.type === 'donor' ? 'bg-red-100 dark:bg-red-950/30' : 'bg-blue-100 dark:bg-blue-950/30'
                    }`}>
                      {item.type === 'donor' ? (
                        <User className="h-5 w-5 text-red-600" />
                      ) : (
                        <Building className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {item.type === 'donor' ? item.fullName : item.hospitalName || item.fullName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {item.email}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {item.phone}
                        </span>
                        {item.type === 'donor' && item.bloodType && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-full">
                            <Droplet className="h-3 w-3 inline mr-1" />
                            {item.bloodType}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full">
                          {item.type === 'donor' ? 'Donor' : 'Hospital'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        Registered: {new Date(item.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(item.id, item.type)}
                      disabled={processingId === item.id}
                      className="p-2 bg-emerald-100 dark:bg-emerald-950/30 hover:bg-emerald-200 dark:hover:bg-emerald-950/50 rounded-lg transition text-emerald-600 disabled:opacity-50"
                      title="Approve"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(item.id, item.type)}
                      disabled={processingId === item.id}
                      className="p-2 bg-red-100 dark:bg-red-950/30 hover:bg-red-200 dark:hover:bg-red-950/50 rounded-lg transition text-red-600 disabled:opacity-50"
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {pendingApprovals.length > 10 && (
                <div className="text-center py-2">
                  <Link href="/admin/donors">
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                      View {pendingApprovals.length - 10} more pending approvals
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-zinc-400" />
              Quick Actions
            </h2>
            <button className="text-sm text-red-600 hover:text-red-700 font-medium transition">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/admin/users">
              <button className="w-full p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all group">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition" />
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Manage Users</p>
              </button>
            </Link>
            <Link href="/admin/donors">
              <button className="w-full p-4 bg-red-50 dark:bg-red-950/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-all group">
                <Heart className="h-6 w-6 text-red-600 mx-auto mb-2 group-hover:scale-110 transition" />
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Manage Donors</p>
              </button>
            </Link>
            <Link href="/admin/hospitals">
              <button className="w-full p-4 bg-green-50 dark:bg-green-950/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/50 transition-all group">
                <Building className="h-6 w-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition" />
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Manage Hospitals</p>
              </button>
            </Link>
            <Link href="/admin/donors?status=pending">
              <button className="w-full p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-all group">
                <UserCheck className="h-6 w-6 text-yellow-600 mx-auto mb-2 group-hover:scale-110 transition" />
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Pending Approvals</p>
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-zinc-400" />
              Recent Activity
            </h3>
            <button className="text-xs text-red-600 hover:text-red-700 font-medium transition">
              View All
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {!stats.recentActivities || stats.recentActivities.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition">
                  <div className="p-2 rounded-full bg-white dark:bg-zinc-700 shadow-sm">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-900 dark:text-white">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      {activity.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(activity.status)}`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {activity.status === 'pending' && (
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded transition">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </button>
                      <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats Chart Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Monthly Donations</h3>
            {!stats.monthlyDonations || stats.monthlyDonations.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-400">
                No donation data available
              </div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-2">
                {stats.monthlyDonations.map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-red-500 rounded-t-lg transition-all hover:bg-red-600"
                      style={{ height: `${(value / Math.max(...stats.monthlyDonations)) * 100}%` }}
                    ></div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {['J','F','M','A','M','J','J','A','S','O','N','D'][index]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Server Status</span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Database</span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Storage Usage</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  45% Used
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Active Sessions</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {stats.activeUsers || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}