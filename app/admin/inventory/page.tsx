// app/admin/inventory/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Package,
  Search,
  Filter,
  Droplet,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Printer,
  Eye,
  AlertTriangle,
  Hospital,
  RefreshCw,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface InventoryItem {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  hospitalStatus: string;
  bloodType: string;
  quantity: number;
  minRequired: number;
  maxCapacity: number;
  status: 'Sufficient' | 'Low' | 'Critical' | 'Out of Stock';
  expirationDate: string;
  batchNumber: string;
  notes: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

interface HospitalInventory {
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  totalUnits: number;
  items: InventoryItem[];
}

interface InventoryStats {
  totalHospitals: number;
  totalBloodUnits: number;
  criticalHospitals: number;
  lowStockHospitals: number;
  bloodTypeBreakdown: {
    [key: string]: number;
  };
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const statusColors = {
  Sufficient: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  Low: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  Critical: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
  "Out of Stock": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400",
};

const statusIcons = {
  Sufficient: <CheckCircle className="w-3 h-3" />,
  Low: <AlertCircle className="w-3 h-3" />,
  Critical: <AlertTriangle className="w-3 h-3" />,
  "Out of Stock": <X className="w-3 h-3" />,
};

export default function AdminBloodInventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [groupedInventory, setGroupedInventory] = useState<HospitalInventory[]>([]);
  const [expandedHospitals, setExpandedHospitals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<InventoryStats>({
    totalHospitals: 0,
    totalBloodUnits: 0,
    criticalHospitals: 0,
    lowStockHospitals: 0,
    bloodTypeBreakdown: {}
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const generateUniqueId = useCallback((item: any, index: number): string => {
    const baseId = item.id || item._id || item.inventoryId || `item-${index}`;
    const hospitalPart = item.hospitalId || item.hospital?._id || 'unknown';
    const bloodTypePart = item.bloodType || 'unknown';
    const batchPart = item.batchNumber || item.batch || index;
    return `${baseId}-${hospitalPart}-${bloodTypePart}-${batchPart}`;
  }, []);

  const mapStatus = useCallback((status: string, units: number): 'Sufficient' | 'Low' | 'Critical' | 'Out of Stock' => {
    if (units === 0) return 'Out of Stock';
    if (status === 'out of stock' || status === 'Out of Stock') return 'Out of Stock';
    if (status === 'critical' || status === 'Critical') return 'Critical';
    if (status === 'low' || status === 'Low') return 'Low';
    if (status === 'expired' || status === 'Expired') return 'Out of Stock';
    return 'Sufficient';
  }, []);

  const calculateBloodTypeBreakdown = useCallback((items: InventoryItem[]): { [key: string]: number } => {
    const breakdown: { [key: string]: number } = {};
    bloodTypes.forEach(type => breakdown[type] = 0);
    
    items.forEach(item => {
      if (item.bloodType && breakdown[item.bloodType] !== undefined) {
        breakdown[item.bloodType] += item.quantity || 0;
      }
    });
    
    return breakdown;
  }, []);

  const extractInventoryData = useCallback((data: any): any[] => {
    if (!data) return [];

    if (data.data !== undefined) {
      if (Array.isArray(data.data)) return data.data;
      
      if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        const flattened = [
          ...(data.data.lowStock || []),
          ...(data.data.criticalStock || []),
          ...(data.data.outOfStock || []),
          ...(data.data.expiringSoon || []),
          ...(data.data.expired || []),
        ];
        return flattened;
      }
      return [];
    }

    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
    if (data.results && Array.isArray(data.results)) return data.results;

    return [];
  }, []);

  const fetchInventory = useCallback(async () => {
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
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/blood-inventory?${params.toString()}`, {
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
        
        let errorMessage = 'Failed to fetch inventory';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid response format from server');
      }

      const rawInventoryData = extractInventoryData(data);
      
      const processedInventory = rawInventoryData.map((item: any, index: number) => ({
        id: generateUniqueId(item, index),
        originalId: item.id || item._id || null,
        hospitalId: item.hospitalId || item.hospital?._id || '',
        hospitalName: item.hospitalName || item.hospital?.name || 'Unknown Hospital',
        hospitalAddress: item.hospitalAddress || item.hospital?.address || '',
        hospitalPhone: item.hospitalPhone || item.hospital?.phone || '',
        hospitalEmail: item.hospitalEmail || item.hospital?.email || '',
        hospitalStatus: item.hospitalStatus || item.hospital?.status || 'active',
        bloodType: item.bloodType || 'Unknown',
        quantity: item.units || item.quantity || 0,
        minRequired: item.minRequired || 15,
        maxCapacity: item.maxCapacity || 60,
        status: mapStatus(item.status || item.alertStatus, item.units || item.quantity || 0),
        expirationDate: item.expirationDate || item.expiryDate || new Date().toISOString(),
        batchNumber: item.batchNumber || item.batch || 'N/A',
        notes: item.notes || item.message || item.alertMessage || '',
        lastUpdated: item.lastUpdated || item.updatedAt || item.createdAt || new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));

      const uniqueItems = new Map();
      processedInventory.forEach(item => {
        const key = `${item.hospitalId}-${item.bloodType}-${item.batchNumber}`;
        if (!uniqueItems.has(key) || item.quantity > uniqueItems.get(key).quantity) {
          uniqueItems.set(key, item);
        }
      });
      
      const finalInventory = Array.from(uniqueItems.values());
      
      setInventory(finalInventory);
      
      const grouped = groupInventoryByHospital(finalInventory);
      setGroupedInventory(grouped);
      
      const statsData = data.stats || {};
      setStats({
        totalHospitals: grouped.length,
        totalBloodUnits: finalInventory.reduce((sum, item) => sum + item.quantity, 0),
        criticalHospitals: statsData.criticalHospitals || statsData.criticalStock || 0,
        lowStockHospitals: statsData.lowStockHospitals || statsData.lowStock || 0,
        bloodTypeBreakdown: statsData.bloodTypeBreakdown || calculateBloodTypeBreakdown(finalInventory)
      });
      
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
      setInventory([]);
      setGroupedInventory([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, bloodTypeFilter, statusFilter, router, extractInventoryData, generateUniqueId, mapStatus, calculateBloodTypeBreakdown]);

  const debouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchInventory();
    }, 300);
  }, [fetchInventory]);

  const groupInventoryByHospital = useCallback((items: InventoryItem[]): HospitalInventory[] => {
    const hospitalMap = new Map<string, HospitalInventory>();
    
    items.forEach(item => {
      if (!hospitalMap.has(item.hospitalId)) {
        hospitalMap.set(item.hospitalId, {
          hospitalId: item.hospitalId,
          hospitalName: item.hospitalName,
          hospitalAddress: item.hospitalAddress,
          hospitalPhone: item.hospitalPhone,
          hospitalEmail: item.hospitalEmail,
          totalUnits: 0,
          items: []
        });
      }
      
      const hospital = hospitalMap.get(item.hospitalId)!;
      hospital.items.push(item);
      hospital.totalUnits += item.quantity;
    });
    
    return Array.from(hospitalMap.values());
  }, []);

  const toggleHospital = useCallback((hospitalId: string) => {
    setExpandedHospitals(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(hospitalId)) {
        newExpanded.delete(hospitalId);
      } else {
        newExpanded.add(hospitalId);
      }
      return newExpanded;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set(groupedInventory.map(h => h.hospitalId));
    setExpandedHospitals(allIds);
  }, [groupedInventory]);

  const collapseAll = useCallback(() => {
    setExpandedHospitals(new Set());
  }, []);

  useEffect(() => {
    debouncedFetch();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedFetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInventory();
    setIsRefreshing(false);
    showToast('success', 'Inventory refreshed!');
  };

  const getStatusLabel = (status: string) => status;
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'Sufficient': return '✅';
      case 'Low': return '⚠️';
      case 'Critical': return '🚨';
      case 'Out of Stock': return '❌';
      default: return '📦';
    }
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchInventory}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Try Again
          </button>
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
            <Package className="w-8 h-8 text-red-500" />
            Blood Inventory
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            View blood inventory across all hospitals
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={expandAll}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <ChevronDown className="w-4 h-4" />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <ChevronRightIcon className="w-4 h-4" />
            Collapse All
          </button>
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
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Hospitals</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{groupedInventory.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Hospital className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Blood Units</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalBloodUnits}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <Droplet className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Critical Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalHospitals}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600">{stats.lowStockHospitals}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Blood Type Breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Blood Type Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {bloodTypes.map(type => (
            <div key={type} className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{type}</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {stats.bloodTypeBreakdown?.[type] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by hospital or blood type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={bloodTypeFilter}
              onChange={(e) => setBloodTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="all">🩸 All Blood Types</option>
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="all">📋 All Status</option>
              <option value="Sufficient">✅ Sufficient</option>
              <option value="Low">⚠️ Low</option>
              <option value="Critical">🚨 Critical</option>
              <option value="Out of Stock">❌ Out of Stock</option>
            </select>

            <button
              onClick={fetchInventory}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Inventory Display */}
      <div className="space-y-4">
        {groupedInventory.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 text-center">
            <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">No inventory items found</p>
          </div>
        ) : (
          groupedInventory.map((hospital) => {
            const isExpanded = expandedHospitals.has(hospital.hospitalId);
            
            const hasCritical = hospital.items.some(item => item.status === 'Critical');
            const hasLow = hospital.items.some(item => item.status === 'Low');
            const hasOutOfStock = hospital.items.some(item => item.status === 'Out of Stock');
            
            let hospitalStatus = 'Sufficient';
            let statusColor = 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400';
            
            if (hasOutOfStock) {
              hospitalStatus = 'Out of Stock';
              statusColor = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400';
            } else if (hasCritical) {
              hospitalStatus = 'Critical';
              statusColor = 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400';
            } else if (hasLow) {
              hospitalStatus = 'Low';
              statusColor = 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400';
            }
            
            return (
              <div
                key={hospital.hospitalId}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden"
              >
                {/* Hospital Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  onClick={() => toggleHospital(hospital.hospitalId)}
                >
                  <div className="flex items-center gap-4">
                    <button className="text-zinc-500">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {hospital.hospitalName}
                      </h3>
                      {hospital.hospitalAddress && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{hospital.hospitalAddress}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                      {hospitalStatus}
                    </span>
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {hospital.items.length} types · {hospital.totalUnits} units
                    </span>
                  </div>
                </div>

                {/* Hospital Items - Expanded */}
                {isExpanded && (
                  <div className="border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Blood Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Min / Max
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Expiry Date
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                          {hospital.items.map((item) => {
                            const isExpired = new Date(item.expirationDate) < new Date();
                            const displayStatus = isExpired ? 'Out of Stock' : item.status;
                            
                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                                    <Droplet className="w-3.5 h-3.5" />
                                    {item.bloodType}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-sm font-semibold ${
                                    item.quantity <= item.minRequired || isExpired
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-zinc-900 dark:text-white'
                                  }`}>
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[displayStatus as keyof typeof statusColors]}`}>
                                    {statusIcons[displayStatus as keyof typeof statusIcons]}
                                    {getStatusLabel(displayStatus)}
                                    <span className="ml-0.5">{getStatusEmoji(displayStatus)}</span>
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {item.minRequired} / {item.maxCapacity}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className={`text-sm ${
                                    isExpired
                                      ? 'text-red-600 dark:text-red-400 font-bold' 
                                      : 'text-zinc-600 dark:text-zinc-400'
                                  }`}>
                                    {new Date(item.expirationDate).toLocaleDateString()}
                                    {isExpired && (
                                      <span className="ml-2 text-xs text-red-600 dark:text-red-400">(Expired)</span>
                                    )}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setShowDetailsModal(true);
                                    }}
                                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* View Details Modal (read-only) */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Inventory Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedItem(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-lg font-bold bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                  <Droplet className="w-5 h-5" />
                  {selectedItem.bloodType}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selectedItem.status as keyof typeof statusColors]}`}>
                  {statusIcons[selectedItem.status as keyof typeof statusIcons]}
                  {selectedItem.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hospital</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {selectedItem.hospitalName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Quantity</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedItem.quantity}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Min Required</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedItem.minRequired}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Max Capacity</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedItem.maxCapacity}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Expiry Date</p>
                <p className={`text-sm font-medium ${
                  new Date(selectedItem.expirationDate) < new Date() 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-zinc-900 dark:text-white'
                }`}>
                  {new Date(selectedItem.expirationDate).toLocaleDateString()}
                  {new Date(selectedItem.expirationDate) < new Date() && (
                    <span className="ml-2 text-xs text-red-600 dark:text-red-400">(Expired)</span>
                  )}
                </p>
              </div>

              {selectedItem.notes && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedItem.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Last updated: {new Date(selectedItem.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}