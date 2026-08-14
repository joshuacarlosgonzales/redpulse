// app/donors/dashboard/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  User,
  Calendar,
  Clock,
  Droplet,
  Activity,
  Award,
  ChevronRight,
  Bell,
  Settings,
  Phone,
  MapPin,
  Mail,
  FileText,
  History,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
  Clock as ClockIcon,
  Home,
  Shield,
  IdCard,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Syringe,
  Hospital as HospitalIcon,
  Ambulance,
  Check,
  Info,
  Users,
  MapPin as MapPinIcon,
  Clock as ClockIcon2,
  Heart as HeartIcon,
  Loader2,
  CalendarCheck,
  Building,
  Eye,
  X
} from "lucide-react";
import NotificationModal from "@/components/UserNotif/NotificationModal";
import BloodRequestModal from "@/components/DonorRequest/BloodRequestModal";
import DonorProfileModal from "@/components/donor/DonorProfileModal";

interface DonorStats {
  totalDonations: number;
  nextEligibleDate: string;
  lastDonationDate: string;
  bloodType: string;
  totalPoints: number;
  lifetimeDonations: number;
  eligibilityStatus: 'eligible' | 'pending' | 'ineligible';
  eligibilityReason?: string;
}

interface RecentDonation {
  id: string;
  date: string;
  location: string;
  status: 'completed' | 'pending' | 'scheduled' | 'cancelled';
  points: number;
  hospitalName?: string;
  notes?: string;
}

interface DonorProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  dateOfBirth: string;
  gender: string;
  weight: number;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  emergencyContact: string;
  medicalConditions: string;
  currentMedications: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  digitalId?: string;
  status?: string;
  isEligible?: boolean;
  totalDonations?: number;
  lastDonationDate?: string;
  points?: number;
  emergencyName?: string;
  emergencyRelationship?: string;
  _id?: string;
  donorId?: string;
}

interface BloodRequest {
  id: string;
  hospitalName: string;
  hospitalAddress: string;
  bloodType: string;
  quantity: string;
  urgency: 'critical' | 'urgent' | 'normal';
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled';
  requestDate: string;
  requiredDate: string;
  patientName?: string;
  patientAge?: number;
  notes?: string;
  requestMethod?: 'emergency' | 'scheduled' | 'routine';
  department?: string;
  doctorName?: string;
  contactNumber?: string;
}

interface Notification {
  id: string;
  subject: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  sender?: string;
  link?: string;
}

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
  isRegistered?: boolean;
  registrationId?: string;
}

