'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { 
  Building, 
  Calendar, 
  Users, 
  Heart, 
  Bell, 
  Activity, 
  Loader2, 
  AlertTriangle,
  Droplet,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

// Import chart components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartRadarGridCircle } from '@/components/ui/chart-radar-grid';
import { ChartRadialLabel } from '@/components/ui/chart-radial-label';

// ============================================================
// TYPES (matching API response)
// ============================================================

interface DashboardData {
  stats: {
    totalDonors: number;
    totalDonations: number;
    pendingRequests: number;
    completedRequests: number;
    totalBloodRequests: number;
    monthlyRequests: number[];
    totalBloodBags: number;
    expiredBloodBags: number;
    availableBloodBags: number;
  };
  pendingRequests: Array<{
    id: string;
    bloodType: string;
    quantity: number;
    urgency: 'critical' | 'urgent' | 'normal';
    requiredDate: string;
    patientName?: string;
    patientAge?: number;
    notes?: string;
    createdAt: string;
    status: 'pending';
    department?: string;
  }>;
  activities: Array<{
    id: string;
    type: 'donor_registered' | 'donation_made' | 'request_created' | 'request_completed' | 'emergency_request' | 'blood_drive_scheduled' | 'blood_bag_used' | 'donor_approved';
    message: string;
    timestamp: string;
    status?: 'pending' | 'completed' | 'failed';
  }>;
  analytics: {
    inventory: {
      byBloodType: Array<{
        bloodType: string;
        units: number;
        status: 'sufficient' | 'low' | 'critical' | 'out of stock';
        availableBags: number;
        expiredBags: number;
      }>;
      totalUnits: number;
      totalAvailableBags: number;
      totalExpiredBags: number;
      statusCounts: {
        sufficient: number;
        low: number;
        critical: number;
        outOfStock: number;
      };
    };
    donations: {
      total: number;
      thisMonth: number;
      percentageChange: number;
      byMonth: Array<{ month: string; count: number }>;
      byBloodType: Array<{ bloodType: string; count: number }>;
    };
    requests: {
      total: number;
      pending: number;
      fulfilled: number;
      cancelled: number;
      rejected: number;
      byMonth: Array<{ month: string; requests: number; fulfilled: number }>;
      byUrgency: Array<{ urgency: string; count: number }>;
    };
    bloodDrives: {
      total: number;
      upcoming: number;
      completed: number;
      registered: number;
      attended: number;
    };
    donorStats: {
      active: number;
      inactive: number;
      pending: number;
      rejected: number;
      totalDonations: number;
      averageDonations: number;
    };
    trends: {
      weekly: Array<{ day: string; donations: number; requests: number }>;
      monthly: Array<{ month: string; donations: number; requests: number }>;
    };
  };
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color,
  subtitle
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  trend?: number; 
  color: 'red' | 'pink' | 'blue' | 'yellow' | 'green' | 'purple' | 'emerald' | 'orange';
  subtitle?: string;
}) => {
  const colorClasses = {
    red: 'bg-red-100 dark:bg-red-950/30 text-red-600',
    pink: 'bg-pink-100 dark:bg-pink-950/30 text-pink-600',
    blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600',
    green: 'bg-green-100 dark:bg-green-950/30 text-green-600',
    purple: 'bg-purple-100 dark:bg-purple-950/30 text-purple-600',
    emerald: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600',
    orange: 'bg-orange-100 dark:bg-orange-950/30 text-orange-600',
  };

  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isZero = trend !== undefined && trend === 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${
              isPositive ? 'text-emerald-600' : 
              isNegative ? 'text-red-600' : 
              'text-zinc-500'
            }`}>
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {isZero && <span className="text-zinc-400">—</span>}
              <span>
                {isZero ? '0%' : Math.abs(trend).toFixed(1) + '%'}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DonationMetricCard = ({ 
  title, 
  value, 
  icon, 
  color,
  previousMonth,
  currentMonth,
  trend
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: 'red' | 'pink' | 'blue' | 'yellow' | 'green' | 'purple' | 'emerald' | 'orange';
  previousMonth: number;
  currentMonth: number;
  trend?: number;
}) => {
  const colorClasses = {
    red: 'bg-red-100 dark:bg-red-950/30 text-red-600',
    pink: 'bg-pink-100 dark:bg-pink-950/30 text-pink-600',
    blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600',
    green: 'bg-green-100 dark:bg-green-950/30 text-green-600',
    purple: 'bg-purple-100 dark:bg-purple-950/30 text-purple-600',
    emerald: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600',
    orange: 'bg-orange-100 dark:bg-orange-950/30 text-orange-600',
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date();
  const currentMonthName = monthNames[currentDate.getMonth()];
  const prevMonthName = monthNames[(currentDate.getMonth() - 1 + 12) % 12];

  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNew = trend !== undefined && trend === 100;
  const isZero = trend !== undefined && trend === 0;

  let trendDisplay = '';
  let trendIcon = null;
  let trendColor = '';

  if (isNew) {
    trendDisplay = 'New';
    trendIcon = <span className="mr-0.5">✦</span>;
    trendColor = 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400';
  } else if (isPositive) {
    trendDisplay = Math.abs(trend).toFixed(0) + '%';
    trendIcon = <TrendingUp className="h-2.5 w-2.5 inline mr-0.5" />;
    trendColor = 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400';
  } else if (isNegative) {
    trendDisplay = Math.abs(trend).toFixed(0) + '%';
    trendIcon = <TrendingDown className="h-2.5 w-2.5 inline mr-0.5" />;
    trendColor = 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400';
  } else if (isZero) {
    trendDisplay = '0%';
    trendIcon = null;
    trendColor = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400';
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          <div className="flex items-center gap-1 mt-1 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Prev:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{prevMonthName}</span>
            <span className="text-zinc-600 dark:text-zinc-400">{previousMonth}</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Current:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{currentMonthName}</span>
            <span className="text-zinc-600 dark:text-zinc-400">{currentMonth}</span>
            
            {trend !== undefined && (
              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${trendColor}`}>
                {trendIcon}
                {trendDisplay}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusItem = ({ label, count, color }: { label: string; count: number; color: 'emerald' | 'yellow' | 'red' | 'zinc' | 'blue' | 'purple' }) => {
  const colorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
    zinc: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400',
    blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className={`text-sm font-medium px-3 py-1 rounded-full ${colorClasses[color]}`}>
        {count}
      </span>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HospitalDashboard() {
  const router = useRouter();
  
  const allowedRoles = useMemo(() => ['hospital'], []);
  const { loading, isAuthorized } = useRoleGuard(allowedRoles);
  
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month');
  const [refreshing, setRefreshing] = useState(false);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // ============================================================
  // FETCH FUNCTION - Memoized to prevent recreation
  // ============================================================
  
  const fetchDashboard = useCallback(async (token: string) => {
    try {
      const response = await fetch(`/api/hospital/dashboard?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.data && result.data.stats && result.data.analytics) {
          setDashboardData(result.data);
          setError(null);
        } else {
          console.error('Invalid API response shape:', result);
          setError('Invalid data received from server');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Dashboard API error:', response.status, errorData);
        setError(errorData.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Network error - failed to connect to server');
    }
  }, [timeRange]);

  // ============================================================
  // DATA FETCHING EFFECT
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          router.replace('/');
          return;
        }

        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role !== 'hospital') {
          router.replace('/');
          return;
        }

        setHospitalData(parsedUser);
        await fetchDashboard(token);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthorized) {
      fetchData();
    } else if (!loading) {
      router.replace('/');
    }
  }, [router, loading, isAuthorized, fetchDashboard]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleCompleteRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/hospital/requests?id=${requestId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'approved',
          releaseData: {
            patientName: 'Patient',
            doctorName: 'Doctor',
            department: 'General',
            hospitalWard: 'General'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (token) await fetchDashboard(token);
        alert('Request approved and blood released successfully!');
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
      
      const response = await fetch(`/api/hospital/requests?id=${requestId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: 'Cancelled by hospital'
        })
      });

      if (response.ok) {
        if (token) await fetchDashboard(token);
        alert('Request rejected successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    window.location.href = '/';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const token = localStorage.getItem('token');
    if (token) {
      await fetchDashboard(token);
    }
    setRefreshing(false);
  };

  // ============================================================
  // HELPERS
  // ============================================================

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
    const icons: Record<string, React.ReactNode> = {
      donor_registered: <UserCheck className="h-4 w-4 text-blue-500" />,
      donation_made: <Heart className="h-4 w-4 text-red-500" />,
      request_created: <FileText className="h-4 w-4 text-yellow-500" />,
      request_completed: <CheckCircle className="h-4 w-4 text-emerald-500" />,
      emergency_request: <AlertTriangle className="h-4 w-4 text-red-500" />,
      blood_drive_scheduled: <Calendar className="h-4 w-4 text-green-500" />,
      blood_bag_used: <Droplet className="h-4 w-4 text-purple-500" />,
      donor_approved: <UserCheck className="h-4 w-4 text-emerald-500" />,
    };
    return icons[type] || <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
      completed: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
      failed: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
      cancelled: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400',
    };
    return styles[status] || styles.pending;
  };

  // ============================================================
  // RENDER
  // ============================================================

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

  if (!isAuthorized) return null;

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
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!hospitalData || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No data available</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Please try refreshing.</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const { stats, pendingRequests, activities, analytics } = dashboardData;
  
  // Transform chart data to a consistent format
  const rawChartData = timeRange === 'week' ? analytics.trends.weekly : analytics.trends.monthly;
  const chartData = rawChartData.map((item: any) => ({
    label: timeRange === 'week' ? item.day : item.month,
    donations: item.donations,
    requests: item.requests,
  }));

  // Safely calculate max with fallback to 1 to avoid division by zero
  const maxMonthlyRequests = stats.monthlyRequests.length > 0 
    ? Math.max(...stats.monthlyRequests) 
    : 1;

  // Get previous month donations from byMonth array
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const prevMonthIndex = (currentMonthIndex - 1 + 12) % 12;
  
  const currentMonthData = analytics.donations.byMonth.find((m: any) => m.month === monthNames[currentMonthIndex]);
  const previousMonthData = analytics.donations.byMonth.find((m: any) => m.month === monthNames[prevMonthIndex]);
  
  const currentMonthDonations = currentMonthData?.count || 0;
  const previousMonthDonations = previousMonthData?.count || 0;

  // ✅ NEW: Explicit August vs September Calculation
  const currentMonthRequestsData = analytics.requests.byMonth.find(
    (m: any) => m.month === monthNames[currentMonthIndex]
  );
  const previousMonthRequestsData = analytics.requests.byMonth.find(
    (m: any) => m.month === monthNames[prevMonthIndex]
  );
  
  const currentMonthRequests = currentMonthRequestsData?.requests || 0;
  const previousMonthRequests = previousMonthRequestsData?.requests || 0;

  // Calculate Trends
  const donationTrend = previousMonthDonations > 0 
    ? ((currentMonthDonations - previousMonthDonations) / previousMonthDonations) * 100 
    : (currentMonthDonations > 0 ? 100 : 0);

  const requestTrend = previousMonthRequests > 0 
    ? ((currentMonthRequests - previousMonthRequests) / previousMonthRequests) * 100 
    : (currentMonthRequests > 0 ? 100 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Building className="h-6 w-6 text-red-500" />
            {hospitalData.hospitalName || hospitalData.fullName || 'Hospital Dashboard'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Welcome back! Here's your hospital overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            {['week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  timeRange === range
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Donors */}
        <MetricCard
          title="Total Donors"
          value={stats.totalDonors}
          icon={<Users className="h-5 w-5" />}
          color="blue"
          subtitle={`${analytics.donorStats.active} active`}
        />
        
        {/* Total Donations - With Previous/Current Month */}
        <DonationMetricCard
          title="Total Donations"
          value={stats.totalDonations}
          icon={<Heart className="h-5 w-5" />}
          color="red"
          previousMonth={previousMonthDonations}
          currentMonth={currentMonthDonations}
          trend={analytics.donations.percentageChange}
        />
        
        {/* Pending Requests */}
        <MetricCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
        />
        
        {/* Blood Bags Available */}
        <MetricCard
          title="Blood Bags Available"
          value={stats.availableBloodBags}
          icon={<Droplet className="h-5 w-5" />}
          color="emerald"
          subtitle={`${stats.expiredBloodBags} expired`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Completed Requests</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {stats.completedRequests}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Blood Drives</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {analytics.bloodDrives.total}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {analytics.bloodDrives.upcoming} upcoming
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Critical Inventory</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {analytics.inventory.statusCounts.critical}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                blood types critical
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-950/30 rounded-lg">
              <UserCheck className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Avg Donations/Donor</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {analytics.donorStats.averageDonations.toFixed(1)}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                per donor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartRadarGridCircle data={analytics.inventory.byBloodType} />
        <ChartRadialLabel
          totalDrives={analytics.bloodDrives.total}
          registered={analytics.bloodDrives.registered}
          attended={analytics.bloodDrives.attended}
          ongoing={analytics.bloodDrives.upcoming}
        />
      </div>

      {/* Donations vs Requests Trends */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Donations vs Requests Trends
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {timeRange === 'week' ? 'Weekly' : 'Monthly'} comparison
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis 
                dataKey="label"
                className="text-xs text-zinc-500"
              />
              <YAxis className="text-xs text-zinc-500" />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)', 
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                }} 
              />
              <Area
                type="monotone"
                dataKey="donations"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Donations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Requests</span>
          </div>
        </div>
      </div>

      {/* Blood Type Distribution & Inventory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
            Blood Type Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.inventory.byBloodType}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis dataKey="bloodType" className="text-xs text-zinc-500" />
                <YAxis className="text-xs text-zinc-500" />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                  }} 
                />
                <Bar dataKey="units" fill="#ef4444" radius={[4, 4, 0, 0]}>
                  {analytics.inventory.byBloodType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
            Inventory Status
          </h3>
          <div className="space-y-3">
            <StatusItem 
              label="Sufficient" 
              count={analytics.inventory.statusCounts.sufficient}
              color="emerald"
            />
            <StatusItem 
              label="Low" 
              count={analytics.inventory.statusCounts.low}
              color="yellow"
            />
            <StatusItem 
              label="Critical" 
              count={analytics.inventory.statusCounts.critical}
              color="red"
            />
            <StatusItem 
              label="Out of Stock" 
              count={analytics.inventory.statusCounts.outOfStock}
              color="zinc"
            />
          </div>
        </div>
      </div>

      {/* Pending Requests */}
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
                        {request.bloodType} - {request.quantity} unit{request.quantity > 1 ? 's' : ''}
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
                      {request.department && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Dept: {request.department}
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
                    title="Approve Request"
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
                    title="Reject Request"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-400" />
          Recent Activity
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
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

      {/* ✅ UPDATED: August vs September Comparison Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Monthly Performance Comparison
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {monthNames[prevMonthIndex]} vs {monthNames[currentMonthIndex]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Previous Month (August) */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">
              {monthNames[prevMonthIndex]} (Previous)
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Donations</span>
                </div>
                <span className="text-lg font-bold text-zinc-900 dark:text-white">
                  {previousMonthDonations}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Requests</span>
                </div>
                <span className="text-lg font-bold text-zinc-900 dark:text-white">
                  {previousMonthRequests}
                </span>
              </div>
            </div>
          </div>

          {/* Current Month (September) */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
               {requestTrend > 0 ? (
                 <TrendingUp className="h-5 w-5 text-emerald-500" />
               ) : requestTrend < 0 ? (
                 <TrendingDown className="h-5 w-5 text-red-500" />
               ) : null}
            </div>
            <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-4 uppercase tracking-wider">
              {monthNames[currentMonthIndex]} (Current)
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Donations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {currentMonthDonations}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    donationTrend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {donationTrend > 0 ? '+' : ''}{donationTrend.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {currentMonthRequests}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    requestTrend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {requestTrend > 0 ? '+' : ''}{requestTrend.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}