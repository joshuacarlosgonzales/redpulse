// components/donor/RedPulseDigitalID.tsx
"use client";

import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Share2, Droplet, Heart, Shield, Calendar, MapPin, Phone, Mail, User } from 'lucide-react';

interface RedPulseDigitalIDProps {
  donor: {
    id: string;
    name: string;
    email: string;
    phone: string;
    bloodType: string;
    location: string;
    status: 'active' | 'inactive' | 'pending';
    digitalId: string;
    registered: string;
    lastDonation: string;
    dateOfBirth?: string;
    gender?: string;
    barangay?: string;
    municipality?: string;
    province?: string;
    emergencyContact?: string;
    totalDonations?: number;
    nextEligible?: string;
    address?: string;
    civilStatus?: string;
    nationality?: string;
    occupation?: string;
    weight?: number;
  };
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
}

export default function RedPulseDigitalID({ donor, onDownload, onPrint, onShare }: RedPulseDigitalIDProps) {
  // Generate QR Code data
  const qrData = JSON.stringify({
    id: donor.digitalId,
    name: donor.name,
    bloodType: donor.bloodType,
    email: donor.email,
    phone: donor.phone,
    registered: donor.registered,
    status: donor.status,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
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

  const getBarangay = () => donor.barangay || donor.location?.split(',')[0]?.trim() || 'N/A';
  const getMunicipality = () => donor.municipality || donor.location?.split(',')[1]?.trim() || 'N/A';
  const getProvince = () => donor.province || donor.location?.split(',')[2]?.trim() || 'N/A';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-[400px] w-full" id="redpulse-digital-id">
      {/* Header - Red Pulse Branding */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white p-3 text-center relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8"></div>
        
        <div className="flex items-center justify-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Droplet className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide">Red Pulse</div>
            <div className="text-[8px] opacity-80">Blood Donor Digital ID</div>
          </div>
        </div>
        
        <div className="mt-1 text-[9px] font-medium tracking-wider border-t border-white/20 pt-1">
          {getProvince()} • {getMunicipality()}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Left Column */}
          <div className="flex-1 min-w-0">
            {/* Photo/Avatar with status indicator */}
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {getInitials(donor.name)}
              </div>
              <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[7px] font-bold ${getStatusColor(donor.status)} border-2 border-white`}>
                {getStatusText(donor.status)}
              </div>
            </div>
            
            {/* Name */}
            <div className="mt-2">
              <p className="text-[8px] font-bold text-red-600 uppercase tracking-wider">Full Name</p>
              <p className="text-[10px] font-bold text-zinc-900 leading-tight">{donor.name.toUpperCase()}</p>
            </div>
            
            {/* Blood Type - Prominent */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Droplet className="w-3 h-3 text-red-600" />
                <span className="text-[10px] font-bold text-red-700">{donor.bloodType}</span>
              </div>
              <div className="text-[8px] text-zinc-400">|</div>
              <div className="text-[8px] text-zinc-500">
                {donor.totalDonations || 0} Donation{donor.totalDonations !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Address */}
            <div className="mt-1.5">
              <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-wider">Address</p>
              <p className="text-[8px] text-zinc-800 leading-tight truncate">
                {donor.address || `${getBarangay()}, ${getMunicipality()}, ${getProvince()}`}
              </p>
            </div>
            
            {/* Date of Birth & Gender */}
            <div className="mt-1 grid grid-cols-2 gap-1">
              <div>
                <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</p>
                <p className="text-[8px] text-zinc-800">{formatDate(donor.dateOfBirth || donor.registered)}</p>
              </div>
              <div>
                <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-wider">Gender</p>
                <p className="text-[8px] text-zinc-800">{donor.gender || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="flex-shrink-0 w-28">
            {/* QR Code with Red Pulse branding */}
            <div className="relative">
              <div className="bg-white border-2 border-red-200 rounded-xl p-1 shadow-md">
                <QRCodeSVG
                  value={qrData}
                  size={100}
                  level="H"
                  includeMargin={false}
                  className="w-full h-full"
                />
              </div>
              <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 shadow-lg">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            
            {/* QR Code Label */}
            <div className="text-center mt-0.5">
              <p className="text-[6px] font-bold text-red-600 uppercase tracking-wider">Scan to Verify</p>
            </div>

            {/* Additional Info */}
            <div className="mt-1.5 space-y-0.5 bg-zinc-50 rounded-lg p-1.5">
              <div>
                <p className="text-[6px] font-bold text-zinc-500 uppercase tracking-wider">Contact</p>
                <p className="text-[7px] text-zinc-800 truncate">{donor.phone}</p>
              </div>
              <div>
                <p className="text-[6px] font-bold text-zinc-500 uppercase tracking-wider">Email</p>
                <p className="text-[7px] text-zinc-800 truncate">{donor.email}</p>
              </div>
              <div>
                <p className="text-[6px] font-bold text-zinc-500 uppercase tracking-wider">Weight</p>
                <p className="text-[7px] text-zinc-800">{donor.weight || 'N/A'} kg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Donation Info */}
        <div className="mt-3 pt-2 border-t-2 border-red-200 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[6px] font-bold text-red-600 uppercase tracking-wider">Registered</p>
            <p className="text-[8px] text-zinc-800">{formatDate(donor.registered)}</p>
          </div>
          <div>
            <p className="text-[6px] font-bold text-red-600 uppercase tracking-wider">Last Donation</p>
            <p className="text-[8px] text-zinc-800">{formatDate(donor.lastDonation)}</p>
          </div>
          <div className="text-right">
            <p className="text-[6px] font-bold text-red-600 uppercase tracking-wider">ID Number</p>
            <p className="text-[7px] font-mono font-bold text-zinc-800 truncate">{donor.digitalId}</p>
          </div>
        </div>

        {/* Emergency Contact & Next Eligible */}
        <div className="mt-1.5 flex justify-between items-center text-[7px] text-zinc-500">
          <span>Emergency: {donor.emergencyContact || 'N/A'}</span>
          <span>Next Eligible: {formatDate(donor.nextEligible || donor.registered)}</span>
        </div>

        {/* Bottom Bar */}
        <div className="mt-2 pt-1.5 border-t border-zinc-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span className="text-[6px] font-bold text-red-600">#SaveLives</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[5px] text-zinc-400">Powered by</span>
            <span className="text-[6px] font-bold text-red-600">Red Pulse</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Hidden when printing */}
      <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 flex flex-wrap gap-2 justify-end print:hidden">
        <button
          onClick={onDownload}
          className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 rounded-lg transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
        <button
          onClick={onPrint}
          className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 rounded-lg transition flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
        <button
          onClick={onShare}
          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>
    </div>
  );
}