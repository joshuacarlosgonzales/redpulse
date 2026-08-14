// components/DonorRequest/BloodRequestModal.tsx
'use client';

import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronDown,
  CheckCircle,
  Building,
  Loader2,
  AlertCircle
} from "lucide-react";

interface HospitalOption {
  id: string;
  name: string;
  address: string;
  phone: string;
  license: string;
}

interface BloodRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  bloodTypes: string[];
  urgencyLevels: { value: string; label: string; color: string }[];
  requestMethods: { value: string; label: string; description: string }[];
  departments: string[];
  profileName?: string;
}

export default function BloodRequestModal({
  isOpen,
  onClose,
  onSubmit,
  bloodTypes,
  urgencyLevels,
  requestMethods,
  departments,
  profileName
}: BloodRequestModalProps) {
  const [requestForm, setRequestForm] = useState({
    bloodType: '',
    quantity: '1',
    urgency: 'normal',
    requiredDate: '',
    notes: '',
    requestMethod: 'routine',
    department: '',
    doctorName: '',
    contactNumber: '',
    hospitalId: '',
    patientName: '',
    patientAge: ''
  });
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<HospitalOption | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch hospitals when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsInitialLoad(true);
      fetchHospitals('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      setSelectedHospital(null);
      setHospitalSearch('');
      setShowHospitalDropdown(false);
      setHospitals([]);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHospitalDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchHospitals = async (search: string) => {
    try {
      setLoadingHospitals(true);
      setFetchError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setFetchError('Please login to view hospitals');
        setLoadingHospitals(false);
        return;
      }

      // FIX: Changed from /api/hospitals to /api/hospital
      const response = await fetch(`/api/hospital?search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setFetchError(errorData.error || `Failed to fetch hospitals (${response.status})`);
        setHospitals([]);
        setLoadingHospitals(false);
        return;
      }

      const data = await response.json();
      console.log('🏥 Hospitals fetched:', data);
      
      if (data.data && data.data.length > 0) {
        setHospitals(data.data);
        if (isInitialLoad && data.data.length === 1) {
          selectHospital(data.data[0]);
        }
        setIsInitialLoad(false);
      } else {
        setHospitals([]);
        if (isInitialLoad) {
          setFetchError('No active hospitals found. Please contact support.');
        }
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setFetchError('Failed to load hospitals. Please try again.');
      setHospitals([]);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleHospitalSearch = (value: string) => {
    setHospitalSearch(value);
    if (value.length > 0) {
      fetchHospitals(value);
      setShowHospitalDropdown(true);
    } else {
      fetchHospitals('');
      setShowHospitalDropdown(true);
    }
  };

  const selectHospital = (hospital: HospitalOption) => {
    console.log('🏥 Selected hospital:', hospital);
    setSelectedHospital(hospital);
    setRequestForm(prev => ({ ...prev, hospitalId: hospital.id }));
    setHospitalSearch(hospital.name);
    setShowHospitalDropdown(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Form state before submit:', {
      bloodType: requestForm.bloodType,
      requiredDate: requestForm.requiredDate,
      hospitalId: requestForm.hospitalId,
      selectedHospital: selectedHospital,
      hospitalSearch: hospitalSearch
    });
    
    if (!requestForm.bloodType) {
      alert('Please select a Blood Type');
      return;
    }
    
    if (!requestForm.requiredDate) {
      alert('Please select a Required Date');
      return;
    }
    
    if (!selectedHospital || !requestForm.hospitalId) {
      alert('Please select a Hospital from the list');
      return;
    }

    setSubmitting(true);

    const submitData = {
      bloodType: requestForm.bloodType,
      quantity: parseInt(requestForm.quantity) || 1,
      urgency: requestForm.urgency || 'normal',
      requiredDate: requestForm.requiredDate,
      notes: requestForm.notes || '',
      requestMethod: requestForm.requestMethod || 'routine',
      department: requestForm.department || '',
      doctorName: requestForm.doctorName || '',
      contactNumber: requestForm.contactNumber || '',
      hospitalId: requestForm.hospitalId,
      patientName: requestForm.patientName || '',
      patientAge: requestForm.patientAge || ''
    };
    
    console.log('📤 Submitting data:', submitData);
    
    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('❌ Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const RequestMethodModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Request Method</h3>
            <button
              onClick={() => setShowMethodModal(false)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="h-5 w-5 text-zinc-500" />
            </button>
          </div>

          <div className="space-y-4">
            {requestMethods.map((method) => (
              <div
                key={method.value}
                onClick={() => {
                  setRequestForm({ ...requestForm, requestMethod: method.value });
                  setShowMethodModal(false);
                }}
                className={`p-4 border rounded-xl cursor-pointer transition hover:border-red-400 ${
                  requestForm.requestMethod === method.value
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {requestForm.requestMethod === method.value ? (
                      <CheckCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{method.label}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {method.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowMethodModal(false)}
            className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Select Method
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Request Blood</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Submit a blood request for a patient</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hospital Selection - Dropdown */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Hospital <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={selectedHospital ? selectedHospital.name : hospitalSearch}
                      onChange={(e) => {
                        if (selectedHospital) {
                          setSelectedHospital(null);
                          setRequestForm(prev => ({ ...prev, hospitalId: '' }));
                        }
                        handleHospitalSearch(e.target.value);
                      }}
                      onClick={() => {
                        if (!selectedHospital) {
                          setShowHospitalDropdown(true);
                          if (hospitals.length === 0 && !loadingHospitals) {
                            fetchHospitals('');
                          }
                        }
                      }}
                      onFocus={() => {
                        if (!selectedHospital) {
                          setShowHospitalDropdown(true);
                          if (hospitals.length === 0 && !loadingHospitals) {
                            fetchHospitals('');
                          }
                        }
                      }}
                      placeholder="Search for a hospital..."
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                      required
                    />
                    {loadingHospitals ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" />
                    ) : (
                      <ChevronDown 
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 cursor-pointer hover:text-zinc-600"
                        onClick={() => {
                          if (!selectedHospital) {
                            setShowHospitalDropdown(!showHospitalDropdown);
                            if (hospitals.length === 0 && !loadingHospitals) {
                              fetchHospitals('');
                            }
                          }
                        }}
                      />
                    )}
                  </div>

                  {/* Dropdown */}
                  {showHospitalDropdown && !selectedHospital && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingHospitals ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-red-500" />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Loading hospitals...</p>
                        </div>
                      ) : fetchError ? (
                        <div className="p-4 text-center">
                          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p className="text-sm text-red-500 dark:text-red-400">{fetchError}</p>
                          <button
                            type="button"
                            onClick={() => fetchHospitals(hospitalSearch)}
                            className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Retry
                          </button>
                        </div>
                      ) : hospitals.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">No hospitals found</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                            {hospitalSearch ? 'Try a different search term' : 'No active hospitals available'}
                          </p>
                        </div>
                      ) : (
                        hospitals.map((hospital) => (
                          <div
                            key={hospital.id}
                            onClick={() => selectHospital(hospital)}
                            className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                          >
                            <div className="flex items-start gap-2">
                              <Building className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                  {hospital.name}
                                </p>
                                {hospital.address && (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                    {hospital.address}
                                  </p>
                                )}
                                {hospital.phone && (
                                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                    📞 {hospital.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedHospital && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✅ Selected: {selectedHospital.name}
                  </p>
                )}
                {!selectedHospital && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    Click the search box to see available hospitals
                  </p>
                )}
              </div>

              {/* Request Method */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Request Method <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMethodModal(true)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {requestForm.requestMethod ? (
                      requestMethods.find(m => m.value === requestForm.requestMethod)?.label || 'Select method'
                    ) : (
                      'Select request method'
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>
                {requestForm.requestMethod && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {requestMethods.find(m => m.value === requestForm.requestMethod)?.description}
                  </p>
                )}
              </div>

              {/* Blood Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Blood Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={requestForm.bloodType}
                  onChange={(e) => setRequestForm({ ...requestForm, bloodType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition appearance-none"
                  required
                >
                  <option value="">Select Blood Type</option>
                  {bloodTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Quantity (bags)
                  </label>
                  <select
                    value={requestForm.quantity}
                    onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Urgency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition appearance-none"
                    required
                  >
                    {urgencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Required Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={requestForm.requiredDate}
                  onChange={(e) => setRequestForm({ ...requestForm, requiredDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  required
                />
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={requestForm.patientName}
                  onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                  placeholder="Patient's full name"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>

              {/* Patient Age */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Patient Age
                </label>
                <input
                  type="number"
                  value={requestForm.patientAge}
                  onChange={(e) => setRequestForm({ ...requestForm, patientAge: e.target.value })}
                  placeholder="e.g., 45"
                  min="0"
                  max="150"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Department
                </label>
                <select
                  value={requestForm.department}
                  onChange={(e) => setRequestForm({ ...requestForm, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition appearance-none"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={requestForm.doctorName}
                    onChange={(e) => setRequestForm({ ...requestForm, doctorName: e.target.value })}
                    placeholder="Dr. Juan Dela Cruz"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={requestForm.contactNumber}
                    onChange={(e) => setRequestForm({ ...requestForm, contactNumber: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  placeholder="Any additional information about the request..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Request Method Modal */}
      {showMethodModal && <RequestMethodModal />}
    </>
  );
}