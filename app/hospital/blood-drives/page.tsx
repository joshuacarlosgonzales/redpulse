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
  Clock as ClockIcon2,
  History,
  FileText,
  UserPlus,
  User,
  CalendarDays,
  CheckCheck
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
  donationDate?: string;
  units?: number;
  notes?: string;
  isWalkIn?: boolean;
}

const getCurrentStatus = (
  drive: BloodDrive
): "upcoming" | "ongoing" | "completed" | "cancelled" => {
  // If explicitly cancelled, return cancelled
  if (drive.status === "cancelled") return "cancelled";

  const now = new Date();

  // Parse the date correctly.
  // BloodDrive.date is defined as a string.
  const driveDate = new Date(drive.date);

  // Check if the date is valid
  if (isNaN(driveDate.getTime())) {
    console.warn("⚠️ Invalid date detected:", drive.date);
    return drive.status;
  }

  // Get start and end times with proper defaults
  const startTime = drive.startTime || "00:00";
  const endTime = drive.endTime || "23:59";

  // Parse times
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  // Create Date objects for start and end times
  const startDateTime = new Date(driveDate);
  startDateTime.setHours(
    startHour || 0,
    startMinute || 0,
    0,
    0
  );

  const endDateTime = new Date(driveDate);
  endDateTime.setHours(
    endHour || 23,
    endMinute || 59,
    59,
    999
  );

  // Get timestamps for comparison
  const nowTime = now.getTime();
  const driveTime = driveDate.getTime();
  const startTimeMs = startDateTime.getTime();
  const endTimeMs = endDateTime.getTime();

  // If the drive date is today
  if (driveDate.toDateString() === now.toDateString()) {
    // Current time is between start and end time
    if (nowTime >= startTimeMs && nowTime <= endTimeMs) {
      return "ongoing";
    }

    // Current time is before start time
    if (nowTime < startTimeMs) {
      return "upcoming";
    }

    // Current time is after end time
    if (nowTime > endTimeMs) {
      return "completed";
    }
  }

  // If the drive date is in the future
  if (driveTime > nowTime) {
    return "upcoming";
  }

  // If the drive date is in the past
  if (driveTime < nowTime) {
    return "completed";
  }

  // Default fallback
  return drive.status;
};

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
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedDrive, setSelectedDrive] = useState<BloodDrive | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegistrantsModal, setShowRegistrantsModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
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
  const [registrantFilter, setRegistrantFilter] = useState<'all' | 'approved' | 'rejected' | 'completed' | 'history'>('all');

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

  const [walkInForm, setWalkInForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    bloodType: '',
    units: 1,
    donationDate: new Date().toISOString().split('T')[0],
    notes: '',
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

  // ✅ FIXED: Fetch blood drives with proper status calculation
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
      
      // ✅ Process drives with correct status
      const processedDrives = (data.data || []).map((drive: BloodDrive) => {
        // ✅ Calculate the correct status based on date
        const calculatedStatus = getCurrentStatus(drive);
        
        return {
          ...drive,
          status: calculatedStatus
        };
      });
      
      // Sort by date (newest first)
      const sortedDrives = processedDrives.sort((a: BloodDrive, b: BloodDrive) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setBloodDrives(sortedDrives);
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

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBloodDrives();
    }, 60000);
    return () => clearInterval(interval);
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
        const registrantsWithStatus = (data.data || []).map((r: Registrant) => ({
          ...r,
          donationStatus: r.donationStatus || 'pending'
        }));
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
          await fetchBloodDrives();
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
          await fetchBloodDrives();
        }
      } else {
        showToast('error', data.error || 'Failed to reject donor');
      }
    } catch (error) {
      console.error('Error rejecting donor:', error);
      showToast('error', 'Failed to reject donor');
    }
  };

  // ✅ FIXED: Handle confirm donation with proper status update
  const handleConfirmDonation = async () => {
    if (!selectedRegistrant || !selectedDrive) {
      showToast('error', 'Missing donor or blood drive information');
      return;
    }

    // ✅ Check if already completed to prevent double confirmation
    if (selectedRegistrant.donationStatus === 'completed') {
      showToast('info', 'This donor has already completed their donation.');
      setShowDonationModal(false);
      setSelectedRegistrant(null);
      return;
    }

    // Validate donation form
    if (!donationForm.bloodType) {
      showToast('error', 'Blood type is required');
      return;
    }
    if (donationForm.units < 1) {
      showToast('error', 'Units must be at least 1');
      return;
    }
    if (!donationForm.donationDate) {
      showToast('error', 'Donation date is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      if (!token) {
        showToast('error', 'Please login again');
        router.push('/auth/login');
        return;
      }

      const requestData = {
        donorId: selectedRegistrant.id,
        units: donationForm.units,
        bloodType: donationForm.bloodType,
        donationDate: donationForm.donationDate,
        notes: donationForm.notes || '',
      };

      console.log('📤 Sending donation confirmation:', requestData);

      const response = await fetch(`/api/hospital/blood-drives/${selectedDrive.id}/donations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Try to parse the response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        showToast('error', 'Server returned an invalid response. Please try again.');
        return;
      }

      console.log('📥 Donation response:', data);

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Server error: ${response.status}`;
        showToast('error', errorMessage);
        return;
      }

      // ✅ CRITICAL FIX: Update the registrant's status to 'completed' immediately
      // This updates the UI without waiting for server refresh
      setRegistrants(prevRegistrants => {
        const updated = prevRegistrants.map(r => {
          if (r.id === selectedRegistrant.id) {
            return { 
              ...r, 
              donationStatus: 'completed' as const,
              donationDate: donationForm.donationDate,
              units: donationForm.units,
              notes: donationForm.notes || r.notes,
              donationId: data?.data?.donationId || r.donationId
            };
          }
          return r;
        });
        console.log('✅ Updated registrants:', updated);
        return updated;
      });

      // ✅ Update the blood drive stats
      setBloodDrives(prevDrives => {
        const updated = prevDrives.map(d => {
          if (d.id === selectedDrive.id) {
            return { 
              ...d, 
              completedDonations: d.completedDonations + donationForm.units,
            };
          }
          return d;
        });
        return updated;
      });

      // ✅ Update selectedDrive state
      if (selectedDrive) {
        setSelectedDrive({
          ...selectedDrive,
          completedDonations: selectedDrive.completedDonations + donationForm.units
        });
      }

      // Show success message
      let message = `✅ Donation confirmed for ${selectedRegistrant.fullName}!`;
      if (data?.data?.inventoryUpdated && data?.data?.expirationDate) {
        const expDate = new Date(data.data.expirationDate).toLocaleDateString();
        message += ` ✅ Added to inventory. Expires: ${expDate}`;
      } else if (data?.data?.inventoryUpdated) {
        message += ' ✅ Added to inventory!';
      } else {
        message += ' ⚠️ Inventory update failed, but donation was recorded.';
      }
      showToast('success', message);

      // ✅ Close modal and reset form
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

      // ✅ IMPORTANT: Only refresh blood drives, NOT registrants
      // This prevents the status from reverting back to 'approved'
      await fetchBloodDrives();

    } catch (error) {
      console.error('❌ Error confirming donation:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to confirm donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDonationModal = (registrant: Registrant) => {
    // ✅ Prevent opening donation modal for already completed donors
    if (registrant.donationStatus === 'completed') {
      showToast('info', 'This donor has already completed their donation.');
      return;
    }
    
    // ✅ Prevent opening for rejected donors
    if (registrant.donationStatus === 'rejected') {
      showToast('info', 'This donor has been rejected.');
      return;
    }
    
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

  const openWalkInModal = () => {
    if (selectedDrive && getCurrentStatus(selectedDrive) === 'completed') {
      showToast('error', 'Cannot add walk-in donors to a completed blood drive.');
      return;
    }
    setWalkInForm({
      fullName: '',
      email: '',
      phone: '',
      bloodType: '',
      units: 1,
      donationDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowWalkInModal(true);
  };

  // ✅ FIXED: Handle walk-in donation properly
  const handleWalkInDonation = async () => {
    if (!selectedDrive) {
      showToast('error', 'No blood drive selected');
      return;
    }

    const currentStatus = getCurrentStatus(selectedDrive);
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      showToast('error', `Cannot add walk-in donor to a ${currentStatus} blood drive.`);
      return;
    }

    // Validate form
    if (!walkInForm.fullName.trim()) {
      showToast('error', 'Donor name is required');
      return;
    }
    if (!walkInForm.bloodType) {
      showToast('error', 'Blood type is required');
      return;
    }
    if (walkInForm.units < 1) {
      showToast('error', 'Units must be at least 1');
      return;
    }
    if (!walkInForm.donationDate) {
      showToast('error', 'Donation date is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      if (!token) {
        showToast('error', 'Please login again');
        router.push('/auth/login');
        return;
      }

      // ✅ Send ALL donor information to the backend
      const requestData = {
        fullName: walkInForm.fullName.trim(),
        email: walkInForm.email.trim() || `${walkInForm.fullName.replace(/\s/g, '').toLowerCase()}@walkin.com`,
        phone: walkInForm.phone.trim() || 'N/A',
        bloodType: walkInForm.bloodType,
        units: walkInForm.units,
        donationDate: walkInForm.donationDate,
        notes: walkInForm.notes || 'Walk-in donor',
        isWalkIn: true,
        address: 'Walk-in Donor',
        dateOfBirth: new Date('2000-01-01').toISOString().split('T')[0],
        gender: 'Other',
        weight: 50,
        barangay: 'Walk-in',
        municipality: 'Walk-in',
        province: 'Walk-in',
      };

      console.log('📤 Sending walk-in donation with donor info:', {
        fullName: requestData.fullName,
        email: requestData.email,
        phone: requestData.phone,
        bloodType: requestData.bloodType,
      });

      const response = await fetch(`/api/hospital/blood-drives/${selectedDrive.id}/walk-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Try to parse the response
      let data;
      try {
        const text = await response.text();
        console.log('📥 Raw response:', text);
        
        if (text) {
          data = JSON.parse(text);
        } else {
          showToast('error', 'Server returned an empty response');
          return;
        }
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        showToast('error', 'Server returned an invalid response. Please try again.');
        return;
      }

      console.log('📥 Walk-in response:', data);

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Server error: ${response.status}`;
        showToast('error', errorMessage);
        return;
      }

      // Success - Show donor name from response
      const donorName = data?.data?.donorName || walkInForm.fullName;
      let message = `✅ Walk-in donation recorded for ${donorName}!`;
      
      if (data?.data?.inventoryUpdated && data?.data?.expirationDate) {
        const expDate = new Date(data.data.expirationDate).toLocaleDateString();
        message += ` ✅ Added to inventory. Expires: ${expDate}`;
      } else if (data?.data?.inventoryUpdated) {
        message += ' ✅ Added to inventory!';
      } else {
        message += ' ⚠️ Inventory update may have failed, but donation was recorded.';
      }
      
      showToast('success', message);
      setShowWalkInModal(false);
      setWalkInForm({
        fullName: '',
        email: '',
        phone: '',
        bloodType: '',
        units: 1,
        donationDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      
      // Refresh data
      await fetchBloodDrives();
      if (selectedDrive) {
        await fetchRegistrants(selectedDrive.id);
      }
    } catch (error) {
      console.error('❌ Error with walk-in donation:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to record walk-in donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRegistrants = registrants.filter(r => {
    if (registrantFilter === 'all') return true;
    if (registrantFilter === 'history') return r.donationStatus === 'completed';
    return r.donationStatus === registrantFilter;
  });

  const getStatusCount = (status: string) => {
    return registrants.filter(r => r.donationStatus === status).length;
  };

  // Calculate active and completed drives for tabs
  const activeDrives = bloodDrives.filter(drive => {
    const status = getCurrentStatus(drive);
    return status === 'upcoming' || status === 'ongoing';
  });

  const completedDrives = bloodDrives.filter(drive => {
    const status = getCurrentStatus(drive);
    return status === 'completed' || status === 'cancelled';
  });

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
        
        <div className="flex items-center gap-3 flex-wrap">
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
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{bloodDrives.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Upcoming</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {bloodDrives.filter(d => getCurrentStatus(d) === 'upcoming').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ongoing</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {bloodDrives.filter(d => getCurrentStatus(d) === 'ongoing').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
          <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400 mt-1">
            {bloodDrives.filter(d => getCurrentStatus(d) === 'completed').length}
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Active Drives
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'active'
              ? 'bg-white/20 text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
          }`}>
            {activeDrives.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-zinc-700 text-white shadow-lg shadow-zinc-200 dark:shadow-zinc-900/30'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          Completed
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'completed'
              ? 'bg-white/20 text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
          }`}>
            {completedDrives.length}
          </span>
        </button>
      </div>

      {/* Blood Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === 'active' ? activeDrives : completedDrives).length === 0 ? (
          <div className="col-span-full text-center py-12">
            {activeTab === 'active' ? (
              <>
                <CalendarDays className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400">No active blood drives</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium"
                >
                  Create Your First Blood Drive
                </button>
              </>
            ) : (
              <>
                <CheckCheck className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400">No completed blood drives yet</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                  Completed drives will appear here once they're finished
                </p>
              </>
            )}
          </div>
        ) : (
          (activeTab === 'active' ? activeDrives : completedDrives).map((drive) => {
            const currentStatus = getCurrentStatus(drive);
            const isCompleted = currentStatus === 'completed' || currentStatus === 'cancelled';
            
            return (
              <div
                key={drive.id}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border ${
                  isCompleted 
                    ? 'border-zinc-200/60 dark:border-zinc-800/60 opacity-75' 
                    : 'border-zinc-200/60 dark:border-zinc-800/60'
                } shadow-sm hover:shadow-md transition-all overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[currentStatus]}`}>
                      {statusIcons[currentStatus]}
                      {getStatusLabel(currentStatus)}
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
            );
          })
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
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[getCurrentStatus(selectedDrive)]}`}>
                  {statusIcons[getCurrentStatus(selectedDrive)]}
                  {getStatusLabel(getCurrentStatus(selectedDrive))}
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
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Registered Donors ({selectedDrive.registeredDonors})
                  </h4>
                  {getCurrentStatus(selectedDrive) !== 'completed' && getCurrentStatus(selectedDrive) !== 'cancelled' && (
                    <button
                      onClick={openWalkInModal}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Walk-in Donor
                    </button>
                  )}
                  {getCurrentStatus(selectedDrive) === 'completed' && (
                    <span className="px-3 py-1.5 text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Drive Completed
                    </span>
                  )}
                </div>
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
              <div className="flex items-center gap-2">
                {getCurrentStatus(selectedDrive) !== 'completed' && getCurrentStatus(selectedDrive) !== 'cancelled' && (
                  <button
                    onClick={openWalkInModal}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    Walk-in
                  </button>
                )}
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
                      onClick={() => setRegistrantFilter('rejected')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        registrantFilter === 'rejected'
                          ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Rejected ({getStatusCount('rejected')})
                    </button>
                    <button
                      onClick={() => setRegistrantFilter('history')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition flex items-center gap-1.5 ${
                        registrantFilter === 'history'
                          ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <History className="w-3 h-3" />
                      History ({getStatusCount('completed')})
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredRegistrants.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-zinc-500 dark:text-zinc-400">
                          {registrantFilter === 'history' 
                            ? 'No donation history yet. Complete a donation to see it here.' 
                            : 'No registrants with this status'}
                        </p>
                        {registrantFilter === 'history' && (
                          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                            After confirming a donation, it will appear in the History tab.
                          </p>
                        )}
                      </div>
                    ) : (
                      filteredRegistrants.map((registrant) => {
                        const isHistory = registrantFilter === 'history';
                        const isWalkIn = registrant.isWalkIn;
                        return (
                          <div
                            key={registrant.id}
                            className={`p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border ${
                              isHistory 
                                ? 'border-purple-200 dark:border-purple-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/20' 
                                : isWalkIn
                                ? 'border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            } transition gap-4`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                                  isHistory 
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                                    : isWalkIn
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                }`}>
                                  {getInitials(registrant.fullName)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-zinc-900 dark:text-white truncate">
                                    {registrant.fullName}
                                    {isWalkIn && (
                                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                        (Walk-in)
                                      </span>
                                    )}
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
                              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                {isHistory && (
                                  <>
                                    <span className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/30 rounded-lg flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      {registrant.units || 1} unit(s)
                                    </span>
                                    {registrant.donationDate && (
                                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                        {new Date(registrant.donationDate).toLocaleDateString()}
                                      </span>
                                    )}
                                    {registrant.notes && (
                                      <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[100px]">
                                        📝 {registrant.notes}
                                      </span>
                                    )}
                                  </>
                                )}
                                {!isHistory && registrant.donationStatus === 'approved' && (
                                  <>
                                    <button
                                      onClick={() => openDonationModal(registrant)}
                                      className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-1"
                                    >
                                      <Syringe className="w-3 h-3" />
                                      Confirm Donation
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
                                {!isHistory && registrant.donationStatus === 'pending' && (
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
                                {!isHistory && registrant.donationStatus === 'completed' && (
                                  <span className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Completed
                                  </span>
                                )}
                                {!isHistory && registrant.donationStatus === 'rejected' && (
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
                            {isHistory && registrant.notes && (
                              <div className="mt-2 pt-2 border-t border-purple-100 dark:border-purple-800/30">
                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                  <span className="font-medium">Notes:</span> {registrant.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })
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

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Blood Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select
                    value={donationForm.bloodType}
                    onChange={(e) => setDonationForm({ ...donationForm, bloodType: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
                  >
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

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

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Donation Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="date"
                    value={donationForm.donationDate}
                    onChange={(e) => setDonationForm({ ...donationForm, donationDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  placeholder="Additional notes about the donation..."
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  This will mark the donor as having completed their donation and update the inventory.
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
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm Donation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Donor Modal */}
      {showWalkInModal && selectedDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Walk-in Donor</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Record a walk-in blood donation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={walkInForm.fullName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="Enter donor's full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      value={walkInForm.email}
                      onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="donor@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={walkInForm.phone}
                      onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="Contact number"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Blood Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select
                    value={walkInForm.bloodType}
                    onChange={(e) => setWalkInForm({ ...walkInForm, bloodType: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
                  >
                    <option value="">Select blood type</option>
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Units <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={walkInForm.units}
                    onChange={(e) => setWalkInForm({ ...walkInForm, units: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} Unit{num !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Donation Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="date"
                      value={walkInForm.donationDate}
                      onChange={(e) => setWalkInForm({ ...walkInForm, donationDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={walkInForm.notes}
                  onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  placeholder="Additional notes about the walk-in donor..."
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  This will register the walk-in donor and record their donation immediately.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowWalkInModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWalkInDonation}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Record Donation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}