// app/admin/reports/requests/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  FileText,
  CheckCircle,
  Building2,
  Droplet,
  AlertCircle,
  Loader2,
  Search,
  Eye,
  X,
  Clock,
  Ban,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Download,
  RefreshCw,
  Printer,
  Hospital,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  CalendarDays,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// ============================================================
// TYPES
// ============================================================

interface RequestItem {
  id: string;
  type: 'donor' | 'hospital' | 'blood_drive' | 'emergency' | 'blood_request';
  title: string;
  description: string;
  requester: string;
  requesterEmail: string;
  requesterPhone: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  bloodType?: string;
  units?: number;
  hospitalName?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportStats {
  total: number;
  pending: number;
  approved: number;
  fulfilled: number;
  rejected: number;
}

type SubTab = 'overview' | 'status' | 'hospitals' | 'blood-types' | 'timeline';
type ViewMode = 'split' | 'single' | 'compact';

// ============================================================
// CONSTANTS
// ============================================================

const ITEMS_PER_PAGE = 6;

const SUB_TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: ClipboardList },
  { key: 'status', label: 'Status Analysis', icon: PieChart },
  { key: 'hospitals', label: 'Hospitals', icon: Hospital },
  { key: 'blood-types', label: 'Blood Types', icon: Droplet },
  { key: 'timeline', label: 'Timeline', icon: CalendarDays },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', icon: Clock, bg: 'bg-yellow-500' },
  approved: { label: 'Approved', color: 'success', icon: CheckCircle, bg: 'bg-green-500' },
  completed: { label: 'Fulfilled', color: 'info', icon: CheckSquare, bg: 'bg-blue-500' },
  fulfilled: { label: 'Fulfilled', color: 'info', icon: CheckSquare, bg: 'bg-blue-500' },
  rejected: { label: 'Rejected', color: 'danger', icon: XCircle, bg: 'bg-red-500' },
} as const;

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'danger', icon: AlertTriangle },
  high: { label: 'High', color: 'warning', icon: AlertCircle },
  medium: { label: 'Medium', color: 'info', icon: Activity },
  low: { label: 'Low', color: 'success', icon: TrendingDown },
} as const;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ============================================================
// HELPERS
// ============================================================

const formatType = (type: string) => 
  type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const formatDate = (value: string) => 
  new Date(value).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getStatusColor = (status: string) => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!config) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  
  const colors = {
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[config.color as keyof typeof colors] || colors.neutral;
};

const getPriorityStyles = (priority: string) => {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
  if (!config) return 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400';
  
  const colors = {
    danger: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-400',
    info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400',
    success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400',
  };
  return colors[config.color as keyof typeof colors] || colors.info;
};

// ============================================================
// PAGINATION COMPONENT
// ============================================================

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  itemsPerPage
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing <span className="font-medium text-zinc-900 dark:text-white">{startItem}</span> to{' '}
        <span className="font-medium text-zinc-900 dark:text-white">{endItem}</span> of{' '}
        <span className="font-medium text-zinc-900 dark:text-white">{totalItems}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </button>
        
        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            if (pageNum < 1 || pageNum > totalPages) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTS
