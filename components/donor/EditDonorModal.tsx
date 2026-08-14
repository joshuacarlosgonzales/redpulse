// components/donor/EditDonorModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Droplet,
  Calendar,
  Heart,
  AlertCircle,
  Save,
  UserCircle,
  Home,
  Briefcase,
  Weight,
  Thermometer,
  Activity,
  Droplets,
  Users,
  FileText,
  Pill,
  PhoneCall,
  UserCheck,
  Clock,
  QrCode,
  Plus,
  Minus,
} from "lucide-react";
import { Donor } from "@/types/donor";

interface EditDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  donor: Donor | null;
  onUpdate: (updatedDonor: any) => void;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const statusOptions = ["active", "inactive", "pending"];
const genderOptions = ["Male", "Female", "Other"];
const civilStatusOptions = ["Single", "Married", "Divorced", "Widowed", "Separated"];

export default function EditDonorModal({ isOpen, onClose, donor, onUpdate }: EditDonorModalProps) {
  const [formData, setFormData] = useState<any>({
    id: "",
    name: "",
    email: "",
    phone: "",
    bloodType: "O+",
    status: "active",
    location: "",
    barangay: "",
    municipality: "",
    province: "",
    dateOfBirth: "",
    gender: "Female",
    address: "",
    civilStatus: "Single",
    nationality: "Filipino",
    occupation: "",
    weight: 65,
    bloodPressure: "",
    temperature: 36.5,
    pulseRate: 72,
    hemoglobin: 12.5,
    medicalConditions: "",
    currentMedications: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyContact: "",
    totalDonations: 0,
    lastDonation: "",
    nextEligible: "",
    digitalId: "",
    registered: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "medical" | "emergency">("personal");

  // Populate form when donor data changes
  useEffect(() => {
    if (donor) {
      console.log('📝 EditDonorModal - Donor received:', donor);
      console.log('📝 EditDonorModal - Donor ID:', donor.id);
      console.log('📝 EditDonorModal - Total Donations:', donor.totalDonations);
      
      // Extract location components with fallbacks
      const locationParts = donor.location?.split(',') || [];
      const barangay = donor.barangay || locationParts[0]?.trim() || "";
      const municipality = donor.municipality || locationParts[1]?.trim() || "";
      const province = donor.province || locationParts[2]?.trim() || "";
      
      setFormData({
        id: donor.id || "",
        name: donor.name || "",
        email: donor.email || "",
        phone: donor.phone || "",
        bloodType: donor.bloodType || "O+",
        status: donor.status || "active",
        location: donor.location || "",
        barangay: barangay || "",
        municipality: municipality || "",
        province: province || "",
        dateOfBirth: donor.dateOfBirth || "",
        gender: donor.gender || "Female",
        address: donor.address || donor.location || "",
        civilStatus: donor.civilStatus || "Single",
        nationality: donor.nationality || "Filipino",
        occupation: donor.occupation || "",
        weight: donor.weight ?? 65,
        bloodPressure: donor.bloodPressure || "",
        temperature: donor.temperature ?? 36.5,
        pulseRate: donor.pulseRate ?? 72,
        hemoglobin: donor.hemoglobin ?? 12.5,
        medicalConditions: donor.medicalConditions || "",
        currentMedications: donor.currentMedications || "",
        emergencyName: donor.emergencyName || "",
        emergencyRelationship: donor.emergencyRelationship || "",
        emergencyContact: donor.emergencyContact || "",
        // CRITICAL: Preserve donation stats with fallbacks
        totalDonations: donor.totalDonations ?? 0,
        lastDonation: donor.lastDonation || "",
        nextEligible: donor.nextEligible || "",
        digitalId: donor.digitalId || "",
        registered: donor.registered || "",
      });
      
      setErrors({});
    }
  }, [donor]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.bloodType) {
      newErrors.bloodType = "Please select a blood type";
    }

    if (!formData.barangay) {
      newErrors.barangay = "Barangay is required";
    }

    if (!formData.municipality) {
      newErrors.municipality = "Municipality is required";
    }

    if (!formData.province) {
      newErrors.province = "Province is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTotalDonationsChange = (increment: number) => {
    setFormData((prev: any) => ({
      ...prev,
      totalDonations: Math.max(0, (prev.totalDonations || 0) + increment),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!donor) {
      console.error('❌ EditDonorModal - No donor data available');
      alert('Cannot update donor: No donor data available');
      return;
    }
    
    const donorId = donor.id || formData.id;
    
    if (!donorId) {
      console.error('❌ EditDonorModal - No donor ID found');
      alert('Cannot update donor: Missing donor ID');
      return;
    }
    
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) {
        (element as HTMLElement).focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Create update data - ONLY include fields that exist in your database model
      const updateData = {
        // Basic info
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bloodType: formData.bloodType,
        status: formData.status,
        
        // Address
        barangay: formData.barangay,
        municipality: formData.municipality,
        province: formData.province,
        address: formData.address || `${formData.barangay}, ${formData.municipality}, ${formData.province}`,
        
        // Personal
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        weight: formData.weight,
        
        // Medical
        bloodPressure: formData.bloodPressure,
        temperature: formData.temperature,
        pulseRate: formData.pulseRate,
        hemoglobin: formData.hemoglobin,
        medicalConditions: formData.medicalConditions,
        currentMedications: formData.currentMedications,
        
        // Emergency
        emergencyName: formData.emergencyName,
        emergencyRelationship: formData.emergencyRelationship,
        emergencyContact: formData.emergencyContact,
        
        // CRITICAL: Allow manual editing of total donations
        totalDonations: formData.totalDonations,
        
        // Preserve these fields
        lastDonation: formData.lastDonation,
        nextEligible: formData.nextEligible,
        digitalId: formData.digitalId,
        registered: formData.registered,
      };

      console.log('📝 EditDonorModal - Submitting update:', updateData);
      console.log('📝 EditDonorModal - Total Donations being saved:', updateData.totalDonations);
      
      // Call the update function
      onUpdate(updateData);
      
      // Close the modal
      onClose();
      
      // Show success message
      alert('Donor updated successfully!');
    } catch (error) {
      console.error('Failed to update donor:', error);
      alert('Failed to update donor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !donor) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-xl">
              <User className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Donor</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Update donor information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Donation Stats Summary - NOW EDITABLE */}
        <div className="px-6 py-4 bg-red-50 dark:bg-red-950/10 border-b border-red-100 dark:border-red-900/20">
          <div className="flex flex-wrap items-center gap-6">
            {/* Total Donations - Editable */}
            <div className="flex items-center gap-3">
              <Droplet className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Donations:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTotalDonationsChange(-1)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                  title="Decrease donation count"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  name="totalDonations"
                  value={formData.totalDonations || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setFormData((prev: any) => ({
                      ...prev,
                      totalDonations: Math.max(0, val),
                    }));
                  }}
                  className="w-16 px-2 py-1 text-center text-lg font-bold text-red-600 dark:text-red-400 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-800/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => handleTotalDonationsChange(1)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                  title="Increase donation count"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Last Donation:</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">{formData.lastDonation || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Next Eligible:</span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{formData.nextEligible || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Digital ID:</span>
              <span className="text-sm font-mono font-medium text-zinc-900 dark:text-white">{formData.digitalId || 'N/A'}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
            💡 Use the + and - buttons or type directly to adjust total donations
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition whitespace-nowrap ${
                activeTab === "personal"
                  ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <UserCircle className="w-4 h-4 inline mr-2" />
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab("medical")}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition whitespace-nowrap ${
                activeTab === "medical"
                  ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              Medical Information
            </button>
            <button
              onClick={() => setActiveTab("emergency")}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition whitespace-nowrap ${
                activeTab === "emergency"
                  ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Emergency Contact
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: "calc(95vh - 260px)" }}>
          <div className="p-6 space-y-6">
            {/* Personal Information Tab */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                        errors.name ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"
                      } rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                        errors.email ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"
                      } rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                      placeholder="donor@email.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-zinc-400" />
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                        errors.phone ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"
                      } rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                      placeholder="09XX XXX XXXX"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Blood Type */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-zinc-400" />
                      Blood Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="bloodType"
                      value={formData.bloodType || "O+"}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                        errors.bloodType ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"
                      } rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                    >
                      {bloodTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.bloodType && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.bloodType}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-zinc-400" />
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status || "active"}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender || "Female"}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      {genderOptions.map((gender) => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Civil Status */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-zinc-400" />
                      Civil Status
                    </label>
                    <select
                      name="civilStatus"
                      value={formData.civilStatus || "Single"}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      {civilStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nationality */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      Nationality
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="Filipino"
                    />
                  </div>

                  {/* Occupation */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-zinc-400" />
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="e.g., Teacher, Engineer, Student"
                    />
                  </div>

                  {/* Address Section */}
                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Home className="w-4 h-4 text-zinc-400" />
                      Address Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Barangay <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="barangay"
                          value={formData.barangay || ""}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                            errors.barangay ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"
                          } rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                          placeholder="Barangay"
                        />
                        {errors.barangay && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.barangay}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Municipality <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="municipality"
                          value={formData.municipality || ""}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                            errors.municipality ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"
                          } rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                          placeholder="Municipality"
                        />
                        {errors.municipality && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.municipality}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Province <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="province"
                          value={formData.province || ""}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border ${
                            errors.province ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"
                          } rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                          placeholder="Province"
                        />
                        {errors.province && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.province}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Full Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="Complete address (optional)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Medical Information Tab */}
            {activeTab === "medical" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Weight className="w-4 h-4 text-zinc-400" />
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight ?? 65}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="65"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-zinc-400" />
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      name="bloodPressure"
                      value={formData.bloodPressure || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="120/80"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-zinc-400" />
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      name="temperature"
                      value={formData.temperature ?? 36.5}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="36.5"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-zinc-400" />
                      Pulse Rate (bpm)
                    </label>
                    <input
                      type="number"
                      name="pulseRate"
                      value={formData.pulseRate ?? 72}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="72"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-zinc-400" />
                      Hemoglobin (g/dL)
                    </label>
                    <input
                      type="number"
                      name="hemoglobin"
                      value={formData.hemoglobin ?? 12.5}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="12.5"
                      step="0.1"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      Medical Conditions
                    </label>
                    <textarea
                      name="medicalConditions"
                      value={formData.medicalConditions || ""}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-y"
                      placeholder="List any existing medical conditions"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-zinc-400" />
                      Current Medications
                    </label>
                    <textarea
                      name="currentMedications"
                      value={formData.currentMedications || ""}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-y"
                      placeholder="List any current medications"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact Tab */}
            {activeTab === "emergency" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergencyName"
                      value={formData.emergencyName || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="Full name of emergency contact"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyRelationship"
                      value={formData.emergencyRelationship || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-zinc-400" />
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="09XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200/60 dark:border-zinc-800/60 p-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition border border-zinc-200 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-lg shadow-red-200 dark:shadow-red-900/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}