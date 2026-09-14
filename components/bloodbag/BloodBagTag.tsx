// components/bloodbag/BloodBagTag.tsx
'use client';

import { useState, useRef } from 'react';
import {
  Printer,
  X,
  Droplet,
  Calendar,
  User,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Share2,
  QrCode
} from 'lucide-react';

export interface BloodBagTagData {
  id: string;
  bloodType: string;
  units: number;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  donationDate: string;
  expirationDate: string;
  hospitalName: string;
  hospitalAddress?: string;
  batchNumber?: string;
  bloodDriveId?: string;
  bloodDriveTitle?: string;
  isWalkIn?: boolean;
  status: 'available' | 'expired' | 'used';
  daysRemaining?: number;
}

interface BloodBagTagProps {
  isOpen: boolean;
  onClose: () => void;
  data: BloodBagTagData | null;
  onPrint?: () => void;
}

export default function BloodBagTag({ isOpen, onClose, data, onPrint }: BloodBagTagProps) {
  const [printing, setPrinting] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'expired': return 'bg-red-100 text-red-700 border-red-300';
      case 'used': return 'bg-zinc-100 text-zinc-700 border-zinc-300';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const handlePrint = () => {
    const printContent = tagRef.current;
    if (!printContent) {
      alert('Unable to print. Please try again.');
      return;
    }

    setPrinting(true);

    const styles = `
      @page {
        size: 4in 6in;
        margin: 0;
      }
      @media print {
        body { margin: 0; padding: 0; background: white; }
        .no-print { display: none !important; }
        .tag-container { 
          width: 100%;
          height: 100%;
          border-radius: 0;
          box-shadow: none;
        }
        .tag-container .print-actions { display: none !important; }
        .tag-container .close-btn { display: none !important; }
      }
      @media screen {
        body { 
          margin: 0; 
          padding: 20px; 
          background: #f5f5f5;
          font-family: 'Courier New', monospace;
        }
        .tag-container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .tag-header { 
          background: linear-gradient(135deg, #dc2626, #991b1b);
          padding: 20px;
          color: white;
        }
        .tag-body { padding: 20px; }
        .blood-type-display {
          font-size: 48px;
          font-weight: bold;
          background: #fee2e2;
          color: #dc2626;
          padding: 8px 24px;
          border-radius: 8px;
          display: inline-block;
        }
        .tag-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .tag-row .label {
          color: #6b7280;
          font-weight: 500;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tag-row .value {
          color: #1f2937;
          font-weight: 600;
          font-size: 13px;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .footer {
          background: #f9fafb;
          padding: 16px 20px;
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }
        .print-actions {
          padding: 16px 20px;
          display: flex;
          gap: 10px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .print-actions button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .print-actions .btn-print {
          background: #2563eb;
          color: white;
        }
        .print-actions .btn-print:hover {
          background: #1d4ed8;
        }
        .print-actions .btn-close {
          background: #e5e7eb;
          color: #374151;
        }
        .print-actions .btn-close:hover {
          background: #d1d5db;
        }
        .close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        .tag-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .qr-placeholder {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 10px;
          text-align: center;
          padding: 4px;
        }
        .warning-text {
          color: #dc2626;
          font-weight: bold;
          font-size: 14px;
        }
        .expired-badge {
          background: #fee2e2;
          color: #dc2626;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
          border: 2px solid #dc2626;
        }
      }
    `;

    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups to print the tag.');
      setPrinting(false);
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Blood Bag Tag - ${data.bloodType}</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          <\/script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();

    setTimeout(() => {
      setPrinting(false);
      if (onPrint) onPrint();
    }, 1000);
  };

  const isExpired = data.status === 'expired' || new Date(data.expirationDate) < new Date();
  const daysRemaining = data.daysRemaining !== undefined ? data.daysRemaining : 
    Math.ceil((new Date(data.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={tagRef} className="tag-container">
        {/* Tag Header */}
        <div className="tag-header">
          <div className="tag-header-top">
            <div>
              <div className="text-xs opacity-80 uppercase tracking-wider">Blood Bag Tag</div>
              <div className="text-sm font-mono mt-1 opacity-70">{data.id.slice(0, 12).toUpperCase()}</div>
            </div>
            <button
              onClick={onClose}
              className="close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="blood-type-display">
              {data.bloodType}
            </div>
            <span className={`status-badge ${getStatusColor(data.status)}`}>
              {getStatusIcon(data.status)}
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Tag Body */}
        <div className="tag-body">
          {/* Donor Information */}
          <div className="mb-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Donor Information</div>
            <div className="tag-row">
              <span className="label">Donor Name</span>
              <span className="value">{data.donorName}</span>
            </div>
            {data.donorEmail && (
              <div className="tag-row">
                <span className="label">Email</span>
                <span className="value">{data.donorEmail}</span>
              </div>
            )}
            {data.donorPhone && (
              <div className="tag-row">
                <span className="label">Phone</span>
                <span className="value">{data.donorPhone}</span>
              </div>
            )}
            {data.isWalkIn && (
              <div className="tag-row">
                <span className="label">Type</span>
                <span className="value text-purple-600 font-semibold">Walk-in Donor</span>
              </div>
            )}
          </div>

          {/* Blood Details */}
          <div className="mb-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Blood Details</div>
            <div className="tag-row">
              <span className="label">Blood Type</span>
              <span className="value text-red-600 font-bold text-lg">{data.bloodType}</span>
            </div>
            <div className="tag-row">
              <span className="label">Units</span>
              <span className="value">{data.units}</span>
            </div>
            {data.batchNumber && (
              <div className="tag-row">
                <span className="label">Batch #</span>
                <span className="value font-mono text-sm">{data.batchNumber}</span>
              </div>
            )}
            {data.bloodDriveTitle && (
              <div className="tag-row">
                <span className="label">Blood Drive</span>
                <span className="value text-sm">{data.bloodDriveTitle}</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="mb-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Dates</div>
            <div className="tag-row">
              <span className="label">Donation Date</span>
              <span className="value">{formatDate(data.donationDate)}</span>
            </div>
            <div className="tag-row">
              <span className="label">Expiration Date</span>
              <span className={`value ${isExpired ? 'text-red-600' : ''}`}>
                {formatDate(data.expirationDate)}
              </span>
            </div>
            <div className="tag-row">
              <span className="label">Days Remaining</span>
              <span className={`value ${isExpired ? 'text-red-600 font-bold' : daysRemaining <= 7 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {isExpired ? '🔴 EXPIRED' : `${daysRemaining} days`}
              </span>
            </div>
          </div>

          {/* Hospital Information */}
          <div className="mb-2">
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Hospital</div>
            <div className="tag-row">
              <span className="label">Name</span>
              <span className="value text-sm">{data.hospitalName}</span>
            </div>
            {data.hospitalAddress && (
              <div className="tag-row">
                <span className="label">Address</span>
                <span className="value text-sm">{data.hospitalAddress}</span>
              </div>
            )}
          </div>

          {/* Warning for Expired */}
          {isExpired && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">WARNING:</span>
                This blood unit has expired and should not be used for transfusion.
              </p>
            </div>
          )}

          {/* Warning for Expiring Soon */}
          {!isExpired && daysRemaining <= 7 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">⚠️ EXPIRING SOON:</span>
                This blood unit expires in {daysRemaining} days. Please use it soon.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="flex items-center justify-center gap-4">
            <span>🩸 RedPulse Blood Management System</span>
            <span>•</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Print Actions */}
        <div className="print-actions">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="btn-print"
          >
            {printing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            {printing ? 'Printing...' : 'Print Tag'}
          </button>
          <button
            onClick={onClose}
            className="btn-close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}