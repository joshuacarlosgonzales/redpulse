// components/donor/AddDonorModal.tsx
"use client";

import { useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  Heart,
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  Upload,
  UserPlus,
  Home,
  Building,
  Globe,
  Weight,
  Thermometer,
  Stethoscope,
  Pill,
  Users,
  UserCheck,
  CalendarDays,
  Clock,
  FileText,
  Shield,
} from "lucide-react";
import { donorService } from "@/services/donorService";

interface AddDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (donor: any) => void;
}

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  mobileNumber: string;
  email: string;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  bloodType: string;
  lastDonationDate: string;
  nextEligibleDate: string;
  donorStatus: string;
  weight: string;
  bloodPressure: string;
  temperature: string;
  pulseRate: string;
  hemoglobin: string;
  medicalConditions: string;
  currentMedications: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyContact: string;
  certifyInfo: boolean;
  agreeStorage: boolean;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["Male", "Female", "Other"];
const donorStatuses = ["Active", "Pending", "Inactive"];
const provinces = ["Negros Occidental", "Iloilo", "Cebu", "Bacolod", "Other"];
const municipalities = ["Binalbagan", "Hinigaran", "La Carlota City", "Bacolod City", "Other"];
const barangays = ["Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5", "Other"];
const relationships = ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"];

export default function AddDonorModal({ isOpen, onClose, onAdd }: AddDonorModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    age: 0,
    mobileNumber: "",
    email: "",
    address: "",
    barangay: "",
    municipality: "",
    province: "",
    bloodType: "",
    lastDonationDate: "",
    nextEligibleDate: "",
    donorStatus: "Pending",
    weight: "",
    bloodPressure: "",
    temperature: "",
    pulseRate: "",
    hemoglobin: "",
    medicalConditions: "",
    currentMedications: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyContact: "",
    certifyInfo: false,
    agreeStorage: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const totalSteps = 4;

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === "dateOfBirth") {
      const age = calculateAge(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        age: age,
      }));
    } else if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.mobileNumber) newErrors.mobileNumber = "Mobile number is required";
      if (!formData.email) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid";
      }
      if (!formData.barangay) newErrors.barangay = "Barangay is required";
      if (!formData.municipality) newErrors.municipality = "Municipality is required";
      if (!formData.province) newErrors.province = "Province is required";
    } else if (step === 2) {
      if (!formData.bloodType) newErrors.bloodType = "Blood type is required";
      if (!formData.donorStatus) newErrors.donorStatus = "Donor status is required";
    } else if (step === 3) {
      if (!formData.weight) newErrors.weight = "Weight is required";
      if (!formData.bloodPressure) newErrors.bloodPressure = "Blood pressure is required";
      if (!formData.temperature) newErrors.temperature = "Temperature is required";
      if (!formData.pulseRate) newErrors.pulseRate = "Pulse rate is required";
      if (!formData.hemoglobin) newErrors.hemoglobin = "Hemoglobin is required";
    } else if (step === 4) {
      if (!formData.emergencyName) newErrors.emergencyName = "Emergency contact name is required";
      if (!formData.emergencyRelationship) newErrors.emergencyRelationship = "Relationship is required";
      if (!formData.emergencyContact) newErrors.emergencyContact = "Emergency contact number is required";
      if (!formData.certifyInfo) newErrors.certifyInfo = "You must certify the information is true";
      if (!formData.agreeStorage) newErrors.agreeStorage = "You must agree to the storage terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare data for API - format it properly
      const donorData = {
        firstName: formData.firstName || '',
        middleName: formData.middleName || '',
        lastName: formData.lastName || '',
        gender: formData.gender || '',
        dateOfBirth: formData.dateOfBirth || '',
        email: formData.email || '',
        mobileNumber: formData.mobileNumber || '',
        address: formData.address || '',
        barangay: formData.barangay || '',
        municipality: formData.municipality || '',
        province: formData.province || '',
        bloodType: formData.bloodType || '',
        donorStatus: formData.donorStatus || 'Pending',
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        bloodPressure: formData.bloodPressure || '',
        temperature: formData.temperature ? parseFloat(formData.temperature) : 0,
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : 0,
        hemoglobin: formData.hemoglobin ? parseFloat(formData.hemoglobin) : 0,
        medicalConditions: formData.medicalConditions || '',
        currentMedications: formData.currentMedications || '',
        emergencyName: formData.emergencyName || '',
        emergencyRelationship: formData.emergencyRelationship || '',
        emergencyContact: formData.emergencyContact || '',
        totalDonations: 0,
        lastDonationDate: formData.lastDonationDate || '',
        nextEligibleDate: formData.nextEligibleDate || '',
      };

      console.log('📝 AddDonorModal - Sending data:', donorData);

      // Call API to create donor
      const createdDonor = await donorService.createDonor(donorData);

      console.log('✅ Donor created successfully:', createdDonor);

      // Call the onAdd callback with the created donor
      if (onAdd) {
        onAdd(createdDonor);
      }

      // Close modal and reset form
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('❌ Failed to add donor:', error);
      setSubmitError(error.message || 'Failed to add donor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      dateOfBirth: "",
      age: 0,
      mobileNumber: "",
      email: "",
      address: "",
      barangay: "",
      municipality: "",
      province: "",
      bloodType: "",
      lastDonationDate: "",
      nextEligibleDate: "",
      donorStatus: "Pending",
      weight: "",
      bloodPressure: "",
      temperature: "",
      pulseRate: "",
      hemoglobin: "",
      medicalConditions: "",
      currentMedications: "",
      emergencyName: "",
      emergencyRelationship: "",
      emergencyContact: "",
      certifyInfo: false,
      agreeStorage: false,
    });
    setCurrentStep(1);
    setErrors({});
    setSubmitError(null);
  };

  const getStepTitle = (step: number) => {
    const titles = {
      1: "Personal Information",
      2: "Blood Information",
      3: "Health Screening",
      4: "Emergency & Agreement",
    };
    return titles[step as keyof typeof titles] || "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 z-10 p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-red-500" />
              Add New Donor
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to close? All progress will be lost.")) {
                onClose();
                resetForm();
              }
            }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {submitError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
          </div>
        )}

        <div className="px-6 pt-6">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;
              const Icon = [User, Droplet, Heart, Shield][index];

              return (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-red-600 text-white ring-4 ring-red-200 dark:ring-red-900/30"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-[10px] mt-1 text-zinc-500 dark:text-zinc-400 text-center hidden sm:block">
                      Step {stepNumber}
                    </span>
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                        stepNumber <= currentStep
                          ? "bg-red-600"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <User className="w-5 h-5" />
                <h4 className="text-lg font-semibold">Personal Information</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.firstName ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="Enter middle name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.lastName ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.gender ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  >
                    <option value="">Select gender</option>
                    {genders.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    readOnly
                    className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white cursor-not-allowed"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.mobileNumber ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="+63 912 345 6789"
                  />
                  {errors.mobileNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.mobileNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.email ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="donor@email.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Barangay <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.barangay ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  >
                    <option value="">Select barangay</option>
                    {barangays.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {errors.barangay && (
                    <p className="text-xs text-red-500 mt-1">{errors.barangay}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.municipality ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  >
                    <option value="">Select municipality</option>
                    {municipalities.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {errors.municipality && (
                    <p className="text-xs text-red-500 mt-1">{errors.municipality}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.province ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  >
                    <option value="">Select province</option>
                    {provinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.province && (
                    <p className="text-xs text-red-500 mt-1">{errors.province}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Droplet className="w-5 h-5" />
                <h4 className="text-lg font-semibold">Blood Information</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Blood Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.bloodType ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  >
                    <option value="">Select blood type</option>
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.bloodType && (
                    <p className="text-xs text-red-500 mt-1">{errors.bloodType}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Donor Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="donorStatus"
                    value={formData.donorStatus}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.donorStatus ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  >
                    {donorStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.donorStatus && (
                    <p className="text-xs text-red-500 mt-1">{errors.donorStatus}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Last Donation Date
                  </label>
                  <input
                    type="date"
                    name="lastDonationDate"
                    value={formData.lastDonationDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Next Eligible Date
                  </label>
                  <input
                    type="date"
                    name="nextEligibleDate"
                    value={formData.nextEligibleDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Heart className="w-5 h-5" />
                <h4 className="text-lg font-semibold">Health Screening</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.weight ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="70"
                    step="0.1"
                  />
                  {errors.weight && (
                    <p className="text-xs text-red-500 mt-1">{errors.weight}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Blood Pressure <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bloodPressure"
                    value={formData.bloodPressure}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.bloodPressure ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="120/80"
                  />
                  {errors.bloodPressure && (
                    <p className="text-xs text-red-500 mt-1">{errors.bloodPressure}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Temperature (°C) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.temperature ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="36.5"
                    step="0.1"
                  />
                  {errors.temperature && (
                    <p className="text-xs text-red-500 mt-1">{errors.temperature}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Pulse Rate (bpm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="pulseRate"
                    value={formData.pulseRate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.pulseRate ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="72"
                  />
                  {errors.pulseRate && (
                    <p className="text-xs text-red-500 mt-1">{errors.pulseRate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Hemoglobin (g/dL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="hemoglobin"
                    value={formData.hemoglobin}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.hemoglobin ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="14.5"
                    step="0.1"
                  />
                  {errors.hemoglobin && (
                    <p className="text-xs text-red-500 mt-1">{errors.hemoglobin}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="List any medical conditions (if none, write 'None')"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Current Medications
                </label>
                <textarea
                  name="currentMedications"
                  value={formData.currentMedications}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="List current medications (if none, write 'None')"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Shield className="w-5 h-5" />
                <h4 className="text-lg font-semibold">Emergency Contact & Agreement</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Emergency Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.emergencyName ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="Full name"
                  />
                  {errors.emergencyName && (
                    <p className="text-xs text-red-500 mt-1">{errors.emergencyName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.emergencyRelationship ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  >
                    <option value="">Select relationship</option>
                    {relationships.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {errors.emergencyRelationship && (
                    <p className="text-xs text-red-500 mt-1">{errors.emergencyRelationship}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Emergency Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                      errors.emergencyContact ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'
                    } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    placeholder="+63 912 345 6789"
                  />
                  {errors.emergencyContact && (
                    <p className="text-xs text-red-500 mt-1">{errors.emergencyContact}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="certifyInfo"
                    checked={formData.certifyInfo}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-zinc-300 dark:border-zinc-600 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      I certify that the information provided is true and accurate.
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Providing false information may result in disqualification from donation.
                    </p>
                    {errors.certifyInfo && (
                      <p className="text-xs text-red-500 mt-1">{errors.certifyInfo}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="agreeStorage"
                    checked={formData.agreeStorage}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-zinc-300 dark:border-zinc-600 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      I agree to the storage of my information for blood donation purposes.
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Your data will be securely stored and only used for blood donation-related activities.
                    </p>
                    {errors.agreeStorage && (
                      <p className="text-xs text-red-500 mt-1">{errors.agreeStorage}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200/60 dark:border-zinc-800/60 p-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 text-sm font-medium rounded-xl transition ${
              currentStep === 1
                ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-lg shadow-red-200 dark:shadow-red-900/30 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : currentStep === totalSteps ? (
              <>
                <UserPlus className="w-4 h-4" />
                Add Donor
              </>
            ) : (
              <>
                Next Step
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}