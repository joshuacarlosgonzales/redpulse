// app/admin/donors/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  X,
  Check,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  Loader2,
  PhoneCall,
  Clipboard,
  UserCircle,
  Weight,
  Calendar as CalendarIcon,
  IdCard,
  Activity,
  User,
  Bell,
  Send,
  Info,
  UserPlus,
  UserCog,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Donor {
  id: string;
  _id?: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  status: "active" | "inactive" | "pending" | "approved" | "rejected";
  location: string;
  lastDonation: string;
  totalDonations: number;
  registered: string;
  nextEligible: string;
  digitalId: string;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  dateOfBirth: string;
  gender: string;
  weight: number;
  emergencyContact: string;
  medicalConditions: string;
  currentMedications: string;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  isEligible?: boolean;
  points?: number;
  emergencyName?: string;
  emergencyRelationship?: string;
  registrationType?: "walk-in" | "system";
  isWalkIn?: boolean;
}

const bloodTypes = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AdminDonorsPage() {
  const router = useRouter();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'walk-in'>('all');
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationSubject, setNotificationSubject] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [notificationSent, setNotificationSent] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 0,
  });
  
  // ============ ADDED: Store total counts separately ============
  const [totalCounts, setTotalCounts] = useState({
    totalDonors: 0,
    systemDonors: 0,
    walkInDonors: 0,
    pendingDonors: 0,
    activeDonors: 0,
  });

  const fetchDonors = useCallback(async () => {
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
      if (bloodTypeFilter !== 'all') params.append('bloodType', bloodTypeFilter);
      
      if (activeTab === 'system') {
        params.append('registrationType', 'system');
      } else if (activeTab === 'walk-in') {
        params.append('registrationType', 'walk-in');
      }
      
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/donors?${params.toString()}`, {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch donors (${response.status})`);
      }

      const data = await response.json();
      
      const donorsWithIds = (data.donors || []).map((donor: any) => {
        const donorId = donor.id || donor._id;
        return {
          ...donor,
          id: donorId,
          _id: donor._id || donorId,
          userId: donor.userId || '',
          registrationType: donor.registrationType || 'system',
          isWalkIn: donor.registrationType === 'walk-in',
        };
      });
      
      setDonors(donorsWithIds);
      setPagination(data.pagination || { total: 0, page: 1, limit: 8, totalPages: 0 });
      
      // ============ UPDATE: Calculate total counts from ALL donors ============
      // We need to fetch ALL donors to get accurate counts, or we can use the pagination total
      // For now, we'll calculate from the current donors list but only if we're on 'all' tab
      // A better approach: fetch total counts from a separate API or use the pagination.total
      
      // Since pagination.total is the total number of donors (all types), we use that
      // For system/walk-in breakdown, we need to calculate from the current donors
      // But since we're on the 'all' tab when counts are calculated, we can use that
      
    } catch (err) {
      console.error('❌ Error fetching donors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load donors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, bloodTypeFilter, activeTab, pagination.page, router]);

  // ============ ADDED: Fetch total counts separately ============
  const fetchTotalCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch all donors (first page only) to calculate counts
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '100'); // Fetch more to get all counts

      const response = await fetch(`/api/admin/donors?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allDonors = data.donors || [];
        
        const systemCount = allDonors.filter((d: any) => d.registrationType === 'system' || (!d.registrationType && !d.isWalkIn)).length;
        const walkInCount = allDonors.filter((d: any) => d.registrationType === 'walk-in' || d.isWalkIn === true).length;
        const pendingCount = allDonors.filter((d: any) => d.status === 'pending').length;
        const activeCount = allDonors.filter((d: any) => d.status === 'active' || d.status === 'approved').length;
        
        setTotalCounts({
          totalDonors: data.pagination?.total || allDonors.length,
          systemDonors: systemCount,
          walkInDonors: walkInCount,
          pendingDonors: pendingCount,
          activeDonors: activeCount,
        });
      }
    } catch (err) {
      console.error('Failed to fetch total counts:', err);
    }
  }, []);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  // ============ ADDED: Fetch total counts when component mounts ============
  useEffect(() => {
    fetchTotalCounts();
  }, []);

  // ============ HANDLER FUNCTIONS ============
  
  const handleApprove = async (donorId: string) => {
    try {
      setProcessingId(donorId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      const donor = donors.find(d => d.id === donorId);
      if (!donor) {
        alert('Donor not found. Please refresh the page and try again.');
        setProcessingId(null);
        return;
      }

      const response = await fetch(`/api/admin/donors/${donorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'approve'
        })
      });

      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve donor');
      }

      setDonors(prev => prev.map(d => 
        d.id === donorId 
          ? { 
              ...d, 
              status: 'active', 
              approvedAt: new Date().toISOString(), 
              digitalId: data.donor?.digitalId || d.digitalId 
            }
          : d
      ));

      await sendNotification(donor, 'approved', 'success');
      
      alert('✅ Donor approved successfully! Email and in-app notification sent.');
      await fetchDonors();
      await fetchTotalCounts(); // Refresh counts

    } catch (error: any) {
      console.error('❌ Error approving donor:', error);
      alert(error.message || 'Failed to approve donor. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const sendNotification = async (donor: Donor, type: string, notificationType: string = 'info') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const templates: Record<string, { subject: string; message: string }> = {
        approved: {
          subject: `✅ Application Approved - Welcome to RedPulse!`,
          message: `Dear {donor_name},

We are pleased to inform you that your blood donor application has been APPROVED! 🎉

You are now officially part of the RedPulse Blood Donation family. Your willingness to donate blood can save lives and make a real difference in our community.

📋 Your Details:
• Blood Type: {blood_type}
• Donor ID: {donor_id}
• Status: Active Donor

📝 Next Steps:
1. Complete your profile
2. View available blood drives
3. Register for a blood drive
4. Donate & save lives

Thank you for your commitment to saving lives!

Best regards,
RedPulse Blood Donation Team`
        },
        eligibility: {
          subject: `🩸 You're Eligible to Donate Blood`,
          message: `Dear {donor_name},

We are pleased to inform you that you are ELIGIBLE to donate blood! 🩸

Your next donation can help save up to 3 lives. We appreciate your continued commitment to our cause.

📋 Your Details:
• Blood Type: {blood_type}
• Next Eligible Date: {next_eligible}
• Total Donations: {total_donations}

Please schedule your donation at your earliest convenience.

Thank you for being a valued RedPulse donor!

Best regards,
RedPulse Blood Donation Team`
        },
        reminder: {
          subject: `🔔 Donation Reminder`,
          message: `Dear {donor_name},

This is a friendly reminder that you are eligible to donate blood.

🩸 Blood Type: {blood_type}
📅 Next Eligible: {next_eligible}

Every donation can save up to 3 lives. Please visit your nearest blood donation center or schedule an appointment through our system.

Thank you for your continued support!

Best regards,
RedPulse Blood Donation Team`
        },
        thank_you: {
          subject: `❤️ Thank You for Your Donation!`,
          message: `Dear {donor_name},

Thank you so much for your recent blood donation! ❤️

Your generosity has helped save lives in our community. We are incredibly grateful for your commitment to this life-saving cause.

📋 Donation Details:
• Blood Type: {blood_type}
• Total Donations: {total_donations}
• Points Earned: 100 points

You are making a real difference. Thank you for being a hero!

With gratitude,
RedPulse Blood Donation Team`
        },
        schedule: {
          subject: `📅 Schedule Your Next Donation`,
          message: `Dear {donor_name},

We invite you to schedule your next blood donation appointment.

🩸 Blood Type: {blood_type}
📍 Location: {location}

Please visit our platform to schedule your appointment at your convenience.

Thank you for your continued support!

Best regards,
RedPulse Blood Donation Team`
        }
      };

      const template = templates[type] || templates.eligibility;

      const response = await fetch('/api/admin/donors/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donorId: donor.id,
          subject: template.subject,
          message: template.message,
          donorEmail: donor.email,
          donorName: donor.fullName,
          type: notificationType,
          emailTemplate: type,
          sendEmail: true
        })
      });

      if (response.ok) {
        console.log(`✅ ${type} notification sent to ${donor.email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Notification failed:', error);
      return false;
    }
  };

  const handleSendEmailAndInAppNotification = async (donorId: string) => {
    if (!notificationSubject.trim() || !notificationMessage.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    try {
      setProcessingId(donorId);
      setNotificationSent(false);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      const donor = donors.find(d => d.id === donorId);
      if (!donor) {
        alert('Donor not found. Please refresh the page and try again.');
        setProcessingId(null);
        return;
      }

      const processedMessage = notificationMessage
        .replace(/{donor_name}/g, donor.fullName)
        .replace(/{blood_type}/g, donor.bloodType)
        .replace(/{donor_id}/g, donor.digitalId || donor.id)
        .replace(/{next_eligible}/g, donor.nextEligible || 'Not set')
        .replace(/{total_donations}/g, donor.totalDonations?.toString() || '0')
        .replace(/{location}/g, donor.location || donor.address || donor.barangay || 'Not specified');

      const processedSubject = notificationSubject
        .replace(/{donor_name}/g, donor.fullName)
        .replace(/{blood_type}/g, donor.bloodType);

      const response = await fetch('/api/admin/donors/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donorId: donorId,
          subject: processedSubject,
          message: processedMessage,
          donorEmail: donor.email,
          donorName: donor.fullName,
          type: notificationType,
          emailTemplate: 'custom',
          sendEmail: true
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setShowNotifyModal(null);
      setNotificationSubject('');
      setNotificationMessage('');
      setNotificationSent(true);
      
      alert('✅ Email and in-app notification sent successfully!');
      
      setTimeout(() => setNotificationSent(false), 3000);

    } catch (error: any) {
      console.error('❌ Error sending notification:', error);
      alert(error.message || 'Failed to send notification. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (donorId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(donorId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      const donor = donors.find(d => d.id === donorId);
      if (!donor) {
        alert('Donor not found. Please refresh the page and try again.');
        setProcessingId(null);
        return;
      }

      const response = await fetch(`/api/admin/donors/${donorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectionReason
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject donor');
      }

      setDonors(prev => prev.map(d => 
        d.id === donorId 
          ? { ...d, status: 'inactive', rejectionReason: rejectionReason }
          : d
      ));

      setShowRejectModal(null);
      setRejectionReason('');

      await sendNotification(donor, 'rejected', 'error');
      
      alert('❌ Donor rejected. Email and in-app notification sent.');
      await fetchDonors();
      await fetchTotalCounts(); // Refresh counts

    } catch (error: any) {
      console.error('❌ Error rejecting donor:', error);
      alert(error.message || 'Failed to reject donor. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const loadNotificationTemplate = (type: string, donor?: Donor) => {
    const donorName = donor?.fullName || '{donor_name}';
    const bloodType = donor?.bloodType || '{blood_type}';
    const donorId = donor?.digitalId || donor?.id || '{donor_id}';
    const totalDonations = donor?.totalDonations?.toString() || '{total_donations}';
    const location = donor?.address || donor?.barangay || '{location}';
    const nextEligible = donor?.nextEligible || '{next_eligible}';

    const templates: Record<string, { subject: string; message: string }> = {
      info: {
        subject: `📢 Announcement from RedPulse`,
        message: `Dear ${donorName},

We have an important announcement regarding the upcoming blood donation drive.

📅 Date: Coming Soon
📍 Location: ${location}

Stay tuned for more details!

Best regards,
RedPulse Blood Donation Team`
      },
      success: {
        subject: `✅ Your Donation Was Successful!`,
        message: `Dear ${donorName},

Your recent blood donation was a success! ❤️

Thank you for your generosity. You've helped save lives in our community.

📋 Details:
• Blood Type: ${bloodType}
• Total Donations: ${totalDonations}

Best regards,
RedPulse Blood Donation Team`
      },
      warning: {
        subject: `⚠️ Important: Donation Eligibility Update`,
        message: `Dear ${donorName},

We wanted to inform you about an update regarding your donation eligibility.

Please log in to your account to view the details and take any necessary actions.

Best regards,
RedPulse Blood Donation Team`
      },
      reminder: {
        subject: `🔔 Donation Reminder`,
        message: `Dear ${donorName},

This is a friendly reminder that you are eligible to donate blood.

🩸 Blood Type: ${bloodType}
📅 Next Eligible: ${nextEligible}

Every donation can save up to 3 lives.

Thank you for your continued support!

Best regards,
RedPulse Blood Donation Team`
      },
      thank_you: {
        subject: `❤️ Thank You for Your Donation!`,
        message: `Dear ${donorName},

Thank you so much for your recent blood donation! ❤️

Your generosity has helped save lives in our community.

📋 Details:
• Blood Type: ${bloodType}
• Total Donations: ${totalDonations}

You are making a real difference!

Best regards,
RedPulse Blood Donation Team`
      },
      schedule: {
        subject: `📅 Schedule Your Next Donation`,
        message: `Dear ${donorName},

We invite you to schedule your next blood donation appointment.

🩸 Blood Type: ${bloodType}
📍 Location: ${location}

Please visit our platform to schedule your appointment.

Best regards,
RedPulse Blood Donation Team`
      }
    };

    const template = templates[type] || templates.info;
    setNotificationSubject(template.subject);
    setNotificationMessage(template.message);
    setNotificationType(type);
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
      inactive: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400",
      pending: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
      approved: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
      rejected: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
    };
    return statusMap[status] || "";
  };

  const getStatusIcon = (status: string) => {
    if (status === "active" || status === "approved") return <Check className="w-3 h-3" />;
    if (status === "pending") return <Clock className="w-3 h-3" />;
    return <X className="w-3 h-3" />;
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

  if (loading && donors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading donor registrations...</p>
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
            onClick={fetchDonors}
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
            <Users className="w-8 h-8 text-red-500" />
            Donor Management
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            Manage all donors - system registered and walk-in
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchDonors();
              fetchTotalCounts();
            }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-zinc-500" />
          </button>
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {totalCounts.pendingDonors} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Stats with separated counts - USING TOTAL COUNTS NOT FILTERED DONORS */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Donors</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{totalCounts.totalDonors}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {totalCounts.pendingDonors}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalCounts.activeDonors}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">💻 System Registered</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {totalCounts.systemDonors}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">🚶 Walk-in</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalCounts.walkInDonors}
          </p>
        </div>
      </div>

      {/* Tab Navigation - USING TOTAL COUNTS */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2 flex-wrap">
        <button
          onClick={() => {
            setActiveTab('all');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          All Donors
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'all'
              ? 'bg-white/20 text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
          }`}>
            {totalCounts.totalDonors}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('system');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'system'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <UserCog className="w-4 h-4" />
          System Registered
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'system'
              ? 'bg-white/20 text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
          }`}>
            {totalCounts.systemDonors}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('walk-in');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            activeTab === 'walk-in'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Walk-in Donors
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'walk-in'
              ? 'bg-white/20 text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
          }`}>
            {totalCounts.walkInDonors}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="all">📋 All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
            </select>

            <select
              value={bloodTypeFilter}
              onChange={(e) => {
                setBloodTypeFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              {bloodTypes.map(type => (
                <option key={type} value={type.toLowerCase()}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Donors Table - Rest of the component remains the same */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Blood Type
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
              {donors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {activeTab === 'walk-in' ? (
                        <>
                          <UserPlus className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                          <p className="text-zinc-500 dark:text-zinc-400">No walk-in donors found</p>
                          <p className="text-sm text-zinc-400 dark:text-zinc-500">
                            Walk-in donors will appear here when they are registered
                          </p>
                        </>
                      ) : activeTab === 'system' ? (
                        <>
                          <UserCog className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                          <p className="text-zinc-500 dark:text-zinc-400">No system-registered donors found</p>
                          <p className="text-sm text-zinc-400 dark:text-zinc-500">
                            Users who register through the system will appear here
                          </p>
                        </>
                      ) : (
                        <>
                          <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                          <p className="text-zinc-500 dark:text-zinc-400">No donor registrations found</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                donors.map((donor) => (
                  <tr
                    key={donor.id}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${
                      donor.registrationType === 'walk-in' ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          donor.registrationType === 'walk-in'
                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                            : 'bg-gradient-to-br from-red-400 to-red-600'
                        }`}>
                          {getInitials(donor.fullName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {donor.fullName}
                            {donor.registrationType === 'walk-in' && (
                              <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                🚶 Walk-in
                              </span>
                            )}
                          </p>
                          {donor.digitalId && (
                            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                              ID: {donor.digitalId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          {donor.email}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          {donor.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                        <Droplet className="w-3 h-3 mr-1" />
                        {donor.bloodType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {donor.registrationType === 'walk-in' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                          <UserPlus className="w-3 h-3 mr-1" />
                          Walk-in
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                          <UserCog className="w-3 h-3 mr-1" />
                          System
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(donor.status)}`}>
                        {getStatusIcon(donor.status)}
                        {getStatusLabel(donor.status)}
                      </span>
                      {donor.status === 'inactive' && donor.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={donor.rejectionReason}>
                          {donor.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {donor.registered}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Only show approve/reject for system donors (pending) */}
                        {donor.registrationType !== 'walk-in' && donor.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(donor.id)}
                              disabled={processingId === donor.id}
                              className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 rounded-lg transition group"
                              title="Approve Donor (Sends Email + In-App)"
                            >
                              {processingId === donor.id ? (
                                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
                              )}
                            </button>
                            <button
                              onClick={() => setShowRejectModal(donor.id)}
                              disabled={processingId === donor.id}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg transition group"
                              title="Reject Donor"
                            >
                              <UserX className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                            </button>
                          </>
                        )}

                        {/* Send Email & In-App Notification button for active donors */}
                        {(donor.status === 'active' || donor.status === 'approved') && (
                          <button
                            onClick={() => {
                              setSelectedDonor(donor);
                              setShowNotifyModal(donor.id);
                              loadNotificationTemplate('info', donor);
                            }}
                            disabled={processingId === donor.id}
                            className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 rounded-lg transition group"
                            title="Send Email & In-App Notification"
                          >
                            <Mail className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600" />
                          </button>
                        )}

                        {/* View details button */}
                        <button
                          onClick={() => {
                            setSelectedDonor(donor);
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
              Showing <span className="font-medium text-zinc-700 dark:text-zinc-300">{donors.length}</span> of{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{pagination.total}</span> registrations
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

      {/* ============ VIEW DETAILS MODAL ============ */}
      {showDetailsModal && selectedDonor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Donor Profile</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className={`-m-6 p-6 text-white mb-6 ${
                selectedDonor.registrationType === 'walk-in'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
                  : 'bg-gradient-to-r from-red-600 to-red-700'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                    {getInitials(selectedDonor.fullName)}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">{selectedDonor.fullName}</h1>
                    <p className="text-red-100">{selectedDonor.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        {selectedDonor.bloodType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedDonor.status === 'active' || selectedDonor.status === 'approved'
                          ? 'bg-green-500/30' 
                          : selectedDonor.status === 'pending'
                          ? 'bg-yellow-500/30'
                          : 'bg-red-500/30'
                      }`}>
                        {selectedDonor.status === 'active' || selectedDonor.status === 'approved' ? 'Active' : 
                         selectedDonor.status === 'pending' ? 'Pending' : 'Inactive'}
                      </span>
                      {selectedDonor.registrationType === 'walk-in' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                          <UserPlus className="w-3 h-3" />
                          Walk-in
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                          <UserCog className="w-3 h-3" />
                          System
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        ID: {selectedDonor.digitalId}
                      </span>
                      {selectedDonor.isEligible !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedDonor.isEligible 
                            ? 'bg-green-500/30' 
                            : 'bg-red-500/30'
                        }`}>
                          {selectedDonor.isEligible ? '✅ Eligible' : '⛔ Not Eligible'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/admin/donors/${selectedDonor.id}/digital-id`}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition backdrop-blur-sm border border-white/30">
                      <IdCard className="h-4 w-4" />
                      View ID
                    </button>
                  </Link>
                </div>
              </div>

              {/* Walk-in info section */}
              {selectedDonor.registrationType === 'walk-in' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <UserPlus className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Walk-in Donor</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500">
                        This donor was registered as a walk-in and is automatically active.
                        No approval needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending info for system donors */}
              {selectedDonor.registrationType !== 'walk-in' && selectedDonor.status === 'pending' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Pending Approval</p>
                      <p className="text-sm text-amber-600 dark:text-amber-500">
                        This donor registered through the system and needs admin approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <User className="w-4 h-4" /> Full Name
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.fullName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Mail className="w-4 h-4" /> Email
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Phone
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Droplet className="w-4 h-4" /> Blood Type
                  </p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                    {selectedDonor.bloodType}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" /> Date of Birth
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    {selectedDonor.dateOfBirth ? new Date(selectedDonor.dateOfBirth).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <UserCircle className="w-4 h-4" /> Gender
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.gender || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Weight className="w-4 h-4" /> Weight
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.weight ? `${selectedDonor.weight} kg` : 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <PhoneCall className="w-4 h-4" /> Emergency Contact
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.emergencyContact || 'Not specified'}</p>
                </div>
              </div>

              {/* Address Section */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4" /> Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Barangay</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.barangay || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Municipality</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.municipality || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Province</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.province || 'Not specified'}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Full Address</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.address || 'Not specified'}</p>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <Clipboard className="w-4 h-4" /> Medical Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Medical Conditions</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.medicalConditions || 'None reported'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Medications</p>
                    <p className="text-sm text-zinc-900 dark:text-white">{selectedDonor.currentMedications || 'None reported'}</p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4" /> Donor Statistics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Donations</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedDonor.totalDonations || 0}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Points Earned</p>
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{selectedDonor.points || 0}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Last Donation</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {selectedDonor.lastDonation ? new Date(selectedDonor.lastDonation).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason if any */}
              {selectedDonor.rejectionReason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{selectedDonor.rejectionReason}</p>
                </div>
              )}

              {/* Approval Info */}
              {selectedDonor.approvedAt && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Approved At
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {new Date(selectedDonor.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Admin Actions - Only show for system donors */}
              {selectedDonor.registrationType !== 'walk-in' && selectedDonor.status === 'pending' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    onClick={() => {
                      handleApprove(selectedDonor.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={processingId === selectedDonor.id}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 flex items-center gap-2"
                  >
                    {processingId === selectedDonor.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    Approve Donor
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRejectModal(selectedDonor.id);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-lg shadow-red-200 dark:shadow-red-900/30 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    Reject Donor
                  </button>
                </div>
              )}

              {/* Send Email & In-App Notification Button in Details */}
              {(selectedDonor.status === 'active' || selectedDonor.status === 'approved') && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    onClick={() => {
                      setShowNotifyModal(selectedDonor.id);
                      loadNotificationTemplate('info', selectedDonor);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email & In-App Notification
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ REJECT MODAL ============ */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Reject Donor</h3>
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
                Please provide a reason for rejecting this donor application. The donor will receive an email and in-app notification.
              </p>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
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
                Reject & Send Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ EMAIL + IN-APP NOTIFICATION MODAL ============ */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  Send Email & In-App Notification
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Sending to: <strong>{selectedDonor?.fullName || 'Donor'}</strong> ({selectedDonor?.bloodType || 'Blood Type'})
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Email: {selectedDonor?.email || 'No email'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNotifyModal(null);
                  setNotificationSubject('');
                  setNotificationMessage('');
                  setNotificationType('info');
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Template Selector */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Quick Templates (Auto-fills donor info)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['info', 'success', 'warning', 'reminder', 'thank_you', 'schedule'].map((template) => {
                    const donor = donors.find(d => d.id === showNotifyModal);
                    return (
                      <button
                        key={template}
                        onClick={() => loadNotificationTemplate(template, donor)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition capitalize ${
                          notificationType === template
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {template.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={notificationSubject}
                  onChange={(e) => setNotificationSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Enter notification subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-mono"
                  placeholder="Enter notification message... Use {donor_name}, {blood_type}, etc. for auto-fill"
                />
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Available placeholders:</span>
                  <button
                    onClick={() => {
                      setNotificationMessage(prev => prev + '{donor_name} ');
                    }}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    {'{donor_name}'}
                  </button>
                  <button
                    onClick={() => {
                      setNotificationMessage(prev => prev + '{blood_type} ');
                    }}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    {'{blood_type}'}
                  </button>
                  <button
                    onClick={() => {
                      setNotificationMessage(prev => prev + '{donor_id} ');
                    }}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    {'{donor_id}'}
                  </button>
                  <button
                    onClick={() => {
                      setNotificationMessage(prev => prev + '{location} ');
                    }}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    {'{location}'}
                  </button>
                  <button
                    onClick={() => {
                      setNotificationMessage(prev => prev + '{total_donations} ');
                    }}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    {'{total_donations}'}
                  </button>
                  <button
                    onClick={() => {
                      setNotificationMessage(prev => prev + '{next_eligible} ');
                    }}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    {'{next_eligible}'}
                  </button>
                </div>

                <p className="text-xs text-amber-500 dark:text-amber-400 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  This notification will be sent to the donor's email and will also appear in their in-app inbox.
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Preview - Sending to: {selectedDonor?.fullName || 'Donor'} ({selectedDonor?.bloodType || 'Blood Type'})
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{notificationSubject || 'Subject will appear here'}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line max-h-40 overflow-y-auto">
                    {notificationMessage || 'Message will appear here...'}
                  </p>
                </div>
              </div>

              {/* Notification Status */}
              {notificationSent && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    ✅ Email and in-app notification sent successfully to {selectedDonor?.fullName}!
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNotifyModal(null);
                  setNotificationSubject('');
                  setNotificationMessage('');
                  setNotificationType('info');
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendEmailAndInAppNotification(showNotifyModal)}
                disabled={processingId === showNotifyModal || !notificationSubject.trim() || !notificationMessage.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
              >
                {processingId === showNotifyModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Email & In-App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}