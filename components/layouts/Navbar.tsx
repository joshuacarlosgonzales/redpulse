// components/Navbar.tsx (Updated)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Settings,
  Search,
  ChevronDown,
  LogOut,
  Heart,
  Moon,
  Sun,
  HelpCircle,
  UserCircle,
} from "lucide-react";
import AdminNotification from "@/components/AdminNotif/AdminNotification";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState("John Doe");
  const [userEmail, setUserEmail] = useState("admin@redpulse.com");
  const [userRole, setUserRole] = useState("admin");

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get user info from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.fullName) setUserName(userData.fullName);
        if (userData.email) setUserEmail(userData.email);
        if (userData.role) setUserRole(userData.role);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Load notifications for admin
    if (userRole === 'admin') {
      fetchNotifications();
    }
  }, [userRole]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.data?.filter((n: any) => !n.isRead).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications/read-all', {
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

  const handleApprove = async (id: string, entity: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/${entity}s/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove notification or update status
        fetchNotifications();
        alert(`${entity} approved successfully!`);
      }
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (id: string, entity: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/${entity}s/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchNotifications();
        alert(`${entity} rejected successfully!`);
      }
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const getPageTitle = () => {
    const path = pathname?.split('/').pop() || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
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

  const getUserInitials = () => {
    return userName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Left Section - Menu & Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="lg:hidden flex items-center gap-2">
                <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-200 dark:shadow-red-900/30">
                  <Heart className="w-4 h-4 text-white" fill="currentColor" />
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">RedPulse</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white hidden sm:block">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Search - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
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
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-black">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
                aria-label="Profile"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold text-sm">
                  {getUserInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white leading-none">
                    {userName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                    {userRole === 'admin' ? 'Administrator' : userRole === 'hospital' ? 'Hospital Admin' : 'Donor'}
                  </p>
                </div>
                <ChevronDown className="hidden md:block w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold">
                          {getUserInitials()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{userName}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <Link
                        href={`/${userRole}/profile`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href={`/${userRole}/settings`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <Link
                        href="/help"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <HelpCircle className="w-4 h-4" />
                        Help
                      </Link>
                    </div>

                    <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Notification Modal */}
      <AdminNotification
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}