export default function DonorDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [stats, setStats] = useState<DonorStats>({
    totalDonations: 0,
    nextEligibleDate: '',
    lastDonationDate: '',
    bloodType: 'A+',
    totalPoints: 0,
    lifetimeDonations: 0,
    eligibilityStatus: 'pending'
  });
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bloodDrives, setBloodDrives] = useState<BloodDrive[]>([]);
  const [registeredDrives, setRegisteredDrives] = useState<BloodDrive[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'eligibility' | 'requests' | 'blood-drives'>('dashboard');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [registeringDrive, setRegisteringDrive] = useState<string | null>(null);
  const [cancellingDrive, setCancellingDrive] = useState<string | null>(null);
  const [bloodDriveSearch, setBloodDriveSearch] = useState("");
  const [bloodDriveFilter, setBloodDriveFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/auth/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      
      if (userData.role !== 'donor') {
        router.push('/auth/login');
        return;
      }

      setUser(userData);
      await fetchDonorData(userData.id || userData.userId);
      await fetchNotifications();
      await fetchBloodDrives();
      await fetchRegisteredDrives();
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.data?.filter((n: Notification) => !n.isRead).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const fetchDonorData = async (userId: string) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      // Fetch donor profile
      const profileResponse = await fetch(`/api/donors/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const donorData = profileData.data || profileData;
        
        setProfile({
          id: donorData._id || donorData.id || userId,
          _id: donorData._id || donorData.id || userId,
          donorId: donorData.donorId || donorData._id || donorData.id || userId,
          fullName: donorData.fullName || donorData.name || '',
          email: donorData.email || '',
          phone: donorData.phone || donorData.mobileNumber || '',
          bloodType: donorData.bloodType || 'A+',
          dateOfBirth: donorData.dateOfBirth || '',
          gender: donorData.gender || '',
          weight: donorData.weight || 0,
          address: donorData.address || '',
          barangay: donorData.barangay || '',
          municipality: donorData.municipality || '',
          province: donorData.province || '',
          emergencyContact: donorData.emergencyContact || '',
          medicalConditions: donorData.medicalConditions || '',
          currentMedications: donorData.currentMedications || '',
          isVerified: donorData.isVerified || false,
          createdAt: donorData.createdAt || new Date().toISOString(),
          updatedAt: donorData.updatedAt || new Date().toISOString(),
          digitalId: donorData.digitalId || `RP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          status: donorData.status || 'pending',
          isEligible: donorData.isEligible || false,
          totalDonations: donorData.totalDonations || 0,
          lastDonationDate: donorData.lastDonationDate || '',
          points: donorData.points || 0,
          emergencyName: donorData.emergencyName || '',
          emergencyRelationship: donorData.emergencyRelationship || ''
        });

        setStats({
          bloodType: donorData.bloodType || 'A+',
          totalDonations: donorData.totalDonations || 0,
          lifetimeDonations: donorData.totalDonations || 0,
          totalPoints: donorData.points || 0,
          lastDonationDate: donorData.lastDonationDate || '',
          nextEligibleDate: donorData.nextEligibleDate || '',
          eligibilityStatus: donorData.isEligible ? 'eligible' : 
                           donorData.status === 'pending' ? 'pending' : 'ineligible'
        });
      }

      // Fetch donations
      try {
        const donationsResponse = await fetch(`/api/donations/donor/${userId}?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (donationsResponse.ok) {
          const donationsData = await donationsResponse.json();
          setRecentDonations(donationsData.data || []);
        }
      } catch (error) {
        console.log('Donations endpoint not available');
        setRecentDonations([]);
      }

      // Fetch blood requests
      try {
        const requestsResponse = await fetch(`/api/blood-requests/donor/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setBloodRequests(requestsData.data || []);
        } else {
          setBloodRequests([]);
        }
      } catch (error) {
        console.log('Blood requests endpoint not available');
        setBloodRequests([]);
      }

    } catch (error) {
      console.error('Error fetching donor data:', error);
      showNotification('error', 'Failed to load donor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedData: any): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const userId = user?.id || user?.userId;
      
      const response = await fetch(`/api/donors/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const data = await response.json();
        const donorData = data.data || data;
        
        setProfile(prev => ({
          ...prev!,
          ...donorData
        }));
        
        showNotification('success', 'Profile updated successfully!');
        return;
      }
      showNotification('error', 'Failed to update profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('error', 'Failed to update profile');
    }
  };

  const fetchRegisteredDrives = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/blood-drives/registered', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegisteredDrives(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching registered drives:', error);
    }
  };

  const fetchBloodDrives = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/blood-drives?status=upcoming&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const drivesWithRegistration = (data.data || []).map((drive: any) => {
          const isRegistered = registeredDrives.some(rd => rd.id === drive.id);
          return {
            ...drive,
            isRegistered: isRegistered || drive.isRegistered || false
          };
        });
        
        setBloodDrives(drivesWithRegistration);
      } else {
        setBloodDrives([]);
      }
    } catch (error) {
      console.error('Error fetching blood drives:', error);
      setBloodDrives([]);
    }
  };

  const handleRegisterForDrive = async (driveId: string) => {
    try {
      setRegisteringDrive(driveId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/blood-drives/${driveId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        setBloodDrives(prev => 
          prev.map(d => 
            d.id === driveId 
              ? { ...d, registeredDonors: d.registeredDonors + 1, isRegistered: true }
              : d
          )
        );
        
        showNotification('success', data.message || 'Successfully registered for the blood drive! 🎉');
        
        await fetchRegisteredDrives();
        await fetchBloodDrives();
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Failed to register for blood drive');
      }
    } catch (error) {
      console.error('Error registering for blood drive:', error);
      showNotification('error', 'Failed to register for blood drive');
    } finally {
      setRegisteringDrive(null);
    }
  };

  const handleCancelRegistration = async (driveId: string) => {
    try {
      setCancellingDrive(driveId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/blood-drives/${driveId}/register`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        setBloodDrives(prev => 
          prev.map(d => 
            d.id === driveId 
              ? { ...d, registeredDonors: Math.max(0, d.registeredDonors - 1), isRegistered: false }
              : d
          )
        );
        
        showNotification('info', data.message || 'Successfully unregistered from the blood drive');
        
        await fetchRegisteredDrives();
        await fetchBloodDrives();
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Failed to cancel registration');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      showNotification('error', 'Failed to cancel registration');
    } finally {
      setCancellingDrive(null);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateRequest = async (formData: any) => {
    console.log('📝 Received form data in dashboard:', formData);
    
    if (!formData.bloodType) {
      showNotification('error', 'Please select a Blood Type');
      return;
    }
    
    if (!formData.requiredDate) {
      showNotification('error', 'Please select a Required Date');
      return;
    }
    
    if (!formData.hospitalId) {
      showNotification('error', 'Please select a Hospital from the list');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login again');
        return;
      }

      const requestBody = {
        bloodType: formData.bloodType,
        quantity: parseInt(formData.quantity) || 1,
        urgency: formData.urgency || 'normal',
        requiredDate: formData.requiredDate,
        notes: formData.notes || '',
        requestMethod: formData.requestMethod || 'routine',
        department: formData.department || '',
        doctorName: formData.doctorName || '',
        contactNumber: formData.contactNumber || '',
        hospitalId: formData.hospitalId,
        patientName: formData.patientName || '',
        patientAge: formData.patientAge ? parseInt(formData.patientAge) : undefined,
        donorId: user?.id || user?.userId
      };
      
      console.log('📤 Sending to API:', requestBody);

      const response = await fetch('/api/blood-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('📥 API Response:', data);

      if (response.ok) {
        const newRequest = {
          id: data.data.id || data.data._id,
          bloodType: data.data.bloodType,
          quantity: data.data.quantity.toString(),
          urgency: data.data.urgency,
          status: data.data.status || 'pending',
          requestDate: new Date().toISOString(),
          requiredDate: data.data.requiredDate,
          hospitalName: formData.hospitalName || 'Hospital',
          hospitalAddress: formData.hospitalAddress || '',
          patientName: formData.patientName || '',
          patientAge: formData.patientAge ? parseInt(formData.patientAge) : undefined,
          notes: formData.notes || '',
          requestMethod: formData.requestMethod || 'routine',
          department: formData.department || '',
          doctorName: formData.doctorName || '',
          contactNumber: formData.contactNumber || ''
        };
        setBloodRequests([newRequest, ...bloodRequests]);
        setShowRequestModal(false);
        showNotification('success', 'Blood request submitted successfully! 🩸');
        await fetchDonorData(user?.id || user?.userId);
      } else {
        console.error('❌ API Error:', data);
        showNotification('error', data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('❌ Error creating request:', error);
      showNotification('error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login again');
        return;
      }

      const response = await fetch(`/api/blood-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBloodRequests(prev => 
          prev.map(r => 
            r.id === requestId ? { ...r, status: 'cancelled' as const } : r
          )
        );
        showNotification('info', 'Request cancelled successfully');
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      showNotification('error', 'Failed to cancel request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'fulfilled':
        return 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
      case 'cancelled':
        return 'text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      case 'approved':
        return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800';
      default:
        return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800';
    }
  };

  const getEligibilityStatusColor = (status: string) => {
    switch (status) {
      case 'eligible':
        return 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
      case 'ineligible':
        return 'text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      default:
        return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800';
    }
  };

  const getEligibilityIcon = (status: string) => {
    switch (status) {
      case 'eligible':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-600" />;
      case 'ineligible':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-zinc-600" />;
    }
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

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getFilteredDrives = () => {
    let filtered = bloodDrives;
    
    if (bloodDriveFilter !== 'all') {
      filtered = filtered.filter(d => d.status === bloodDriveFilter);
    }
    
    if (bloodDriveSearch) {
      const search = bloodDriveSearch.toLowerCase();
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(search) ||
        d.location.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };

  const filteredDrives = getFilteredDrives();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-950/90 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : notification.type === 'error'
            ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'info' && <Bell className="h-5 w-5 flex-shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-red-200 dark:shadow-red-900/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {profile?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Donor'}! 👋</h1>
                <p className="text-red-100 mt-1">
                  {stats.eligibilityStatus === 'eligible' 
                    ? `✅ You're eligible to donate! Next donation: ${stats.nextEligibleDate ? new Date(stats.nextEligibleDate).toLocaleDateString() : 'Check your eligibility'}`
                    : stats.eligibilityStatus === 'pending'
                    ? '⏳ Your eligibility is being reviewed'
                    : 'ℹ️ You are currently ineligible to donate'}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition backdrop-blur-sm border border-white/30 flex items-center gap-2"
                >
                  <Syringe className="h-4 w-4" />
                  Request Blood
                </button>
                {stats.eligibilityStatus === 'eligible' && (
                  <Link href="/donors/schedule">
                    <button className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition backdrop-blur-sm border border-white/30 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule Donation
                    </button>
                  </Link>
                )}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition backdrop-blur-sm border border-white/20 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Total Donations</span>
                <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <Droplet className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalDonations}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Lifetime: {stats.lifetimeDonations} donations
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Blood Type</span>
                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{profile?.bloodType || stats.bloodType}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Rh {(profile?.bloodType || stats.bloodType).includes('+') ? 'Positive' : 'Negative'}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Points Earned</span>
                <div className="h-10 w-10 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalPoints}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {stats.totalPoints >= 1000 ? '🏆 Elite Donor' : '⭐ Growing Donor'}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Last Donation</span>
                <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">
                {stats.lastDonationDate ? new Date(stats.lastDonationDate).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {stats.lastDonationDate ? Math.floor((Date.now() - new Date(stats.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)) : 0} days ago
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Donations */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Donations</h2>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {recentDonations.length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">No recent donations to display.</p>
                ) : (
                  recentDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                          <Droplet className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {new Date(donation.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{donation.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(donation.status)}`}>
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </span>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">+{donation.points} points</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Blood Requests */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Active Blood Requests</h2>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {bloodRequests.filter(r => r.status === 'pending' || r.status === 'approved').length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">No active blood requests.</p>
                ) : (
                  bloodRequests
                    .filter(r => r.status === 'pending' || r.status === 'approved')
                    .slice(0, 3)
                    .map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            request.urgency === 'critical' ? 'bg-red-50 dark:bg-red-950/30' :
                            request.urgency === 'urgent' ? 'bg-orange-50 dark:bg-orange-950/30' :
                            'bg-blue-50 dark:bg-blue-950/30'
                          }`}>
                            {request.urgency === 'critical' ? <AlertTriangle className="h-5 w-5 text-red-600" /> :
                             request.urgency === 'urgent' ? <Ambulance className="h-5 w-5 text-orange-600" /> :
                             <HospitalIcon className="h-5 w-5 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">
                              {request.bloodType} - {request.quantity}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {request.hospitalName} • Required: {new Date(request.requiredDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}