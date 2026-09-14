// components/releaseblood/ReleaseBloodModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Droplet,
  User,
  Building,
  Stethoscope,
  CalendarDays,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Activity,
  FileText,
  Mail,
  Phone,
  Calendar,
  Printer,
  Share2,
  Download
} from 'lucide-react';

interface InventoryItem {
  id: string;
  bloodType: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  expiryDate: string;
  status: "available" | "low" | "critical" | "expired";
  location: string;
}

export interface ReleaseData {
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
  donorBloodType?: string;
}

interface ReleaseBloodModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  onRelease: (data: ReleaseData) => Promise<void>;
  isReleasing?: boolean;
  releaseData?: ReleaseData;
  hospitalName?: string;
  hospitalAddress?: string;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ReleaseBloodModal({
  isOpen,
  onClose,
  inventoryItems,
  onRelease,
  isReleasing = false,
  releaseData: initialReleaseData,
  hospitalName = "Gov. Valeriano M. Gatuslao Memorial Hospital",
  hospitalAddress = "Himamaylan City, Negros Occidental"
}: ReleaseBloodModalProps) {
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [releaseResult, setReleaseResult] = useState<ReleaseData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<ReleaseData>({
    bloodType: '',
    units: 1,
    patientName: '',
    patientAge: undefined,
    patientGender: '',
    hospitalWard: '',
    doctorName: '',
    reason: '',
    releaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    requestId: '',
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    donorBloodType: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialReleaseData) {
      setFormData({
        ...formData,
        ...initialReleaseData,
        releaseDate: initialReleaseData.releaseDate || new Date().toISOString().split('T')[0],
      });
    }
  }, [initialReleaseData]);

  const availableBloodTypes = inventoryItems
    .filter(item => item.status !== 'expired' && item.quantity > 0)
    .map(item => item.bloodType)
    .filter((value, index, self) => self.indexOf(value) === index);

  const getAvailableUnits = (bloodType: string) => {
    const item = inventoryItems.find(
      i => i.bloodType === bloodType && i.status !== 'expired'
    );
    return item ? item.quantity : 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bloodType) {
      newErrors.bloodType = 'Blood type is required';
    }
    if (!formData.units || formData.units < 1) {
      newErrors.units = 'Units must be at least 1';
    }
    if (formData.units > getAvailableUnits(formData.bloodType)) {
      newErrors.units = `Only ${getAvailableUnits(formData.bloodType)} units available`;
    }
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }
    if (!formData.hospitalWard.trim()) {
      newErrors.hospitalWard = 'Hospital ward is required';
    }
    if (!formData.doctorName.trim()) {
      newErrors.doctorName = 'Doctor name is required';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for release is required';
    }
    if (!formData.releaseDate) {
      newErrors.releaseDate = 'Release date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const result = await onRelease(formData);
      setReleaseResult(formData);
      setShowReceipt(true);
      // Reset form on success
      setFormData({
        bloodType: '',
        units: 1,
        patientName: '',
        patientAge: undefined,
        patientGender: '',
        hospitalWard: '',
        doctorName: '',
        reason: '',
        releaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        requestId: '',
        donorName: '',
        donorEmail: '',
        donorPhone: '',
        donorBloodType: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error releasing blood:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const content = receiptRef.current.innerHTML;
        printWindow.document.write(`
          <html>
            <head>
              <title>Blood Release Receipt</title>
              <style>
                @media print {
                  body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: white; }
                  .receipt { max-width: 400px; margin: 0 auto; padding: 20px; }
                  .text-center { text-align: center; }
                  .border-bottom { border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
                  .receipt-item { display: flex; justify-content: space-between; padding: 4px 0; }
                  .receipt-item .label { font-weight: bold; color: #555; }
                  .receipt-item .value { font-weight: bold; }
                  .header { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
                  .sub-header { font-size: 12px; color: #666; margin-bottom: 16px; }
                  .receipt-footer { margin-top: 20px; padding-top: 10px; border-top: 2px dashed #ccc; text-align: center; font-size: 11px; color: #888; }
                }
                @media screen {
                  body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: #f5f5f5; }
                  .receipt { max-width: 400px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                  .text-center { text-align: center; }
                  .border-bottom { border-bottom: 2px dashed #e5e7eb; padding-bottom: 10px; margin-bottom: 10px; }
                  .receipt-item { display: flex; justify-content: space-between; padding: 4px 0; }
                  .receipt-item .label { font-weight: bold; color: #6b7280; }
                  .receipt-item .value { font-weight: bold; color: #1f2937; }
                  .header { font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #dc2626; }
                  .sub-header { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
                  .receipt-footer { margin-top: 20px; padding-top: 10px; border-top: 2px dashed #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
                }
              </style>
            </head>
            <body>
              ${content}
              <script>
                window.onload = function() { window.print(); window.close(); }
              <\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        bloodType: '',
        units: 1,
        patientName: '',
        patientAge: undefined,
        patientGender: '',
        hospitalWard: '',
        doctorName: '',
        reason: '',
        releaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        requestId: '',
        donorName: '',
        donorEmail: '',
        donorPhone: '',
        donorBloodType: '',
      });
      setErrors({});
      setShowReceipt(false);
      setReleaseResult(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isFromRequest = !!initialReleaseData?.donorName;
  const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;
  const formattedDate = new Date(formData.releaseDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Receipt View
  if (showReceipt && releaseResult) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Release Successful!
            </h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          <div className="p-6">
            {/* Receipt Content */}
            <div ref={receiptRef} className="receipt">
              <div className="text-center border-bottom">
                <div className="header">🩸 BLOOD RELEASE RECEIPT</div>
                <div className="sub-header">{hospitalName}</div>
                <div className="sub-header" style={{ fontSize: '10px' }}>{hospitalAddress}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Receipt #{receiptNumber}
                </div>
              </div>

              <div className="receipt-item">
                <span className="label">Blood Type</span>
                <span className="value" style={{ color: '#dc2626' }}>{releaseResult.bloodType}</span>
              </div>
              <div className="receipt-item">
                <span className="label">Units</span>
                <span className="value">{releaseResult.units}</span>
              </div>
              <div className="receipt-item">
                <span className="label">Patient Name</span>
                <span className="value">{releaseResult.patientName}</span>
              </div>
              {releaseResult.patientAge && (
                <div className="receipt-item">
                  <span className="label">Patient Age</span>
                  <span className="value">{releaseResult.patientAge}</span>
                </div>
              )}
              {releaseResult.patientGender && (
                <div className="receipt-item">
                  <span className="label">Gender</span>
                  <span className="value">{releaseResult.patientGender}</span>
                </div>
              )}
              <div className="receipt-item">
                <span className="label">Hospital Ward</span>
                <span className="value">{releaseResult.hospitalWard}</span>
              </div>
              <div className="receipt-item">
                <span className="label">Doctor</span>
                <span className="value">{releaseResult.doctorName}</span>
              </div>
              <div className="receipt-item">
                <span className="label">Reason</span>
                <span className="value">{releaseResult.reason}</span>
              </div>
              <div className="receipt-item">
                <span className="label">Release Date</span>
                <span className="value">{formattedDate}</span>
              </div>

              {isFromRequest && (
                <>
                  <div className="border-bottom" style={{ marginTop: '8px' }}></div>
                  <div style={{ fontSize: '12px', color: '#2563eb', textAlign: 'center', marginBottom: '8px' }}>
                    📋 Donor Request Fulfilled
                  </div>
                  <div className="receipt-item">
                    <span className="label">Donor</span>
                    <span className="value">{releaseResult.donorName}</span>
                  </div>
                  <div className="receipt-item">
                    <span className="label">Donor Blood Type</span>
                    <span className="value">{releaseResult.donorBloodType || releaseResult.bloodType}</span>
                  </div>
                  <div className="receipt-item">
                    <span className="label">Request ID</span>
                    <span className="value" style={{ fontSize: '11px' }}>{releaseResult.requestId?.slice(0, 12) || 'N/A'}</span>
                  </div>
                </>
              )}

              {releaseResult.notes && (
                <div className="receipt-item" style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '8px', marginTop: '8px' }}>
                  <span className="label">Notes</span>
                  <span className="value" style={{ fontSize: '11px', color: '#6b7280' }}>{releaseResult.notes}</span>
                </div>
              )}

              <div className="receipt-footer">
                <div>✓ This is a valid blood release receipt</div>
                <div style={{ marginTop: '4px' }}>Generated: {new Date().toLocaleString()}</div>
                <div style={{ marginTop: '4px', fontSize: '10px' }}>Thank you for saving lives! ❤️</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <button
                onClick={handlePrintReceipt}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Form View
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-red-500" />
              {isFromRequest ? 'Fulfill Donor Request' : 'Release Blood'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {isFromRequest 
                ? `Releasing blood for donor request from ${initialReleaseData.donorName}`
                : 'Release blood units from inventory for patient use'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Donor Information (if from request) */}
          {isFromRequest && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-500" />
                Donor Request Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Donor Name
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{initialReleaseData.donorName}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Donor Email
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{initialReleaseData.donorEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Donor Phone
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{initialReleaseData.donorPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-red-500" />
                    Donor Blood Type
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{initialReleaseData.donorBloodType || initialReleaseData.bloodType || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Request ID
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white font-mono">{initialReleaseData.requestId?.slice(0, 12) || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  This release will fulfill the donor's blood request
                </p>
              </div>
            </div>
          )}

          {/* Blood Type & Units */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Blood Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bloodType}
                onChange={(e) => {
                  setFormData({ ...formData, bloodType: e.target.value, units: 1 });
                  setErrors({ ...errors, bloodType: '', units: '' });
                }}
                className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${
                  errors.bloodType ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                disabled={!!initialReleaseData?.bloodType}
              >
                <option value="">Select blood type</option>
                {bloodTypes.map(type => (
                  <option 
                    key={type} 
                    value={type}
                    disabled={!availableBloodTypes.includes(type)}
                  >
                    {type} {availableBloodTypes.includes(type) ? `(${getAvailableUnits(type)} units)` : '(Unavailable)'}
                  </option>
                ))}
              </select>
              {errors.bloodType && (
                <p className="mt-1 text-xs text-red-500">{errors.bloodType}</p>
              )}
              {formData.bloodType && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Available: {getAvailableUnits(formData.bloodType)} units
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Units <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.units}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, units: val });
                  setErrors({ ...errors, units: '' });
                }}
                min="1"
                max={getAvailableUnits(formData.bloodType)}
                className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${
                  errors.units ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
              />
              {errors.units && (
                <p className="mt-1 text-xs text-red-500">{errors.units}</p>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/30">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-red-500" />
              Patient Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => {
                    setFormData({ ...formData, patientName: e.target.value });
                    setErrors({ ...errors, patientName: '' });
                  }}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border ${
                    errors.patientName ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                  } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  placeholder="Enter patient name"
                />
                {errors.patientName && (
                  <p className="mt-1 text-xs text-red-500">{errors.patientName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.patientAge || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFormData({ ...formData, patientAge: isNaN(val) ? undefined : val });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="Age"
                  min="0"
                  max="150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Gender
                </label>
                <select
                  value={formData.patientGender}
                  onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Hospital Ward <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hospitalWard}
                  onChange={(e) => {
                    setFormData({ ...formData, hospitalWard: e.target.value });
                    setErrors({ ...errors, hospitalWard: '' });
                  }}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border ${
                    errors.hospitalWard ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                  } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  placeholder="e.g., ICU, Ward 3"
                />
                {errors.hospitalWard && (
                  <p className="mt-1 text-xs text-red-500">{errors.hospitalWard}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <Stethoscope className="w-4 h-4 inline mr-1.5" />
                Doctor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.doctorName}
                onChange={(e) => {
                  setFormData({ ...formData, doctorName: e.target.value });
                  setErrors({ ...errors, doctorName: '' });
                }}
                className={`w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border ${
                  errors.doctorName ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                placeholder="Enter doctor's name"
              />
              {errors.doctorName && (
                <p className="mt-1 text-xs text-red-500">{errors.doctorName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <CalendarDays className="w-4 h-4 inline mr-1.5" />
                Release Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => {
                  setFormData({ ...formData, releaseDate: e.target.value });
                  setErrors({ ...errors, releaseDate: '' });
                }}
                className={`w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border ${
                  errors.releaseDate ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
              />
              {errors.releaseDate && (
                <p className="mt-1 text-xs text-red-500">{errors.releaseDate}</p>
              )}
            </div>
          </div>

          {/* Reason & Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <Activity className="w-4 h-4 inline mr-1.5" />
              Reason for Release <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.reason}
              onChange={(e) => {
                setFormData({ ...formData, reason: e.target.value });
                setErrors({ ...errors, reason: '' });
              }}
              className={`w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border ${
                errors.reason ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
              } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
            >
              <option value="">Select reason</option>
              <option value="Emergency Surgery">Emergency Surgery</option>
              <option value="Trauma">Trauma</option>
              <option value="Surgery">Scheduled Surgery</option>
              <option value="Transfusion">Blood Transfusion</option>
              <option value="Anemia">Anemia Treatment</option>
              <option value="Maternal">Maternal Care</option>
              <option value="Other">Other</option>
            </select>
            {errors.reason && (
              <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              rows={2}
              placeholder="Additional notes about the release..."
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                This will deduct <strong>{formData.units || 0}</strong> unit(s) of <strong>{formData.bloodType || 'selected blood type'}</strong> from inventory. 
                {formData.bloodType && ` Available: ${getAvailableUnits(formData.bloodType)} units.`}
                This action cannot be undone.
                {isFromRequest && (
                  <span className="block mt-1 text-blue-600 dark:text-blue-400">
                    This will fulfill the request from donor {initialReleaseData.donorName}.
                  </span>
                )}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isReleasing}
              className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200 dark:shadow-red-900/30"
            >
              {(loading || isReleasing) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isFromRequest ? 'Fulfilling Request...' : 'Releasing...'}
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  {isFromRequest ? 'Fulfill Request & Release' : 'Release Blood'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}