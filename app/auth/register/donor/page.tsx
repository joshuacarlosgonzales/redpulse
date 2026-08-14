// app/auth/register/donor/page.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Heart, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Droplet, 
  ArrowLeft, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Weight,
  UserCircle,
  Home,
  Clipboard,
  Pill,
  MapPin,
  Building2
} from "lucide-react";

export default function DonorRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bloodType: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
    weight: "",
    address: "",
    barangay: "",
    municipality: "",
    province: "",
    emergencyContact: "",
    medicalConditions: "",
    currentMedications: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");

  const router = useRouter();

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genders = ["Male", "Female", "Other"];
  const provinces = [
    "Negros Occidental",
    "Negros Oriental",
    "Cebu",
    "Iloilo",
    "Bacolod",
    "Manila",
    "Quezon City",
    "Davao",
    "Cagayan de Oro",
    "Zamboanga",
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // ⭐ IMPORTANT: Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    // Validate phone number
    if (formData.phone.length < 10) {
      setError("Please enter a valid phone number");
      setIsLoading(false);
      return;
    }

    // Validate donor fields
    if (!formData.dateOfBirth) {
      setError("Date of birth is required");
      setIsLoading(false);
      return;
    }
    if (!formData.gender) {
      setError("Gender is required");
      setIsLoading(false);
      return;
    }
    if (!formData.weight) {
      setError("Weight is required");
      setIsLoading(false);
      return;
    }

    try {
      // ⭐ Make sure password is included and has correct length
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        bloodType: formData.bloodType,
        password: formData.password, // ⭐ This must be included
        role: 'donor',
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        weight: parseFloat(formData.weight),
        address: formData.address,
        barangay: formData.barangay,
        municipality: formData.municipality,
        province: formData.province,
        emergencyContact: formData.emergencyContact,
        medicalConditions: formData.medicalConditions,
        currentMedications: formData.currentMedications,
      };

      console.log('📤 Sending payload:', {
        ...payload,
        password: '***' // Hide password in logs
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (data.success) {
        setSuccess(true);
        setRegistrationMessage("Account created successfully! Your donor profile is pending approval.");
        localStorage.setItem('user', JSON.stringify(data.data));
        
        setTimeout(() => {
          router.push('/user/dashboard');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-black/50">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </Link>
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-8 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30">
                  <Heart className="h-8 w-8 text-white" fill="currentColor" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Become a Donor</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Register as a blood donor and save lives
              </p>
              <div className="mt-2 flex justify-center gap-4">
                <Link href="/auth/register/donor" className="text-sm px-4 py-1.5 bg-red-600 text-white rounded-full font-medium">
                  Donor
                </Link>
                <Link href="/auth/register/hospital" className="text-sm px-4 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 transition">
                  Hospital
                </Link>
              </div>
            </div>

            {success ? (
              <div className="text-center p-6 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Registration Successful!</h3>
                <p className="text-sm text-green-600 dark:text-green-300 mt-2">{registrationMessage}</p>
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2 justify-center">
                    <AlertCircle className="h-4 w-4" />
                    Pending Approval - You will be notified once verified
                  </p>
                </div>
                <p className="text-xs text-green-600 dark:text-green-300 mt-2">Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Phone Number <span className="text-red-500">*</span>
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
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white appearance-none"
                    >
                      <option value="">Select Blood Type</option>
                      {bloodTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Donor Specific Information */}
                <div className="space-y-4 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-800/30">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Donor Information <span className="text-red-500 text-xs">*Required</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white appearance-none"
                      >
                        <option value="">Select Gender</option>
                        {genders.map((gender) => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        id="weight"
                        type="number"
                        placeholder="65"
                        value={formData.weight}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        min="40"
                        max="300"
                        step="0.1"
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Rest of the form... */}

                {/* Password Fields */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                      className="w-full pl-10 pr-12 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                      className="w-full pl-10 pr-12 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition shadow-lg shadow-red-200 dark:shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" fill="currentColor" />
                      Register as Donor
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-red-600 hover:text-red-700 font-semibold transition-colors">
                Sign In
              </Link>
            </div>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500">
                  Join the RedPulse Community
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}