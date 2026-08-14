// app/hospital/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { 
  Building, 
  Calendar, 
  Users, 
  Heart, 
  Settings, 
  Bell, 
  Activity, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  AlertTriangle,
  Droplet,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  PlusCircle,
  Menu,
  X,
  Home,
  BarChart3,
  Shield,
  Trash2,
  Edit,
  Search,
  Filter,
  ChevronDown,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

interface HospitalData {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  hospitalName: string;
  hospitalLicense: string;
  hospitalAddress: string;
  hospitalPhone: string;
  isActive: boolean;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  hospitalType?: string;
  hospitalCapacity?: number;
  hospitalEmail?: string;
  hospitalWebsite?: string;
}

interface HospitalStats {
  totalDonors: number;
  totalDonations: number;
  pendingRequests: number;
  completedRequests: number;
  totalBloodRequests: number;
  monthlyRequests: number[];
  recentActivities: Activity[];
}

interface Activity {
  id: string;
  type: 'donor_registered' | 'donation_made' | 'request_created' | 'request_completed' | 'emergency_request' | 'blood_drive_scheduled';
  message: string;
  timestamp: string;
  status?: 'pending' | 'completed' | 'failed';
}

interface PendingRequest {
  id: string;
  bloodType: string;
  quantity: string;
  urgency: 'critical' | 'urgent' | 'normal';
  requiredDate: string;
  patientName?: string;
  patientAge?: number;
  notes?: string;
  createdAt: string;
  status: 'pending';
}

export default function HospitalDashboard() {
  const router = useRouter();
  const { loading, isAuthorized } = useRoleGuard(['hospital']);
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<HospitalStats>({
    totalDonors: 0,
    totalDonations: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalBloodRequests: 0,
    monthlyRequests: [],
    recentActivities: []
  });
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitalData = async () => {
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

        if (parsedUser.role !== 'hospital') {
          router.replace('/');
          return;
        }

        setHospitalData(parsedUser);

        // Fetch real data from API
        await fetchHospitalStats(token);
        await fetchPendingRequests(token);

      } catch (error) {
        console.error('Error fetching hospital data:', error);
        setError('Failed to load hospital data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthorized) {
      fetchHospitalData();
    } else if (!loading) {
      // FIX: Redirect to landing page instead of login
      router.replace('/');
    }
  }, [router, loading, isAuthorized]);

  const fetchHospitalStats = async (token: string) => {
    try {
      const response = await fetch('/api/hospital/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        // Fallback to mock data
        setStats({
          totalDonors: 25,
          totalDonations: 150,
          pendingRequests: 5,
          completedRequests: 45,
          totalBloodRequests: 50,
          monthlyRequests: [12, 15, 8, 20, 18, 22, 30, 25, 35, 40, 45, 50],
          recentActivities: [
            {
              id: '1',
              type: 'donor_registered',
              message: 'New donor registered: Juan Dela Cruz',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              status: 'completed'
            },
            {
              id: '2',
              type: 'donation_made',
              message: 'Blood donation recorded: 500ml O+',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              status: 'completed'
            },
            {
              id: '3',
              type: 'request_created',
              message: 'New blood request: A+ for Maria Santos',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPendingRequests = async (token: string) => {
    try {
      const response = await fetch('/api/hospital/requests/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/hospital/requests/${requestId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        setStats(prev => ({
          ...prev,
          pendingRequests: prev.pendingRequests - 1,
          completedRequests: prev.completedRequests + 1
        }));
        alert('Request completed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete request');
      }
    } catch (error) {
      console.error('Error completing request:', error);
      alert('Failed to complete request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/hospital/requests/${requestId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        setStats(prev => ({
          ...prev,
          pendingRequests: prev.pendingRequests - 1
        }));
        alert('Request cancelled successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Failed to cancel request. Please try again.');
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
    
    // Hard redirect to landing page
    window.location.href = '/';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'normal':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400';
    }
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      donor_registered: <UserCheck className="h-4 w-4 text-blue-500" />,
      donation_made: <Heart className="h-4 w-4 text-red-500" />,
      request_created: <FileText className="h-4 w-4 text-yellow-500" />,
      request_completed: <CheckCircle className="h-4 w-4 text-emerald-500" />,
      emergency_request: <AlertTriangle className="h-4 w-4 text-red-500" />,
      blood_drive_scheduled: <Calendar className="h-4 w-4 text-green-500" />
    };
    return icons[type as keyof typeof icons] || <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
      completed: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
      failed: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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
      <div className="flex items-center justify-center h-64">
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

  if (!hospitalData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No hospital data</h2>
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
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Donors</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.totalDonors}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-lg">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Donations</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.totalDonations}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-950/30 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.pendingRequests}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.completedRequests}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pending Blood Requests
              <span className="ml-2 bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            </h2>
            <Link href="/hospital/requests">
              <button className="text-sm text-red-600 hover:text-red-700 font-medium transition">
                View All
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {pendingRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getUrgencyColor(request.urgency)}`}>
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {request.bloodType} - {request.quantity}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Required: {new Date(request.requiredDate).toLocaleDateString()}
                      </span>
                      {request.patientName && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Patient: {request.patientName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCompleteRequest(request.id)}
                    disabled={processingId === request.id}
                    className="p-2 bg-emerald-100 dark:bg-emerald-950/30 hover:bg-emerald-200 dark:hover:bg-emerald-950/50 rounded-lg transition text-emerald-600 disabled:opacity-50"
                    title="Complete Request"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCancelRequest(request.id)}
                    disabled={processingId === request.id}
                    className="p-2 bg-red-100 dark:bg-red-950/30 hover:bg-red-200 dark:hover:bg-red-950/50 rounded-lg transition text-red-600 disabled:opacity-50"
                    title="Cancel Request"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-zinc-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/hospital/donors">
            <button className="w-full p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all group">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition" />
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Manage Donors</p>
            </button>
          </Link>
          <Link href="/hospital/requests/new">
            <button className="w-full p-4 bg-red-50 dark:bg-red-950/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-all group">
              <PlusCircle className="h-6 w-6 text-red-600 mx-auto mb-2 group-hover:scale-110 transition" />
              <p className="text-sm font-medium text-zinc-900 dark:text-white">New Request</p>
            </button>
          </Link>
          <Link href="/hospital/blood-drives">
            <button className="w-full p-4 bg-green-50 dark:bg-green-950/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/50 transition-all group">
              <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition" />
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Blood Drives</p>
            </button>
          </Link>
          <Link href="/hospital/inventory">
            <button className="w-full p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-all group">
              <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition" />
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Inventory</p>
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-400" />
          Recent Activity
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {stats.recentActivities.length === 0 ? (
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
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly Requests Chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Monthly Blood Requests</h3>
        {stats.monthlyRequests.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-zinc-400">
            No data available
          </div>
        ) : (
          <div className="h-48 flex items-end justify-between gap-2">
            {stats.monthlyRequests.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-red-500 rounded-t-lg transition-all hover:bg-red-600"
                  style={{ height: `${(value / Math.max(...stats.monthlyRequests)) * 100}%` }}
                ></div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {['J','F','M','A','M','J','J','A','S','O','N','D'][index]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}