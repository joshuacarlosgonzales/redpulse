// app/hospital/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  Hospital,
  Download,
  Copy,
  Check,
  Printer,
  Share2,
  Shield,
  Award,
  Heart,
  Settings,
  Edit,
  ArrowLeft,
  QrCode,
  UserCircle,
  BadgeCheck,
  Smartphone
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface HospitalProfile {
  id: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  hospitalLicense: string;
  hospitalType: string;
  hospitalCapacity: number;
  status: 'active' | 'pending' | 'inactive';
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  digitalId?: string;
}

export default function HospitalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<HospitalProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
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
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'license' = 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    console.log('Downloading ID...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    console.log('Sharing ID...');
  };

  const getInitials = (name: string) => {
    if (!name) return 'H';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const map = {
      active: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400',
      inactive: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400',
      pending: 'text-amber-600 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400'
    };
    return map[status as keyof typeof map] || 'text-zinc-600 bg-zinc-100';
  };

  const getStatusText = (status: string) => {
    const map = {
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending Verification'
    };
    return map[status as keyof typeof map] || 'Active';
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-zinc-400';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatFullDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const qrData = JSON.stringify({
    id: profile?.digitalId || profile?.id || '',
    name: profile?.hospitalName || '',
    license: profile?.hospitalLicense || '',
    email: profile?.hospitalEmail || '',
    phone: profile?.hospitalPhone || '',
    type: profile?.hospitalType || '',
    status: profile?.status || '',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-red-500" />
                Hospital Profile
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                View and manage your hospital information
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/hospital/settings')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - ID Card */}
          <div className="lg:col-span-2">
            {profile?.hospitalName ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden p-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-red-500" />
                  Digital ID Card
                  {profile?.verifiedAt && (
                    <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </h2>
                
                {/* ID Card - Professional Design */}
                <div 
                  className="id-card-container bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-xl max-w-[550px] mx-auto border border-zinc-200 dark:border-zinc-700"
                  id="hospital-digital-id"
                >
                  {/* Header - Branding with Status */}
                  <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white fill-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold tracking-wide text-white">Red Pulse</div>
                        <div className="text-[10px] text-white/80">Hospital Digital ID</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-white/80">Status</div>
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`inline-block w-2 h-2 rounded-full ${getStatusDot(profile?.status || 'pending')}`} />
                        <span className="text-xs font-semibold text-white">{getStatusText(profile?.status || 'pending')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-6">
                    <div className="flex gap-6">
                      {/* Left Column - Hospital Info */}
                      <div className="flex-1 min-w-0">
                        {/* Hospital Name & License */}
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                            {getInitials(profile?.hospitalName || 'Hospital')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight break-words">
                              {profile?.hospitalName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex-shrink-0">License:</span>
                              <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 break-all">
                                {profile?.hospitalLicense || 'N/A'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(profile?.hospitalLicense || '', 'license')}
                                className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition flex-shrink-0"
                              >
                                {copied ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Details Grid - Full Email Display */}
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Type</p>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{profile?.hospitalType || 'N/A'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Address</p>
                            <p className="text-sm text-zinc-800 dark:text-zinc-200 break-words">{profile?.hospitalAddress || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Phone</p>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{profile?.hospitalPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email</p>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 break-all">
                              {profile?.hospitalEmail || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Registration & ID Info */}
                        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Member Since</p>
                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{formatDate(profile?.createdAt || '')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID Number</p>
                            <div className="flex items-center gap-1 justify-end">
                              <p className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 break-all">
                                {profile?.digitalId || profile?.id || 'N/A'}
                              </p>
                              <button
                                onClick={() => copyToClipboard(profile?.digitalId || profile?.id || '', 'id')}
                                className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition flex-shrink-0"
                              >
                                {copiedId ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - QR Code */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center border-l border-zinc-200 dark:border-zinc-700 pl-6">
                        <div className="bg-white dark:bg-zinc-700 rounded-xl p-2 border-2 border-red-200 dark:border-red-800">
                          <QRCodeSVG
                            value={qrData}
                            size={140}
                            level="H"
                            includeMargin={false}
                            className="w-35 h-35"
                          />
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">Scan to verify</p>
                          <p className="text-[8px] text-zinc-400 dark:text-zinc-500">Secure digital identity</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Secure Digital ID</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-zinc-400">Powered by</span>
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Red Pulse</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center print:hidden">
                  <button
                    onClick={() => copyToClipboard(profile?.id || '', 'license')}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition flex items-center gap-2 border border-zinc-200 dark:border-zinc-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy ID
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition flex items-center gap-2 border border-zinc-200 dark:border-zinc-700"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition flex items-center gap-2 border border-zinc-200 dark:border-zinc-700"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={handleShare}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Hospital Not Set Up</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
                  Please set up your hospital profile to start receiving blood requests and managing inventory.
                </p>
                <button
                  onClick={() => router.push('/hospital/settings')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Set Up Hospital Now
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-red-500" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Status</span>
                  <span className={`text-sm font-medium ${getStatusColor(profile?.status || 'pending')}`}>
                    {getStatusText(profile?.status || 'pending')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Hospital Type</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {profile?.hospitalType || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Capacity</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {profile?.hospitalCapacity || 0} beds
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">License</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {profile?.hospitalLicense || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Member Since</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatFullDate(profile?.createdAt || '')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/hospital/settings?tab=setup')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  <Edit className="w-4 h-4 text-red-500" />
                  Edit Hospital Info
                </button>
                <button
                  onClick={() => router.push('/hospital/settings?tab=security')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  <Shield className="w-4 h-4 text-red-500" />
                  Security Settings
                </button>
                <button
                  onClick={() => router.push('/hospital/settings')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  <Settings className="w-4 h-4 text-red-500" />
                  All Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}