// components/hospital/HospitalProfileModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Building,
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
  Building2,
  Shield,
  Award,
  Heart,
  Users,
  Settings,
  Droplet
} from 'lucide-react';

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

interface HospitalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (data: any) => void;
  onSetupClick?: () => void;
}

export function HospitalProfileModal({ isOpen, onClose, onUpdate, onSetupClick }: HospitalProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<HospitalProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

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
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    registered: profile?.createdAt || '',
    status: profile?.status || 'pending',
    type: profile?.hospitalType || '',
    capacity: profile?.hospitalCapacity || 0,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-500" />
              Hospital Profile
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">View your hospital information and digital ID</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-8rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mb-6 print:hidden">
                <button
                  onClick={onSetupClick}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  {profile?.hospitalName ? 'Update Hospital Info' : 'Set Up Hospital'}
                </button>
                {!profile?.hospitalName && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Please set up your hospital to receive blood requests</span>
                  </div>
                )}
              </div>

              {/* Digital ID Card */}
              {profile?.hospitalName ? (
                <div className="mb-6 flex flex-col items-center">
                  {/* ID Card Container - Credit Card Size */}
                  <div 
                    className="id-card-container bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-[400px] mx-auto print:max-w-none print:shadow-none print:rounded-none"
                    id="hospital-digital-id"
                  >
                    {/* Header - Red Pulse Branding */}
                    <div className="bg-gradient-to-r from-red-700 to-red-600 text-white p-2.5 text-center relative">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                      <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full -ml-6 -mb-6"></div>
                      
                      <div className="flex items-center justify-center gap-1.5 relative z-10">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Building2 className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-wide leading-none">Red Pulse</div>
                          <div className="text-[6px] opacity-80 leading-none">Hospital Digital ID</div>
                        </div>
                      </div>
                      
                      <div className="mt-0.5 text-[7px] font-medium tracking-wider border-t border-white/20 pt-0.5 leading-none">
                        {profile?.hospitalType || 'General Hospital'}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-2.5">
                      <div className="flex gap-2.5">
                        {/* Left Column */}
                        <div className="flex-1 min-w-0">
                          {/* Logo/Avatar with status indicator */}
                          <div className="relative inline-block">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white text-base font-bold shadow-md">
                              {getInitials(profile?.hospitalName || 'Hospital')}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 px-1 py-0.5 rounded-full text-[6px] font-bold ${getStatusColor(profile?.status || 'pending')} border border-white`}>
                              {getStatusText(profile?.status || 'pending')}
                            </div>
                          </div>
                          
                          {/* Hospital Name */}
                          <div className="mt-1">
                            <p className="text-[6px] font-bold text-red-600 uppercase tracking-wider leading-none">Hospital Name</p>
                            <p className="text-[8px] font-bold text-zinc-900 leading-tight truncate">{profile?.hospitalName?.toUpperCase() || 'HOSPITAL'}</p>
                          </div>
                          
                          {/* License & Type */}
                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <FileText className="w-2 h-2 text-red-600" />
                              <span className="text-[6px] font-bold text-red-700">{profile?.hospitalLicense || 'N/A'}</span>
                            </div>
                            <div className="text-[6px] text-zinc-400">|</div>
                            <div className="text-[6px] text-zinc-500">
                              {profile?.hospitalCapacity || 0} Beds
                            </div>
                          </div>
                          
                          {/* Address */}
                          <div className="mt-1">
                            <p className="text-[5px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Address</p>
                            <p className="text-[6px] text-zinc-800 leading-tight truncate">
                              {profile?.hospitalAddress || 'N/A'}
                            </p>
                          </div>
                          
                          {/* Contact Info */}
                          <div className="mt-1 grid grid-cols-2 gap-0.5">
                            <div>
                              <p className="text-[5px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Phone</p>
                              <p className="text-[6px] text-zinc-800 truncate">{profile?.hospitalPhone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[5px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Email</p>
                              <p className="text-[6px] text-zinc-800 truncate">{profile?.hospitalEmail || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - QR Code */}
                        <div className="flex-shrink-0 w-[85px]">
                          {/* QR Code with Red Pulse branding */}
                          <div className="relative">
                            <div className="bg-white border-2 border-red-200 rounded-lg p-0.5 shadow-sm">
                              <QRCodeSVG
                                value={qrData}
                                size={72}
                                level="H"
                                includeMargin={false}
                                className="w-full h-full"
                              />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 bg-red-600 rounded-full p-0.5 shadow">
                              <Shield className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                          
                          {/* QR Code Label */}
                          <div className="text-center mt-0.5">
                            <p className="text-[5px] font-bold text-red-600 uppercase tracking-wider leading-none">Scan to Verify</p>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-1 space-y-0.5 bg-zinc-50 rounded-lg p-1">
                            <div>
                              <p className="text-[5px] font-bold text-zinc-500 uppercase tracking-wider leading-none">License</p>
                              <p className="text-[6px] text-zinc-800 truncate">{profile?.hospitalLicense || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[5px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Type</p>
                              <p className="text-[6px] text-zinc-800 truncate">{profile?.hospitalType || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[5px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Capacity</p>
                              <p className="text-[6px] text-zinc-800">{profile?.hospitalCapacity || 0} beds</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer - Registration Info */}
                      <div className="mt-2 pt-1.5 border-t-2 border-red-200 grid grid-cols-2 gap-1">
                        <div>
                          <p className="text-[5px] font-bold text-red-600 uppercase tracking-wider leading-none">Registered</p>
                          <p className="text-[6px] text-zinc-800">{formatDate(profile?.createdAt || '')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[5px] font-bold text-red-600 uppercase tracking-wider leading-none">ID Number</p>
                          <p className="text-[6px] font-mono font-bold text-zinc-800 truncate">{profile?.digitalId || profile?.id || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Status & Verification */}
                      <div className="mt-1 flex justify-between items-center text-[6px] text-zinc-500">
                        <div className="flex items-center gap-1">
                          <span className={`inline-block w-1 h-1 rounded-full ${getStatusDot(profile?.status || 'pending')}`} />
                          <span>Status: {getStatusText(profile?.status || 'pending')}</span>
                        </div>
                        {profile?.verifiedAt && (
                          <div className="flex items-center gap-0.5 text-emerald-600">
                            <Award className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Bar */}
                      <div className="mt-1.5 pt-1 border-t border-zinc-200 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                          <span className="text-[5px] font-bold text-red-600">#SaveLives</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[4px] text-zinc-400">Powered by</span>
                          <span className="text-[5px] font-bold text-red-600">Red Pulse</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex flex-wrap gap-2 justify-center print:hidden">
                    <button
                      onClick={() => copyToClipboard(profile?.id || '')}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 rounded-lg transition flex items-center gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy ID
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 rounded-lg transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 rounded-lg transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>
                    <button
                      onClick={handleShare}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                  </div>
                </div>
              ) : (
                // No Hospital Setup - Show Setup Prompt
                <div className="text-center py-12 px-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-700 print:hidden">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Hospital Not Set Up</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
                    Please set up your hospital profile to start receiving blood requests and managing inventory.
                  </p>
                  <button
                    onClick={onSetupClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                  >
                    <Settings className="w-4 h-4" />
                    Set Up Hospital Now
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Named export for the component
export { HospitalProfileModal as default };