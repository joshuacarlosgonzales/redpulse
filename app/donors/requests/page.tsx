// app/donors/requests/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Syringe,
  Plus,
  Eye,
  XCircle,
  AlertTriangle,
  Ambulance,
  Hospital as HospitalIcon,
  Loader2,
  CheckCircle,
  Info,
  Calendar,
  Clock,
  Bell,
  Check,
  Send,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  Phone,
  User as UserIcon,
  CalendarDays,
  Clock as ClockIcon,
  Circle,
  CircleCheck,
  CircleAlert,
  CircleX,
  FileText,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Heart,
  Droplet,
  Users,
  BadgeCheck,
  AlertCircle
} from "lucide-react";
import BloodRequestModal from "@/components/DonorRequest/BloodRequestModal";

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

export default function BloodRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BloodRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'fulfilled' | 'rejected' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'critical', label: '🚨 Critical', color: 'text-red-600 bg-red-100' },
    { value: 'urgent', label: '⚡ Urgent', color: 'text-orange-600 bg-orange-100' },
    { value: 'normal', label: '📋 Normal', color: 'text-blue-600 bg-blue-100' }
  ];
  const requestMethods = [
    { value: 'emergency', label: '🚑 Emergency', description: 'Immediate blood needed for emergency surgery' },
    { value: 'scheduled', label: '📅 Scheduled', description: 'Planned blood transfusion for scheduled procedure' },
    { value: 'routine', label: '🔄 Routine', description: 'Regular blood supply for ongoing treatment' }
  ];
  const departments = ['Emergency Room', 'Surgery', 'Internal Medicine', 'Pediatrics', 'Oncology', 'Maternity', 'ICU', 'General Ward'];

  useEffect(() => {
    fetchRequests();
    fetchNotifications();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  useEffect(() => {
    filterRequests();
  }, [bloodRequests, selectedFilter, searchQuery]);

  const filterRequests = () => {
    let filtered = bloodRequests;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(r => r.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.hospitalName.toLowerCase().includes(query) ||
        r.bloodType.toLowerCase().includes(query) ||
        r.department?.toLowerCase().includes(query) ||
        r.doctorName?.toLowerCase().includes(query) ||
        r.patientName?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/blood-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBloodRequests(data.data || []);
        setFilteredRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/donor/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/donor/notifications?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/donor/notifications', {
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

  const handleCreateRequest = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/blood-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
          patientAge: formData.patientAge || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBloodRequests(prev => [data.data, ...prev]);
        setShowRequestModal(false);
        alert('Blood request submitted successfully! 🩸\n\nYou will receive a notification when your request is reviewed.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to submit request');
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/blood-requests?id=${requestId}`, {
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
        alert('Request cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Failed to cancel request');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
      approved: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400',
      fulfilled: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
      cancelled: 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400',
      rejected: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      critical: 'bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-900',
      urgent: 'bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400 border-orange-200 dark:border-orange-900',
      normal: 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 border-sky-200 dark:border-sky-900'
    };
    return colors[urgency as keyof typeof colors];
  };

  const getUrgencyAccent = (urgency: string) => {
    const accents = {
      critical: 'border-l-red-600',
      urgent: 'border-l-orange-500',
      normal: 'border-l-sky-500'
    };
    return accents[urgency as keyof typeof accents];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3.5 w-3.5" />;
      case 'approved':
        return <Check className="h-3.5 w-3.5" />;
      case 'fulfilled':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'rejected':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'cancelled':
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { icon: Clock, label: 'Pending', color: 'text-amber-600 dark:text-amber-400' },
      approved: { icon: Check, label: 'Approved', color: 'text-teal-600 dark:text-teal-400' },
      fulfilled: { icon: CheckCircle, label: 'Fulfilled', color: 'text-emerald-600 dark:text-emerald-400' },
      cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-zinc-500 dark:text-zinc-400' },
      rejected: { icon: XCircle, label: 'Rejected', color: 'text-rose-600 dark:text-rose-400' }
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const getFilterCount = (status: string) => {
    if (status === 'all') return bloodRequests.length;
    return bloodRequests.filter(r => r.status === status).length;
  };

  // Journey stage for the lifeline rail — pure presentation, derived from status only
  const getJourneyStage = (status: string) => {
    if (status === 'rejected' || status === 'cancelled') return -1;
    if (status === 'pending') return 0;
    if (status === 'approved') return 1;
    if (status === 'fulfilled') return 2;
    return 0;
  };

  // Notification dropdown
  const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) fetchNotifications();
          }}
          className="relative p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex-shrink-0"
        >
          <Bell className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 min-w-[18px] h-[18px] flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-900/10 border border-zinc-200 dark:border-zinc-800 z-50">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                  <Bell className="h-9 w-9 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm">You're all caught up</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      handleMarkAsRead(notif._id);
                      if (notif.link) router.push(notif.link);
                    }}
                    className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                      !notif.isRead ? 'bg-red-50/40 dark:bg-red-950/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                        notif.type === 'success' ? 'bg-emerald-500' :
                        notif.type === 'error' ? 'bg-rose-500' :
                        notif.type === 'warning' ? 'bg-amber-500' :
                        'bg-sky-500'
                      } ${!notif.isRead ? '' : 'opacity-30'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-zinc-900 dark:text-white ${!notif.isRead ? 'font-semibold' : 'font-medium'} truncate`}>
                          {notif.subject}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 tracking-wide">
                          {new Date(notif.createdAt).toLocaleDateString()} · {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {notifications.length > 5 && (
                <div className="p-3 text-center border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                  >
                    View all notifications →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-2 border-zinc-100 dark:border-zinc-800 border-t-red-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500 tracking-wide">Loading your requests…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-7 border border-zinc-200 dark:border-zinc-800">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-50 dark:bg-red-950/20 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="h-13 w-13 h-[52px] w-[52px] rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg shadow-red-900/20 flex-shrink-0 ring-1 ring-red-900/10">
              <Syringe className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                Blood Requests
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {bloodRequests.length}
                </span>
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                Request blood for yourself or someone in your care
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationDropdown />
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl transition-colors shadow-sm text-sm font-semibold whitespace-nowrap"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>New Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 mt-4 overflow-hidden">
        <div className="p-4 text-center sm:text-left">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Total</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{bloodRequests.length}</p>
        </div>
        <div className="p-4 text-center sm:text-left">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Pending</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {bloodRequests.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="p-4 text-center sm:text-left">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Approved</p>
          <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {bloodRequests.filter(r => r.status === 'approved').length}
          </p>
        </div>
        <div className="p-4 text-center sm:text-left">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Fulfilled</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {bloodRequests.filter(r => r.status === 'fulfilled').length}
          </p>
        </div>
        <div className="p-4 text-center sm:text-left col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Rejected</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {bloodRequests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 mt-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by hospital, blood type, patient…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-colors text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              All ({getFilterCount('all')})
            </button>
            <button
              onClick={() => setSelectedFilter('pending')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              Pending ({getFilterCount('pending')})
            </button>
            <button
              onClick={() => setSelectedFilter('approved')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === 'approved'
                  ? 'bg-teal-600 text-white'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              Approved ({getFilterCount('approved')})
            </button>
            <button
              onClick={() => setSelectedFilter('fulfilled')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === 'fulfilled'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              Fulfilled ({getFilterCount('fulfilled')})
            </button>
            <button
              onClick={() => setSelectedFilter('rejected')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === 'rejected'
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              Rejected ({getFilterCount('rejected') + getFilterCount('cancelled')})
            </button>
          </div>
        )}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-10 sm:p-14 border border-dashed border-zinc-200 dark:border-zinc-700 mt-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-4">
            <Syringe className="h-8 w-8 text-red-300 dark:text-red-800" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">No blood requests yet</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Nothing matches your search — try a different hospital, blood type, or name.' : 'When you need blood for yourself or someone in your care, start a request here.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="mt-5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm font-semibold inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Make your first request
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {filteredRequests.map((request) => {
            const StatusIcon = getStatusBadge(request.status).icon;
            const statusLabel = getStatusBadge(request.status).label;
            const statusColor = getStatusBadge(request.status).color;
            const journeyStage = getJourneyStage(request.status);

            return (
              <div
                key={request.id}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-l-4 ${getUrgencyAccent(request.urgency)} hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors overflow-hidden`}
              >
                <div className="p-3 sm:p-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left side - Main info */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        request.urgency === 'critical' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900' :
                        request.urgency === 'urgent' ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900' :
                        'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900'
                      }`}>
                        {request.urgency === 'critical' ? <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> :
                         request.urgency === 'urgent' ? <Ambulance className="h-3.5 w-3.5 text-orange-600" /> :
                         <HospitalIcon className="h-3.5 w-3.5 text-sky-600" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Title row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {request.bloodType} · {request.quantity} unit{parseInt(request.quantity) > 1 ? 's' : ''}
                          </h3>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getUrgencyColor(request.urgency)} flex-shrink-0`}>
                            {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getStatusColor(request.status)} flex items-center gap-1 flex-shrink-0`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusLabel}
                          </span>
                        </div>

                        {/* Journey rail — only for active, non-terminal-negative requests */}
                        {journeyStage >= 0 && (
                          <div className="flex items-center gap-1 mt-1.5 mb-0.5">
                            {['Submitted', 'Reviewed', 'Fulfilled'].map((label, i) => (
                              <div key={label} className="flex items-center gap-1">
                                <div className={`h-1 w-1 rounded-full ${i <= journeyStage ? 'bg-red-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                                <span className={`text-[9px] font-medium tracking-wide ${i <= journeyStage ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                  {label}
                                </span>
                                {i < 2 && <div className={`w-3 h-px ${i < journeyStage ? 'bg-red-300' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mt-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
                            <Building2 className="h-3 w-3 flex-shrink-0 text-zinc-400" />
                            <span className="truncate">{request.hospitalName}</span>
                          </div>
                          {request.department && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
                              <MapPin className="h-3 w-3 flex-shrink-0 text-zinc-400" />
                              <span className="truncate">{request.department}</span>
                            </div>
                          )}
                          {request.patientName && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
                              <UserIcon className="h-3 w-3 flex-shrink-0 text-zinc-400" />
                              <span className="truncate">{request.patientName}{request.patientAge ? ` (${request.patientAge} yrs)` : ''}</span>
                            </div>
                          )}
                          {request.doctorName && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
                              <UserIcon className="h-3 w-3 flex-shrink-0 text-zinc-400" />
                              <span className="truncate">Dr. {request.doctorName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
                            <CalendarDays className="h-3 w-3 flex-shrink-0 text-zinc-400" />
                            <span className="truncate">Required {new Date(request.requiredDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
                            <ClockIcon className="h-3 w-3 flex-shrink-0 text-zinc-400" />
                            <span className="truncate">Requested {new Date(request.requestDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mt-2 p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5">
                              <FileText className="h-3 w-3 text-zinc-400 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{request.notes}</span>
                            </p>
                          </div>
                        )}

                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/50">
                            <div className="flex items-start gap-2">
                              <XCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Request rejected</p>
                                <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-0.5">{request.rejectionReason}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {request.status === 'fulfilled' && (
                          <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Request fulfilled</p>
                                <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-0.5">
                                  A confirmation has been sent to your notifications.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => cancelRequest(request.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-md transition-colors flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </button>
                      )}
                      {request.status === 'approved' && (
                        <div className="px-2.5 py-1 text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 rounded-md flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Awaiting fulfillment
                        </div>
                      )}
                      {request.status === 'fulfilled' && (
                        <div className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-md flex items-center gap-1">
                          <Send className="h-3 w-3" />
                          Completed
                        </div>
                      )}
                      {request.status === 'cancelled' && (
                        <div className="px-2.5 py-1 text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Cancelled
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BloodRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleCreateRequest}
        bloodTypes={bloodTypes}
        urgencyLevels={urgencyLevels}
        requestMethods={requestMethods}
        departments={departments}
        profileName={user?.fullName}
      />
    </div>
  );
}