// components/modals/HospitalRegisterModal.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Droplet, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Hospital,
  Building,
  MapPin,
  Phone as PhoneIcon,
  FileText,
  Building2,
  Users,
  Globe,
  AlertTriangle,
  X
} from "lucide-react";

interface HospitalRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HospitalRegisterModal({ isOpen, onClose }: HospitalRegisterModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bloodType: "",
    password: "",
    confirmPassword: "",
    hospitalName: "",
    hospitalLicense: "",
    hospitalAddress: "",
    hospitalPhone: "",
    hospitalType: "",
    hospitalCapacity: "",
    hospitalEmail: "",
    hospitalWebsite: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");

  const router = useRouter();

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const hospitalTypes = [
    "General Hospital",
    "Specialty Hospital",
    "Teaching Hospital",
    "Community Hospital",
    "Private Hospital",
    "Public Hospital",
    "Military Hospital",
    "Other"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (formData.phone.length < 10) {
      setError("Please enter a valid phone number");
      setIsLoading(false);
      return;
    }

    if (!formData.hospitalName) {
      setError("Hospital name is required");
      setIsLoading(false);
      return;
    }
    if (!formData.hospitalLicense) {
      setError("Hospital license is required");
      setIsLoading(false);
      return;
    }
    if (!formData.hospitalAddress) {
      setError("Hospital address is required");
      setIsLoading(false);
      return;
    }
    if (!formData.hospitalPhone) {
      setError("Hospital phone is required");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        role: 'hospital',
        hospitalCapacity: formData.hospitalCapacity ? parseInt(formData.hospitalCapacity) : 0,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setRegistrationMessage("Your hospital account has been created and is pending admin approval.");
        localStorage.setItem('user', JSON.stringify(data.data));
        
        setTimeout(() => {
          onClose();
          router.push('/hospital/dashboard');
        }, 2000);
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#090a0a] shadow-2xl max-h-[90vh]"
          >
            <div className="p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Register Hospital</h2>
                  <p className="text-sm text-white/40 mt-1">Register your hospital to manage blood donations</p>
                </div>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="p-2 rounded-lg hover:bg-white/5 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {success ? (
                <div className="text-center p-6 bg-green-950/30 rounded-xl border border-green-800">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-400">Registration Successful!</h3>
                  <p className="text-sm text-green-300 mt-2">{registrationMessage}</p>
                  <div className="mt-4 p-3 bg-yellow-950/30 rounded-lg border border-yellow-800">
                    <p className="text-sm text-yellow-400 flex items-center gap-2 justify-center">
                      <AlertTriangle className="h-4 w-4" />
                      Pending Approval - You will be notified once verified
                    </p>
                  </div>
                  <p className="text-xs text-green-300 mt-2">Redirecting to dashboard...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Admin Information */}
                  <div className="space-y-4 border border-zinc-700 rounded-lg p-4 bg-zinc-800/30">
                    <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Hospital Administrator <span className="text-red-500 text-xs">*Required</span>
                    </h3>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="fullName"
                          type="text"
                          placeholder="Dr. John Doe"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="email"
                          type="email"
                          placeholder="admin@hospital.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="phone"
                          type="tel"
                          placeholder="09123456789"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Blood Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <select
                          id="bloodType"
                          value={formData.bloodType}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white appearance-none"
                        >
                          <option value="">Select Blood Type</option>
                          {bloodTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Hospital Details */}
                  <div className="space-y-4 border border-zinc-700 rounded-lg p-4 bg-blue-950/20">
                    <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-400" />
                      Hospital Details <span className="text-red-500 text-xs">*Required</span>
                    </h3>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Hospital Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="hospitalName"
                          type="text"
                          placeholder="City General Hospital"
                          value={formData.hospitalName}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Hospital License <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="hospitalLicense"
                          type="text"
                          placeholder="DOH-HOSP-2024-001"
                          value={formData.hospitalLicense}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Hospital Type
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <select
                          id="hospitalType"
                          value={formData.hospitalType}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white appearance-none"
                        >
                          <option value="">Select Hospital Type</option>
                          {hospitalTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Hospital Capacity (Beds)
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="hospitalCapacity"
                          type="number"
                          placeholder="150"
                          value={formData.hospitalCapacity}
                          onChange={handleChange}
                          disabled={isLoading}
                          min="1"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Hospital Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="hospitalAddress"
                          type="text"
                          placeholder="123 Medical Center Dr., City"
                          value={formData.hospitalAddress}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Hospital Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="hospitalPhone"
                          type="tel"
                          placeholder="(02) 8123-4567"
                          value={formData.hospitalPhone}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Hospital Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="hospitalEmail"
                          type="email"
                          placeholder="info@cityhospital.com"
                          value={formData.hospitalEmail}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-300">
                        Hospital Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          id="hospitalWebsite"
                          type="url"
                          placeholder="https://www.cityhospital.com"
                          value={formData.hospitalWebsite}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 chars)"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="w-full pl-10 pr-12 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="w-full pl-10 pr-12 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 text-white placeholder:text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-800">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Registration Failed</div>
                        <div>{error}</div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registering Hospital...
                      </>
                    ) : (
                      <>
                        <Hospital className="h-4 w-4" />
                        Register Hospital
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center text-sm text-zinc-400">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={onClose}
                  className="text-blue-500 hover:text-blue-400 font-semibold transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}