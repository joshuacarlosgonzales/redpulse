// app/donors/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  Mail,
  Phone,
  Lock,
  Key,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Fingerprint,
  Clock,
  Download,
  Trash2,
  ArrowLeft,
  Palette,
  Monitor,
  Calendar,
  Heart,
  Syringe,
  LogOut,
  Loader2,
  XCircle,
  Droplet,
  UserCircle,
  Weight,
  PhoneCall,
  Home,
  Building2,
  MapPin,
  Clipboard,
  Pill,
  MessageSquare,
  Calendar as CalendarIcon,
  Send,
  Check,
  Timer,
  Info
} from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

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
  digitalId: string;
  status: string;
  isEligible?: boolean;
  totalDonations?: number;
  lastDonationDate?: string;
  points?: number;
  emergencyName?: string;
  emergencyRelationship?: string;
  _id?: string;
  donorId?: string;
}

export default function DonorSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // OTP Password Change States
  const [otpStep, setOtpStep] = useState<'request' | 'verify' | 'success'>('request');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [otpConfirmPassword, setOtpConfirmPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpNewPassword, setShowOtpNewPassword] = useState(false);
  const [showOtpConfirmPassword, setShowOtpConfirmPassword] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  // Profile Settings
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    bloodType: 'O+',
    dateOfBirth: '',
    gender: '',
    weight: '',
    address: '',
    barangay: '',
    municipality: '',
    province: '',
    emergencyContact: '',
    emergencyName: '',
    emergencyRelationship: '',
    medicalConditions: '',
    currentMedications: ''
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    driveReminders: true,
    requestUpdates: true,
    promotionalEmails: false,
    donationReminders: true,
    eligibilityAlerts: true,
    appointmentReminders: true,
    newsletter: false
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    showBloodType: true,
    showDonationHistory: true,
    showContactInfo: false,
    shareWithHospitals: true,
    dataForResearch: false,
    twoFactorAuth: false
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    compactMode: false,
    reduceAnimations: false
  });

  // Load all settings on mount
  useEffect(() => {
    setMounted(true);
    loadUserData();
    loadSettings();
    fetchProfileData();
  }, []);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Apply font size to document
  useEffect(() => {
    if (mounted) {
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      document.documentElement.style.fontSize = fontSizeMap[appearanceSettings.fontSize];
      localStorage.setItem('fontSize', appearanceSettings.fontSize);
    }
  }, [appearanceSettings.fontSize, mounted]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) return;
      
      const userData = JSON.parse(userStr);
      const userId = userData.id || userData.userId || userData._id;
      
      let response = await fetch(`/api/donors/${userId}`, {
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
        const donorData = data.data || data;
        
        const profileData: DonorProfile = {
          id: donorData._id || donorData.id || donorData.userId || userId || 'unknown',
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
        setOtpEmail(profileData.email);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const loadUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setProfileForm(prev => ({
          ...prev,
          fullName: userData.fullName || userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bloodType: userData.bloodType || 'O+',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || '',
          weight: userData.weight || '',
          address: userData.address || '',
          barangay: userData.barangay || '',
          municipality: userData.municipality || '',
          province: userData.province || '',
          emergencyContact: userData.emergencyContact || '',
          emergencyName: userData.emergencyName || '',
          emergencyRelationship: userData.emergencyRelationship || '',
          medicalConditions: userData.medicalConditions || '',
          currentMedications: userData.currentMedications || ''
        }));
        if (userData.email) {
          setOtpEmail(userData.email);
        }
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  };

  const loadSettings = () => {
    // Load dark mode
    const savedTheme = localStorage.getItem('redpulse-theme');
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load font size
    const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' | null;
    if (savedFontSize) {
      setAppearanceSettings(prev => ({
        ...prev,
        fontSize: savedFontSize
      }));
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      document.documentElement.style.fontSize = fontSizeMap[savedFontSize];
    }

    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      try {
        setNotificationSettings(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }
    }

    const savedPrivacy = localStorage.getItem('privacySettings');
    if (savedPrivacy) {
      try {
        setPrivacySettings(JSON.parse(savedPrivacy));
      } catch (e) {
        console.error('Error loading privacy settings:', e);
      }
    }

    const savedAppearance = localStorage.getItem('appearanceSettings');
    if (savedAppearance) {
      try {
        setAppearanceSettings(JSON.parse(savedAppearance));
      } catch (e) {
        console.error('Error loading appearance settings:', e);
      }
    }
  };

  // ==================== OTP Password Change Functions ====================

  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOtp = async () => {
    if (!otpEmail) {
      setErrorMessage('Email address is required');
      return;
    }

    setOtpLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setOtpError('');

    try {
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      const token = localStorage.getItem('token');
      
      if (!token) {
        setErrorMessage('Please login again');
        setOtpLoading(false);
        return;
      }

      const response = await fetch('/api/user/update-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          otp: otp,
          expiresAt: expiresAt.toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save OTP');
      }

      console.log('📧 OTP for', otpEmail, ':', otp);
      console.log('⏰ OTP expires at:', expiresAt.toISOString());

      setOtpSent(true);
      setOtpStep('verify');
      setOtpTimer(300);
      
      setSuccessMessage('✅ OTP has been sent to your email! Please check your inbox (and spam folder).');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send OTP. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtpAndChangePassword = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!otpNewPassword || otpNewPassword.length < 8) {
      setOtpError('Password must be at least 8 characters');
      return;
    }

    if (otpNewPassword !== otpConfirmPassword) {
      setOtpError('Passwords do not match');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          email: otpEmail,
          otp: otpCode,
          newPassword: otpNewPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpStep('success');
        setSuccessMessage('✅ Password changed successfully!');
        setOtpCode('');
        setOtpNewPassword('');
        setOtpConfirmPassword('');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setOtpError(data.error || data.message || 'Failed to verify OTP or change password');
        
        if (data.error && (data.error.includes('expired') || data.error.includes('Invalid'))) {
          setOtpTimer(0);
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    setOtpTimer(0);
    setOtpCode('');
    await sendOtp();
  };

  const resetOtpState = () => {
    setOtpStep('request');
    setOtpSent(false);
    setOtpCode('');
    setOtpNewPassword('');
    setOtpConfirmPassword('');
    setOtpTimer(0);
    setErrorMessage('');
    setSuccessMessage('');
    setOtpError('');
  };

  // ==================== Other Settings Functions ====================

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProfileForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAppearanceChange = (key: keyof typeof appearanceSettings, value: any) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    if (key === 'fontSize') {
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      document.documentElement.style.fontSize = fontSizeMap[value as 'small' | 'medium' | 'large'];
      localStorage.setItem('fontSize', value);
    }
    
    if (key === 'theme') {
      if (value === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('redpulse-theme', 'dark');
        setIsDarkMode(true);
      } else if (value === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('redpulse-theme', 'light');
        setIsDarkMode(false);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('redpulse-theme', 'dark');
          setIsDarkMode(true);
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('redpulse-theme', 'light');
          setIsDarkMode(false);
        }
      }
    }
  };

  const saveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        throw new Error('You must be logged in to update your profile');
      }

      const userData = JSON.parse(userStr);
      const userId = userData.id || userData.userId || userData._id;

      if (!userId) {
        throw new Error('User ID not found');
      }

      const payload = {
        fullName: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone,
        bloodType: profileForm.bloodType,
        dateOfBirth: profileForm.dateOfBirth,
        gender: profileForm.gender,
        weight: profileForm.weight ? parseFloat(profileForm.weight) : 0,
        address: profileForm.address,
        barangay: profileForm.barangay,
        municipality: profileForm.municipality,
        province: profileForm.province,
        emergencyContact: profileForm.emergencyContact,
        emergencyName: profileForm.emergencyName,
        emergencyRelationship: profileForm.emergencyRelationship,
        medicalConditions: profileForm.medicalConditions,
        currentMedications: profileForm.currentMedications
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUser = { ...userData, ...payload };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (profile) {
        setProfile({
          ...profile,
          ...payload,
          weight: payload.weight
        });
      }

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/user/notification-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(notificationSettings)
        }).catch(() => {});
      }

      setSuccessMessage('Notification settings saved!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to save notification settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const savePrivacySettings = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
      
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/user/privacy-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(privacySettings)
        }).catch(() => {});
      }

      setSuccessMessage('Privacy settings saved!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to save privacy settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAppearanceSettings = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));

      if (appearanceSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('redpulse-theme', 'dark');
        setIsDarkMode(true);
      } else if (appearanceSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('redpulse-theme', 'light');
        setIsDarkMode(false);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('redpulse-theme', 'dark');
          setIsDarkMode(true);
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('redpulse-theme', 'light');
          setIsDarkMode(false);
        }
      }

      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      document.documentElement.style.fontSize = fontSizeMap[appearanceSettings.fontSize];
      localStorage.setItem('fontSize', appearanceSettings.fontSize);

      setSuccessMessage('Appearance settings saved!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to save appearance settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
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
    router.push('/');
  };

  const handleExportData = () => {
    const data = {
      profile: profileForm,
      notifications: notificationSettings,
      privacy: privacySettings,
      appearance: appearanceSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redpulse-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Data exported successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('You must be logged in');
        }

        const response = await fetch('/api/user/delete-account', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete account');
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      } catch (error) {
        setErrorMessage('Failed to delete account');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-4 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-4 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/donors/dashboard"
              className="p-1.5 sm:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white truncate">Settings</h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">Manage your account preferences</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-green-700 dark:text-green-400 animate-fade-in">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400 animate-fade-in">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden sticky top-16 sm:top-20">
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible p-1.5 sm:p-2 gap-0.5 sm:gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap lg:whitespace-normal flex-1 lg:flex-none justify-center lg:justify-start ${
                        isActive
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden text-[10px]">{tab.label.slice(0, 4)}</span>
                      {isActive && (
                        <div className="hidden lg:block ml-auto w-0.5 h-6 bg-red-600 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 lg:p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={saveProfileSettings}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">Profile Information</h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">Update your personal details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                        <input
                          type="text"
                          name="fullName"
                          value={profileForm.fullName}
                          onChange={handleProfileChange}
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                          required
                          disabled
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Blood Type
                      </label>
                      <div className="relative">
                        <Droplet className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                        <select
                          name="bloodType"
                          value={profileForm.bloodType}
                          onChange={handleProfileChange}
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition appearance-none"
                        >
                          {bloodTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={profileForm.dateOfBirth}
                          onChange={handleProfileChange}
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Gender
                      </label>
                      <div className="relative">
                        <UserCircle className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                        <select
                          name="gender"
                          value={profileForm.gender}
                          onChange={handleProfileChange}
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition appearance-none"
                        >
                          <option value="">Select gender</option>
                          {genders.map(gender => (
                            <option key={gender} value={gender}>{gender}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Weight (kg)
                      </label>
                      <div className="relative">
                        <Weight className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                        <input
                          type="number"
                          name="weight"
                          value={profileForm.weight}
                          onChange={handleProfileChange}
                          min="30"
                          max="300"
                          step="0.5"
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 sm:mb-3">Address</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Street Address
                        </label>
                        <div className="relative">
                          <Home className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          <input
                            type="text"
                            name="address"
                            value={profileForm.address}
                            onChange={handleProfileChange}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Barangay
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          <input
                            type="text"
                            name="barangay"
                            value={profileForm.barangay}
                            onChange={handleProfileChange}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Municipality
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          <input
                            type="text"
                            name="municipality"
                            value={profileForm.municipality}
                            onChange={handleProfileChange}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Province
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          <input
                            type="text"
                            name="province"
                            value={profileForm.province}
                            onChange={handleProfileChange}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 sm:mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Contact Name
                        </label>
                        <div className="relative">
                          <UserCircle className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          <input
                            type="text"
                            name="emergencyName"
                            value={profileForm.emergencyName}
                            onChange={handleProfileChange}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Relationship
                        </label>
                        <input
                          type="text"
                          name="emergencyRelationship"
                          value={profileForm.emergencyRelationship}
                          onChange={handleProfileChange}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Contact Number
                        </label>
                        <div className="relative">
                          <PhoneCall className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          <input
                            type="tel"
                            name="emergencyContact"
                            value={profileForm.emergencyContact}
                            onChange={handleProfileChange}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 sm:mb-3">Medical Information</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Medical Conditions
                        </label>
                        <div className="relative">
                          <Clipboard className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          <textarea
                            name="medicalConditions"
                            value={profileForm.medicalConditions}
                            onChange={handleProfileChange}
                            rows={2}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                            placeholder="List any medical conditions (if none, write 'None')"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Current Medications
                        </label>
                        <div className="relative">
                          <Pill className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                          <textarea
                            name="currentMedications"
                            value={profileForm.currentMedications}
                            onChange={handleProfileChange}
                            rows={2}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                            placeholder="List any current medications (if none, write 'None')"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => router.push('/donors/dashboard')}
                      className="w-full sm:w-auto px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg sm:rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">Notification Preferences</h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">Choose how you want to be notified</p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg sm:rounded-xl">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white truncate">Email Notifications</p>
                          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">Receive updates via email</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle('emailNotifications')}
                        className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full transition flex-shrink-0 ${notificationSettings.emailNotifications ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                        aria-label="Toggle email notifications"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white transition-transform shadow-sm ${notificationSettings.emailNotifications ? 'translate-x-4 sm:translate-x-5' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg sm:rounded-xl">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white truncate">Push Notifications</p>
                          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">Receive push notifications</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle('pushNotifications')}
                        className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full transition flex-shrink-0 ${notificationSettings.pushNotifications ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                        aria-label="Toggle push notifications"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white transition-transform shadow-sm ${notificationSettings.pushNotifications ? 'translate-x-4 sm:translate-x-5' : ''}`} />
                      </button>
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 sm:pt-4">
                      <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 sm:mb-3">Notification Types</h3>
                      <div className="space-y-2 sm:space-y-3">
                        {[
                          { key: 'driveReminders', label: 'Blood Drive Reminders', icon: Calendar },
                          { key: 'requestUpdates', label: 'Request Updates', icon: Syringe },
                          { key: 'donationReminders', label: 'Donation Reminders', icon: Heart },
                          { key: 'eligibilityAlerts', label: 'Eligibility Alerts', icon: Shield },
                          { key: 'appointmentReminders', label: 'Appointment Reminders', icon: Clock },
                          { key: 'newsletter', label: 'Newsletter', icon: Bell },
                          { key: 'promotionalEmails', label: 'Promotional Emails', icon: Mail },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 truncate">{label}</span>
                            </div>
                            <button
                              onClick={() => handleNotificationToggle(key as keyof typeof notificationSettings)}
                              className={`relative w-8 sm:w-9 h-4 sm:h-5 rounded-full transition flex-shrink-0 ${notificationSettings[key as keyof typeof notificationSettings] ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                              aria-label={`Toggle ${label}`}
                            >
                              <div className={`absolute top-0.5 left-0.5 w-3 sm:w-4 h-3 sm:h-4 rounded-full bg-white transition-transform shadow-sm ${notificationSettings[key as keyof typeof notificationSettings] ? 'translate-x-3.5 sm:translate-x-4' : ''}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={saveNotificationSettings}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Save Preferences
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">Security Settings</h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">Manage your account security</p>
                    </div>
                  </div>

                  {/* OTP Password Change */}
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 sm:mb-3">Change Password with OTP</h3>
                    
                    {otpStep === 'request' && (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800">
                          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                            <span>An OTP will be sent to your registered email address. Enter the code to verify your identity and change your password.</span>
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                            <input
                              type="email"
                              value={otpEmail}
                              onChange={(e) => setOtpEmail(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                              placeholder="Enter your email address"
                              disabled={otpLoading}
                            />
                          </div>
                        </div>

                        <button
                          onClick={sendOtp}
                          disabled={otpLoading || !otpEmail}
                          className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {otpLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                              Sending OTP...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Send OTP to Email
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {otpStep === 'verify' && (
                      <div className="space-y-4 sm:space-y-5">
                        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/30 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
                          <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                            ✅ OTP sent to <strong>{otpEmail}</strong>. Please check your inbox and enter the 6-digit code below.
                          </p>
                        </div>

                        {/* OTP Input */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Enter OTP Code
                          </label>
                          <div className="flex justify-center">
                            <InputOTP
                              maxLength={6}
                              value={otpCode}
                              onChange={(value) => setOtpCode(value)}
                              disabled={otpLoading}
                              containerClassName="gap-1 sm:gap-2"
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl border-zinc-300 dark:border-zinc-600 focus:border-red-500" />
                                <InputOTPSlot index={1} className="w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl border-zinc-300 dark:border-zinc-600 focus:border-red-500" />
                                <InputOTPSlot index={2} className="w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl border-zinc-300 dark:border-zinc-600 focus:border-red-500" />
                                <InputOTPSlot index={3} className="w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl border-zinc-300 dark:border-zinc-600 focus:border-red-500" />
                                <InputOTPSlot index={4} className="w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl border-zinc-300 dark:border-zinc-600 focus:border-red-500" />
                                <InputOTPSlot index={5} className="w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl border-zinc-300 dark:border-zinc-600 focus:border-red-500" />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                          {otpTimer > 0 && (
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 text-center flex items-center justify-center gap-1">
                              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              OTP expires in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}
                            </p>
                          )}
                          {otpError && (
                            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                              {otpError}
                            </p>
                          )}
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                            <input
                              type={showOtpNewPassword ? 'text' : 'password'}
                              value={otpNewPassword}
                              onChange={(e) => setOtpNewPassword(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                              placeholder="Enter new password (min 8 characters)"
                              minLength={8}
                              disabled={otpLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowOtpNewPassword(!showOtpNewPassword)}
                              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                              {showOtpNewPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                            </button>
                          </div>
                          {otpNewPassword && otpNewPassword.length < 8 && (
                            <p className="text-[10px] sm:text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" />
                            <input
                              type={showOtpConfirmPassword ? 'text' : 'password'}
                              value={otpConfirmPassword}
                              onChange={(e) => setOtpConfirmPassword(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition"
                              placeholder="Confirm new password"
                              disabled={otpLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowOtpConfirmPassword(!showOtpConfirmPassword)}
                              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                              {showOtpConfirmPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                            </button>
                          </div>
                          {otpNewPassword && otpConfirmPassword && otpNewPassword !== otpConfirmPassword && (
                            <p className="text-[10px] sm:text-xs text-red-500 mt-1">Passwords do not match</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={verifyOtpAndChangePassword}
                            disabled={
                              otpLoading || 
                              !otpCode || 
                              otpCode.length !== 6 ||
                              !otpNewPassword || 
                              otpNewPassword.length < 8 ||
                              otpNewPassword !== otpConfirmPassword
                            }
                            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {otpLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Verify OTP & Change Password
                              </>
                            )}
                          </button>
                        </div>

                        {/* Cancel & Resend */}
                        <div className="flex items-center justify-between pt-1 sm:pt-2">
                          <button
                            onClick={resetOtpState}
                            className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                          >
                            Cancel
                          </button>
                          {otpTimer === 0 && (
                            <button
                              onClick={resendOtp}
                              disabled={otpLoading}
                              className="text-xs sm:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition disabled:opacity-50"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {otpStep === 'success' && (
                      <div className="p-4 sm:p-6 bg-green-50 dark:bg-green-950/30 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800 text-center">
                        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400 mx-auto mb-2 sm:mb-3" />
                        <h4 className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-300">Password Changed Successfully!</h4>
                        <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                          Your password has been updated. You can now use your new password to login.
                        </p>
                        <button
                          onClick={resetOtpState}
                          className="mt-3 sm:mt-4 px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 sm:pt-6">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 sm:mb-3">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg sm:rounded-xl">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white truncate">2FA Authentication</p>
                          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">Add an extra layer of security</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setPrivacySettings(prev => ({
                            ...prev,
                            twoFactorAuth: !prev.twoFactorAuth
                          }));
                          setTimeout(() => savePrivacySettings(), 100);
                        }}
                        className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full transition flex-shrink-0 ${privacySettings.twoFactorAuth ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                        aria-label="Toggle two-factor authentication"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white transition-transform shadow-sm ${privacySettings.twoFactorAuth ? 'translate-x-4 sm:translate-x-5' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">Privacy Settings</h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">Control your data and privacy</p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { key: 'showBloodType', label: 'Show Blood Type', desc: 'Display your blood type on your profile' },
                      { key: 'showDonationHistory', label: 'Show Donation History', desc: 'Allow others to see your donation history' },
                      { key: 'showContactInfo', label: 'Show Contact Information', desc: 'Display your contact details on your profile' },
                      { key: 'shareWithHospitals', label: 'Share Data with Hospitals', desc: 'Allow hospitals to see your donation data' },
                      { key: 'dataForResearch', label: 'Allow Data for Research', desc: 'Share anonymized data for medical research' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg sm:rounded-xl">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white truncate">{label}</p>
                          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">{desc}</p>
                        </div>
                        <button
                          onClick={() => handlePrivacyToggle(key as keyof typeof privacySettings)}
                          className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full transition flex-shrink-0 ${privacySettings[key as keyof typeof privacySettings] ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          aria-label={`Toggle ${label}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white transition-transform shadow-sm ${privacySettings[key as keyof typeof privacySettings] ? 'translate-x-4 sm:translate-x-5' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 sm:mb-3">Data Management</h3>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={handleExportData}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg sm:rounded-xl transition"
                      >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Export My Data
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg sm:rounded-xl transition"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Delete Account
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={savePrivacySettings}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Save Privacy Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center flex-shrink-0">
                      <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">Appearance Settings</h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">Customize how the app looks</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 sm:mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                        {[
                          { id: 'light', label: 'Light', icon: Sun },
                          { id: 'dark', label: 'Dark', icon: Moon },
                          { id: 'system', label: 'System', icon: Monitor },
                        ].map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            onClick={() => handleAppearanceChange('theme', id as 'light' | 'dark' | 'system')}
                            className={`flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition text-xs sm:text-sm ${
                              appearanceSettings.theme === id
                                ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                            }`}
                            aria-label={`Select ${label} theme`}
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">{label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 sm:mt-2">
                        Current: {appearanceSettings.theme === 'system' ? 'Following system' : appearanceSettings.theme}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 sm:mb-2">
                        Font Size
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                        {[
                          { id: 'small', label: 'Small' },
                          { id: 'medium', label: 'Medium' },
                          { id: 'large', label: 'Large' },
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            onClick={() => handleAppearanceChange('fontSize', id as 'small' | 'medium' | 'large')}
                            className={`flex items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition ${
                              appearanceSettings.fontSize === id
                                ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                            }`}
                            aria-label={`Select ${label} font size`}
                          >
                            <span className={`font-medium ${
                              id === 'small' ? 'text-xs' : id === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                            }`}>
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 sm:mt-2">
                        Current: {appearanceSettings.fontSize}
                      </p>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg sm:rounded-xl">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white truncate">Compact Mode</p>
                          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">Reduce spacing and padding</p>
                        </div>
                        <button
                          onClick={() => handleAppearanceChange('compactMode', !appearanceSettings.compactMode)}
                          className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full transition flex-shrink-0 ${appearanceSettings.compactMode ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          aria-label="Toggle compact mode"
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white transition-transform shadow-sm ${appearanceSettings.compactMode ? 'translate-x-4 sm:translate-x-5' : ''}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg sm:rounded-xl">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white truncate">Reduce Animations</p>
                          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">Minimize motion effects</p>
                        </div>
                        <button
                          onClick={() => handleAppearanceChange('reduceAnimations', !appearanceSettings.reduceAnimations)}
                          className={`relative w-9 sm:w-11 h-5 sm:h-6 rounded-full transition flex-shrink-0 ${appearanceSettings.reduceAnimations ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          aria-label="Toggle reduce animations"
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white transition-transform shadow-sm ${appearanceSettings.reduceAnimations ? 'translate-x-4 sm:translate-x-5' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={saveAppearanceSettings}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Save Appearance Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}