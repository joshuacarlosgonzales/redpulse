// components/releaseblood/ReleaseReceipt.tsx
'use client';

import { useRef } from 'react';
import { Printer, X, Droplet, Calendar, User, Building, Stethoscope, FileText, CheckCircle } from 'lucide-react';

export interface ReceiptData {
  id: string;
  bloodType: string;
  units: number;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  hospitalWard: string;
  doctorName: string;
  reason: string;
  releaseDate: string;
  notes?: string;
  requestId?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  hospitalName: string;
  hospitalAddress?: string;
  releasedBy: string;
}

interface ReleaseReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

export default function ReleaseReceipt({ isOpen, onClose, receiptData }: ReleaseReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups to print the receipt.');
      return;
    }

    const styles = `
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: 'Courier New', monospace;
          background: white;
          color: #1a1a2e;
          margin: 0;
          padding: 20px;
        }
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          border: 2px solid #1a1a2e;
          border-radius: 8px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #1a1a2e;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          margin: 0;
          color: #dc2626;
          letter-spacing: 2px;
        }
        .header .subtitle {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .receipt-id {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
          border-bottom: 1px dotted #f3f4f6;
        }
        .row:last-child {
          border-bottom: none;
        }
        .label {
          color: #6b7280;
          font-weight: 500;
        }
        .value {
          color: #1f2937;
          font-weight: 600;
          text-align: right;
        }
        .blood-type-badge {
          display: inline-block;
          background: #fee2e2;
          color: #dc2626;
          padding: 2px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 18px;
        }
        .status-badge {
          display: inline-block;
          background: #dcfce7;
          color: #16a34a;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px dashed #1a1a2e;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }
        .footer .powered {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .print-btn {
          display: none;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
          .receipt-container { border: none; border-radius: 0; padding: 20px; }
          .header h1 { font-size: 28px; }
        }
      </style>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Blood Release Receipt</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          <\/script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isFromRequest = !!receiptData.donorName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with Print and Close buttons */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/60 p-4 flex items-center justify-between z-10 no-print">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Release Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="receipt-container p-6">
          {/* Header */}
          <div className="header text-center border-b-2 border-dashed border-zinc-200 dark:border-zinc-700 pb-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Droplet className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">BLOOD RELEASE RECEIPT</h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Official Blood Release Document</p>
          </div>

          {/* Receipt ID */}
          <div className="receipt-id text-center text-xs text-zinc-400 dark:text-zinc-500 mb-4">
            Receipt #: {receiptData.id.slice(0, 12).toUpperCase()}
          </div>

          {/* Status */}
          <div className="text-center mb-4">
            <span className="status-badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-semibold">
              ✓ RELEASED
            </span>
          </div>

          {/* Donor Info (if from request) */}
          {isFromRequest && (
            <div className="section">
              <h4 className="section-title text-sm font-bold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-3 uppercase tracking-wide">
                Donor Information
              </h4>
              <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
                <span className="label text-zinc-500 dark:text-zinc-400">Donor Name</span>
                <span className="value text-zinc-900 dark:text-white font-semibold">{receiptData.donorName}</span>
              </div>
              <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
                <span className="label text-zinc-500 dark:text-zinc-400">Email</span>
                <span className="value text-zinc-900 dark:text-white">{receiptData.donorEmail || 'N/A'}</span>
              </div>
              <div className="row flex justify-between py-1.5 text-sm">
                <span className="label text-zinc-500 dark:text-zinc-400">Phone</span>
                <span className="value text-zinc-900 dark:text-white">{receiptData.donorPhone || 'N/A'}</span>
              </div>
              <div className="row flex justify-between py-1.5 text-sm">
                <span className="label text-zinc-500 dark:text-zinc-400">Request ID</span>
                <span className="value text-zinc-900 dark:text-white font-mono text-xs">{receiptData.requestId?.slice(0, 12) || 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Blood Details */}
          <div className="section">
            <h4 className="section-title text-sm font-bold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-3 uppercase tracking-wide">
              Blood Details
            </h4>
            <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
              <span className="label text-zinc-500 dark:text-zinc-400">Blood Type</span>
              <span className="blood-type-badge bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-3 py-1 rounded font-bold text-lg">
                {receiptData.bloodType}
              </span>
            </div>
            <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
              <span className="label text-zinc-500 dark:text-zinc-400">Units Released</span>
              <span className="value text-zinc-900 dark:text-white font-bold text-lg">{receiptData.units}</span>
            </div>
            <div className="row flex justify-between py-1.5 text-sm">
              <span className="label text-zinc-500 dark:text-zinc-400">Reason</span>
              <span className="value text-zinc-900 dark:text-white">{receiptData.reason}</span>
            </div>
          </div>

          {/* Patient Information */}
          <div className="section">
            <h4 className="section-title text-sm font-bold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-3 uppercase tracking-wide">
              Patient Information
            </h4>
            <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
              <span className="label text-zinc-500 dark:text-zinc-400">Patient Name</span>
              <span className="value text-zinc-900 dark:text-white font-semibold">{receiptData.patientName}</span>
            </div>
            {receiptData.patientAge && (
              <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
                <span className="label text-zinc-500 dark:text-zinc-400">Age</span>
                <span className="value text-zinc-900 dark:text-white">{receiptData.patientAge}</span>
              </div>
            )}
            {receiptData.patientGender && (
              <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
                <span className="label text-zinc-500 dark:text-zinc-400">Gender</span>
                <span className="value text-zinc-900 dark:text-white">{receiptData.patientGender}</span>
              </div>
            )}
            <div className="row flex justify-between py-1.5 text-sm">
              <span className="label text-zinc-500 dark:text-zinc-400">Hospital Ward</span>
              <span className="value text-zinc-900 dark:text-white">{receiptData.hospitalWard}</span>
            </div>
          </div>

          {/* Medical Staff */}
          <div className="section">
            <h4 className="section-title text-sm font-bold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-3 uppercase tracking-wide">
              Medical Staff
            </h4>
            <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
              <span className="label text-zinc-500 dark:text-zinc-400">Doctor</span>
              <span className="value text-zinc-900 dark:text-white font-semibold">{receiptData.doctorName}</span>
            </div>
            <div className="row flex justify-between py-1.5 text-sm">
              <span className="label text-zinc-500 dark:text-zinc-400">Released By</span>
              <span className="value text-zinc-900 dark:text-white">{receiptData.releasedBy}</span>
            </div>
          </div>

          {/* Hospital Information */}
          <div className="section">
            <h4 className="section-title text-sm font-bold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-3 uppercase tracking-wide">
              Hospital Information
            </h4>
            <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
              <span className="label text-zinc-500 dark:text-zinc-400">Hospital</span>
              <span className="value text-zinc-900 dark:text-white font-semibold">{receiptData.hospitalName}</span>
            </div>
            {receiptData.hospitalAddress && (
              <div className="row flex justify-between py-1.5 text-sm">
                <span className="label text-zinc-500 dark:text-zinc-400">Address</span>
                <span className="value text-zinc-900 dark:text-white text-right">{receiptData.hospitalAddress}</span>
              </div>
            )}
          </div>

          {/* Date & Notes */}
          <div className="section">
            <h4 className="section-title text-sm font-bold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-3 uppercase tracking-wide">
              Release Details
            </h4>
            <div className="row flex justify-between py-1.5 text-sm border-b border-dotted border-zinc-100 dark:border-zinc-800">
              <span className="label text-zinc-500 dark:text-zinc-400">Release Date</span>
              <span className="value text-zinc-900 dark:text-white">{formatDate(receiptData.releaseDate)}</span>
            </div>
            {receiptData.notes && (
              <div className="row flex justify-between py-1.5 text-sm">
                <span className="label text-zinc-500 dark:text-zinc-400">Notes</span>
                <span className="value text-zinc-900 dark:text-white text-right max-w-[60%]">{receiptData.notes}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer mt-6 pt-4 border-t-2 border-dashed border-zinc-200 dark:border-zinc-700 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <FileText className="w-3 h-3" />
              <span>This is a computer-generated receipt. No signature required.</span>
            </div>
            <p className="powered text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              RedPulse Blood Management System • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}