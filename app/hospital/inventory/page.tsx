// app/hospital/inventory/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit,
  Droplet,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  Minus,
  History,
  Calendar,
  RefreshCw,
  HandHeart,
  ArrowUpRight,
  Info,
  AlertOctagon,
  Printer,
  QrCode,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ReleaseBloodModal, { ReleaseData } from "@/components/releaseblood/ReleaseBloodModal";
import InventoryHistory from "@/components/releaseblood/InventoryHistory";
import BloodBagTag, { BloodBagTagData } from "@/components/bloodbag/BloodBagTag";

interface InventoryItem {
  id: string;
  bloodType: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  expiryDate: string;
  status: "available" | "low" | "critical" | "expired";
  location: string;
  hospitalId: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

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

interface ExpiredBloodItem {
  id: string;
  bloodType: string;
  units: number;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donationDate: string;
  expirationDate: string;
  daysOverdue: number;
  hospital: string;
  isWalkIn: boolean;
  notes: string;
  bloodDriveId: string | null;
}

interface BloodBagItem {
  id: string;
  bloodType: string;
  units: number;
  donationId: string;
  donationDate: string;
  expirationDate: string;
  status: 'available' | 'used' | 'expired' | 'quarantined';
  batchNumber: string;
  location: string;
  notes: string;
  daysRemaining: number;
  isExpired: boolean;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const statusColors = {
  available: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  low: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  critical: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
  expired: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400",
};

const statusIcons = {
  available: <CheckCircle className="w-3 h-3" />,
  low: <AlertCircle className="w-3 h-3" />,
  critical: <AlertTriangle className="w-3 h-3" />,
  expired: <X className="w-3 h-3" />,
};

const donationStatusColors = {
  Completed: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  Pending: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400",
  Scheduled: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  Cancelled: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
};

const bagStatusColors = {
  available: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  used: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  expired: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
  quarantined: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
};

export default function HospitalInventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inventory' | 'donations' | 'expired' | 'bags'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [expiredBlood, setExpiredBlood] = useState<ExpiredBloodItem[]>([]);
  const [bloodBags, setBloodBags] = useState<BloodBagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [expiredLoading, setExpiredLoading] = useState(false);
  const [bagsLoading, setBagsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [donationStatusFilter, setDonationStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<DonationRecord | null>(null);
  const [selectedExpired, setSelectedExpired] = useState<ExpiredBloodItem | null>(null);
  const [selectedBag, setSelectedBag] = useState<BloodBagItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDonationDetailsModal, setShowDonationDetailsModal] = useState(false);
  const [showExpiredDetailsModal, setShowExpiredDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBagTagModal, setShowBagTagModal] = useState(false);
  const [showBagsModal, setShowBagsModal] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState<string | null>(null);
  const [bagsForType, setBagsForType] = useState<BloodBagItem[]>([]);
  const [showNotesTooltip, setShowNotesTooltip] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [donationPagination, setDonationPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [expiredPagination, setExpiredPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [bagsPagination, setBagsPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [expiredSummary, setExpiredSummary] = useState({
    totalExpired: 0,
    totalUnits: 0,
    byBloodType: {} as Record<string, { units: number; count: number }>,
  });
  const [bagsSummary, setBagsSummary] = useState({
    total: 0,
    available: 0,
    used: 0,
    expired: 0,
    quarantined: 0,
  });

  const initialFetchDone = useRef(false);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    bloodType: "",
    quantity: 0,
    minThreshold: 5,
    maxThreshold: 20,
    expiryDate: "",
    location: "",
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
    if (!name) return "??";
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

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // ============================================================
  // ✅ FETCH FUNCTIONS WITH PROPER ARRAY HANDLING
  // ============================================================

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        if (router) {
          router.push('/auth/login');
        }
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/hospital/inventory?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (router) {
            router.push('/auth/login');
          }
          return;
        }
        throw new Error(`Failed to fetch inventory: ${response.status}`);
      }

      const data = await response.json();
      
      setInventory(Array.isArray(data.data) ? data.data : []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory. Please try again.');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [router, searchQuery, bloodTypeFilter, statusFilter]);

  const fetchDonations = useCallback(async () => {
    try {
      setDonationsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        if (router) {
          router.push('/auth/login');
        }
        setDonations([]);
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);
      if (donationStatusFilter !== 'all') params.append('status', donationStatusFilter);

      const response = await fetch(`/api/hospital/donations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }

      const data = await response.json();
      
      const donationsData = Array.isArray(data.data) ? data.data : [];
      setDonations(donationsData);
      setDonationPagination(data.pagination || { 
        total: donationsData.length, 
        page: 1, 
        limit: 10, 
        totalPages: Math.ceil(donationsData.length / 10) 
      });
    } catch (err) {
      console.error('Error fetching donations:', err);
      showToast('error', 'Failed to load donations');
      setDonations([]);
    } finally {
      setDonationsLoading(false);
    }
  }, [router, searchQuery, bloodTypeFilter, donationStatusFilter]);

  const fetchExpiredBlood = useCallback(async () => {
    try {
      setExpiredLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        if (router) {
          router.push('/auth/login');
        }
        setExpiredBlood([]);
        return;
      }

      const params = new URLSearchParams();
      params.append('page', expiredPagination.page.toString());
      params.append('limit', expiredPagination.limit.toString());
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/hospital/inventory/expired?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expired blood');
      }

      const data = await response.json();
      
      setExpiredBlood(Array.isArray(data.data) ? data.data : []);
      setExpiredPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
      setExpiredSummary(data.summary || { totalExpired: 0, totalUnits: 0, byBloodType: {} });
    } catch (err) {
      console.error('Error fetching expired blood:', err);
      showToast('error', 'Failed to load expired blood');
      setExpiredBlood([]);
    } finally {
      setExpiredLoading(false);
    }
  }, [router, searchQuery, bloodTypeFilter, expiredPagination.page, expiredPagination.limit]);

  const fetchBloodBags = useCallback(async () => {
    try {
      setBagsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        if (router) {
          router.push('/auth/login');
        }
        setBloodBags([]);
        return;
      }

      const params = new URLSearchParams();
      params.append('page', bagsPagination.page.toString());
      params.append('limit', bagsPagination.limit.toString());
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/hospital/inventory/bags?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch blood bags');
      }

      const data = await response.json();
      
      setBloodBags(Array.isArray(data.data) ? data.data : []);
      setBagsPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
      setBagsSummary(data.summary || { total: 0, available: 0, used: 0, expired: 0, quarantined: 0 });
    } catch (err) {
      console.error('Error fetching blood bags:', err);
      showToast('error', 'Failed to load blood bags');
      setBloodBags([]);
    } finally {
      setBagsLoading(false);
    }
  }, [router, searchQuery, bloodTypeFilter, bagsPagination.page, bagsPagination.limit]);

  const fetchBagsByType = useCallback(async (bloodType: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (router) {
          router.push('/auth/login');
        }
        return;
      }

      setSelectedBloodType(bloodType);
      setBagsLoading(true);

      const response = await fetch(`/api/hospital/inventory/bags?bloodType=${bloodType}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bags for blood type');
      }

      const data = await response.json();
      setBagsForType(Array.isArray(data.data) ? data.data : []);
      setShowBagsModal(true);
    } catch (err) {
      console.error('Error fetching bags by type:', err);
      showToast('error', 'Failed to load blood bags');
      setBagsForType([]);
    } finally {
      setBagsLoading(false);
    }
  }, [router]);

  // ============================================================
  // ✅ SYNC AND RELEASE FUNCTIONS
  // ============================================================

  const syncInventory = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/hospital/inventory/fix', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast('success', `Inventory synced! ${data.data?.bloodTypesUpdated || 0} blood types updated`);
        await fetchInventory();
        await fetchDonations();
        await fetchExpiredBlood();
        await fetchBloodBags();
      } else {
        showToast('error', data.error || 'Failed to sync inventory');
      }
    } catch (error) {
      console.error('Error syncing inventory:', error);
      showToast('error', 'Failed to sync inventory');
    } finally {
      setSyncing(false);
    }
  };

