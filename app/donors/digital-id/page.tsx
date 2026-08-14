// app/donors/digital-id/page.tsx
'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Heart,
  User,
  Mail,
  Phone,
  Droplet,
  Calendar,
  MapPin,
  Award,
  Download,
  Printer,
  Camera,
  Shield,
  CheckCircle,
  ArrowLeft,
  Loader2,
  QrCode,
  IdCard,
  Copy,
  Check,
  Building2,
  Home
} from "lucide-react";
import html2canvas from "html2canvas";

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
  digitalId: string;
  status: string;
  isEligible: boolean;
  emergencyName: string;
  emergencyRelationship: string;
  totalDonations?: number;
  lastDonationDate?: string;
  points?: number;
  _id?: string;
  donorId?: string;
}

export default function DigitalIDPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

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

      setUser(userData);
      await fetchDonorProfile();
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchDonorProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('📥 Fetching donor profile for digital ID...');
      
      // Try to get profile from donor API
      const response = await fetch('/api/donors/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Donor data received:', data);
        
        if (data.success && data.data) {
          const donorData = data.data;
          const profileData: DonorProfile = {
            id: donorData._id || donorData.id || 'unknown',
            _id: donorData._id || donorData.id || 'unknown',
            donorId: donorData._id || donorData.id || 'unknown',
            fullName: donorData.fullName || donorData.name || '',
            email: donorData.email || '',
            phone: donorData.phone || donorData.mobileNumber || 'N/A',
            bloodType: donorData.bloodType || 'O+',
            dateOfBirth: donorData.dateOfBirth || '',
            gender: donorData.gender || 'Not specified',
            weight: donorData.weight || 0,
            address: donorData.address || 'N/A',
            barangay: donorData.barangay || 'N/A',
            municipality: donorData.municipality || 'N/A',
            province: donorData.province || 'N/A',
            emergencyContact: donorData.emergencyContact || 'N/A',
            medicalConditions: donorData.medicalConditions || 'None',
            currentMedications: donorData.currentMedications || 'None',
            isVerified: donorData.isVerified || false,
            createdAt: donorData.createdAt || new Date().toISOString(),
            digitalId: donorData.digitalId || `RP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            status: donorData.status || 'pending',
            isEligible: donorData.isEligible || false,
            totalDonations: donorData.totalDonations || 0,
            lastDonationDate: donorData.lastDonationDate || '',
            points: donorData.points || 0,
            emergencyName: donorData.emergencyName || '',
            emergencyRelationship: donorData.emergencyRelationship || ''
          };
          
          setProfile(profileData);
          setLoading(false);
          return;
        }
      }

      // If donor API fails, try user profile API
      console.log('⚠️ Donor API failed, trying user profile API...');
      const userResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.ok) {
        const data = await userResponse.json();
        console.log('📥 User profile data received:', data);
        
        let userData = data;
        if (data.success && data.data) {
          userData = data.data;
        }
        
        const profileData: DonorProfile = {
          id: userData._id || userData.id || userData.userId || 'unknown',
          _id: userData._id || userData.id || userData.userId || 'unknown',
          donorId: userData._id || userData.id || userData.userId || 'unknown',
          fullName: userData.fullName || userData.name || '',
          email: userData.email || '',
          phone: userData.phone || userData.mobileNumber || 'N/A',
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
          digitalId: userData.digitalId || `RP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          status: userData.status || userData.donorStatus || 'pending',
          isEligible: userData.isEligible || false,
          totalDonations: userData.totalDonations || 0,
          lastDonationDate: userData.lastDonationDate || userData.lastDonation || '',
          points: userData.points || 0,
          emergencyName: userData.emergencyName || '',
          emergencyRelationship: userData.emergencyRelationship || ''
        };
        
        setProfile(profileData);
        setLoading(false);
        return;
      }

      // If all APIs fail, use localStorage data
      console.log('⚠️ All APIs failed, using localStorage data');
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const fallbackProfile: DonorProfile = {
          id: userData.id || userData.userId || 'unknown',
          _id: userData.id || userData.userId || 'unknown',
          donorId: userData.id || userData.userId || 'unknown',
          fullName: userData.name || userData.fullName || 'Donor',
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
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async (side: 'front' | 'back') => {
    const ref = side === 'front' ? frontRef : backRef;
    
    if (!ref.current) {
      console.error('ID card element not found');
      return;
    }

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

  const copyDonorId = () => {
    if (profile?.digitalId) {
      navigator.clipboard.writeText(profile.digitalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading your digital ID...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30">
        <div className="text-center max-w-md">
          <IdCard className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">No ID Found</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Your digital ID has not been generated yet. Please contact the admin.
          </p>
          <Link href="/donors/dashboard">
            <button className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href="/donors/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition rounded-lg hover:bg-white/50 dark:hover:bg-black/50">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </Link>
          <div className="flex flex-wrap gap-2">
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
              Print ID
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div 
            className={`relative w-[400px] h-[600px] transition-transform duration-700 preserve-3d ${
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 border-2 border-white/10 rounded-full m-8" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 border-2 border-white/10 rounded-full m-8" />
                </div>
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }} />
              </div>

              <div className="relative h-full p-6 text-white flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-8 w-8" fill="currentColor" />
                    <div>
                      <h1 className="text-xl font-bold tracking-tight">RedPulse</h1>
                      <p className="text-[10px] opacity-80">Blood Donor ID</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] opacity-80">Donor ID</p>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-mono font-bold">{profile.digitalId}</p>
                      <button
                        onClick={copyDonorId}
                        className="p-1 hover:bg-white/20 rounded transition no-print"
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

                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                      <span className="text-4xl font-bold text-white">
                        {profile.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">{profile.fullName}</h2>
                    <p className="text-sm opacity-80 truncate">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        {profile.bloodType}
                      </span>
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        {profile.gender}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        profile.status === 'active' 
                          ? 'bg-green-500/30' 
                          : 'bg-yellow-500/30'
                      }`}>
                        {profile.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white/10 rounded-xl p-4 mb-4">
                  <div>
                    <p className="text-[10px] opacity-70 uppercase">Phone</p>
                    <p className="text-sm font-medium">{profile.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-70 uppercase">Blood Type</p>
                    <p className="text-sm font-bold text-red-300">{profile.bloodType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-70 uppercase">Date of Birth</p>
                    <p className="text-sm font-medium">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-70 uppercase">Weight</p>
                    <p className="text-sm font-medium">{profile.weight} kg</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs opacity-70">Scan to verify</p>
                    <p className="text-xs font-mono opacity-60 truncate">{profile.digitalId}</p>
                  </div>
                  <div className="bg-white p-1 rounded-lg flex-shrink-0">
                    <QRCodeSVG
                      value={JSON.stringify({
                        id: profile.id,
                        digitalId: profile.digitalId,
                        name: profile.fullName,
                        bloodType: profile.bloodType,
                        verified: profile.isVerified,
                        phone: profile.phone,
                        status: profile.status,
                        email: profile.email
                      })}
                      size={64}
                      level="H"
                      includeMargin={false}
                      fgColor="#DC2626"
                    />
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between text-[10px] opacity-60">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Verified Donor</span>
                  </div>
                  <div className="text-right">
                    <p>Issued: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
                    <p>Valid: Lifetime</p>
                  </div>
                </div>

                <div className="absolute bottom-12 right-6 opacity-5">
                  <Heart className="h-32 w-32" fill="currentColor" />
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
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mt-32" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mb-24" />
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: `radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }} />
              </div>

              <div className="relative h-full p-6 text-white flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold">Donor Information</h3>
                  <div className="h-0.5 w-20 bg-red-500 mx-auto mt-1" />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-sm opacity-70">Full Name</span>
                    <span className="text-sm font-medium truncate ml-4">{profile.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-sm opacity-70">Donor ID</span>
                    <span className="text-sm font-mono">{profile.digitalId}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-sm opacity-70">Blood Type</span>
                    <span className="text-sm font-bold text-red-400">{profile.bloodType}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-sm opacity-70">Status</span>
                    <span className={`text-sm font-medium ${
                      profile.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {profile.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">Eligibility</span>
                    <span className={`text-sm font-medium ${
                      profile.isEligible ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {profile.isEligible ? '✅ Eligible' : '⛔ Not Eligible'}
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 mb-3">
                  <p className="text-[10px] opacity-70 mb-1">📍 Address</p>
                  <p className="text-sm">
                    {profile.address || `${profile.barangay}, ${profile.municipality}, ${profile.province}`}
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl p-3 mb-3">
                  <p className="text-[10px] opacity-70 mb-1">🚨 Emergency Contact</p>
                  <p className="text-sm font-medium">
                    {profile.emergencyName || profile.emergencyContact || 'N/A'}
                    {profile.emergencyRelationship && ` (${profile.emergencyRelationship})`}
                  </p>
                </div>

                <div className="mt-auto text-center">
                  <p className="text-[10px] opacity-50">
                    This ID is the property of RedPulse Blood Donor Program
                  </p>
                  <p className="text-[8px] opacity-30 mt-1">
                    In case of emergency, please contact RedPulse immediately
                  </p>
                  <div className="flex justify-center items-center gap-4 mt-2 text-[10px] opacity-30">
                    <span>📞 1-800-RED-PULSE</span>
                    <span>✉️ support@redpulse.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 no-print">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-zinc-900 dark:text-white">RedPulse Digital ID</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                <span className="font-medium">Donor ID:</span> {profile.digitalId}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-medium">Status:</span>{' '}
                <span className={profile.status === 'active' ? 'text-green-600' : 'text-yellow-600'}>
                  {profile.status === 'active' ? '✅ Active' : '⏳ Pending Verification'}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                profile.isEligible 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {profile.isEligible ? '🩸 Eligible' : '⛔ Not Eligible'}
              </span>
            </div>
          </div>
        </div>
      </div>

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
            width: 400px !important;
            height: 600px !important;
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