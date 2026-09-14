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
  X,
  CalendarDays,
  Droplets,
  Gift,
  Star,
  Trophy,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  Target,
  Gift as GiftIcon,
  CircleCheck,
  CircleAlert,
  Circle,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  LayoutDashboard,
  ChartBar,
  Sparkles
} from "lucide-react";
import NotificationModal from "@/components/UserNotif/NotificationModal";
import DonorProfileModal from "@/components/donor/DonorProfileModal";

// Import Recharts
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LabelList
} from "recharts";

// Define the Notification interface to match the one in NotificationModal
interface Notification {
  _id: string;
  subject: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  sender?: string;
  link?: string;
}

interface DonorStats {
  totalDonations: number;
  nextEligibleDate: string;
  lastDonationDate: string;
  bloodType: string;
  totalPoints: number;
  lifetimeDonations: number;
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
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled' | 'rejected';
  requestDate: string;
  requiredDate: string;
  patientName?: string;
  patientAge?: number;
  notes?: string;
  requestMethod?: 'emergency' | 'scheduled' | 'routine';
  department?: string;
  doctorName?: string;
  contactNumber?: string;
  rejectionReason?: string;
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

// KPI Analytics Interface
interface DonorKPIAnalytics {
  totalDonations: number;
  donationsThisYear: number;
  donationsThisMonth: number;
  donationTrend: 'up' | 'down' | 'stable';
  donationGrowthRate: number;
  totalPoints: number;
  pointsThisYear: number;
  pointsThisMonth: number;
  pointsTrend: 'up' | 'down' | 'stable';
  pointsGrowthRate: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  fulfilledRequests: number;
  rejectedRequests: number;
  requestSuccessRate: number;
  totalDrivesRegistered: number;
  upcomingDrives: number;
  completedDrives: number;
  driveAttendanceRate: number;
  daysUntilEligible: number;
  nextEligibleDate: string;
  engagementScore: number;
  engagementLevel: 'low' | 'medium' | 'high' | 'excellent';
  achievements: {
    id: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedDate?: string;
  }[];
  activitySummary: {
    label: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

// Standard waiting period between whole blood donations (in days).
const DONATION_ELIGIBILITY_DAYS = 45;

function computeNextEligibleDate(lastDonationDate: string | undefined | null): string {
  if (!lastDonationDate) return '';
  const last = new Date(lastDonationDate);
  if (isNaN(last.getTime())) return '';
  const next = new Date(last.getTime() + DONATION_ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000);
  return next.toISOString();
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
    lifetimeDonations: 0
  });
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bloodDrives, setBloodDrives] = useState<BloodDrive[]>([]);
  const [registeredDrives, setRegisteredDrives] = useState<BloodDrive[]>([]);
  const [kpiAnalytics, setKpiAnalytics] = useState<DonorKPIAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kpi'>('dashboard');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<BloodDrive | null>(null);
  const [showDriveDetails, setShowDriveDetails] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Track window width for responsive chart bars (prevents SSR crash)
  const [windowWidth, setWindowWidth] = useState(0);

