// app/hospital/blood-drives/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  MapPin,
  Clock,
  Users,
  Droplet,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Heart,
  Clock as ClockIcon,
  Info,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Syringe,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Clock as ClockIcon2
} from "lucide-react";
import { useRouter } from "next/navigation";

interface BloodDrive {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  bloodTypesNeeded: string[];
  targetDonors: number;
  registeredDonors: number;
  completedDonations: number;
  organizer: string;
  contactNumber: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface Registrant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  registeredAt: string;
  status: 'registered' | 'attended' | 'cancelled';
  donationStatus?: 'pending' | 'approved' | 'rejected' | 'completed';
  donationId?: string;
}

const statusColors = {
  upcoming: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  ongoing: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  completed: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400",
  cancelled: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
};

const statusIcons = {
  upcoming: <ClockIcon className="w-3 h-3" />,
  ongoing: <Heart className="w-3 h-3" />,
  completed: <Check className="w-3 h-3" />,
  cancelled: <X className="w-3 h-3" />,
};

export default function HospitalBloodDrivesPage() {
  const router = useRouter();
  const [bloodDrives, setBloodDrives] = useState<BloodDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDrive, setSelectedDrive] = useState<BloodDrive | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegistrantsModal, setShowRegistrantsModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState<Registrant | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [registrantsLoading, setRegistrantsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [donationForm, setDonationForm] = useState({
    donorId: '',
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    bloodType: '',
    units: 1,
    donationDate: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [registrantFilter, setRegistrantFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    address: "",
    date: "",
    startTime: "",
    endTime: "",
    bloodTypesNeeded: [] as string[],
    targetDonors: 50,
    organizer: "",
    contactNumber: "",
    contactEmail: "",
  });

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
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

  const getDonationStatusBadge = (status?: string) => {
    switch(status) {
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full flex items-center gap-1"><ClockIcon2 className="w-3 h-3" /> Pending</span>;
      case 'approved':
        return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Approved</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full flex items-center gap-1"><X className="w-3 h-3" /> Rejected</span>;
      case 'completed':
        return <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">Unknown</span>;
    }
  };

  const fetchBloodDrives = useCallback(async () => {
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
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/hospital/blood-drives?${params.toString()}`, {
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
        throw new Error('Failed to fetch blood drives');
      }

      const data = await response.json();
      setBloodDrives(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (err) {
      console.error('Error fetching blood drives:', err);
      setError('Failed to load blood drives. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, pagination.page, router]);

  useEffect(() => {
    fetchBloodDrives();
  }, [fetchBloodDrives]);

 const fetchRegistrants = async (driveId: string) => {
  try {
    setRegistrantsLoading(true);
    const token = localStorage.getItem('token');
    
    const response = await fetch(`/api/hospital/blood-drives/${driveId}/registrants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📋 Raw registrants data:', data.data);
      
      // Ensure each registrant has a donationStatus
      const registrantsWithStatus = (data.data || []).map((r: Registrant) => ({
        ...r,
        // If donationStatus is not set, default to 'pending'
        donationStatus: r.donationStatus || 'pending'
      }));
      
      console.log('✅ Registrants with status:', registrantsWithStatus);
      setRegistrants(registrantsWithStatus);
    } else {
      const errorData = await response.json();
      showToast('error', errorData.error || 'Failed to fetch registrants');
    }
  } catch (error) {
    console.error('Error fetching registrants:', error);
    showToast('error', 'Failed to fetch registrants');
  } finally {
    setRegistrantsLoading(false);
  }
};
  const handleCreateDrive = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/hospital/blood-drives', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          title: "",
          description: "",
          location: "",
          address: "",
          date: "",
          startTime: "",
          endTime: "",
          bloodTypesNeeded: [],
          targetDonors: 50,
          organizer: "",
          contactNumber: "",
          contactEmail: "",
        });
        await fetchBloodDrives();
        showToast('success', 'Blood drive created successfully! 🎉');
      } else {
        showToast('error', data.error || 'Failed to create blood drive');
      }
    } catch (error) {
      console.error('Error creating blood drive:', error);
      showToast('error', 'Failed to create blood drive. Please try again.');
    }
  };

  const handleApproveDonor = async (registrant: Registrant) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/hospital/blood-drives/${selectedDrive?.id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ registrantId: registrant.id })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('success', `${registrant.fullName} has been approved! ✅`);
        if (selectedDrive) {
          await fetchRegistrants(selectedDrive.id);
        }
      } else {
        showToast('error', data.error || 'Failed to approve donor');
      }
    } catch (error) {
      console.error('Error approving donor:', error);
      showToast('error', 'Failed to approve donor');
    }
  };

  const handleRejectDonor = async (registrant: Registrant) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/hospital/blood-drives/${selectedDrive?.id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ registrantId: registrant.id })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('info', `${registrant.fullName} has been rejected.`);
        if (selectedDrive) {
          await fetchRegistrants(selectedDrive.id);
        }
      } else {
        showToast('error', data.error || 'Failed to reject donor');
      }
    } catch (error) {
      console.error('Error rejecting donor:', error);
      showToast('error', 'Failed to reject donor');
    }
  };

  const handleConfirmDonation = async () => {
    if (!selectedRegistrant || !selectedDrive) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const donationData = {
        donorId: selectedRegistrant.id,
        donorName: selectedRegistrant.fullName,
        donorEmail: selectedRegistrant.email,
        donorPhone: selectedRegistrant.phone,
        bloodDriveId: selectedDrive.id,
        bloodDriveTitle: selectedDrive.title,
        bloodType: donationForm.bloodType || selectedRegistrant.bloodType,
        units: donationForm.units,
        donationDate: donationForm.donationDate || new Date().toISOString().split('T')[0],
        notes: donationForm.notes,
      };

      const response = await fetch('/api/hospital/donations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationData)
      });

      const data = await response.json();

      if (response.ok) {
        let message = `✅ Donation confirmed for ${selectedRegistrant.fullName}!`;
        
        if (data.data?.inventoryUpdated && data.data?.expirationDate) {
          const expDate = new Date(data.data.expirationDate).toLocaleDateString();
          message += ` ✅ Added to inventory. Expires: ${expDate}`;
        } else if (data.data?.inventoryUpdated) {
          message += ' ✅ Added to inventory!';
        } else {
          message += ' ⚠️ Inventory update failed, but donation was recorded.';
        }
        
        showToast('success', message);
        setShowDonationModal(false);
        setSelectedRegistrant(null);
        setDonationForm({
          donorId: '',
          donorName: '',
          donorEmail: '',
          donorPhone: '',
          bloodType: '',
          units: 1,
          donationDate: '',
          notes: '',
        });
        await fetchBloodDrives();
        if (selectedDrive) {
          await fetchRegistrants(selectedDrive.id);
        }
      } else {
        showToast('error', data.error || 'Failed to confirm donation');
      }
    } catch (error) {
      console.error('Error confirming donation:', error);
      showToast('error', 'Failed to confirm donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDonationModal = (registrant: Registrant) => {
    setSelectedRegistrant(registrant);
    setDonationForm({
      donorId: registrant.id,
      donorName: registrant.fullName,
      donorEmail: registrant.email,
      donorPhone: registrant.phone,
      bloodType: registrant.bloodType,
      units: 1,
      donationDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowDonationModal(true);
  };

  const filteredRegistrants = registrants.filter(r => {
    if (registrantFilter === 'all') return true;
    return r.donationStatus === registrantFilter;
  });

  const getStatusCount = (status: string) => {
    return registrants.filter(r => r.donationStatus === status).length;
  };

  if (loading && bloodDrives.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading blood drives...</p>
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
            <Calendar className="w-8 h-8 text-red-500" />
            Blood Drives
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            Manage blood drives, registrants, and donations
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium shadow-lg shadow-red-200 dark:shadow-red-900/30"
          >
            <Plus className="w-4 h-4" />
            New Blood Drive
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Drives</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{pagination.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Upcoming</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {bloodDrives.filter(d => d.status === 'upcoming').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ongoing</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {bloodDrives.filter(d => d.status === 'ongoing').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
          <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400 mt-1">
            {bloodDrives.filter(d => d.status === 'completed').length}
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
              placeholder="Search blood drives..."
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
              <option value="upcoming">⏳ Upcoming</option>
              <option value="ongoing">🟢 Ongoing</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>

            <button
              onClick={fetchBloodDrives}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Blood Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bloodDrives.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">No blood drives found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium"
            >
              Create Your First Blood Drive
            </button>
          </div>
        ) : (
          bloodDrives.map((drive) => (
            <div
              key={drive.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[drive.status]}`}>
                    {statusIcons[drive.status]}
                    {getStatusLabel(drive.status)}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {new Date(drive.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-1">
                  {drive.title}
                </h3>

                <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{drive.location}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {drive.bloodTypesNeeded.slice(0, 4).map((type) => (
                    <span
                      key={type}
                      className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium rounded"
                    >
                      {type}
                    </span>
                  ))}
                  {drive.bloodTypesNeeded.length > 4 && (
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded">
                      +{drive.bloodTypesNeeded.length - 4}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Target</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{drive.targetDonors}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Registered</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{drive.registeredDonors}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Donated</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{drive.completedDonations}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    onClick={() => {
                      setSelectedDrive(drive);
                      fetchRegistrants(drive.id);
                      setShowRegistrantsModal(true);
                    }}
                    className="flex items-center gap-1 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-950/30 rounded-lg transition group"
                    title="View Registrants"
                  >
                    <Users className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                    <span className="text-xs text-blue-500 font-medium">
                      ({drive.registeredDonors})
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDrive(drive);
                      setShowDetailsModal(true);
                    }}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {bloodDrives.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{bloodDrives.length}</span> of{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{pagination.total}</span> blood drives
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
      )}

      {/* Create Blood Drive Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Create Blood Drive</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* ... form fields ... */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="e.g., Community Blood Drive 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  placeholder="Describe the blood drive event..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="e.g., City Hall"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Blood Types Needed
                </label>
                <div className="flex flex-wrap gap-2">
                  {bloodTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        const types = formData.bloodTypesNeeded.includes(type)
                          ? formData.bloodTypesNeeded.filter(t => t !== type)
                          : [...formData.bloodTypesNeeded, type];
                        setFormData({ ...formData, bloodTypesNeeded: types });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        formData.bloodTypesNeeded.includes(type)
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Target Donors <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.targetDonors}
                    onChange={(e) => setFormData({ ...formData, targetDonors: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Organizer
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="Organizer name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="Contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="contact@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDrive}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Blood Drive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Blood Drive Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedDrive.title}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selectedDrive.status]}`}>
                  {statusIcons[selectedDrive.status]}
                  {getStatusLabel(selectedDrive.status)}
                </span>
              </div>

              <p className="text-zinc-600 dark:text-zinc-400">{selectedDrive.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Location</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDrive.location}</p>
                  {selectedDrive.address && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{selectedDrive.address}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Date & Time</p>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    {new Date(selectedDrive.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedDrive.startTime} - {selectedDrive.endTime}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Target Donors</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedDrive.targetDonors}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Registered</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedDrive.registeredDonors}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Donated</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedDrive.completedDonations}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Blood Types Needed</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDrive.bloodTypesNeeded.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Organizer</p>
                <p className="text-sm text-zinc-900 dark:text-white">{selectedDrive.organizer || 'Not specified'}</p>
                {(selectedDrive.contactNumber || selectedDrive.contactEmail) && (
                  <div className="mt-2 space-y-1">
                    {selectedDrive.contactNumber && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">📞 {selectedDrive.contactNumber}</p>
                    )}
                    {selectedDrive.contactEmail && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">✉️ {selectedDrive.contactEmail}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-500" />
                  Registered Donors ({selectedDrive.registeredDonors})
                </h4>
                {selectedDrive.registeredDonors === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No registered donors yet</p>
                ) : (
                  <button
                    onClick={() => {
                      fetchRegistrants(selectedDrive.id);
                      setShowRegistrantsModal(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View all {selectedDrive.registeredDonors} registered donor{selectedDrive.registeredDonors !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registrants Modal */}
      {showRegistrantsModal && selectedDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Registered Donors
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {selectedDrive.title} • {selectedDrive.registeredDonors} registered donor{selectedDrive.registeredDonors !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRegistrantsModal(false);
                  setRegistrants([]);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6">
              {registrantsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
              ) : registrants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400">No registered donors yet</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                    Donors will appear here when they register for this blood drive
                  </p>
                </div>
              ) : (
                <>
                  {/* Status Filter Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-3 mb-4">
                    <button
                      onClick={() => setRegistrantFilter('all')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        registrantFilter === 'all'
                          ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      All ({registrants.length})
                    </button>
                    <button
                      onClick={() => setRegistrantFilter('pending')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        registrantFilter === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Pending ({getStatusCount('pending')})
                    </button>
                    <button
                      onClick={() => setRegistrantFilter('approved')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        registrantFilter === 'approved'
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Approved ({getStatusCount('approved')})
                    </button>
                    <button
                      onClick={() => setRegistrantFilter('completed')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        registrantFilter === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Completed ({getStatusCount('completed')})
                    </button>
                    <button
                      onClick={() => setRegistrantFilter('rejected')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        registrantFilter === 'rejected'
                          ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Rejected ({getStatusCount('rejected')})
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredRegistrants.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-zinc-500 dark:text-zinc-400">No registrants with this status</p>
                      </div>
                    ) : (
                      filteredRegistrants.map((registrant) => (
                        <div
                          key={registrant.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition gap-4"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm flex-shrink-0">
                              {getInitials(registrant.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-zinc-900 dark:text-white truncate">
                                {registrant.fullName}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{registrant.email}</span>
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  {registrant.phone}
                                </span>
                                <span className="text-xs font-medium px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded">
                                  {registrant.bloodType}
                                </span>
                                <span className="text-xs">
                                  {getDonationStatusBadge(registrant.donationStatus)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {registrant.donationStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveDonor(registrant)}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectDonor(registrant)}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-1"
                                >
                                  <UserX className="w-3 h-3" />
                                  Reject
                                </button>
                              </>
                            )}
                            {registrant.donationStatus === 'approved' && (
                              <button
                                onClick={() => openDonationModal(registrant)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1"
                              >
                                <Syringe className="w-3 h-3" />
                                Confirm Donation
                              </button>
                            )}
                            {registrant.donationStatus === 'completed' && (
                              <span className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Donated
                              </span>
                            )}
                            {registrant.donationStatus === 'rejected' && (
                              <span className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                              {new Date(registrant.registeredAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Donation Modal */}
      {showDonationModal && selectedRegistrant && selectedDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Syringe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Confirm Blood Donation</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Record donation for {selectedRegistrant.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDonationModal(false);
                  setSelectedRegistrant(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Donor Info */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Donor</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {selectedRegistrant.fullName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Blood Drive</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {selectedDrive.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Email</span>
                  <span className="text-sm text-zinc-900 dark:text-white">
                    {selectedRegistrant.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Phone</span>
                  <span className="text-sm text-zinc-900 dark:text-white">
                    {selectedRegistrant.phone}
                  </span>
                </div>
              </div>

              {/* Blood Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Blood Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={donationForm.bloodType}
                  onChange={(e) => setDonationForm({ ...donationForm, bloodType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
                >
                  {bloodTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Units Collected */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Units Collected <span className="text-red-500">*</span>
                </label>
                <select
                  value={donationForm.units}
                  onChange={(e) => setDonationForm({ ...donationForm, units: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} Unit{num !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Donation Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Donation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={donationForm.donationDate}
                  onChange={(e) => setDonationForm({ ...donationForm, donationDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  placeholder="Additional notes about the donation..."
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  This will mark the donor as having completed their donation.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDonationModal(false);
                    setSelectedRegistrant(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDonation}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Confirm Donation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}