  const handleReleaseBlood = async (releaseData: ReleaseData) => {
    try {
      setReleasing(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/hospital/inventory/release', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(releaseData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to release blood');
      }

      showToast('success', `Released ${releaseData.units} unit(s) of ${releaseData.bloodType} for ${releaseData.patientName}`);
      await fetchInventory();
      await fetchDonations();
      await fetchExpiredBlood();
      await fetchBloodBags();
      setShowReleaseModal(false);
    } catch (error) {
      console.error('Error releasing blood:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to release blood');
      throw error;
    } finally {
      setReleasing(false);
    }
  };

  // ============================================================
  // ✅ EFFECTS
  // ============================================================

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchInventory();
      fetchDonations();
      fetchExpiredBlood();
      fetchBloodBags();
    }
  }, [fetchInventory, fetchDonations, fetchExpiredBlood, fetchBloodBags]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (initialFetchDone.current) {
        if (activeTab === 'inventory') {
          fetchInventory();
        } else if (activeTab === 'donations') {
          fetchDonations();
        } else if (activeTab === 'expired') {
          fetchExpiredBlood();
        } else if (activeTab === 'bags') {
          fetchBloodBags();
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, bloodTypeFilter, statusFilter, donationStatusFilter, activeTab, fetchInventory, fetchDonations, fetchExpiredBlood, fetchBloodBags]);

  useEffect(() => {
    if (activeTab === 'expired') {
      autoRefreshInterval.current = setInterval(() => {
        fetchExpiredBlood();
      }, 60000);
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, [activeTab, fetchExpiredBlood]);

  // ============================================================
  // ✅ HANDLER FUNCTIONS
  // ============================================================

  const handleSaveInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const existingItem = inventory.find(item => 
        item.bloodType === formData.bloodType && 
        item.status !== 'expired'
      );

      let response;
      if (existingItem) {
        response = await fetch(`/api/hospital/inventory/${existingItem.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quantity: existingItem.quantity + formData.quantity,
            expiryDate: formData.expiryDate
          })
        });
      } else {
        response = await fetch('/api/hospital/inventory', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bloodType: formData.bloodType,
            quantity: formData.quantity,
            minThreshold: formData.minThreshold || 15,
            maxThreshold: formData.maxThreshold || 60,
            expiryDate: formData.expiryDate,
            location: formData.location,
            notes: formData.location
          })
        });
      }

      if (response.ok) {
        setShowEditModal(false);
        setSelectedItem(null);
        setFormData({
          bloodType: "",
          quantity: 0,
          minThreshold: 5,
          maxThreshold: 20,
          expiryDate: "",
          location: "",
        });
        await fetchInventory();
        await fetchExpiredBlood();
        await fetchBloodBags();
        showToast('success', existingItem ? 'Inventory updated successfully!' : 'Stock added successfully!');
      } else {
        const error = await response.json();
        showToast('error', error.error || 'Failed to save inventory');
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      showToast('error', 'Failed to save inventory. Please try again.');
    }
  };

  const handleAddDonation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (router) {
          router.push('/auth/login');
        }
        return;
      }

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
        showToast('success', data.message || 'Donation recorded and inventory updated! 🩸');
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
        await fetchInventory();
        await fetchExpiredBlood();
        await fetchBloodBags();
      } else {
        showToast('error', data.error || 'Failed to record donation');
      }
    } catch (error) {
      console.error('Error adding donation:', error);
      showToast('error', 'Failed to record donation');
    }
  };

  const handleViewDonationDetails = (donation: DonationRecord) => {
    setSelectedDonation(donation);
    setShowDonationDetailsModal(true);
  };

  const handleViewInventoryDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleViewExpiredDetails = (item: ExpiredBloodItem) => {
    setSelectedExpired(item);
    setShowExpiredDetailsModal(true);
  };

  const handleEditInventory = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      bloodType: item.bloodType,
      quantity: item.quantity,
      minThreshold: item.minThreshold,
      maxThreshold: item.maxThreshold,
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : "",
      location: item.location || "",
    });
    setShowEditModal(true);
  };

  const handlePrintBagTag = (bag: BloodBagItem) => {
    const tagData: BloodBagTagData = {
      id: bag.id,
      bloodType: bag.bloodType,
      units: bag.units,
      donorName: bag.donorName || 'Unknown',
      donorEmail: bag.donorEmail || '',
      donorPhone: bag.donorPhone || '',
      donationDate: bag.donationDate,
      expirationDate: bag.expirationDate,
      hospitalName: 'Gov. Valeriano M. Gatuslao Memorial Hospital',
      hospitalAddress: 'Himamaylan City, Negros Occidental',
      batchNumber: bag.batchNumber,
      status: bag.isExpired ? 'expired' : 'available',
      daysRemaining: bag.daysRemaining,
      isWalkIn: false,
    };
    setSelectedBag(bag);
    setShowBagTagModal(true);
  };

  // ============================================================
  // ✅ RENDER
  // ============================================================

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading inventory...</p>
          <button
            onClick={() => fetchInventory()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
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
            Blood Inventory & Donations
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            Manage blood inventory, donations, and expired blood
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {inventory.length} items in inventory • {expiredSummary.totalExpired} expired units • {bagsSummary.total} blood bags
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {activeTab === 'donations' && (
            <button
              onClick={() => fetchDonations()}
              disabled={donationsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-medium shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 disabled:opacity-50"
            >
              {donationsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          )}
          <button
            onClick={syncInventory}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-medium shadow-lg shadow-blue-200 dark:shadow-blue-900/30 disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync Inventory
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
          <button
            onClick={() => fetchInventory()}
            className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-t-2xl px-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          Inventory ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'donations'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <History className="h-4 w-4 inline mr-2" />
          Donations ({donations.length})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'expired'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <AlertOctagon className="h-4 w-4 inline mr-2" />
          Expired ({expiredSummary.totalExpired})
        </button>
        <button
          onClick={() => setActiveTab('bags')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'bags'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Tag className="h-4 w-4 inline mr-2" />
          Blood Bags ({bagsSummary.total})
        </button>
      </div>

      {/* Stats - Inventory */}
      {activeTab === 'inventory' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Units</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                {inventory.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Available</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {inventory.filter(i => i.status === 'available').reduce((sum, i) => sum + i.quantity, 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {inventory.filter(i => i.status === 'low').length}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Critical</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {inventory.filter(i => i.status === 'critical').length}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition text-sm font-medium shadow-lg shadow-purple-200 dark:shadow-purple-900/30"
            >
              <History className="w-4 h-4" />
              History
            </button>

            <button
              onClick={() => setShowReleaseModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium shadow-lg shadow-red-200 dark:shadow-red-900/30"
            >
              <ArrowUpRight className="w-4 h-4" />
              Release Blood
            </button>
            
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium shadow-lg shadow-red-200 dark:shadow-red-900/30"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </button>
          </div>
        </>
      )}

      {/* Stats - Donations */}
      {activeTab === 'donations' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Donations</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
              {donations.length}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-emerald-200 dark:border-emerald-800/60">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {donations.filter(d => d.status === 'Completed').length}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800/60">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {donations.filter(d => d.status === 'Pending').length}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-blue-200 dark:border-blue-800/60">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {donations.filter(d => d.status === 'Scheduled').length}
            </p>
          </div>
        </div>
      )}

      {/* Stats - Expired Blood */}
      {activeTab === 'expired' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Expired</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
              {expiredSummary.totalExpired || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Units</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
              {expiredSummary.totalUnits || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Avg Overdue</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
              {expiredBlood.length > 0 
                ? Math.round(expiredBlood.reduce((sum, item) => sum + item.daysOverdue, 0) / expiredBlood.length)
                : 0
              } days
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Blood Types</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
              {Object.keys(expiredSummary.byBloodType || {}).length}
            </p>
          </div>
        </div>
      )}

      {/* Stats - Blood Bags */}
      {activeTab === 'bags' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Bags</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
              {bagsSummary.total || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-emerald-200 dark:border-emerald-800/60">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Available</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {bagsSummary.available || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-red-200 dark:border-red-800/60">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">Expired</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {bagsSummary.expired || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-blue-200 dark:border-blue-800/60">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Used</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {bagsSummary.used || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={activeTab === 'inventory' ? "Search inventory..." : activeTab === 'donations' ? "Search donations..." : activeTab === 'expired' ? "Search expired blood..." : "Search blood bags by batch number..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab === 'expired') {
                  setExpiredPagination(prev => ({ ...prev, page: 1 }));
                } else if (activeTab === 'bags') {
                  setBagsPagination(prev => ({ ...prev, page: 1 }));
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={bloodTypeFilter}
              onChange={(e) => {
                setBloodTypeFilter(e.target.value);
                if (activeTab === 'expired') {
                  setExpiredPagination(prev => ({ ...prev, page: 1 }));
                } else if (activeTab === 'bags') {
                  setBagsPagination(prev => ({ ...prev, page: 1 }));
                }
              }}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="all">🩸 All Blood Types</option>
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {activeTab === 'inventory' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="all">📋 All Status</option>
                <option value="available">✅ Available</option>
                <option value="low">⚠️ Low</option>
                <option value="critical">🚨 Critical</option>
                <option value="expired">❌ Expired</option>
              </select>
            )}

            {activeTab === 'donations' && (
              <select
                value={donationStatusFilter}
                onChange={(e) => setDonationStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="all">📋 All Status</option>
                <option value="Completed">✅ Completed</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Scheduled">📅 Scheduled</option>
                <option value="Cancelled">❌ Cancelled</option>
              </select>
            )}

            <button
              onClick={() => {
                if (activeTab === 'inventory') {
                  fetchInventory();
                } else if (activeTab === 'donations') {
                  fetchDonations();
                } else if (activeTab === 'expired') {
                  fetchExpiredBlood();
                } else if (activeTab === 'bags') {
                  fetchBloodBags();
                }
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          INVENTORY TABLE
          ============================================================ */}
      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-zinc-500 dark:text-zinc-400">No inventory items found</p>
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const isExpired = new Date(item.expiryDate) < new Date();
                    const displayStatus = isExpired ? 'expired' : item.status;
                    
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
                          <span className={`text-sm font-semibold ${(
                            item.quantity <= item.minThreshold || isExpired
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-zinc-900 dark:text-white'
                          )}`}>
                            {item.quantity} {item.unit}
                          </span>
                          <div className="text-xs text-zinc-400 dark:text-zinc-500">
                            Min: {item.minThreshold} | Max: {item.maxThreshold}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[displayStatus as keyof typeof statusColors]}`}>
                            {statusIcons[displayStatus as keyof typeof statusIcons]}
                            {getStatusLabel(displayStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {item.location || 'Main Storage'}
                            </p>
                            {item.notes && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowNotesTooltip(showNotesTooltip === item.id ? null : item.id)}
                                  className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                                {showNotesTooltip === item.id && (
                                  <div className="absolute z-10 left-0 top-full mt-1 w-64 p-3 bg-zinc-800 dark:bg-zinc-700 text-white text-xs rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    <div className="whitespace-pre-wrap">
                                      {item.notes}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-sm ${isExpired ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {new Date(item.expiryDate).toLocaleDateString()}
                            {isExpired && (
                              <span className="ml-2 text-xs text-red-600 dark:text-red-400">(Expired)</span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewInventoryDetails(item)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                            </button>
                            <button
                              onClick={() => fetchBagsByType(item.bloodType)}
                              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-950/30 rounded-lg transition group"
                              title="View Bags"
                            >
                              <Tag className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleEditInventory(item)}
                              className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/30 rounded-lg transition group"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-zinc-400 group-hover:text-amber-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {inventory.length > 0 && (
            <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{inventory.length}</span> of{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{pagination.total}</span> items
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
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${pagination.page === pageNum ? 'text-white bg-red-600 hover:bg-red-700 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
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
      )}

      {/* ============================================================
          DONATIONS TABLE - ✅ FIXED
          ============================================================ */}
      {activeTab === 'donations' && (
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
                {donationsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
                      <p className="text-zinc-500 dark:text-zinc-400 mt-2">Loading donations...</p>
                    </td>
                  </tr>
                ) : !Array.isArray(donations) || donations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-zinc-500 dark:text-zinc-400">No donations found</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          Record your first donation to get started
                        </p>
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
                          onClick={() => handleViewDonationDetails(donation)}
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

          {Array.isArray(donations) && donations.length > 0 && (
            <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{donations.length}</span> of{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{donationPagination.total}</span> donations
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDonationPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={donationPagination.page === 1}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, donationPagination.totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setDonationPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${donationPagination.page === pageNum ? 'text-white bg-red-600 hover:bg-red-700 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {donationPagination.totalPages > 5 && <span className="px-2 text-zinc-400">...</span>}
                  <button
                    onClick={() => setDonationPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={donationPagination.page === donationPagination.totalPages}
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
      )}

      {/* ============================================================
          EXPIRED BLOOD TABLE
          ============================================================ */}
      {activeTab === 'expired' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Donation Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Expired On
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {expiredLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : expiredBlood.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                        <p className="text-zinc-500 dark:text-zinc-400">No expired blood found</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">All blood units are within their shelf life</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expiredBlood.map((item) => (
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
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-semibold text-xs">
                            {getInitials(item.donorName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                              {item.donorName}
                            </p>
                            {item.isWalkIn && (
                              <span className="text-xs text-purple-600 dark:text-purple-400">Walk-in</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {item.units}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {new Date(item.donationDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {new Date(item.expirationDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400`}>
                          {item.daysOverdue} days
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleViewExpiredDetails(item)}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition group"
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

          {expiredBlood.length > 0 && (
            <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{expiredBlood.length}</span> of{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{expiredPagination.total}</span> expired units
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpiredPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={expiredPagination.page === 1}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, expiredPagination.totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setExpiredPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${expiredPagination.page === pageNum ? 'text-white bg-red-600 hover:bg-red-700 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {expiredPagination.totalPages > 5 && <span className="px-2 text-zinc-400">...</span>}
                  <button
                    onClick={() => setExpiredPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={expiredPagination.page === expiredPagination.totalPages}
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
      )}

      {/* ============================================================
          BLOOD BAGS TABLE
          ============================================================ */}
      {activeTab === 'bags' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Batch #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Donation Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Days Left
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {bagsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : bloodBags.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-zinc-500 dark:text-zinc-400">No blood bags found</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Create donations to generate blood bags</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bloodBags.map((bag) => {
                    const statusClass = bagStatusColors[bag.status as keyof typeof bagStatusColors] || bagStatusColors.available;
                    return (
                      <tr
                        key={bag.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-zinc-400" />
                            <span className="font-mono text-sm font-medium text-zinc-900 dark:text-white">
                              {bag.batchNumber || bag.id.slice(0, 12).toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                            <Droplet className="w-3.5 h-3.5" />
                            {bag.bloodType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {bag.donorName || 'Unknown'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {new Date(bag.donationDate).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-sm ${bag.isExpired ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {new Date(bag.expirationDate).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${
                            bag.isExpired ? 'text-red-600 dark:text-red-400' : 
                            bag.daysRemaining <= 7 ? 'text-orange-600 dark:text-orange-400' : 
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {bag.isExpired ? 'Expired' : `${bag.daysRemaining} days`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                            {bag.status.charAt(0).toUpperCase() + bag.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handlePrintBagTag(bag)}
                              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-950/30 rounded-lg transition group"
                              title="Print Bag Tag"
                            >
                              <Printer className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBag(bag);
                              }}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {bloodBags.length > 0 && (
            <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{bloodBags.length}</span> of{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{bagsPagination.total}</span> bags
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBagsPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={bagsPagination.page === 1}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, bagsPagination.totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setBagsPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${bagsPagination.page === pageNum ? 'text-white bg-red-600 hover:bg-red-700 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {bagsPagination.totalPages > 5 && <span className="px-2 text-zinc-400">...</span>}
                  <button
                    onClick={() => setBagsPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={bagsPagination.page === bagsPagination.totalPages}
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
      )}

      {/* ============================================================
          ALL MODALS (Same as before - keeping them concise)
          ============================================================ */}

      {/* Blood Bags by Type Modal */}
      {showBagsModal && selectedBloodType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-red-500" />
                  Blood Bags - {selectedBloodType}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {bagsForType.length} individual bag(s) for {selectedBloodType}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBagsModal(false);
                  setSelectedBloodType(null);
                  setBagsForType([]);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {bagsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
              ) : bagsForType.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400">No blood bags found for {selectedBloodType}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bagsForType.map((bag) => {
                    const statusClass = bagStatusColors[bag.status as keyof typeof bagStatusColors] || bagStatusColors.available;
                    return (
                      <div
                        key={bag.id}
                        className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <QrCode className="w-4 h-4 text-zinc-400" />
                              <span className="font-mono text-sm font-medium text-zinc-900 dark:text-white">
                                {bag.batchNumber || bag.id.slice(0, 12).toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Donor:</span>
                                <span className="ml-2 font-medium text-zinc-900 dark:text-white">{bag.donorName || 'Unknown'}</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Donated:</span>
                                <span className="ml-2 text-zinc-900 dark:text-white">{new Date(bag.donationDate).toLocaleDateString()}</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Expires:</span>
                                <span className={`ml-2 font-medium ${bag.isExpired ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
                                  {new Date(bag.expirationDate).toLocaleDateString()}
                                  {bag.isExpired ? ' (Expired)' : ` (${bag.daysRemaining} days left)`}
                                </span>
                              </p>
                              <p className="text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Location:</span>
                                <span className="ml-2 text-zinc-900 dark:text-white">{bag.location}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                              {bag.status.charAt(0).toUpperCase() + bag.status.slice(1)}
                            </span>
                            <button
                              onClick={() => handlePrintBagTag(bag)}
                              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-950/30 rounded-lg transition group"
                              title="Print Bag Tag"
                            >
                              <Printer className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end">
              <button
                onClick={() => {
                  setShowBagsModal(false);
                  setSelectedBloodType(null);
                  setBagsForType([]);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expired Details Modal */}
      {showExpiredDetailsModal && selectedExpired && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                Expired Blood Details
              </h3>
              <button
                onClick={() => setShowExpiredDetailsModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-lg font-bold bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                  <Droplet className="w-5 h-5" />
                  {selectedExpired.bloodType}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400">
                  {selectedExpired.daysOverdue} days overdue
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Donor Name</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedExpired.donorName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Contact</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedExpired.donorEmail || 'N/A'}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedExpired.donorPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Units</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedExpired.units}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Walk-in</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{selectedExpired.isWalkIn ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Donation Date</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {new Date(selectedExpired.donationDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Expiration Date</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {new Date(selectedExpired.expirationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedExpired.notes && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedExpired.notes}</p>
                </div>
              )}

              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  This blood unit expired {selectedExpired.daysOverdue} days ago and should be disposed of.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end">
              <button
                onClick={() => setShowExpiredDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blood Bag Tag Modal */}
      {showBagTagModal && selectedBag && (
        <BloodBagTag
          isOpen={showBagTagModal}
          onClose={() => {
            setShowBagTagModal(false);
            setSelectedBag(null);
          }}
          data={{
            id: selectedBag.id,
            bloodType: selectedBag.bloodType,
            units: selectedBag.units,
            donorName: selectedBag.donorName || 'Unknown',
            donorEmail: selectedBag.donorEmail || '',
            donorPhone: selectedBag.donorPhone || '',
            donationDate: selectedBag.donationDate,
            expirationDate: selectedBag.expirationDate,
            hospitalName: 'Gov. Valeriano M. Gatuslao Memorial Hospital',
            hospitalAddress: 'Himamaylan City, Negros Occidental',
            batchNumber: selectedBag.batchNumber,
            status: selectedBag.isExpired ? 'expired' : 'available',
            daysRemaining: selectedBag.daysRemaining,
            isWalkIn: false,
          }}
        />
      )}

      {/* Add/Edit Inventory Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {selectedItem ? 'Edit Inventory' : 'Add Stock'}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                  setFormData({
                    bloodType: "",
                    quantity: 0,
                    minThreshold: 5,
                    maxThreshold: 20,
                    expiryDate: "",
                    location: "",
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
                  Blood Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="">Select blood type</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Min Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Max Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.maxThreshold}
                    onChange={(e) => setFormData({ ...formData, maxThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="Storage location"
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInventory}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {selectedItem ? 'Update' : 'Add Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Release Blood Modal */}
      <ReleaseBloodModal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
        inventoryItems={inventory}
        onRelease={handleReleaseBlood}
        isReleasing={releasing}
      />

      {/* Inventory History Modal */}
      <InventoryHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        hospitalName="Gov. Valeriano M. Gatuslao Memorial Hospital"
        hospitalAddress="Himamaylan City, Negros Occidental"
      />

      {/* View Inventory Details Modal */}
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
                  {getStatusLabel(selectedItem.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Quantity</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedItem.quantity} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Location</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedItem.location || 'Main Storage'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Min Threshold</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedItem.minThreshold} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Max Threshold</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedItem.maxThreshold} {selectedItem.unit}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Expiry Date</p>
                <p className={`text-sm font-medium ${new Date(selectedItem.expiryDate) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
                  {new Date(selectedItem.expiryDate).toLocaleDateString()}
                  {new Date(selectedItem.expiryDate) < new Date() && (
                    <span className="ml-2 text-xs text-red-600 dark:text-red-400">(Expired)</span>
                  )}
                </p>
              </div>

              {selectedItem.notes && (
                <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</p>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{selectedItem.notes}</p>
                  </div>
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

      {/* View Donation Details Modal */}
      {showDonationDetailsModal && selectedDonation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Donation Details</h3>
              <button
                onClick={() => {
                  setShowDonationDetailsModal(false);
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