  const router = useRouter();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    checkAuth();
  }, []);

  // Safely get window width on client-side only
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      const donorId = userData.id || userData.userId || userData._id;
      await fetchDonorData(donorId);
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
            n._id === notificationId ? { ...n, isRead: true } : n
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

        const totalDonations = donorData.totalDonations || 0;
        const points = donorData.points || 0;
        const lastDonationDate = donorData.lastDonationDate || '';

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
          totalDonations: totalDonations,
          lastDonationDate: lastDonationDate,
          points: points,
          emergencyName: donorData.emergencyName || '',
          emergencyRelationship: donorData.emergencyRelationship || ''
        });

        setStats({
          bloodType: donorData.bloodType || 'A+',
          totalDonations: totalDonations,
          lifetimeDonations: totalDonations,
          totalPoints: points,
          lastDonationDate: lastDonationDate,
          nextEligibleDate: donorData.nextEligibleDate || computeNextEligibleDate(lastDonationDate)
        });
      }

      // Fetch donations
      try {
        let donationsData: RecentDonation[] = [];
        let donationsResponse;

        donationsResponse = await fetch(`/api/donations/donor/${userId}?limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (donationsResponse.ok) {
          const result = await donationsResponse.json();
          donationsData = result.data || [];
        } else {
          donationsResponse = await fetch(`/api/donations?donorId=${userId}&limit=10`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (donationsResponse.ok) {
            const result = await donationsResponse.json();
            donationsData = result.data || [];
          } else {
            donationsResponse = await fetch(`/api/user/donations?limit=10`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (donationsResponse.ok) {
              const result = await donationsResponse.json();
              donationsData = result.data || [];
            }
          }
        }

        donationsData = [...donationsData].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setRecentDonations(donationsData);

        if (donationsData.length > 0) {
          const completedDonations = donationsData.filter(d => d.status === 'completed');
          const totalPoints = donationsData.reduce((sum, d) => sum + (d.points || 0), 0);
          const lastDonation = completedDonations.length > 0 ? completedDonations[0] : null;
          const resolvedLastDonationDate = lastDonation?.date || undefined;

          setStats(prev => ({
            ...prev,
            totalDonations: completedDonations.length,
            lifetimeDonations: completedDonations.length,
            totalPoints: totalPoints,
            lastDonationDate: resolvedLastDonationDate || prev.lastDonationDate,
            nextEligibleDate: computeNextEligibleDate(resolvedLastDonationDate || prev.lastDonationDate) || prev.nextEligibleDate
          }));
        }
      } catch (error) {
        console.log('Donations endpoint not available');
        setRecentDonations([]);
      }

      // Fetch blood requests
      try {
        let requestsData = [];
        let requestsResponse;

        requestsResponse = await fetch(`/api/user/blood-requests`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (requestsResponse.ok) {
          const result = await requestsResponse.json();
          requestsData = result.data || [];
        } else {
          requestsResponse = await fetch(`/api/blood-requests/donor/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (requestsResponse.ok) {
            const result = await requestsResponse.json();
            requestsData = result.data || [];
          }
        }

        setBloodRequests(requestsData);
      } catch (error) {
        console.log('Blood requests endpoint not available');
        setBloodRequests([]);
      }

      setDataLoaded(true);

    } catch (error) {
      console.error('Error fetching donor data:', error);
      showNotification('error', 'Failed to load donor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredDrives = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      let drivesData = [];
      let response;

      response = await fetch('/api/blood-drives/registered', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        drivesData = data.data || [];
      } else {
        response = await fetch('/api/user/blood-drives/registered', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          drivesData = data.data || [];
        }
      }

      setRegisteredDrives(drivesData);
    } catch (error) {
      console.error('Error fetching registered drives:', error);
      setRegisteredDrives([]);
    }
  };

  const fetchBloodDrives = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/blood-drives?status=all&limit=20', {
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

  const calculateKPIAnalytics = (): DonorKPIAnalytics => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const donationsThisYear = recentDonations.filter(d =>
      new Date(d.date).getFullYear() === currentYear
    );
    const donationsThisMonth = donationsThisYear.filter(d =>
      new Date(d.date).getMonth() === currentMonth
    );

    // Handle month rollover in January
    const lastMonthDonations = recentDonations.filter(d => {
      const date = new Date(d.date);
      let year = currentYear;
      let month = currentMonth - 1;
      if (month < 0) {
        month = 11;
        year = currentYear - 1;
      }
      return date.getFullYear() === year && date.getMonth() === month;
    }).length;
    const currentMonthDonations = donationsThisMonth.length;
    const donationGrowthRate = lastMonthDonations > 0
      ? ((currentMonthDonations - lastMonthDonations) / lastMonthDonations) * 100
      : currentMonthDonations > 0 ? 100 : 0;

    const totalRequests = bloodRequests.length;
    const pendingRequests = bloodRequests.filter(r => r.status === 'pending').length;
    const approvedRequests = bloodRequests.filter(r => r.status === 'approved').length;
    const fulfilledRequests = bloodRequests.filter(r => r.status === 'fulfilled').length;
    const rejectedRequests = bloodRequests.filter(r => r.status === 'rejected').length;
    const requestSuccessRate = totalRequests > 0
      ? ((fulfilledRequests + approvedRequests) / totalRequests) * 100
      : 0;

    const upcomingDrives = registeredDrives.filter(d => d.status === 'upcoming').length;
    const completedDrives = registeredDrives.filter(d => d.status === 'completed').length;
    const driveAttendanceRate = registeredDrives.length > 0
      ? (completedDrives / registeredDrives.length) * 100
      : 0;

    const daysUntilEligible = stats.nextEligibleDate
      ? Math.max(0, Math.ceil((new Date(stats.nextEligibleDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const donationScore = Math.min(stats.totalDonations * 10, 100);
    const pointsScore = Math.min(stats.totalPoints / 10, 100);
    const requestScore = Math.min(fulfilledRequests * 15, 100);
    const driveScore = Math.min(completedDrives * 20, 100);
    const engagementScore = Math.min(Math.round((donationScore + pointsScore + requestScore + driveScore) / 4), 100);

    let engagementLevel: 'low' | 'medium' | 'high' | 'excellent' = 'low';
    if (engagementScore >= 80) engagementLevel = 'excellent';
    else if (engagementScore >= 60) engagementLevel = 'high';
    else if (engagementScore >= 40) engagementLevel = 'medium';

    const achievements = [
      {
        id: 'first_donation',
        title: 'First Blood Donation',
        description: 'Completed your first blood donation',
        icon: '💉',
        earned: stats.totalDonations >= 1,
        earnedDate: stats.lastDonationDate
      },
      {
        id: 'five_donations',
        title: 'Lifesaver',
        description: 'Completed 5 blood donations',
        icon: '🩸',
        earned: stats.totalDonations >= 5,
        earnedDate: undefined
      },
      {
        id: 'ten_donations',
        title: 'Hero',
        description: 'Completed 10 blood donations',
        icon: '🦸',
        earned: stats.totalDonations >= 10,
        earnedDate: undefined
      },
      {
        id: 'twenty_donations',
        title: 'Legend',
        description: 'Completed 20 blood donations',
        icon: '🏆',
        earned: stats.totalDonations >= 20,
        earnedDate: undefined
      },
      {
        id: 'points_100',
        title: 'Points Collector',
        description: 'Earned 100 points',
        icon: '⭐',
        earned: stats.totalPoints >= 100,
        earnedDate: undefined
      },
      {
        id: 'points_500',
        title: 'Points Master',
        description: 'Earned 500 points',
        icon: '🌟',
        earned: stats.totalPoints >= 500,
        earnedDate: undefined
      },
      {
        id: 'points_1000',
        title: 'Elite Donor',
        description: 'Earned 1000 points',
        icon: '👑',
        earned: stats.totalPoints >= 1000,
        earnedDate: undefined
      },
      {
        id: 'first_request',
        title: 'Blood Requestor',
        description: 'Made your first blood request',
        icon: '📋',
        earned: totalRequests >= 1,
        earnedDate: undefined
      },
      {
        id: 'drive_participant',
        title: 'Community Hero',
        description: 'Participated in your first blood drive',
        icon: '🤝',
        earned: completedDrives >= 1,
        earnedDate: undefined
      }
    ];

    const activitySummary = [
      {
        label: 'Total Donations',
        value: stats.totalDonations,
        change: donationGrowthRate,
        trend: donationGrowthRate > 5 ? 'up' as const : donationGrowthRate < -5 ? 'down' as const : 'stable' as const
      },
      {
        label: 'Points Earned',
        value: stats.totalPoints,
        change: 0,
        trend: 'stable' as const
      },
      {
        label: 'Requests Fulfilled',
        value: fulfilledRequests,
        change: 0,
        trend: 'stable' as const
      },
      {
        label: 'Drives Attended',
        value: completedDrives,
        change: 0,
        trend: 'stable' as const
      }
    ];

    return {
      totalDonations: stats.totalDonations,
      donationsThisYear: donationsThisYear.length,
      donationsThisMonth: donationsThisMonth.length,
      donationTrend: donationGrowthRate > 5 ? 'up' : donationGrowthRate < -5 ? 'down' : 'stable',
      donationGrowthRate,
      totalPoints: stats.totalPoints,
      pointsThisYear: stats.totalPoints,
      pointsThisMonth: stats.totalPoints,
      pointsTrend: 'stable',
      pointsGrowthRate: 0,
      totalRequests,
      pendingRequests,
      approvedRequests,
      fulfilledRequests,
      rejectedRequests,
      requestSuccessRate,
      totalDrivesRegistered: registeredDrives.length,
      upcomingDrives,
      completedDrives,
      driveAttendanceRate,
      daysUntilEligible,
      nextEligibleDate: stats.nextEligibleDate,
      engagementScore,
      engagementLevel,
      achievements,
      activitySummary
    };
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'fulfilled':
        return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      case 'pending':
        return 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
      case 'scheduled':
        return 'text-sky-700 bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800';
      case 'cancelled':
        return 'text-rose-700 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
      case 'approved':
        return 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800';
      case 'rejected':
        return 'text-rose-700 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
      default:
        return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'urgent':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'normal':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400';
    }
  };

  const getDriveStatusColor = (status: string) => {
    const colors = {
      upcoming: 'bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400',
      ongoing: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
      completed: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400',
      cancelled: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
    };
    return colors[status as keyof typeof colors] || colors.upcoming;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-rose-500" />;
      default:
        return <Minus className="h-4 w-4 text-amber-500" />;
    }
  };

  // Generate chart data from ACTUAL donation history
  const generateDonationChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const monthlyCounts = new Array(12).fill(0);
    recentDonations.forEach((donation) => {
      if (donation.status !== 'completed') return;
      const date = new Date(donation.date);
      if (isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;
      monthlyCounts[date.getMonth()] += 1;
    });

    return months.map((month, index) => ({
      month,
      donations: monthlyCounts[index]
    }));
  };

  const generatePointsChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlyPoints = new Array(12).fill(0);
    recentDonations.forEach((donation) => {
      const date = new Date(donation.date);
      if (isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;
      monthlyPoints[date.getMonth()] += donation.points || 0;
    });

    let cumulative = 0;
    return months.map((month, index) => {
      if (index > currentMonth) {
        return { month, points: null };
      }
      cumulative += monthlyPoints[index];
      return {
        month,
        points: cumulative
      };
    });
  };

  useEffect(() => {
    if (!loading && dataLoaded) {
      const analytics = calculateKPIAnalytics();
      setKpiAnalytics(analytics);
    }
  }, [loading, dataLoaded, recentDonations, bloodRequests, registeredDrives, stats]);

  useEffect(() => {
    if (!loading) {
      fetchRegisteredDrives();
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative flex justify-center mb-5">
            <div className="h-14 w-14 rounded-full border-[3px] border-rose-100 dark:border-rose-950/40" />
            <div className="absolute inset-0 h-14 w-14 border-[3px] border-rose-600 border-t-transparent rounded-full animate-spin" />
            <Droplet className="absolute inset-0 m-auto h-5 w-5 text-rose-600" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // Eligibility ring geometry (used in the KPI tab's signature card)
  const eligibilityRingRadius = 26;
  const eligibilityRingCirc = 2 * Math.PI * eligibilityRingRadius;
  const eligibilityProgress = kpiAnalytics
    ? Math.min(1, Math.max(0, 1 - kpiAnalytics.daysUntilEligible / DONATION_ELIGIBILITY_DAYS))
    : 0;

  return (
    <div className="space-y-5 sm:space-y-7 px-3 sm:px-4 md:px-6 pb-8 max-w-full overflow-x-hidden">
      {notification && (
        <div className={`fixed top-20 right-4 left-4 sm:left-auto z-50 p-4 rounded-xl shadow-lg border max-w-md backdrop-blur-sm ${
          notification.type === 'success'
            ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : notification.type === 'error'
            ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-sky-50/95 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'info' && <Bell className="h-5 w-5 flex-shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header row: greeting + tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
            Donor Dashboard
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            {profile?.fullName ? `Welcome back, ${profile.fullName.split(' ')[0]}` : 'Welcome back'}
          </h1>
        </div>

        <div className="inline-flex self-stretch sm:self-auto items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('kpi')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'kpi'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <ChartBar className="h-4 w-4 flex-shrink-0" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="group bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-w-0 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate">Total Donations</span>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                  <Droplet className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-none">{stats.totalDonations}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 truncate">
                Lifetime: {stats.lifetimeDonations}
              </p>
            </div>

            <div className="group bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-w-0 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate">Blood Type</span>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-none">{profile?.bloodType || stats.bloodType}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 truncate">
                Rh {(profile?.bloodType || stats.bloodType).includes('+') ? 'Positive' : 'Negative'}
              </p>
            </div>

            <div className="group bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-w-0 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate">Points Earned</span>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-none">{stats.totalPoints}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 truncate">
                {stats.totalPoints >= 1000 ? '🏆 Elite' : stats.totalPoints >= 100 ? '⭐ Growing' : '🌱 New'}
              </p>
            </div>

            <div className="group bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-w-0 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate">Last Donation</span>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white truncate leading-none">
                {stats.lastDonationDate ? new Date(stats.lastDonationDate).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 truncate">
                {stats.lastDonationDate ? Math.floor((Date.now() - new Date(stats.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)) : 0} days ago
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Blood Requests Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 min-w-0">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2 min-w-0">
                  <span className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                    <Syringe className="h-4 w-4 text-rose-600" />
                  </span>
                  <span className="truncate">Blood Requests <span className="text-zinc-400 dark:text-zinc-500 font-normal">({bloodRequests.length})</span></span>
                </h2>
                <Link
                  href="/donors/requests"
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium transition flex items-center gap-1 flex-shrink-0"
                >
                  <span className="hidden sm:inline">View all</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {bloodRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                      <Syringe className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">No blood requests yet</p>
                  </div>
                ) : (
                  bloodRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition gap-2 min-w-0"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          request.urgency === 'critical' ? 'bg-rose-50 dark:bg-rose-950/30' :
                          request.urgency === 'urgent' ? 'bg-amber-50 dark:bg-amber-950/30' :
                          'bg-sky-50 dark:bg-sky-950/30'
                        }`}>
                          {request.urgency === 'critical' ? <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" /> :
                           request.urgency === 'urgent' ? <Ambulance className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" /> :
                           <HospitalIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">
                            {request.bloodType} · {request.quantity} unit{parseInt(request.quantity) > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {request.hospitalName} • {new Date(request.requiredDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRequestDetails(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition flex-shrink-0"
                          aria-label="View request details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Registered Blood Drives Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 min-w-0">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2 min-w-0">
                  <span className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-sky-600" />
                  </span>
                  <span className="truncate">Registered Drives <span className="text-zinc-400 dark:text-zinc-500 font-normal">({registeredDrives.length})</span></span>
                </h2>
                <Link
                  href="/donors/blood-drives"
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium transition flex items-center gap-1 flex-shrink-0"
                >
                  <span className="hidden sm:inline">View all</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {registeredDrives.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">No registered blood drives</p>
                    <Link
                      href="/donors/blood-drives"
                      className="text-sm text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 mt-2"
                    >
                      Find a blood drive <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  registeredDrives.slice(0, 3).map((drive) => (
                    <div
                      key={drive.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition gap-2 min-w-0"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                          <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">
                            {drive.title}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {drive.location} • {new Date(drive.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-full ${getDriveStatusColor(drive.status)}`}>
                          {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedDrive(drive);
                            setShowDriveDetails(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition flex-shrink-0"
                          aria-label="View drive details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Donations Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 min-w-0">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2 min-w-0">
                <span className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center flex-shrink-0">
                  <History className="h-4 w-4 text-violet-600" />
                </span>
                <span className="truncate">Recent Donations <span className="text-zinc-400 dark:text-zinc-500 font-normal">({recentDonations.length})</span></span>
              </h2>
            </div>

            <div className="space-y-2.5">
              {recentDonations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <Droplets className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">No donations to display yet</p>
                </div>
              ) : (
                recentDonations.slice(0, 5).map((donation) => (
                  <div
                    key={donation.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition gap-2 min-w-0"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                        <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">
                          {new Date(donation.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{donation.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-auto sm:ml-0">
                      <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-full border ${getStatusColor(donation.status)}`}>
                        {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                      </span>
                      <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">+{donation.points} pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* KPI Analytics Tab */
        kpiAnalytics && (
          <div className="space-y-4 sm:space-y-6">
            {/* Engagement Score + Eligibility ring — signature panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-600 to-rose-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -right-2 top-16 h-16 w-16 rounded-full bg-white/10" />
                <div className="relative flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-rose-100 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Engagement Score
                    </p>
                    <p className="text-4xl sm:text-5xl font-bold mt-2 leading-none">{kpiAnalytics.engagementScore}<span className="text-2xl align-top">%</span></p>
                    <p className="text-rose-100 text-sm mt-2">
                      Level: <span className="font-semibold capitalize">{kpiAnalytics.engagementLevel}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <HeartIcon className="w-9 h-9 sm:w-10 sm:h-10 text-white/90" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Eligibility countdown ring — signature element */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 sm:gap-5">
                <div className="relative h-20 w-20 flex-shrink-0">
                  <svg viewBox="0 0 64 64" className="h-20 w-20 -rotate-90">
                    <circle cx="32" cy="32" r={eligibilityRingRadius} fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-100 dark:text-zinc-800" />
                    <circle
                      cx="32" cy="32" r={eligibilityRingRadius} fill="none"
                      stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                      className={kpiAnalytics.daysUntilEligible === 0 ? 'text-emerald-500' : 'text-rose-500'}
                      strokeDasharray={eligibilityRingCirc}
                      strokeDashoffset={eligibilityRingCirc * (1 - eligibilityProgress)}
                    />
                  </svg>
                  <Droplet className={`absolute inset-0 m-auto h-5 w-5 ${kpiAnalytics.daysUntilEligible === 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Eligibility</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight mt-1">
                    {kpiAnalytics.daysUntilEligible === 0 ? 'Ready now' : `${kpiAnalytics.daysUntilEligible}d left`}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                    {kpiAnalytics.daysUntilEligible === 0
                      ? 'You can donate today'
                      : new Date(kpiAnalytics.nextEligibleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate">Donation Growth</span>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white leading-none">
                  {kpiAnalytics.donationGrowthRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {getTrendIcon(kpiAnalytics.donationTrend)}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize truncate">
                    {kpiAnalytics.donationTrend === 'up' ? 'Increasing' :
                     kpiAnalytics.donationTrend === 'down' ? 'Decreasing' : 'Stable'}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate">Request Success</span>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center flex-shrink-0">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white leading-none">
                  {kpiAnalytics.requestSuccessRate.toFixed(1)}%
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 truncate">
                  {kpiAnalytics.fulfilledRequests} fulfilled
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate">Drive Attendance</span>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white leading-none">
                  {kpiAnalytics.driveAttendanceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 truncate">
                  {kpiAnalytics.completedDrives} attended
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Donation Activity Chart */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4">
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white truncate">Donation Activity</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Monthly donation trends</p>
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 sm:mt-0 flex-shrink-0">{currentYear}</span>
                </div>
                <div className="h-[200px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateDonationChartData()} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(225,29,72,0.08)' }}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                        }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 500, marginBottom: 4, fontSize: 12 }}
                        itemStyle={{ color: '#f4f4f5', fontSize: 12 }}
                        formatter={(value) => [`${value}`, 'Donations']}
                        labelFormatter={(label) => `${label} ${currentYear}`}
                      />
                      <Bar
                        dataKey="donations"
                        fill="url(#donationGradient)"
                        radius={[6, 6, 0, 0]}
                        barSize={Math.min(24, windowWidth < 640 ? 16 : 24)}
                      >
                        <LabelList
                          dataKey="donations"
                          position="top"
                          style={{ fontSize: '10px', fill: '#6b7280', fontWeight: 500 }}
                          formatter={(value: any) => (Number(value) > 0 ? value : '')}
                        />
                      </Bar>
                      <defs>
                        <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#be123c" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Total donations this year</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{kpiAnalytics.donationsThisYear}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mt-1.5">
                    <span className="text-zinc-500 dark:text-zinc-400">Growth rate</span>
                    <span className={`font-medium ${
                      kpiAnalytics.donationTrend === 'up' ? 'text-emerald-600' :
                      kpiAnalytics.donationTrend === 'down' ? 'text-rose-600' :
                      'text-amber-600'
                    }`}>
                      {kpiAnalytics.donationTrend === 'up' ? '↑' : kpiAnalytics.donationTrend === 'down' ? '↓' : '−'}
                      {Math.abs(kpiAnalytics.donationGrowthRate).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Points Progress Chart */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4">
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white truncate">Points Progress</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Points accumulation over time</p>
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 sm:mt-0 flex-shrink-0">All time</span>
                </div>
                <div className="h-[200px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generatePointsChartData()} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(217,119,6,0.08)' }}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                        }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 500, marginBottom: 4, fontSize: 12 }}
                        itemStyle={{ color: '#f4f4f5', fontSize: 12 }}
                        formatter={(value) => [`${value}`, 'Points']}
                        labelFormatter={(label) => `${label} ${currentYear}`}
                      />
                      <Bar
                        dataKey="points"
                        fill="url(#pointsGradient)"
                        radius={[6, 6, 0, 0]}
                        barSize={Math.min(24, windowWidth < 640 ? 16 : 24)}
                      >
                        <LabelList
                          dataKey="points"
                          position="top"
                          style={{ fontSize: '10px', fill: '#6b7280', fontWeight: 500 }}
                          formatter={(value: any) => (Number(value) > 0 ? value : '')}
                        />
                      </Bar>
                      <defs>
                        <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Total points earned</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{kpiAnalytics.totalPoints}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mt-1.5">
                    <span className="text-zinc-500 dark:text-zinc-400">Next milestone</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400 truncate">
                      {kpiAnalytics.totalPoints >= 1000 ? '🏆 Elite achieved!' :
                       `${1000 - kpiAnalytics.totalPoints} pts to Elite`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {kpiAnalytics.activitySummary.map((item, index) => (
                <div key={index} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">{item.label}</p>
                      <p className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-white mt-1">{item.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      item.trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      item.trend === 'down' ? 'bg-rose-100 dark:bg-rose-900/30' :
                      'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {item.trend === 'up' && <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />}
                      {item.trend === 'down' && <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-600" />}
                      {item.trend === 'stable' && <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs sm:text-sm font-medium ${
                      item.trend === 'up' ? 'text-emerald-600' :
                      item.trend === 'down' ? 'text-rose-600' :
                      'text-amber-600'
                    }`}>
                      {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '−'}
                      {Math.abs(item.change).toFixed(1)}%
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 truncate">vs last month</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                  <GiftIcon className="h-4 w-4 text-amber-600" />
                </span>
                <span className="truncate">Achievements &amp; Badges</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {kpiAnalytics.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 sm:p-4 rounded-xl border text-center transition min-w-0 ${
                      achievement.earned
                        ? 'bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/30 dark:to-amber-900/10 border-amber-200 dark:border-amber-800'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 opacity-60'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-1.5">{achievement.icon}</div>
                    <p className={`text-xs sm:text-sm font-semibold truncate ${achievement.earned ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {achievement.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1 hidden sm:block truncate">
                      {achievement.description}
                    </p>
                    {achievement.earned ? (
                      <div className="mt-1.5">
                        <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Earned</span>
                      </div>
                    ) : (
                      <div className="mt-1.5">
                        <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500">Locked</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                  <Syringe className="w-5 h-5 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">Request Details</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">Blood request information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRequestDetails(false);
                  setSelectedRequest(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Blood Type</p>
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base mt-0.5">{selectedRequest.bloodType}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Quantity</p>
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base mt-0.5">{selectedRequest.quantity} unit{parseInt(selectedRequest.quantity) > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Urgency</p>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-block ${getUrgencyColor(selectedRequest.urgency)}`}>
                    {selectedRequest.urgency.charAt(0).toUpperCase() + selectedRequest.urgency.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Status</p>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border inline-block ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Hospital</p>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm sm:text-base truncate mt-0.5">{selectedRequest.hospitalName}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Required Date</p>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm sm:text-base mt-0.5">{new Date(selectedRequest.requiredDate).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedRequest.patientName && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Patient</p>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm sm:text-base mt-0.5">
                    {selectedRequest.patientName}
                    {selectedRequest.patientAge && ` (${selectedRequest.patientAge} yrs)`}
                  </p>
                </div>
              )}

              {selectedRequest.doctorName && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Doctor</p>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm sm:text-base mt-0.5">{selectedRequest.doctorName}</p>
                </div>
              )}

              {selectedRequest.department && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Department</p>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm sm:text-base mt-0.5">{selectedRequest.department}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Notes</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.rejectionReason && (
                <div className="p-3 sm:p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                  <p className="text-sm text-rose-700 dark:text-rose-400">
                    <span className="font-medium">Rejection reason:</span> {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blood Drive Details Modal */}
      {showDriveDetails && selectedDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">Blood Drive Details</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">{selectedDrive.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDriveDetails(false);
                  setSelectedDrive(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getDriveStatusColor(selectedDrive.status)}`}>
                  {selectedDrive.status.charAt(0).toUpperCase() + selectedDrive.status.slice(1)}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(selectedDrive.date).toLocaleDateString()}
                </span>
              </div>

              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Location</p>
                <p className="font-medium text-zinc-900 dark:text-white text-sm sm:text-base mt-0.5">{selectedDrive.location}</p>
                {selectedDrive.address && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedDrive.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Date</p>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm mt-0.5">
                    {new Date(selectedDrive.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Time</p>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm mt-0.5">
                    {selectedDrive.startTime} - {selectedDrive.endTime}
                  </p>
                </div>
              </div>

              {selectedDrive.description && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Description</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedDrive.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Blood Types Needed</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {selectedDrive.bloodTypesNeeded.map((type) => (
                    <span
                      key={type}
                      className="px-2.5 sm:px-3 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-medium rounded-lg"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">Target</p>
                  <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{selectedDrive.targetDonors}</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-sky-600 dark:text-sky-400">Registered</p>
                  <p className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 mt-0.5">{selectedDrive.registeredDonors}</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">Completed</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedDrive.completedDonations}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Registration Status</p>
                <div className="flex items-center gap-2 mt-1.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedDrive.isRegistered ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                  <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                    {selectedDrive.isRegistered ? 'You are registered for this drive' : 'Not registered for this drive'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllAsRead}
      />

      {/* Profile Modal */}
      {showProfileModal && profile && (
        <DonorProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            const user = localStorage.getItem('user');
            if (user) {
              try {
                const userData = JSON.parse(user);
                fetchDonorData(userData.id || userData.userId);
              } catch (e) {
                console.error('Error reloading profile:', e);
              }
            }
          }}
          profile={profile}
          onSave={async (data) => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`/api/donors/${profile.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
              });
              if (response.ok) {
                const result = await response.json();
                const updatedData = result.data || result;
                setProfile(prev => ({ ...prev!, ...updatedData }));
                showNotification('success', 'Profile updated successfully!');
                return result;
              }
              throw new Error('Failed to update profile');
            } catch (error) {
              showNotification('error', 'Failed to update profile');
              throw error;
            }
          }}
          onUpdate={(data) => {
            setProfile(prev => ({ ...prev!, ...data }));
          }}
        />
      )}
    </div>
  );
}