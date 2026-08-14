// components/layouts/HospitalNavbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  LogOut,
  Settings,
  Hospital,
  HelpCircle,
  ChevronDown,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  Search,
  Heart,
  X
} from 'lucide-react';
import { HospitalProfileModal } from '@/components/hospital/HospitalProfileModal';
import { HospitalSetupModal } from '@/components/hospital/HospitalSetupModal';

interface HospitalProfile {
  id: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  hospitalLicense: string;
  hospitalType: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: string;
  updatedAt: string;
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

interface HospitalNavbarProps {
  onMenuClick?: () => void;
  unreadCount?: number;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export function HospitalNavbar({
  onMenuClick,
  unreadCount = 0,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead
}: HospitalNavbarProps) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [profile, setProfile] = useState<HospitalProfile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showSetupNotification, setShowSetupNotification] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
    fetchProfile();
    
    // Check dark mode preference
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Auto-open setup modal if no hospital exists or status is pending
  useEffect(() => {
    if (!loading && profile) {
      // If no hospital name or status is pending/inactive, show setup modal
      if (!profile.hospitalName || profile.status === 'pending' || profile.status === 'inactive') {
        // Show notification instead of auto-opening
        setShowSetupNotification(true);
        // Or auto-open the modal (uncomment the line below)
        // setShowSetupModal(true);
      }
    }
  }, [loading, profile]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUser = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/hospital/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setProfile(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching hospital profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Logout handler - redirects to landing page
  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Clear cookies if any
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    
    // Hard redirect to landing page
    window.location.href = '/';
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const getInitials = (name: string) => {
    if (!name) return 'H';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'inactive':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-zinc-500 dark:text-zinc-400';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-zinc-400';
    }
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Left Section - Menu & Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-200 dark:shadow-red-900/30">
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white hidden sm:block">RedPulse</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded hidden md:block">
                Hospital
              </span>
            </div>
          </div>

          {/* Center Section - Status Badge (shows if hospital is active/pending) */}
          {profile?.status && (
            <div className="hidden md:flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${getStatusColor(profile.status)}`}>
                <span className={`inline-block w-2 h-2 rounded-full ${getStatusDot(profile.status)}`} />
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </span>
            </div>
          )}

          {/* Setup Notification Banner - Shows if hospital needs setup */}
          {showSetupNotification && !profile?.hospitalName && (
            <div className="hidden md:flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-1.5">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                Setup your hospital
              </span>
              <button
                onClick={() => {
                  setShowSetupNotification(false);
                  setShowSetupModal(true);
                }}
                className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline font-medium"
              >
                Click here
              </button>
            </div>
          )}

          {/* Right Section - Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Search - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 w-32 lg:w-48"
              />
              <kbd className="hidden lg:block text-xs text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
              ) : (
                <Moon className="w-5 h-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && onMarkAllAsRead && (
                          <button
                            onClick={onMarkAllAsRead}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button
                          onClick={() => setIsNotificationsOpen(false)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition lg:hidden"
                        >
                          <X className="w-4 h-4 text-zinc-500" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">No notifications</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer ${
                              !notif.isRead ? 'bg-red-50 dark:bg-red-950/20' : ''
                            }`}
                            onClick={() => onMarkAsRead?.(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-full flex-shrink-0 ${
                                notif.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                                notif.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                                notif.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                'bg-blue-100 dark:bg-blue-900/30'
                              }`}>
                                {notif.type === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
                                {notif.type === 'error' && <AlertCircle className="h-3 w-3 text-red-600" />}
                                {notif.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-600" />}
                                {notif.type === 'info' && <Bell className="h-3 w-3 text-blue-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                  {notif.subject}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 5 && (
                      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
                        <button 
                          onClick={() => router.push('/hospital/notifications')}
                          className="w-full text-center text-xs text-red-600 hover:text-red-700 font-medium py-1"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
                aria-label="Profile"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                  {profile?.hospitalName ? getInitials(profile.hospitalName) : 'H'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white leading-none">
                    {profile?.hospitalName || 'Hospital'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-none mt-0.5 flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${getStatusDot(profile?.status || 'pending')}`} />
                    {profile?.status || 'Pending'}
                  </p>
                </div>
                <ChevronDown className="hidden md:block w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50">
                    {/* Profile Header */}
                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                          {profile?.hospitalName ? getInitials(profile.hospitalName) : 'H'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-white truncate">
                            {profile?.hospitalName || 'Hospital'}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {user?.email || 'hospital@email.com'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${getStatusDot(profile?.status || 'pending')}`} />
                            <span className={`text-xs font-medium ${getStatusColor(profile?.status || 'pending')}`}>
                              {profile?.status || 'Pending'}
                            </span>
                            {profile?.hospitalLicense && (
                              <>
                                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                  License: {profile.hospitalLicense}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
                      {profile?.hospitalAddress && (
                        <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <MapPin className="h-4 w-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate">{profile.hospitalAddress}</span>
                        </div>
                      )}
                      {profile?.hospitalPhone && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Phone className="h-4 w-4 text-zinc-400" />
                          <span>{profile.hospitalPhone}</span>
                        </div>
                      )}
                      {profile?.hospitalType && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Hospital className="h-4 w-4 text-zinc-400" />
                          <span>{profile.hospitalType}</span>
                        </div>
                      )}
                    </div>

                    {/* Menu Items - Profile related */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        <UserCircle className="h-4 w-4" />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowSetupModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        <Building className="h-4 w-4" />
                        Hospital Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push('/help');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        <HelpCircle className="h-4 w-4" />
                        Help & Support
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <HospitalProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdate={(data) => {
          setProfile(data);
          fetchProfile();
        }}
      />

      <HospitalSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSetupComplete={() => {
          fetchProfile();
          setShowSetupNotification(false);
        }}
      />
    </>
  );
}