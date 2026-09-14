// app/donors/profile/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Droplet,
  Calendar,
  MapPin,
  Heart,
  Save,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Home,
  PhoneCall,
  Pill,
  Clipboard,
  UserCircle,
  Weight,
  Calendar as CalendarIcon,
  IdCard,
  Award,
  Clock,
  Shield
} from "lucide-react";

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

export default function DonorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DonorProfile>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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

      await fetchProfile();
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('📥 Fetching donor profile...');
      
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setLoading(false);
        return;
      }
      
      const userData = JSON.parse(userStr);
      const userId = userData.id || userData.userId;
      
      // Try to fetch from donor API
      let response = await fetch(`/api/donors/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // If donor API fails, try user profile API
      if (!response.ok) {
        console.log('⚠️ Donor API failed, trying user profile API...');
        response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Profile data received:', data);
        
        let donorData = data.data || data;
        
        // ✅ Calculate points properly
        const totalDonations = donorData.totalDonations || 0;
        const pointsFromDonor = donorData.points || 0;
        // If points is 0 but totalDonations > 0, calculate points from donations
        const calculatedPoints = pointsFromDonor > 0 ? pointsFromDonor : totalDonations * 10;
        
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
          totalDonations: totalDonations,
          lastDonationDate: donorData.lastDonationDate || userData.lastDonationDate || '',
          points: calculatedPoints,
          emergencyName: donorData.emergencyName || userData.emergencyName || '',
          emergencyRelationship: donorData.emergencyRelationship || userData.emergencyRelationship || ''
        };
        
        setProfile(profileData);
        setEditForm(profileData);
      } else {
        // If all APIs fail, use localStorage data
        console.log('⚠️ All APIs failed, using localStorage data');
        const totalDonations = userData.totalDonations || 0;
        const calculatedPoints = userData.points || totalDonations * 10;
        
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
          totalDonations: totalDonations,
          lastDonationDate: userData.lastDonationDate || '',
          points: calculatedPoints,
          emergencyName: userData.emergencyName || '',
          emergencyRelationship: userData.emergencyRelationship || ''
        };
        setProfile(fallbackProfile);
        setEditForm(fallbackProfile);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ✅ Helper function to calculate next eligible date
  const getNextEligibleDate = (lastDonationDate?: string) => {
    if (!lastDonationDate) return null;
    const last = new Date(lastDonationDate);
    if (isNaN(last.getTime())) return null;
    const next = new Date(last);
    next.setDate(next.getDate() + 45);
    return next;
  };

  // ✅ Helper function to calculate days until eligible
  const getDaysUntilEligible = (lastDonationDate?: string) => {
    const nextDate = getNextEligibleDate(lastDonationDate);
    if (!nextDate) return null;
    const now = new Date();
    const diff = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // ✅ Helper function to calculate total points
  const calculateTotalPoints = () => {
    if (!profile) return 0;
    // If points are stored directly and > 0, use them
    if (profile.points && profile.points > 0) return profile.points;
    // Otherwise calculate from donations (10 points per donation)
    if (profile.totalDonations) return profile.totalDonations * 10;
    return 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('error', 'Please login again');
        setSaving(false);
        return;
      }

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        showNotification('error', 'User data not found');
        setSaving(false);
        return;
      }

      const userData = JSON.parse(userStr);
      const userId = userData.id || userData.userId;

      const fullName = editForm.fullName || profile?.fullName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        email: editForm.email || profile?.email,
        phone: editForm.phone || profile?.phone,
        bloodType: editForm.bloodType || profile?.bloodType,
        dateOfBirth: editForm.dateOfBirth || profile?.dateOfBirth,
        gender: editForm.gender || profile?.gender,
        weight: editForm.weight || profile?.weight,
        address: editForm.address || profile?.address,
        barangay: editForm.barangay || profile?.barangay,
        municipality: editForm.municipality || profile?.municipality,
        province: editForm.province || profile?.province,
        emergencyContact: editForm.emergencyContact || profile?.emergencyContact,
        medicalConditions: editForm.medicalConditions || profile?.medicalConditions,
        currentMedications: editForm.currentMedications || profile?.currentMedications,
      };

      console.log('📤 Sending update payload:', payload);

      let response = await fetch(`/api/donors/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.log('⚠️ Donor API update failed, trying user profile API...');
        response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const responseData = await response.json();
      console.log('📥 Update response:', responseData);

      if (response.ok) {
        const updatedProfile: DonorProfile = {
          ...profile!,
          fullName: fullName,
          email: payload.email || profile?.email || '',
          phone: payload.phone || profile?.phone || '',
          bloodType: payload.bloodType || profile?.bloodType || '',
          dateOfBirth: payload.dateOfBirth || profile?.dateOfBirth || '',
          gender: payload.gender || profile?.gender || '',
          weight: payload.weight || profile?.weight || 0,
          address: payload.address || profile?.address || '',
          barangay: payload.barangay || profile?.barangay || '',
          municipality: payload.municipality || profile?.municipality || '',
          province: payload.province || profile?.province || '',
          emergencyContact: payload.emergencyContact || profile?.emergencyContact || '',
          medicalConditions: payload.medicalConditions || profile?.medicalConditions || '',
          currentMedications: payload.currentMedications || profile?.currentMedications || '',
        };
        
        setProfile(updatedProfile);
        setIsEditing(false);
        showNotification('success', 'Profile updated successfully!');
        
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.name = updatedProfile.fullName;
          userData.fullName = updatedProfile.fullName;
          userData.email = updatedProfile.email;
          userData.phone = updatedProfile.phone;
          userData.bloodType = updatedProfile.bloodType;
          userData.address = updatedProfile.address;
          userData.barangay = updatedProfile.barangay;
          userData.municipality = updatedProfile.municipality;
          userData.province = updatedProfile.province;
          userData.dateOfBirth = updatedProfile.dateOfBirth;
          userData.gender = updatedProfile.gender;
          userData.weight = updatedProfile.weight;
          userData.emergencyContact = updatedProfile.emergencyContact;
          userData.medicalConditions = updatedProfile.medicalConditions;
          userData.currentMedications = updatedProfile.currentMedications;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        showNotification('error', responseData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('error', 'An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30">
        <div className="text-center">
          <User className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">Profile Not Found</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Please contact support for assistance.</p>
          <Link href="/donors/dashboard">
            <button className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPoints = calculateTotalPoints();
  const daysUntilEligible = getDaysUntilEligible(profile.lastDonationDate);
  const nextEligibleDate = getNextEligibleDate(profile.lastDonationDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {notification && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-950/90 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <Link href="/donors/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition rounded-lg hover:bg-white/50 dark:hover:bg-black/50">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </Link>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) setEditForm(profile);
                  }}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {profile.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                <p className="text-red-100">{profile.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    {profile.bloodType}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    profile.status === 'active' 
                      ? 'bg-green-500/30' 
                      : 'bg-yellow-500/30'
                  }`}>
                    {profile.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    ID: {profile.digitalId}
                  </span>
                  {profile.isEligible !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      profile.isEligible 
                        ? 'bg-green-500/30' 
                        : 'bg-red-500/30'
                    }`}>
                      {profile.isEligible ? '✅ Eligible' : '⛔ Not Eligible'}
                    </span>
                  )}
                </div>
              </div>
              <Link href="/donors/digital-id">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition backdrop-blur-sm border border-white/30">
                  <IdCard className="h-4 w-4" />
                  View ID
                </button>
              </Link>
            </div>
          </div>

          <form className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={isEditing ? editForm.fullName || '' : profile.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    value={isEditing ? editForm.email || '' : profile.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={isEditing ? editForm.phone || '' : profile.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Blood Type
                </label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <select
                    value={isEditing ? editForm.bloodType || '' : profile.bloodType}
                    onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 appearance-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="date"
                    value={isEditing ? editForm.dateOfBirth || '' : profile.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Gender
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <select
                    value={isEditing ? editForm.gender || '' : profile.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 appearance-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Weight (kg)
                </label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="number"
                    value={isEditing ? editForm.weight || '' : profile.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) })}
                    disabled={!isEditing}
                    min="40"
                    max="300"
                    step="0.1"
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Emergency Contact
                </label>
                <div className="relative">
                  <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={isEditing ? editForm.emergencyContact || '' : profile.emergencyContact}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Address
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={isEditing ? editForm.address || '' : profile.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Barangay
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={isEditing ? editForm.barangay || '' : profile.barangay}
                    onChange={(e) => setEditForm({ ...editForm, barangay: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Municipality
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={isEditing ? editForm.municipality || '' : profile.municipality}
                    onChange={(e) => setEditForm({ ...editForm, municipality: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Province
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={isEditing ? editForm.province || '' : profile.province}
                    onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Medical Conditions
                </label>
                <div className="relative">
                  <Clipboard className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <textarea
                    value={isEditing ? editForm.medicalConditions || '' : profile.medicalConditions}
                    onChange={(e) => setEditForm({ ...editForm, medicalConditions: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 resize-none"
                    placeholder="List any medical conditions (if none, leave empty)"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Current Medications
                </label>
                <div className="relative">
                  <Pill className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <textarea
                    value={isEditing ? editForm.currentMedications || '' : profile.currentMedications}
                    onChange={(e) => setEditForm({ ...editForm, currentMedications: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 resize-none"
                    placeholder="List any current medications (if none, leave empty)"
                  />
                </div>
              </div>
            </div>

            {/* ✅ Fixed Statistics Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Verification Status</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {profile.isVerified ? '✅ Account is verified' : '⏳ Pending verification'}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Donor Statistics
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Donations</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {profile.totalDonations || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Points Earned</span>
                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    {totalPoints}
                  </span>
                </div>
                {profile.lastDonationDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Last Donation</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {new Date(profile.lastDonationDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-1 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Next Eligible
                  </span>
                  <span className={`text-sm font-medium ${
                    daysUntilEligible === 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {daysUntilEligible === 0 ? (
                      '✅ Eligible Now'
                    ) : nextEligibleDate ? (
                      `${daysUntilEligible} days (${nextEligibleDate.toLocaleDateString()})`
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* ✅ Blood Type Info Card */}
            <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center">
                  <Droplet className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Blood Type: {profile.bloodType}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Rh Factor: {profile.bloodType.includes('+') ? 'Positive (+) ✅' : 'Negative (-) ⚠️'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {profile.bloodType.includes('+') 
                      ? 'Can receive: + and - types of same blood group' 
                      : 'Can only receive: - types of same blood group'}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}