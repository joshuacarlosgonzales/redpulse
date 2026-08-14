// app/donors/blood-drives/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Search,
  MapPin,
  Heart,
  Clock,
  Users,
  Check,
  X,
  Loader2,
  AlertCircle,
  CalendarCheck,
  MapPin as MapPinIcon,
  Clock as ClockIcon,
  Heart as HeartIcon,
  Filter,
  ChevronDown,
  Plus,
  Trash2,
  XCircle,
  ArrowLeft,
  Eye,
  Phone,
  Mail,
  Info
} from "lucide-react";

interface BloodDrive {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  bloodTypesNeeded: string[];
  targetDonors: number;
  registeredDonors: number;
  completedDonations: number;
  organizer: string;
  contactNumber: string;
  contactEmail: string;
  isRegistered?: boolean;
}

export default function BloodDrivesPage() {
  const [loading, setLoading] = useState(true);
  const [bloodDrives, setBloodDrives] = useState<BloodDrive[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [registering, setRegistering] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [selectedDriveTitle, setSelectedDriveTitle] = useState<string>("");
  const [selectedDrive, setSelectedDrive] = useState<BloodDrive | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBloodDrives();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchBloodDrives = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/user/blood-drives?status=all&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBloodDrives(data.data || []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      } else {
        // Mock data for testing if API fails
        setBloodDrives([
          {
            id: '1',
            title: 'City Hospital Blood Drive',
            description: 'Annual blood donation drive at City Hospital',
            location: 'City Hospital, Main Lobby',
            address: '123 Medical Drive, City',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            startTime: '08:00',
            endTime: '17:00',
            status: 'upcoming',
            bloodTypesNeeded: ['A+', 'O+', 'B+'],
            targetDonors: 50,
            registeredDonors: 32,
            completedDonations: 0,
            organizer: 'City Hospital Blood Bank',
            contactNumber: '(02) 8123-4567',
            contactEmail: 'bloodbank@cityhospital.com',
            isRegistered: false
          },
          {
            id: '2',
            title: 'Community Center Blood Drive',
            description: 'Community-wide blood donation event',
            location: 'Barangay Community Center',
            address: '456 Peace Street, Barangay',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            startTime: '09:00',
            endTime: '18:00',
            status: 'upcoming',
            bloodTypesNeeded: ['O-', 'AB+', 'A-'],
            targetDonors: 30,
            registeredDonors: 18,
            completedDonations: 0,
            organizer: 'Red Cross',
            contactNumber: '(02) 8765-4321',
            contactEmail: 'community@redcross.org',
            isRegistered: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching blood drives:', error);
      showToast('error', 'Failed to load blood drives');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (driveId: string) => {
    setRegistering(driveId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/blood-drives/${driveId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBloodDrives(prev => 
          prev.map(d => 
            d.id === driveId 
              ? { ...d, registeredDonors: d.registeredDonors + 1, isRegistered: true }
              : d
          )
        );
        showToast('success', '✅ Successfully registered for the blood drive! 🎉');
      } else {
        showToast('error', data.error || '❌ Failed to register. Please try again.');
      }
    } catch (error) {
      console.error('Error registering:', error);
      showToast('error', '❌ Failed to register. Please try again.');
    } finally {
      setRegistering(null);
    }
  };

  const handleCancelRegistration = async (driveId: string) => {
    setCancelling(driveId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/blood-drives/${driveId}/cancel-registration`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBloodDrives(prev => 
          prev.map(d => 
            d.id === driveId 
              ? { ...d, registeredDonors: Math.max(0, d.registeredDonors - 1), isRegistered: false }
              : d
          )
        );
        showToast('success', '✅ Successfully cancelled your registration.');
        setShowCancelModal(false);
        setSelectedDriveId(null);
        setSelectedDriveTitle('');
      } else {
        showToast('error', data.error || '❌ Failed to cancel registration. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      showToast('error', '❌ Failed to cancel registration. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const openCancelModal = (driveId: string, driveTitle: string) => {
    setSelectedDriveId(driveId);
    setSelectedDriveTitle(driveTitle);
    setShowCancelModal(true);
  };

  const openDetailsModal = (drive: BloodDrive) => {
    setSelectedDrive(drive);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
      ongoing: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
      completed: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
      cancelled: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
    };
    return colors[status as keyof typeof colors] || colors.upcoming;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      upcoming: <ClockIcon className="w-3 h-3" />,
      ongoing: <HeartIcon className="w-3 h-3" />,
      completed: <Check className="w-3 h-3" />,
      cancelled: <X className="w-3 h-3" />
    };
    return icons[status as keyof typeof icons];
  };

  const filteredDrives = bloodDrives.filter(drive => {
    const matchesSearch = drive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          drive.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || drive.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Separate registered and unregistered drives
  const registeredDrives = filteredDrives.filter(d => d.isRegistered);
  const unregisteredDrives = filteredDrives.filter(d => !d.isRegistered);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">Loading blood drives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md ${
          toast.type === 'success' 
            ? 'bg-green-50 dark:bg-green-950/90 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <Check className="h-5 w-5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Cancel Registration Confirmation Modal */}
      {showCancelModal && selectedDriveId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Cancel Registration</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Are you sure you want to cancel your registration?
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You are about to cancel your registration for <strong className="text-zinc-900 dark:text-white">{selectedDriveTitle}</strong>.
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This action cannot be undone. You will need to register again if you change your mind.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedDriveId(null);
                    setSelectedDriveTitle('');
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Keep Registration
                </button>
                <button
                  onClick={() => handleCancelRegistration(selectedDriveId)}
                  disabled={cancelling === selectedDriveId}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelling === selectedDriveId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Cancel Registration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Blood Drive Details</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    View full information about this blood drive
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDrive(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedDrive.title}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDrive.status)}`}>
                    {getStatusIcon(selectedDrive.status)}
                    {selectedDrive.status.charAt(0).toUpperCase() + selectedDrive.status.slice(1)}
                  </span>
                </div>
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  {new Date(selectedDrive.date).toLocaleDateString()}
                </span>
              </div>

              {/* Description */}
              {selectedDrive.description && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedDrive.description}</p>
                </div>
              )}

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-red-500" />
                    Location
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedDrive.location}</p>
                  {selectedDrive.address && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedDrive.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-blue-500" />
                    Date & Time
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {new Date(selectedDrive.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedDrive.startTime} - {selectedDrive.endTime}
                  </p>
                </div>
              </div>

              {/* Blood Types Needed */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <HeartIcon className="w-4 h-4 text-red-500" />
                  Blood Types Needed
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDrive.bloodTypesNeeded.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Target Donors</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{selectedDrive.targetDonors}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Registered</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedDrive.registeredDonors}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Donated</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedDrive.completedDonations}</p>
                </div>
              </div>

              {/* Contact Information */}
              {(selectedDrive.organizer || selectedDrive.contactNumber || selectedDrive.contactEmail) && (
                <div className="space-y-2 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    Contact Information
                  </h4>
                  {selectedDrive.organizer && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium">Organizer:</span> {selectedDrive.organizer}
                    </p>
                  )}
                  {selectedDrive.contactNumber && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-zinc-400" />
                      {selectedDrive.contactNumber}
                    </p>
                  )}
                  {selectedDrive.contactEmail && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      {selectedDrive.contactEmail}
                    </p>
                  )}
                </div>
              )}

              {/* Registration Status */}
              <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedDrive.isRegistered ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {selectedDrive.isRegistered ? 'You are registered for this drive ✅' : 'You are not registered for this drive'}
                    </p>
                  </div>
                  {!selectedDrive.isRegistered && selectedDrive.status === 'upcoming' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleRegister(selectedDrive.id);
                      }}
                      disabled={registering === selectedDrive.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                    >
                      {registering === selectedDrive.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Register Now'
                      )}
                    </button>
                  )}
                  {selectedDrive.isRegistered && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openCancelModal(selectedDrive.id, selectedDrive.title);
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 rounded-lg transition"
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-red-500" />
              Blood Drives
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Find and register for upcoming blood drives
            </p>
          </div>
          <div className="flex gap-2">
            {registeredDrives.length > 0 && (
              <Link
                href="/donors/blood-drives/registered"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                My Registrations ({registeredDrives.length})
              </Link>
            )}
            <button
              onClick={fetchBloodDrives}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search blood drives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            <option value="all">📋 All Status</option>
            <option value="upcoming">⏳ Upcoming</option>
            <option value="ongoing">🟢 Ongoing</option>
            <option value="completed">✅ Completed</option>
          </select>
        </div>

        {/* Registered Drives Section */}
        {registeredDrives.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Your Registered Drives ({registeredDrives.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registeredDrives.map((drive) => (
                <div
                  key={drive.id}
                  className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(drive.status)}`}>
                        {getStatusIcon(drive.status)}
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {new Date(drive.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-1">
                      {drive.title}
                    </h3>

                    <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      <MapPinIcon className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{drive.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {drive.bloodTypesNeeded.slice(0, 3).map((type) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium rounded"
                        >
                          {type}
                        </span>
                      ))}
                      {drive.bloodTypesNeeded.length > 3 && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded">
                          +{drive.bloodTypesNeeded.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60">
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Target</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{drive.targetDonors}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Registered</p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{drive.registeredDonors}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openDetailsModal(drive)}
                        className="flex-1 py-2 rounded-lg transition font-medium text-sm bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => openCancelModal(drive.id, drive.title)}
                        disabled={cancelling === drive.id}
                        className="px-4 py-2 rounded-lg transition font-medium text-sm bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 flex items-center gap-1 disabled:opacity-50"
                      >
                        {cancelling === drive.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Drives Section */}
        {unregisteredDrives.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Available Drives ({unregisteredDrives.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unregisteredDrives.map((drive) => (
                <div
                  key={drive.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(drive.status)}`}>
                        {getStatusIcon(drive.status)}
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {new Date(drive.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-1">
                      {drive.title}
                    </h3>

                    <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      <MapPinIcon className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{drive.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {drive.bloodTypesNeeded.slice(0, 3).map((type) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium rounded"
                        >
                          {type}
                        </span>
                      ))}
                      {drive.bloodTypesNeeded.length > 3 && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded">
                          +{drive.bloodTypesNeeded.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Target</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{drive.targetDonors}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Registered</p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{drive.registeredDonors}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openDetailsModal(drive)}
                        className="flex-1 py-2 rounded-lg transition font-medium text-sm bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleRegister(drive.id)}
                        disabled={registering === drive.id}
                        className="flex-1 py-2 rounded-lg transition font-medium text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center justify-center"
                      >
                        {registering === drive.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Register'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredDrives.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No Blood Drives Available</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Check back later for upcoming blood drives in your area.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}