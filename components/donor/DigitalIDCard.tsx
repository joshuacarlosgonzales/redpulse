// components/donor/DigitalIDCard.tsx
"use client";

import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Share2 } from 'lucide-react';

interface DigitalIDCardProps {
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
  };
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
}

export default function DigitalIDCard({ donor, onDownload, onPrint, onShare }: DigitalIDCardProps) {
  // Generate QR Code data
  const qrData = JSON.stringify({
    id: donor.digitalId,
    name: donor.name,
    bloodType: donor.bloodType,
    email: donor.email,
    phone: donor.phone,
    registered: donor.registered,
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

  // Get barangay from location or use default
  const getBarangay = () => {
    if (donor.barangay) return donor.barangay;
    if (donor.location) {
      const parts = donor.location.split(',');
      return parts[0]?.trim() || 'N/A';
    }
    return 'N/A';
  };

  const getMunicipality = () => {
    if (donor.municipality) return donor.municipality;
    if (donor.location) {
      const parts = donor.location.split(',');
      return parts[1]?.trim() || 'N/A';
    }
    return 'N/A';
  };

  const getProvince = () => {
    if (donor.province) return donor.province;
    if (donor.location) {
      const parts = donor.location.split(',');
      return parts[2]?.trim() || 'N/A';
    }
    return 'N/A';
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-[400px] w-full" id="digital-id-card">
      {/* Header - Republic of the Philippines */}
      <div className="bg-[#1a3c6e] text-white p-4 text-center relative">
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#1a3c6e]">RP</span>
          </div>
        </div>
        <div className="text-[10px] font-medium tracking-wide">Republic of the Philippines</div>
        <div className="text-[9px] opacity-80">{getProvince()}</div>
        <div className="text-[8px] opacity-70">{getMunicipality()} - {getBarangay()}</div>
        <div className="mt-1 text-[11px] font-bold tracking-wider border-t border-white/20 pt-1">
          BARANGAY ID
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Left Column - Photo and Name */}
          <div className="flex-1">
            {/* Photo/Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-zinc-200">
              {getInitials(donor.name)}
            </div>
            
            {/* Name */}
            <div className="mt-2">
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Name</p>
              <p className="text-[11px] font-bold text-zinc-900 leading-tight">{donor.name.toUpperCase()}</p>
            </div>
            
            {/* Address */}
            <div className="mt-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Address</p>
              <p className="text-[10px] text-zinc-800 leading-tight">
                {donor.address || `${getBarangay()}, ${getMunicipality()}, ${getProvince()}`}
              </p>
            </div>
            
            {/* Date of Birth */}
            <div className="mt-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Date of Birth</p>
              <p className="text-[10px] text-zinc-800">{formatDate(donor.dateOfBirth || donor.registered)}</p>
            </div>
            
            {/* Gender */}
            <div className="mt-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Gender</p>
              <p className="text-[10px] text-zinc-800">{donor.gender || 'N/A'}</p>
            </div>
            
            {/* Status */}
            <div className="mt-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Status</p>
              <p className="text-[10px] text-zinc-800">{donor.status ? donor.status.toUpperCase() : 'ACTIVE'}</p>
            </div>
          </div>

          {/* Right Column - QR Code and Details */}
          <div className="flex-shrink-0 w-32">
            {/* QR Code */}
            <div className="bg-white border-2 border-zinc-200 rounded p-1">
              <QRCodeSVG
                value={qrData}
                size={110}
                level="H"
                includeMargin={false}
                className="w-full h-full"
              />
            </div>
            
            {/* QR Code Label */}
            <div className="text-center mt-1">
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">QR Code</p>
            </div>

            {/* Additional Info */}
            <div className="mt-2 space-y-0.5">
              <div>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Nationality</p>
                <p className="text-[9px] text-zinc-800">{donor.nationality || 'FILIPINO'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Civil Status</p>
                <p className="text-[9px] text-zinc-800">{donor.civilStatus || 'SINGLE'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Blood Type</p>
                <p className="text-[9px] font-bold text-red-600">{donor.bloodType}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Date and Valid */}
        <div className="mt-4 pt-3 border-t-2 border-zinc-200 flex justify-between items-center">
          <div>
            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Date Issued</p>
            <p className="text-[10px] text-zinc-800">{formatDate(donor.registered)}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Valid Until</p>
            <p className="text-[10px] text-zinc-800">{formatDate(donor.nextEligible || donor.registered)}</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-bold text-zinc-600 uppercase tracking-wider">ID No.</p>
            <p className="text-[9px] font-mono font-bold text-zinc-800">{donor.digitalId}</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-3 pt-2 border-t border-zinc-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-[6px] font-bold text-zinc-600 uppercase tracking-wider">Red Pulse</span>
            </div>
            <span className="text-[6px] text-zinc-400">|</span>
            <span className="text-[6px] text-zinc-500">Blood Donor ID</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[6px] text-red-600 font-bold">#SaveLives</span>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Hidden when printing */}
      <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex flex-wrap gap-2 justify-end print:hidden">
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