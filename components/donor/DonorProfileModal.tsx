// components/donor/DonorProfileModal.tsx
'use client';

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import {
  X,
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
  Download,
  Printer,
  Camera,
  Shield,
  Copy,
  Check,
  Award,
  Clock,
  Activity
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

interface DonorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DonorProfile | null;
  onSave: (data: any) => Promise<void>;
  onUpdate: (data: any) => void;
}

export default function DonorProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
  onUpdate
}: DonorProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'digital-id' | 'stats'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DonorProfile>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      setEditForm(profile);
    }
  }, [profile]);

  if (!isOpen || !profile) return null;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editForm);
      setIsEditing(false);
      showNotification('success', 'Profile updated successfully!');
      // Update the profile in the parent
      if (onUpdate) {
        onUpdate(editForm);
      }
    } catch (error) {
      showNotification('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const copyDonorId = () => {
    if (profile?.digitalId) {
      navigator.clipboard.writeText(profile.digitalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadCard = async (side: 'front' | 'back') => {
    const ref = side === 'front' ? frontRef : backRef;
    if (!ref.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        width: 400,
        height: 600,
      });
      
      const link = document.createElement('a');
      link.download = `RedPulse-ID-${profile?.digitalId || 'donor'}-${side}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading ID:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const printID = () => {
    window.print();
  };

  const getInitials = (name: string) => {
    if (!name) return 'D';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const map = {
      active: 'text-emerald-600 bg-emerald-100',
      inactive: 'text-zinc-600 bg-zinc-100',
      pending: 'text-amber-600 bg-amber-100'
    };
    return map[status as keyof typeof map] || 'text-zinc-600 bg-zinc-100';
  };

  const getStatusText = (status: string) => {
    const map = {
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      pending: 'PENDING'
    };
    return map[status as keyof typeof map] || 'ACTIVE';
  };

  const qrData = JSON.stringify({
    id: profile?.digitalId || profile?.id || '',
    name: profile?.fullName || '',
    bloodType: profile?.bloodType || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    status: profile?.status || 'pending',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
              {getInitials(profile.fullName)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">My Profile</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('digital-id')}
            className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === 'digital-id'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <IdCard className="h-4 w-4 inline mr-2" />
            Digital ID
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === 'stats'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Statistics
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {/* Notification */}
          {notification && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{notification.message}</span>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-end mb-4">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
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
                  </div>
                )}
              </div>

              {/* Profile Form Fields */}
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
                    Email
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
                    Phone
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
                      placeholder="List any medical conditions"
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
                      placeholder="List any current medications"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Digital ID Tab */}
          {activeTab === 'digital-id' && (
            <div>
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {isFlipped ? 'Front' : 'Back'}
                </button>
                <button
                  onClick={() => downloadCard('front')}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </button>
                <button
                  onClick={printID}
                  className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
              </div>

              <div className="flex justify-center">
                <div 
                  className={`relative w-[350px] h-[520px] transition-transform duration-700 preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front Side */}
                  <div 
                    ref={frontRef}
                    className="absolute w-full h-full rounded-2xl shadow-2xl overflow-hidden backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
                      <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full -ml-18 -mb-18" />
                      <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                      }} />
                    </div>

                    <div className="relative h-full p-5 text-white flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Heart className="h-7 w-7" fill="currentColor" />
                          <div>
                            <h1 className="text-lg font-bold tracking-tight">RedPulse</h1>
                            <p className="text-[8px] opacity-80">Blood Donor ID</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] opacity-80">Donor ID</p>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-mono font-bold">{profile.digitalId}</p>
                            <button
                              onClick={copyDonorId}
                              className="p-0.5 hover:bg-white/20 rounded transition"
                            >
                              {copied ? (
                                <Check className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3 opacity-60" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-white/30 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-white">
                              {getInitials(profile.fullName)}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base font-bold truncate">{profile.fullName}</h2>
                          <p className="text-[10px] opacity-80 truncate">{profile.email}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[8px] font-medium">
                              {profile.bloodType}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${getStatusColor(profile.status || '')}`}>
                              {getStatusText(profile.status || '')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 bg-white/10 rounded-lg p-2.5 mb-3">
                        <div>
                          <p className="text-[8px] opacity-70 uppercase">Phone</p>
                          <p className="text-xs font-medium">{profile.phone}</p>
                        </div>
                        <div>
                          <p className="text-[8px] opacity-70 uppercase">Blood Type</p>
                          <p className="text-xs font-bold text-red-300">{profile.bloodType}</p>
                        </div>
                        <div>
                          <p className="text-[8px] opacity-70 uppercase">DOB</p>
                          <p className="text-xs font-medium">
                            {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] opacity-70 uppercase">Weight</p>
                          <p className="text-xs font-medium">{profile.weight} kg</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white/10 rounded-lg p-2.5 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] opacity-70">Scan to verify</p>
                          <p className="text-[8px] font-mono opacity-60 truncate">{profile.digitalId}</p>
                        </div>
                        <div className="bg-white p-1 rounded-lg flex-shrink-0">
                          <QRCodeSVG
                            value={qrData}
                            size={50}
                            level="H"
                            includeMargin={false}
                            fgColor="#DC2626"
                          />
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between text-[8px] opacity-60">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>Verified Donor</span>
                        </div>
                        <div className="text-right">
                          <p>Issued: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
                          <p>Valid: Lifetime</p>
                        </div>
                      </div>

                      <div className="absolute bottom-8 right-4 opacity-5">
                        <Heart className="h-20 w-20" fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div 
                    ref={backRef}
                    className="absolute w-full h-full rounded-2xl shadow-2xl overflow-hidden rotate-y-180"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
                      <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mt-24" />
                      <div className="absolute bottom-0 right-0 w-36 h-36 bg-white/5 rounded-full -mr-18 -mb-18" />
                      <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: `radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                      }} />
                    </div>

                    <div className="relative h-full p-5 text-white flex flex-col">
                      <div className="text-center mb-3">
                        <h3 className="text-base font-bold">Donor Information</h3>
                        <div className="h-0.5 w-12 bg-red-500 mx-auto mt-1" />
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                          <span className="text-[10px] opacity-70">Full Name</span>
                          <span className="text-xs font-medium truncate ml-4">{profile.fullName}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                          <span className="text-[10px] opacity-70">Donor ID</span>
                          <span className="text-xs font-mono">{profile.digitalId}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                          <span className="text-[10px] opacity-70">Blood Type</span>
                          <span className="text-xs font-bold text-red-400">{profile.bloodType}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                          <span className="text-[10px] opacity-70">Status</span>
                          <span className={`text-xs font-medium ${profile.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {getStatusText(profile.status || '')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] opacity-70">Eligibility</span>
                          <span className={`text-xs font-medium ${profile.isEligible ? 'text-green-400' : 'text-red-400'}`}>
                            {profile.isEligible ? '✅ Eligible' : '⛔ Not Eligible'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/10 rounded-lg p-2.5 mb-2">
                        <p className="text-[8px] opacity-70 mb-0.5">📍 Address</p>
                        <p className="text-xs">
                          {profile.address || `${profile.barangay}, ${profile.municipality}, ${profile.province}`}
                        </p>
                      </div>

                      <div className="bg-white/10 rounded-lg p-2.5 mb-2">
                        <p className="text-[8px] opacity-70 mb-0.5">🚨 Emergency Contact</p>
                        <p className="text-xs font-medium">
                          {profile.emergencyName || profile.emergencyContact || 'N/A'}
                          {profile.emergencyRelationship && ` (${profile.emergencyRelationship})`}
                        </p>
                      </div>

                      <div className="mt-auto text-center">
                        <p className="text-[8px] opacity-50">
                          This ID is the property of RedPulse Blood Donor Program
                        </p>
                        <div className="flex justify-center items-center gap-3 mt-1 text-[8px] opacity-30">
                          <span>📞 1-800-RED-PULSE</span>
                          <span>✉️ support@redpulse.com</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Donations</p>
                      <p className="text-3xl font-bold text-zinc-900 dark:text-white">{profile.totalDonations || 0}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Points Earned</p>
                      <p className="text-3xl font-bold text-zinc-900 dark:text-white">{profile.points || 0}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Award className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Last Donation</p>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {profile.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Eligibility</p>
                      <p className={`text-lg font-semibold ${
                        profile.isEligible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {profile.isEligible ? '✅ Eligible' : '⛔ Not Eligible'}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Donor Info Cards */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Blood Type Info</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Type: <span className="font-semibold text-zinc-900 dark:text-white">{profile.bloodType}</span>
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Rh Factor: <span className="font-semibold text-zinc-900 dark:text-white">
                      {profile.bloodType.includes('+') ? 'Positive' : 'Negative'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .preserve-3d, .preserve-3d * {
            visibility: visible;
          }
          .preserve-3d {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) !important;
          }
          .no-print {
            display: none !important;
          }
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}