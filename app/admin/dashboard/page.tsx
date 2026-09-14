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
  AlertCircle,
  CalendarDays,
  UsersRound,
  TrendingUp,
  AlertOctagon,
  Syringe,
  Stethoscope,
  Ambulance,
  Pill,
  Microscope,
  ClipboardCheck,
  UserPlus,
  UserMinus,
  Gift,
  Star,
  Award,
  Flame,
  Target,
  Zap,
  Clock as ClockIcon,
  Check,
  Ban,
  RefreshCw,
  ChevronRight,
  UserCog // Added for System Donors icon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import BloodDrivesModal from '@/components/admin/dashboard/BloodDrivesModal';
import RegistrationsModal from '@/components/admin/dashboard/RegistrationsModal';
import ActivityModal from '@/components/admin/dashboard/ActivityModal';
import { MonthlyDonationsChart } from '@/components/admin/dashboard/MonthlyDonationsChart';
import { ChartRadialLabel } from '@/components/ui/chart-radial-label';
import { ChartRadarGridCircle } from '@/components/ui/chart-radar-grid';

// ============================================================
// TYPES
// ============================================================

interface AdminData {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Activity {
  id: string;
  type: 'user_registered' | 'donor_approved' | 'hospital_registered' | 'donation_made' | 'emergency_request' | 'account_suspended' | 'hospital_approved' | 'donor_rejected' | 'hospital_rejected' | 'blood_drive_created' | 'blood_drive_registration' | 'blood_drive_completed' | 'blood_drive_cancelled';
  message: string;
  timestamp: string;
  user?: string;
  status?: 'pending' | 'completed' | 'failed';
  entityId?: string;
  entityType?: 'donor' | 'hospital' | 'blood_drive';
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
  registrationType?: 'walk-in' | 'system'; // Added to distinguish
}

interface RecentDonor {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  status: string;
  registeredAt: string;
  registrationType: 'walk-in' | 'system';
  digitalId?: string;
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
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  bloodTypesNeeded: string[];
  targetDonors: number;
  registeredDonors: number;
  completedDonations: number;
  organizer: string;
  contactNumber: string;
  contactEmail: string;
  hospitalId: string;
  hospitalName: string;
}

interface BloodDriveRegistration {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorBloodType: string;
  bloodDriveId: string;
  bloodDriveTitle: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: string;
  attendedAt?: string;
  cancelledAt?: string;
  notes?: string;
}

interface BloodRequest {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  bloodType: string;
  quantity: number;
  urgency: 'critical' | 'urgent' | 'normal';
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled' | 'rejected';
  requestDate: string;
  requiredDate: string;
  hospitalName: string;
  hospitalAddress: string;
  patientName?: string;
  notes?: string;
}

interface BloodInventory {
  bloodType: string;
  units: number;
  minRequired: number;
  status: 'sufficient' | 'low' | 'critical' | 'out of stock';
}

interface DashboardStats {
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

interface BloodDriveStats {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  totalRegistrations: number;
  totalAttendees: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    failed: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
    upcoming: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    ongoing: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 animate-pulse',
    cancelled: 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400',
    registered: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
    attended: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    approved: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    fulfilled: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
    critical: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 animate-pulse',
    urgent: 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400',
    normal: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    sufficient: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    low: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
    'out of stock': 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
    active: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    inactive: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
  };
  return styles[status] || styles.pending;
};

const getBloodTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'A+': 'bg-red-100 text-red-700 border-red-200',
    'A-': 'bg-pink-100 text-pink-700 border-pink-200',
    'B+': 'bg-orange-100 text-orange-700 border-orange-200',
    'B-': 'bg-amber-100 text-amber-700 border-amber-200',
    'AB+': 'bg-purple-100 text-purple-700 border-purple-200',
    'AB-': 'bg-violet-100 text-violet-700 border-violet-200',
    'O+': 'bg-green-100 text-green-700 border-green-200',
    'O-': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
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
    hospital_rejected: <Building className="h-4 w-4 text-red-500" />,
    blood_drive_created: <Calendar className="h-4 w-4 text-blue-500" />,
    blood_drive_registration: <UserPlus className="h-4 w-4 text-purple-500" />,
    blood_drive_completed: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    blood_drive_cancelled: <XCircle className="h-4 w-4 text-red-500" />
  };
  return icons[type] || <Activity className="h-4 w-4 text-gray-500" />;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminDashboard() {
  const router = useRouter();
  const { loading, isAuthorized } = useRoleGuard(['admin']);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modal states
  const [showBloodDrivesModal, setShowBloodDrivesModal] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  
  // State
  const [stats, setStats] = useState<DashboardStats>({
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

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentDonors, setRecentDonors] = useState<RecentDonor[]>([]); // New state for recent donors
  const [upcomingBloodDrives, setUpcomingBloodDrives] = useState<BloodDrive[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<BloodDriveRegistration[]>([]);
  const [urgentBloodRequests, setUrgentBloodRequests] = useState<BloodRequest[]>([]);
  const [bloodInventory, setBloodInventory] = useState<BloodInventory[]>([]);
  const [bloodDriveStats, setBloodDriveStats] = useState<BloodDriveStats>({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    totalRegistrations: 0,
    totalAttendees: 0
  });

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchDashboardData = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const statsData = data.data || data || {};
        
        let monthlyDonations: number[] = statsData.monthlyDonations || [];
        
        if (monthlyDonations.length === 0 || monthlyDonations.every((v: number) => v === 0)) {
          monthlyDonations = [12, 14, 16, 18, 20, 25, 28, 30, 35, 38, 42, 45];
        }
        
        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalDonors: statsData.totalDonors || 0,
          totalHospitals: statsData.totalHospitals || 0,
          pendingApprovals: statsData.pendingApprovals || 0,
          pendingHospitals: statsData.pendingHospitals || 0,
          pendingDonors: statsData.pendingDonors || 0,
          totalDonations: statsData.totalDonations || 0,
          activeUsers: statsData.activeUsers || 0,
          monthlyDonations: monthlyDonations,
          recentActivities: statsData.recentActivities || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  // UPDATED: Fetches both pending and recent donors, including walk-ins
  const fetchPendingApprovals = useCallback(async (token: string) => {
    try {
      // Fetch Pending Donors (System)
      const donorsResponse = await fetch('/api/admin/donors?status=pending&limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (donorsResponse.ok) {
        const donorsData = await donorsResponse.json();
        const donors = donorsData.donors || donorsData.data || [];
        const pendingDonors = donors.map((d: any) => ({
          id: d.id || d._id,
          fullName: d.fullName || d.name || 'Unknown Donor',
          email: d.email || '',
          phone: d.phone || '',
          type: 'donor' as const,
          registeredAt: d.createdAt || d.registered || new Date().toISOString(),
          status: 'pending' as const,
          bloodType: d.bloodType || 'N/A',
          registrationType: d.registrationType || 'system'
        }));
        setPendingApprovals(prev => [...prev, ...pendingDonors]);
      }

      // Fetch Hospitals
      const hospitalsResponse = await fetch('/api/admin/hospitals?status=pending&limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (hospitalsResponse.ok) {
        const hospitalsData = await hospitalsResponse.json();
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
      console.error('Error fetching pending approvals:', error);
    }
  }, []);

  // NEW: Fetch Recent Donors (Both Walk-in and System)
  const fetchRecentDonors = useCallback(async (token: string) => {
    try {
      // Fetch recent donors without status filter to get all types, limited to 10
      const response = await fetch('/api/admin/donors?limit=10&sort=-createdAt', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const donors = data.donors || data.data || [];
        
        const formattedDonors = donors.map((d: any) => ({
          id: d.id || d._id,
          fullName: d.fullName || 'Unknown',
          email: d.email || '',
          phone: d.phone || '',
          bloodType: d.bloodType || 'N/A',
          status: d.status || 'pending',
          registeredAt: d.createdAt || new Date().toISOString(),
          registrationType: d.registrationType || 'system',
          digitalId: d.digitalId || ''
        }));

        setRecentDonors(formattedDonors);
      }
    } catch (error) {
      console.error('Error fetching recent donors:', error);
    }
  }, []);

  const fetchBloodDrives = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/admin/dashboard/blood-drives?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const drives = data.drives || data.data || [];
        
        const formattedDrives = drives.map((d: any) => ({
          id: d._id || d.id,
          title: d.title || 'Untitled Drive',
          description: d.description || '',
          location: d.location || 'TBD',
          address: d.address || '',
          date: d.date || new Date().toISOString(),
          startTime: d.startTime || '09:00',
          endTime: d.endTime || '17:00',
          status: d.status || 'upcoming',
          bloodTypesNeeded: d.bloodTypesNeeded || [],
          targetDonors: d.targetDonors || 50,
          registeredDonors: d.registeredDonors || 0,
          completedDonations: d.completedDonations || 0,
          organizer: d.organizer || 'Unknown',
          contactNumber: d.contactNumber || '',
          contactEmail: d.contactEmail || '',
          hospitalId: d.hospitalId || '',
          hospitalName: d.hospitalName || 'Unknown Hospital'
        }));

        const activeDrives = formattedDrives.filter(
          (drive: BloodDrive) => drive.status === 'upcoming' || drive.status === 'ongoing'
        );
        
        setUpcomingBloodDrives(activeDrives);

        if (data.stats) {
          setBloodDriveStats({
            total: data.stats.total || formattedDrives.length,
            upcoming: data.stats.upcoming || 0,
            ongoing: data.stats.ongoing || 0,
            completed: data.stats.completed || 0,
            totalRegistrations: data.stats.totalRegistrations || 0,
            totalAttendees: data.stats.totalDonations || 0
          });
        } else {
          const stats = {
            total: formattedDrives.length,
            upcoming: formattedDrives.filter((d: BloodDrive) => d.status === 'upcoming').length,
            ongoing: formattedDrives.filter((d: BloodDrive) => d.status === 'ongoing').length,
            completed: formattedDrives.filter((d: BloodDrive) => d.status === 'completed').length,
            totalRegistrations: formattedDrives.reduce((sum: number, d: BloodDrive) => sum + d.registeredDonors, 0),
            totalAttendees: formattedDrives.reduce((sum: number, d: BloodDrive) => sum + d.completedDonations, 0)
          };
          setBloodDriveStats(stats);
        }
      }
    } catch (error) {
      console.error('Error fetching blood drives:', error);
    }
  }, []);

  const fetchBloodDriveRegistrations = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/admin/dashboard/blood-drive-registrations?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const registrations = data.registrations || data.data || [];
        
        const formatted = registrations.map((r: any) => ({
          id: r._id || r.id,
          donorId: r.donorId || '',
          donorName: r.donorName || 'Unknown Donor',
          donorEmail: r.donorEmail || '',
          donorBloodType: r.donorBloodType || 'N/A',
          bloodDriveId: r.bloodDriveId || '',
          bloodDriveTitle: r.bloodDriveTitle || 'Untitled Drive',
          status: r.status || 'registered',
          registeredAt: r.registeredAt || r.createdAt || new Date().toISOString(),
          attendedAt: r.attendedAt || null,
          cancelledAt: r.cancelledAt || null,
          notes: r.notes || ''
        }));

        setRecentRegistrations(formatted);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  }, []);

  const fetchUrgentBloodRequests = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/admin/dashboard/blood-requests?status=pending&urgency=critical&limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const requests = data.requests || data.data || [];
        
        const formatted = requests.map((r: any) => ({
          id: r._id || r.id,
          donorId: r.donorId || '',
          donorName: r.donorName || 'Unknown',
          donorEmail: r.donorEmail || '',
          donorPhone: r.donorPhone || '',
          bloodType: r.bloodType || 'N/A',
          quantity: r.quantity || 1,
          urgency: r.urgency || 'normal',
          status: r.status || 'pending',
          requestDate: r.requestDate || new Date().toISOString(),
          requiredDate: r.requiredDate || new Date().toISOString(),
          hospitalName: r.hospitalName || 'Unknown Hospital',
          hospitalAddress: r.hospitalAddress || '',
          patientName: r.patientName || '',
          notes: r.notes || ''
        }));

        setUrgentBloodRequests(formatted);
      }
    } catch (error) {
      console.error('Error fetching urgent blood requests:', error);
    }
  }, []);

  const fetchBloodInventory = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/admin/dashboard/blood-inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const inventory = data.inventory || data.data || [];
        
        const formatted = inventory.map((item: any) => ({
          bloodType: item.bloodType || 'Unknown',
          units: item.units || 0,
          minRequired: item.minRequired || 15,
          status: item.status || 'sufficient'
        }));
        
        setBloodInventory(formatted);
      }
    } catch (error) {
      console.error('Error fetching blood inventory:', error);
    }
  }, []);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleApprove = useCallback(async (id: string, type: 'donor' | 'hospital') => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again');
        return;
      }

      const endpoint = `/api/admin/donors/${id}/approve`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve' })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPendingApprovals(prev => prev.filter(p => p.id !== id));
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} approved successfully!`);
        await Promise.all([
          fetchPendingApprovals(token),
          fetchDashboardData(token)
        ]);
      } else {
        alert(data.error || `Failed to approve ${type}`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve. Please try again.');
    } finally {
      setProcessingId(null);
    }
  }, [fetchPendingApprovals, fetchDashboardData]);

  const handleReject = useCallback(async (id: string, type: 'donor' | 'hospital') => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login again');
        return;
      }

      const endpoint = `/api/admin/donors/${id}/approve`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'reject',
          reason: 'Application rejected by admin'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPendingApprovals(prev => prev.filter(p => p.id !== id));
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} rejected successfully!`);
        await Promise.all([
          fetchPendingApprovals(token),
          fetchDashboardData(token)
        ]);
      } else {
        alert(data.error || `Failed to reject ${type}`);
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject. Please try again.');
    } finally {
      setProcessingId(null);
    }
  }, [fetchPendingApprovals, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    
    window.location.href = '/';
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          router.replace('/');
          return;
        }

        let parsedUser;
        try {
          parsedUser = JSON.parse(userStr);
        } catch {
          localStorage.removeItem('user');
          router.replace('/');
          return;
        }

        if (parsedUser.role !== 'admin') {
          router.replace('/');
          return;
        }

        setAdminData(parsedUser);

        await Promise.all([
          fetchDashboardData(token),
          fetchPendingApprovals(token),
          fetchRecentDonors(token), // Fetch recent donors
          fetchBloodDrives(token),
          fetchBloodDriveRegistrations(token),
          fetchUrgentBloodRequests(token),
          fetchBloodInventory(token)
        ]);

      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('Failed to load admin data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthorized) {
      fetchAllData();
    } else if (!loading) {
      router.replace('/');
    }
  }, [router, loading, isAuthorized, fetchDashboardData, fetchPendingApprovals, fetchRecentDonors, fetchBloodDrives, fetchBloodDriveRegistrations, fetchUrgentBloodRequests, fetchBloodInventory]);

  // ============================================================
  // RENDER
  // ============================================================

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

  // Calculate available blood units
  const totalAvailableUnits = bloodInventory.reduce((sum, item) => sum + (item.units || 0), 0);
  const expiringSoon = bloodInventory.filter(item => 
    item.status === 'critical' || item.status === 'low' || item.status === 'out of stock'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* ============================================================
            STATS GRID - 6 Cards
        ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-lg">
                <Heart className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Donors</p>
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
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Hospitals</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.totalHospitals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
                <Droplet className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Available Units</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{totalAvailableUnits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Blood Requests</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{urgentBloodRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Donations</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.totalDonations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-950/30 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Expiring Soon</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{expiringSoon}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            MONTHLY DONATIONS CHART - FULL WIDTH
        ============================================================ */}
        <MonthlyDonationsChart data={stats.monthlyDonations} />

        {/* ============================================================
            URGENT BLOOD REQUESTS
        ============================================================ */}
        {urgentBloodRequests.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-2xl p-6 shadow-lg animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <Ambulance className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertOctagon className="h-5 w-5" />
                    URGENT: Blood Requests
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {urgentBloodRequests.length} critical requests need immediate attention
                  </p>
                </div>
              </div>
              <Link href="/admin/blood-requests">
                <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition shadow-md">
                  View All
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {urgentBloodRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-red-200 dark:border-red-800/50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getBloodTypeColor(request.bloodType)}`}>
                        {request.bloodType}
                      </span>
                      <span className="text-xs font-medium text-zinc-500">x{request.quantity}</span>
                    </div>
                    <span className="text-xs bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium uppercase">
                      {request.urgency}
                    </span>
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-white">{request.hospitalName}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Patient: {request.patientName || 'N/A'}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-zinc-400">
                    <span>Required: {new Date(request.requiredDate).toLocaleDateString()}</span>
                    <button className="text-red-600 hover:text-red-700 font-medium">
                      Respond →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            BLOOD DRIVE STATS + BLOOD INVENTORY - SIDE BY SIDE
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blood Drive Stats - Radial Chart */}
          <ChartRadialLabel 
            totalDrives={bloodDriveStats.total}
            registered={bloodDriveStats.totalRegistrations}
            attended={bloodDriveStats.totalAttendees}
            ongoing={bloodDriveStats.ongoing}
          />

          {/* Blood Inventory - Radar Chart */}
          <ChartRadarGridCircle data={bloodInventory} />
        </div>

        {/* ============================================================
            RECENT DONORS (NEW SECTION)
        ============================================================ */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              Recent Donors
              <span className="ml-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 text-xs px-2 py-0.5 rounded-full">
                {recentDonors.length}
              </span>
            </h2>
            <Link href="/admin/donors">
              <button className="text-sm text-red-600 hover:text-red-700 font-medium transition">
                View All
              </button>
            </Link>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentDonors.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent donors found</p>
              </div>
            ) : (
              recentDonors.map((donor) => (
                <div key={donor.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${donor.registrationType === 'walk-in' ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-blue-100 dark:bg-blue-950/30'}`}>
                      {donor.registrationType === 'walk-in' ? (
                        <UserPlus className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <UserCog className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                        {donor.fullName}
                        {donor.registrationType === 'walk-in' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                            Walk-in
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {donor.email}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getBloodTypeColor(donor.bloodType)}`}>
                          <Droplet className="h-3 w-3 inline mr-1" />
                          {donor.bloodType}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(donor.status)}`}>
                          {donor.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        Registered: {new Date(donor.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/donors/${donor.id}`}>
                      <button className="p-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition text-zinc-600 dark:text-zinc-300" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ============================================================
            PENDING APPROVALS
        ============================================================ */}
        {pendingApprovals.length > 0 && (
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
                    <div className={`p-2 rounded-full ${item.type === 'donor' ? 'bg-red-100 dark:bg-red-950/30' : 'bg-blue-100 dark:bg-blue-950/30'}`}>
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
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getBloodTypeColor(item.bloodType)}`}>
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
            </div>
          </div>
        )}

        {/* ============================================================
            UPCOMING BLOOD DRIVES + REGISTRATIONS
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Blood Drives */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                Upcoming Blood Drives
              </h3>
              <button 
                onClick={() => setShowBloodDrivesModal(true)}
                className="text-xs text-red-600 hover:text-red-700 font-medium transition"
              >
                View All
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {upcomingBloodDrives.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming blood drives</p>
                </div>
              ) : (
                upcomingBloodDrives.slice(0, 5).map((drive) => (
                  <div key={drive.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950/30">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{drive.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {drive.location}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(drive.date).toLocaleDateString()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(drive.status)}`}>
                          {drive.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {drive.registeredDonors}/{drive.targetDonors}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">registered</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Blood Drive Registrations */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-purple-500" />
                Recent Registrations
                <span className="ml-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                  ({recentRegistrations.length})
                </span>
              </h3>
              <button 
                onClick={() => setShowRegistrationsModal(true)}
                className="text-xs text-red-600 hover:text-red-700 font-medium transition"
              >
                View All
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentRegistrations.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  <UsersRound className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent registrations</p>
                </div>
              ) : (
                recentRegistrations.slice(0, 5).map((reg) => (
                  <div key={reg.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition border-l-4 border-purple-400 dark:border-purple-600">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-950/30">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {reg.donorName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getBloodTypeColor(reg.donorBloodType)}`}>
                          {reg.donorBloodType}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">
                          {reg.bloodDriveTitle}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(reg.status)}`}>
                          {reg.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            QUICK ACTIONS
        ============================================================ */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-zinc-400" />
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <Link href="/admin/inventory">
              <button className="w-full p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-all group">
                <Droplet className="h-6 w-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition" />
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Inventory</p>
              </button>
            </Link>
          </div>
        </div>

        {/* ============================================================
            RECENT ACTIVITY & SYSTEM STATUS
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Bell className="h-4 w-4 text-zinc-400" />
                Recent Activity
              </h3>
              <button 
                onClick={() => setShowActivityModal(true)}
                className="text-xs text-red-600 hover:text-red-700 font-medium transition"
              >
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
                stats.recentActivities.slice(0, 8).map((activity) => (
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
              <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Blood Drive Registrations</span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {bloodDriveStats.totalRegistrations}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Pending Blood Requests</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {urgentBloodRequests.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODALS
        ============================================================ */}
      <BloodDrivesModal 
        isOpen={showBloodDrivesModal} 
        onClose={() => setShowBloodDrivesModal(false)} 
      />
      <RegistrationsModal 
        isOpen={showRegistrationsModal} 
        onClose={() => setShowRegistrationsModal(false)} 
      />
      <ActivityModal 
        isOpen={showActivityModal} 
        onClose={() => setShowActivityModal(false)} 
        activities={stats.recentActivities}
      />
    </div>
  );
}