// components/layouts/DonorNavbar.tsx
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
  IdCard,
  X,
} from "lucide-react";
import NotificationModal from "@/components/UserNotif/NotificationModal";
import DonorProfileModal from "@/components/donor/DonorProfileModal";
import DigitalIDCard from "@/components/donor/DigitalIDCard";

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

interface DonorNavbarProps {
  onMenuClick: () => void;
  onProfileClick?: () => void;
  unreadCount?: number;
  notifications?: any[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export function DonorNavbar({ 
  onMenuClick, 
  onProfileClick,
  unreadCount = 0,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead
}: DonorNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDigitalIdModalOpen, setIsDigitalIdModalOpen] = useState(false);
  const [userName, setUserName] = useState("Donor");
  const [userEmail, setUserEmail] = useState("donor@redpulse.com");
  const [userRole, setUserRole] = useState("donor");
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.fullName) setUserName(userData.fullName);
        if (userData.email) setUserEmail(userData.email);
        if (userData.role) setUserRole(userData.role);
        loadProfileData(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const loadProfileData = async (userData: any) => {
    try {
      setLoadingProfile(true);
      const token = localStorage.getItem('token');
      
      let response = await fetch(`/api/donors/${userData.id || userData.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        let donorData = data.data || data;
        
        const profileData: DonorProfile = {
          id: donorData._id || donorData.id || donorData.userId || userData.id || 'unknown',
          _id: donorData._id || donorData.id || donorData.userId || 'unknown',
          donorId: donorData.donorId || donorData._id || donorData.id || 'unknown',
          fullName: donorData.fullName || donorData.name || userData.fullName || userData.name || '',
          email: donorData.email || userData.email || '',
          phone: donorData.phone || donorData.mobileNumber || userData.phone || 'N/A',
          bloodType: donorData.bloodType || userData.bloodType || 'O+',
          dateOfBirth: donorData.dateOfBirth || userData.dateOfBirth || '',
          gender: donorData.gender || userData.gender || 'Not specified',
          weight: donorData.weight || userData.weight || 0,
          address: donorData.address || userData.address || 'N/A',
          barangay: donorData.barangay || userData.barangay || 'N/A',
          municipality: donorData.municipality || userData.municipality || 'N/A',
          province: donorData.province || userData.province || 'N/A',
          emergencyContact: donorData.emergencyContact || userData.emergencyContact || 'N/A',
          medicalConditions: donorData.medicalConditions || userData.medicalConditions || 'None',
          currentMedications: donorData.currentMedications || userData.currentMedications || 'None',
          isVerified: donorData.isVerified || userData.isVerified || false,
          createdAt: donorData.createdAt || userData.createdAt || new Date().toISOString(),
          updatedAt: donorData.updatedAt || userData.updatedAt || new Date().toISOString(),
          digitalId: donorData.digitalId || userData.digitalId || `RP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          status: donorData.status || userData.status || 'pending',
          isEligible: donorData.isEligible || userData.isEligible || false,
          totalDonations: donorData.totalDonations || userData.totalDonations || 0,
          lastDonationDate: donorData.lastDonationDate || userData.lastDonationDate || '',
          points: donorData.points || userData.points || 0,
          emergencyName: donorData.emergencyName || userData.emergencyName || '',
          emergencyRelationship: donorData.emergencyRelationship || userData.emergencyRelationship || ''
        };
        
        setProfile(profileData);
      } else {
        // Fallback to localStorage data
        const fallbackProfile: DonorProfile = {
          id: userData.id || userData.userId || 'unknown',
          _id: userData.id || userData.userId || 'unknown',
          donorId: userData.id || userData.userId || 'unknown',
          fullName: userData.fullName || userData.name || 'Donor',
          email: userData.email || '',
          phone: userData.phone || 'N/A',
          bloodType: userData.bloodType || 'O+',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || 'Not specified',
          weight: userData.weight || 0,
          address: userData.address || 'N/A',
          barangay: userData.barangay || 'N/A',
          municipality: userData.municipality || 'N/A',
          province: userData.province || 'N/A',
          emergencyContact: userData.emergencyContact || 'N/A',
          medicalConditions: userData.medicalConditions || 'None',
          currentMedications: userData.currentMedications || 'None',
          isVerified: userData.isVerified || false,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
          digitalId: userData.digitalId || `RP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          status: userData.status || 'pending',
          isEligible: userData.isEligible || false,
          totalDonations: userData.totalDonations || 0,
          lastDonationDate: userData.lastDonationDate || '',
          points: userData.points || 0,
          emergencyName: userData.emergencyName || '',
          emergencyRelationship: userData.emergencyRelationship || ''
        };
        setProfile(fallbackProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getPageTitle = () => {
    const path = pathname?.split('/').pop() || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.documentElement.classList.toggle('dark');
  };

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

  const getUserInitials = () => {
    return userName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = () => {
    switch(userRole) {
      case 'admin': return 'Administrator';
      case 'hospital': return 'Hospital Admin';
      case 'donor': return 'Blood Donor';
      default: return 'User';
    }
  };

  const getDashboardRoute = () => {
    switch(userRole) {
      case 'admin': return '/admin/dashboard';
      case 'hospital': return '/hospital/dashboard';
      case 'donor': return '/donors/dashboard';
      default: return '/dashboard';
    }
  };

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleDigitalIdClick = () => {
    setIsProfileOpen(false);
    setIsDigitalIdModalOpen(true);
  };

  const handleUpdateProfile = (updatedData: any) => {
    setProfile(prev => prev ? { ...prev, ...updatedData } : null);
    if (updatedData.fullName) {
      setUserName(updatedData.fullName);
    }
    if (updatedData.email) {
      setUserEmail(updatedData.email);
    }
  };

  const handleSaveProfile = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('No user data found');
      }

      const userData = JSON.parse(userStr);
      const userId = userData.id || userData.userId;

      const payload = {
        ...data,
        fullName: data.fullName || profile?.fullName,
      };

      let response = await fetch(`/api/donors/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUserData = { ...userData, ...payload };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      handleUpdateProfile(payload);

      return response.json();
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  // Convert DonorProfile to DigitalIDCard format
  const getDigitalIDData = () => {
    if (!profile) return null;
    
    return {
      id: profile.id,
      name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      bloodType: profile.bloodType,
      location: `${profile.barangay}, ${profile.municipality}, ${profile.province}`,
      status: profile.status as 'active' | 'inactive' | 'pending',
      digitalId: profile.digitalId || `RP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      registered: profile.createdAt,
      lastDonation: profile.lastDonationDate || 'N/A',
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      barangay: profile.barangay,
      municipality: profile.municipality,
      province: profile.province,
      emergencyContact: profile.emergencyContact,
      totalDonations: profile.totalDonations || 0,
      nextEligible: profile.lastDonationDate ? 
        new Date(new Date(profile.lastDonationDate).setMonth(new Date(profile.lastDonationDate).getMonth() + 3)).toISOString() : 
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      address: profile.address,
      civilStatus: 'Single',
      nationality: 'Filipino'
    };
  };

  const handleDownloadID = () => {
    // Trigger download via the DigitalIDCard component
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const idCardElement = document.getElementById('digital-id-card-print');
      if (idCardElement) {
        printWindow.document.write(`
          <html>
            <head>
              <title>RedPulse Digital ID</title>
              <style>
                body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
                * { box-sizing: border-box; }
              </style>
            </head>
            <body>
              ${idCardElement.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            
            <div className="flex items-center gap-2">
              <Link href={getDashboardRoute()} className="flex items-center gap-2">
                <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-200 dark:shadow-red-900/30">
                  <Heart className="w-4 h-4 text-white" fill="currentColor" />
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white hidden sm:block">
                  RedPulse
                </span>
              </Link>
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white hidden sm:block">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
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
                    {getRoleLabel()}
                  </p>
                </div>
                <ChevronDown className="hidden md:block w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition" />
              </button>

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
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full"
                      >
                        <UserCircle className="w-4 h-4" />
                        My Profile
                      </button>


                      <Link
                        href="/donors/settings"
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

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={onMarkAsRead || (() => {})}
        onMarkAllAsRead={onMarkAllAsRead || (() => {})}
      />

      {/* Profile Modal */}
      {isProfileModalOpen && profile && (
        <DonorProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            const user = localStorage.getItem('user');
            if (user) {
              try {
                const userData = JSON.parse(user);
                loadProfileData(userData);
              } catch (e) {
                console.error('Error reloading profile:', e);
              }
            }
          }}
          profile={profile}
          onSave={handleSaveProfile}
          onUpdate={handleUpdateProfile}
        />
      )}

      {/* Digital ID Modal */}
      {isDigitalIdModalOpen && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                  <IdCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Digital ID</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDigitalIdModalOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 flex justify-center items-center">
              <div id="digital-id-card-print">
                <DigitalIDCard
                  donor={getDigitalIDData()!}
                  onDownload={handleDownloadID}
                  onPrint={handleDownloadID}
                  onShare={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'RedPulse Digital ID',
                        text: `Donor ID: ${profile.digitalId}`,
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}