// ============================================================

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  color = 'blue',
  subtitle 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ElementType;
  trend?: { value: number; direction: 'up' | 'down' };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
  subtitle?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900/90 p-6 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70 transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend.direction === 'up' ? (
            <>
              <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                +{trend.value}%
              </span>
            </>
          ) : (
            <>
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              <span className="text-red-600 dark:text-red-400 font-medium">
                -{trend.value}%
              </span>
            </>
          )}
          <span className="text-zinc-400 dark:text-zinc-500">from last month</span>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const Icon = config?.icon || Activity;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(status)}`}>
      <Icon className="h-3 w-3" />
      {config?.label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
  const Icon = config?.icon || Activity;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getPriorityStyles(priority)}`}>
      <Icon className="h-3 w-3" />
      {config?.label || priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const EmptyState = ({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string; 
  description?: string; 
  icon?: React.ElementType;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-4 mb-4">
      {Icon ? <Icon className="h-8 w-8 text-zinc-400 dark:text-zinc-500" /> : <ClipboardList className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />}
    </div>
    <h4 className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h4>
    {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
  </div>
);

// ============================================================
// VIEW MODE TOGGLE (ONLY USED IN OVERVIEW TAB)
// ============================================================

const ViewModeToggle = ({ 
  mode, 
  onChange 
}: { 
  mode: ViewMode; 
  onChange: (mode: ViewMode) => void;
}) => {
  const modes: { key: ViewMode; icon: React.ElementType; label: string }[] = [
    { key: 'split', icon: LayoutGrid, label: 'Split' },
    { key: 'single', icon: Maximize2, label: 'Single' },
    { key: 'compact', icon: Minimize2, label: 'Compact' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
      {modes.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            mode === key
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
          title={label}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

// ============================================================
// IMPROVED STATUS BREAKDOWN COMPONENT
// ============================================================

const StatusBreakdown = ({ stats }: { stats: ReportStats | null }) => {
  const total = (stats?.total || 0) || 1;
  
  const statusItems = [
    { key: 'pending', label: 'Pending', count: stats?.pending || 0, color: 'bg-yellow-500', icon: Clock },
    { key: 'approved', label: 'Approved', count: stats?.approved || 0, color: 'bg-green-500', icon: CheckCircle },
    { key: 'fulfilled', label: 'Fulfilled', count: stats?.fulfilled || 0, color: 'bg-blue-500', icon: CheckSquare },
    { key: 'rejected', label: 'Rejected', count: stats?.rejected || 0, color: 'bg-red-500', icon: XCircle },
  ];

  const maxCount = Math.max(...statusItems.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {statusItems.map(({ key, count, color }) => (
          <div
            key={key}
            className={`h-full ${color} transition-all duration-700 ease-out`}
            style={{ width: `${(count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statusItems.map(({ key, label, count, color, icon: Icon }) => (
          <div
            key={key}
            className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 p-4 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{count}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              {((count / total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      {/* Status Details Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/70 dark:border-zinc-800/70">
        <div className="grid grid-cols-4 gap-0 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span>Status</span>
          <span className="text-center">Count</span>
          <span className="text-center">Percentage</span>
          <span className="text-right">Visual</span>
        </div>
        {statusItems.map(({ key, label, count, color }) => (
          <div
            key={key}
            className="grid grid-cols-4 gap-0 border-t border-zinc-200/70 dark:border-zinc-800/70 px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
          >
            <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <span className={`h-2 w-2 rounded-full ${color}`} />
              {label}
            </span>
            <span className="text-center font-medium text-zinc-900 dark:text-white">{count}</span>
            <span className="text-center text-zinc-500 dark:text-zinc-400">
              {((count / total) * 100).toFixed(1)}%
            </span>
            <div className="flex items-center justify-end">
              <div className="h-1.5 w-full max-w-[100px] overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={`h-full ${color} transition-all duration-700`}
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminReportsRequestsPage() {
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [byHospital, setByHospital] = useState<any[]>([]);
  const [byBloodType, setByBloodType] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  
  // Hospital modal state
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [showRejectedDetails, setShowRejectedDetails] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);

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
        throw new Error('Failed to fetch requests');
      }

      const result = await response.json();
      setRequests(result.data || []);
      setStats(result.stats || { total: 0, pending: 0, approved: 0, fulfilled: 0, rejected: 0 });
      setByHospital(result.byHospital || []);
      setByBloodType(result.byBloodType || []);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    }
  }, [searchQuery, statusFilter, bloodTypeFilter, router]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, bloodTypeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleExport = () => {
    const csvData = requests.map(r => ({
      id: r.id,
      title: r.title,
      requester: r.requester,
      email: r.requesterEmail,
      phone: r.requesterPhone,
      status: r.status,
      priority: r.priority,
      bloodType: r.bloodType || '',
      units: r.units || '',
      hospital: r.hospitalName || '',
      createdAt: formatDate(r.createdAt)
    }));
    
    if (csvData.length === 0) return;

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => JSON.stringify(row[h as keyof typeof row] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  // Get rejected requests for a hospital
  const getRejectedRequests = useCallback((hospitalName: string) => {
    return requests.filter(r => 
      r.hospitalName === hospitalName && 
      r.status === 'rejected'
    );
  }, [requests]);

  // Memoized filtered data with pagination
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.hospitalName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesBloodType = bloodTypeFilter === 'all' || r.bloodType === bloodTypeFilter;
      return matchesSearch && matchesStatus && matchesBloodType;
    });
  }, [requests, searchQuery, statusFilter, bloodTypeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, currentPage]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-zinc-200 dark:border-zinc-700 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Something went wrong</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  const RequestCard = ({ 
    item, 
    onClick,
    expanded = false
  }: { 
    item: RequestItem; 
    onClick: () => void;
    expanded?: boolean;
  }) => (
    <div
      className={`rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer ${expanded ? 'p-4' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-zinc-900 dark:text-white text-sm">{item.title}</p>
            <PriorityBadge priority={item.priority} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{item.requester}</span>
            {item.hospitalName && <span>· {item.hospitalName}</span>}
            {item.bloodType && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Droplet className="w-3 h-3 text-red-500" />
                {item.bloodType} · {item.units || 1} unit(s)
              </span>
            )}
          </div>
          {expanded && item.description && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={item.status} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            aria-label="View details"
          >
            <Eye className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // OVERVIEW TAB - Has view mode controls
  // ============================================================

  const renderOverview = () => {
    const total = (stats?.total || 0) || 1;
    const completed = (stats?.approved || 0) + (stats?.fulfilled || 0);

    const renderContent = () => {
      switch (viewMode) {
        case 'split':
          return (
            <ResizablePanelGroup
              orientation="horizontal"
              className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden bg-white dark:bg-zinc-900/90"
            >
              <ResizablePanel defaultSize={55} minSize={30}>
                <div className="h-full p-6 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Status Breakdown</h3>
                  <StatusBreakdown stats={stats} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle>
                <div className="flex items-center justify-center w-4 h-full">
                  <GripVertical className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                </div>
              </ResizableHandle>

              <ResizablePanel defaultSize={45} minSize={25}>
                <div className="h-full p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Requests</h3>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {filteredRequests.length} total
                    </span>
                  </div>
                  <div className="space-y-2">
                    {paginatedRequests.map((item) => (
                      <RequestCard key={item.id} item={item} onClick={() => setSelectedRequest(item)} />
                    ))}
                    {paginatedRequests.length === 0 && (
                      <EmptyState title="No requests found" description="Try adjusting your filters" />
                    )}
                  </div>
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={filteredRequests.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          );

        case 'single':
          return (
            <div className="rounded-2xl bg-white dark:bg-zinc-900/90 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">All Requests</h3>
              <div className="space-y-2">
                {paginatedRequests.map((item) => (
                  <RequestCard key={item.id} item={item} onClick={() => setSelectedRequest(item)} expanded />
                ))}
                {paginatedRequests.length === 0 && (
                  <EmptyState title="No requests found" description="Try adjusting your filters" />
                )}
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredRequests.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            </div>
          );

        case 'compact':
          return (
            <div className="rounded-2xl bg-white dark:bg-zinc-900/90 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Request</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Requester</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                    {paginatedRequests.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-3 py-2">
                          <p className="font-medium text-zinc-900 dark:text-white text-sm">{item.title}</p>
                          {item.bloodType && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                              <Droplet className="w-2.5 h-2.5" />
                              {item.bloodType}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-sm text-zinc-900 dark:text-white">{item.requester}</p>
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {formatDate(item.createdAt)}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => setSelectedRequest(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paginatedRequests.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8">
                          <EmptyState title="No requests found" description="Try adjusting your filters" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredRequests.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className={`grid gap-4 ${
          viewMode === 'compact' 
            ? 'grid-cols-2 md:grid-cols-4' 
            : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
        }`}>
          <StatCard
            label="Total Requests"
            value={stats?.total || 0}
            icon={ClipboardList}
            color="purple"
            subtitle="All time requests"
          />
          <StatCard
            label="Pending Review"
            value={stats?.pending || 0}
            icon={Clock}
            color="yellow"
            subtitle="Awaiting action"
          />
          <StatCard
            label="Completed"
            value={completed}
            icon={CheckCircle}
            color="green"
            subtitle={`${((completed / total) * 100).toFixed(1)}% completion rate`}
          />
          <StatCard
            label="Rejection Rate"
            value={stats?.total ? `${Math.round((stats.rejected / stats.total) * 100)}%` : '0%'}
            icon={XCircle}
            color="red"
            subtitle={`${stats?.rejected || 0} requests declined`}
          />
        </div>

        {/* View Mode Controls - Only shown in Overview */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">View Mode</h3>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Main Content based on view mode */}
        {renderContent()}
      </div>
    );
  };

  // ============================================================
  // STATUS ANALYSIS TAB - No view mode controls
  // ============================================================

  const renderStatusAnalysis = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white dark:bg-zinc-900/90 p-6 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-6">Detailed Status Analysis</h3>
          <StatusBreakdown stats={stats} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white dark:bg-zinc-900/90 p-6 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <MetricCard label="Completion Rate" value={stats?.total ? `${(((stats.approved + stats.fulfilled) / stats.total) * 100).toFixed(1)}%` : '0%'} />
              <MetricCard label="Pending Rate" value={stats?.total ? `${((stats.pending / stats.total) * 100).toFixed(1)}%` : '0%'} />
              <MetricCard label="Rejection Rate" value={stats?.total ? `${((stats.rejected / stats.total) * 100).toFixed(1)}%` : '0%'} />
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900/90 p-6 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickStat label="Total" value={stats?.total || 0} color="text-purple-600 dark:text-purple-400" />
              <QuickStat label="Pending" value={stats?.pending || 0} color="text-yellow-600 dark:text-yellow-400" />
              <QuickStat label="Approved" value={stats?.approved || 0} color="text-green-600 dark:text-green-400" />
              <QuickStat label="Fulfilled" value={stats?.fulfilled || 0} color="text-blue-600 dark:text-blue-400" />
              <QuickStat label="Rejected" value={stats?.rejected || 0} color="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MetricCard = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-sm font-semibold text-zinc-900 dark:text-white">{value}</span>
    </div>
  );

  const QuickStat = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );

  // ============================================================
  // HOSPITALS TAB - With rejected requests view
  // ============================================================

  const renderHospitals = () => {
    const sorted = [...byHospital].sort((a, b) => (b.total || 0) - (a.total || 0));
    const totalAcrossHospitals = sorted.reduce((sum, h) => sum + (h.total || 0), 0);

    return (
      <div className="space-y-4">
        {/* Main Hospital List */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900/90 p-6 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Requests by Hospital</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {totalAcrossHospitals.toLocaleString()} total requests across {sorted.length} hospitals
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/40">
              <Hospital className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="space-y-4">
            {sorted.length === 0 ? (
              <EmptyState 
                title="No hospital data" 
                description="No requests have been associated with hospitals yet"
                icon={Hospital}
              />
            ) : (
              sorted.map((hospital, index) => {
                const total = hospital.total || 0;
                const approved = (hospital.approved || 0) + (hospital.completed || 0);
                const pending = hospital.pending || 0;
                const rejected = hospital.rejected || 0;
                const rejectedRequests = getRejectedRequests(hospital.name);

                return (
                  <div
                    key={index}
                    className="group rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 p-4 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40">
                          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-white truncate">{hospital.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{total} total requests</p>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-2 flex-wrap justify-end">
                        {pending > 0 && (
                          <span className="rounded-full bg-yellow-100 dark:bg-yellow-950/40 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                            {pending} pending
                          </span>
                        )}
                        {approved > 0 && (
                          <span className="rounded-full bg-green-100 dark:bg-green-950/40 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                            {approved} completed
                          </span>
                        )}
                        {rejected > 0 && (
                          <button
                            onClick={() => {
                              setSelectedHospital(hospital);
                              setShowRejectedDetails(true);
                            }}
                            className="rounded-full bg-red-100 dark:bg-red-950/40 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-950/60 transition-colors cursor-pointer"
                          >
                            {rejected} rejected
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500" 
                        style={{ width: total > 0 ? `${(approved / total) * 100}%` : '0%' }} 
                      />
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-500" 
                        style={{ width: total > 0 ? `${(pending / total) * 100}%` : '0%' }} 
                      />
                      <div 
                        className="h-full bg-red-500 transition-all duration-500 cursor-pointer hover:opacity-80" 
                        style={{ width: total > 0 ? `${(rejected / total) * 100}%` : '0%' }}
                        onClick={() => {
                          setSelectedHospital(hospital);
                          setShowRejectedDetails(true);
                        }}
                        title="Click to view rejected requests"
                      />
                    </div>
                    
                    {/* Rejected count indicator */}
                    {rejected > 0 && (
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => {
                            setSelectedHospital(hospital);
                            setShowRejectedDetails(true);
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                        >
                          View {rejected} rejected request{rejected > 1 ? 's' : ''}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rejected Requests Modal */}
        {showRejectedDetails && selectedHospital && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => {
              setShowRejectedDetails(false);
              setSelectedHospital(null);
            }}
          >
            <div
              className="w-full max-w-3xl max-h-[80vh] rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200/70 dark:border-zinc-800/70 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Rejected Requests
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {selectedHospital.name} · {getRejectedRequests(selectedHospital.name).length} rejected requests
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRejectedDetails(false);
                    setSelectedHospital(null);
                  }}
                  className="flex-shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh] p-6">
                {getRejectedRequests(selectedHospital.name).length === 0 ? (
                  <EmptyState 
                    title="No rejected requests" 
                    description="All requests from this hospital have been processed"
                    icon={CheckCircle}
                  />
                ) : (
                  <div className="space-y-3">
                    {getRejectedRequests(selectedHospital.name).map((request) => (
                      <div
                        key={request.id}
                        className="rounded-xl border border-red-200/70 dark:border-red-800/70 p-4 bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectedDetails(false);
                          setSelectedHospital(null);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-zinc-900 dark:text-white">{request.title}</p>
                              <PriorityBadge priority={request.priority} />
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {request.requester}
                              </span>
                              {request.bloodType && (
                                <span className="inline-flex items-center gap-1 text-xs">
                                  <Droplet className="w-3 h-3 text-red-500" />
                                  {request.bloodType} · {request.units || 1} unit(s)
                                </span>
                              )}
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                {formatDate(request.createdAt)}
                              </span>
                            </div>
                            {request.description && (
                              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                {request.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={request.status} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request);
                                setShowRejectedDetails(false);
                                setSelectedHospital(null);
                              }}
                              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                              aria-label="View details"
                            >
                              <Eye className="h-4 w-4 text-zinc-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200/70 dark:border-zinc-800/70 px-6 py-3">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Click on any request to view full details
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // BLOOD TYPES TAB - No view mode controls
  // ============================================================

  const renderBloodTypes = () => {
    const sorted = [...byBloodType].sort((a, b) => (b.count || 0) - (a.count || 0));
    const maxCount = Math.max(...sorted.map(b => b.count || 0), 1);
    const total = sorted.reduce((sum, b) => sum + (b.count || 0), 0);

    return (
      <div className="rounded-2xl bg-white dark:bg-zinc-900/90 p-6 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Requests by Blood Type</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {total.toLocaleString()} total requests across {sorted.length} blood types
            </p>
          </div>
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40">
            <Droplet className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {sorted.length === 0 ? (
          <EmptyState 
            title="No blood type data" 
            description="No requests have specified blood types yet"
            icon={Droplet}
          />
        ) : (
          <div className="space-y-4">
            {sorted.map(({ type, count }) => {
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const barWidth = (count / maxCount) * 100;

              return (
                <div key={type} className="group">
                  <div className="flex items-center gap-3">
                    <span className="w-12 flex-shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 flex-shrink-0 text-right text-sm font-medium tabular-nums text-zinc-900 dark:text-white">
                      {count}
                    </span>
                    <span className="w-14 flex-shrink-0 text-right text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // TIMELINE TAB - No view mode controls
  // ============================================================

  const renderTimeline = () => {
    const sortedRequests = [...filteredRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const paginatedTimeline = sortedRequests.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    const timelineTotalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);

    return (
      <div className="rounded-2xl bg-white dark:bg-zinc-900/90 p-6 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Request Timeline</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-6">
          Chronological view of all requests
        </p>

        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

          <div className="space-y-6">
            {paginatedTimeline.length === 0 ? (
              <EmptyState 
                title="No requests found" 
                description="Try adjusting your search or filters"
                icon={CalendarDays}
              />
            ) : (
              paginatedTimeline.map((item) => {
                const statusColor = {
                  pending: 'border-yellow-500 bg-yellow-500',
                  approved: 'border-green-500 bg-green-500',
                  completed: 'border-blue-500 bg-blue-500',
                  fulfilled: 'border-blue-500 bg-blue-500',
                  rejected: 'border-red-500 bg-red-500',
                }[item.status] || 'border-zinc-400 bg-zinc-400';

                return (
                  <div key={item.id} className="relative pl-10">
                    <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 ${statusColor} bg-white dark:bg-zinc-900 flex items-center justify-center`}>
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    <div 
                      className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer" 
                      onClick={() => setSelectedRequest(item)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-white">{item.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <StatusBadge status={item.status} />
                            <PriorityBadge priority={item.priority} />
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {item.requester} · {item.hospitalName || item.location || 'N/A'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(item);
                          }}
                          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={timelineTotalPages}
            onPageChange={setCurrentPage}
            totalItems={sortedRequests.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/30">
              <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            Request Reports
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            View and analyze all request data across the platform
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-700 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-700 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-4 sm:p-5 shadow-sm border border-zinc-200/70 dark:border-zinc-800/70 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={bloodTypeFilter}
              onChange={(e) => setBloodTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
            >
              <option value="all">All Blood Types</option>
              {BLOOD_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-200/70 dark:border-zinc-800/70 print:hidden">
        {SUB_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all ${
              activeTab === key
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50/50 dark:bg-red-950/10'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'status' && renderStatusAnalysis()}
        {activeTab === 'hospitals' && renderHospitals()}
        {activeTab === 'blood-types' && renderBloodTypes()}
        {activeTab === 'timeline' && renderTimeline()}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200/70 dark:border-zinc-800/70 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {formatType(selectedRequest.type)}
                  </p>
                  <h3 className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-white truncate">
                    {selectedRequest.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority={selectedRequest.priority} />
                <StatusBadge status={selectedRequest.status} />
                {selectedRequest.bloodType && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/40 px-3 py-1 text-xs font-medium text-red-800 dark:text-red-300">
                    <Droplet className="h-3 w-3" />
                    {selectedRequest.bloodType} · {selectedRequest.units || 1} unit(s)
                  </span>
                )}
              </div>

              {selectedRequest.description && (
                <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {selectedRequest.description}
                </p>
              )}

              <div className="mt-5 space-y-3 border-t border-zinc-200/70 dark:border-zinc-800/70 pt-4">
                <DetailItem icon={Users} label={selectedRequest.requester} />
                {selectedRequest.requesterEmail && (
                  <DetailItem icon={Mail} label={selectedRequest.requesterEmail} />
                )}
                {selectedRequest.requesterPhone && (
                  <DetailItem icon={Phone} label={selectedRequest.requesterPhone} />
                )}
                {(selectedRequest.hospitalName || selectedRequest.location) && (
                  <DetailItem icon={MapPin} label={selectedRequest.hospitalName || selectedRequest.location || ''} />
                )}
                <DetailItem 
                  icon={Calendar} 
                  label={`Submitted ${formatDateTime(selectedRequest.createdAt)}${
                    selectedRequest.updatedAt && selectedRequest.updatedAt !== selectedRequest.createdAt
                      ? ` · Updated ${formatDateTime(selectedRequest.updatedAt)}`
                      : ''
                  }`} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DetailItem = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
      <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
    </div>
    <span className="truncate">{label}</span>
  </div>
);