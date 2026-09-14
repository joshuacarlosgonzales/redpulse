// app/donors/blood-drives/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
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
  MapPin as MapPinIcon,
  Clock as ClockIcon,
  Heart as HeartIcon,
  Trash2,
  XCircle,
  ArrowLeft,
  Eye,
  Phone,
  Mail,
  Info,
  ChevronRight,
  Bookmark
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
  const [filter, setFilter] = useState("available");
  const [registering, setRegistering] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [selectedDriveTitle, setSelectedDriveTitle] = useState<string>("");
  const [selectedDrive, setSelectedDrive] = useState<BloodDrive | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      router.push('/auth/login');
      return;
    }
    setIsAuthenticated(true);
    fetchBloodDrives();
  }, []);

  const fetchBloodDrives = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/user/blood-drives?status=all&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to load blood drives';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText || 'Failed to load blood drives'}`;
        }
        console.error('API Error:', errorMessage);
        showToast('error', errorMessage);
        setBloodDrives([]);
        return;
      }

      const data = await response.json();
      
      let drives = [];
      if (data.success && data.data) {
        drives = data.data;
      } else if (data.data) {
        drives = data.data;
      } else if (Array.isArray(data)) {
        drives = data;
      } else {
        drives = [];
      }

      const formattedDrives: BloodDrive[] = drives.map((drive: any) => ({
        id: drive.id || drive._id,
        title: drive.title || 'Untitled Blood Drive',
        description: drive.description || '',
        location: drive.location || 'Location not specified',
        address: drive.address || '',
        date: drive.date || new Date().toISOString(),
        startTime: drive.startTime || '09:00',
        endTime: drive.endTime || '17:00',
        status: drive.status || 'upcoming',
        bloodTypesNeeded: drive.bloodTypesNeeded || [],
        targetDonors: drive.targetDonors || 0,
        registeredDonors: drive.registeredDonors || 0,
        completedDonations: drive.completedDonations || 0,
        organizer: drive.organizer || '',
        contactNumber: drive.contactNumber || '',
        contactEmail: drive.contactEmail || '',
        isRegistered: drive.isRegistered || false,
      }));

      // Sort: Registered drives first, then available drives
      const sortedDrives = formattedDrives.sort((a: BloodDrive, b: BloodDrive) => {
        // Registered drives first
        if (a.isRegistered && !b.isRegistered) return -1;
        if (!a.isRegistered && b.isRegistered) return 1;
        // Then sort by date (upcoming first)
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      setBloodDrives(sortedDrives);
      
      if (sortedDrives.length === 0) {
        showToast('info', 'No blood drives available at the moment.');
      }
    } catch (error) {
      console.error('Error fetching blood drives:', error);
      showToast('error', 'Failed to load blood drives. Please refresh the page.');
      setBloodDrives([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleRegister = async (driveId: string) => {
    setRegistering(driveId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/user/blood-drives/${driveId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        await fetchBloodDrives();
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
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/user/blood-drives/${driveId}/cancel-registration`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        await fetchBloodDrives();
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
      upcoming: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',
      ongoing: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      completed: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
      cancelled: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
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

  // Count total registered drives (all statuses)
  const totalRegisteredCount = bloodDrives.filter((d: BloodDrive) => d.isRegistered).length;

  const filteredDrives = bloodDrives.filter((drive: BloodDrive) => {
    const matchesSearch = drive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          drive.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'available') {
      // Only show upcoming and ongoing drives
      matchesFilter = drive.status === 'upcoming' || drive.status === 'ongoing';
    } else if (filter === 'all') {
      matchesFilter = true;
    } else {
      matchesFilter = drive.status === filter;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Separate drives by registration and status
  const myRegisteredDrives = filteredDrives.filter((d: BloodDrive) => d.isRegistered);
  const availableDrives = filteredDrives.filter((d: BloodDrive) => 
    (d.status === 'upcoming' || d.status === 'ongoing') && !d.isRegistered
  );
  const completedDrives = filteredDrives.filter((d: BloodDrive) => 
    (d.status === 'completed' || d.status === 'cancelled') && !d.isRegistered
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-2 border-zinc-100 dark:border-zinc-800 border-t-red-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500 tracking-wide">Loading blood drives…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Please log in to view blood drives.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 p-3.5 rounded-xl shadow-lg shadow-zinc-900/10 border max-w-sm ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : toast.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            : 'bg-sky-50 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <Info className="h-4 w-4 flex-shrink-0" />
            )}
            <p className="text-xs font-semibold">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Cancel Registration Confirmation Modal */}
      {showCancelModal && selectedDriveId && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-xl shadow-zinc-900/10 border border-zinc-200 dark:border-zinc-800">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Cancel registration</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    This will free up your spot for someone else
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You're about to cancel your registration for <strong className="text-zinc-900 dark:text-white font-semibold">{selectedDriveTitle}</strong>. This can't be undone — you'll need to register again if you change your mind.
              </p>
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedDriveId(null);
                    setSelectedDriveTitle('');
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-colors"
                >
                  Keep registration
                </button>
                <button
                  onClick={() => handleCancelRegistration(selectedDriveId)}
                  disabled={cancelling === selectedDriveId}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelling === selectedDriveId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel registration
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
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl shadow-zinc-900/10 border border-zinc-200 dark:border-zinc-800">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Blood drive details</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Full information about this drive
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDrive(null);
                }}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{selectedDrive.title}</h2>
                  <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getStatusColor(selectedDrive.status)}`}>
                    {getStatusIcon(selectedDrive.status)}
                    {selectedDrive.status.charAt(0).toUpperCase() + selectedDrive.status.slice(1)}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                  {new Date(selectedDrive.date).toLocaleDateString()}
                </span>
              </div>

              {selectedDrive.description && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedDrive.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 text-red-500" />
                    Location
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedDrive.location}</p>
                  {selectedDrive.address && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedDrive.address}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 text-sky-500" />
                    Date &amp; time
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {new Date(selectedDrive.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedDrive.startTime} – {selectedDrive.endTime}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                  <HeartIcon className="w-3.5 h-3.5 text-red-500" />
                  Blood types needed
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDrive.bloodTypesNeeded.map((type: string) => (
                    <span
                      key={type}
                      className="px-2.5 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-900"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="text-center p-3">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Target</p>
                  <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">{selectedDrive.targetDonors}</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-[10px] font-semibold text-teal-500 uppercase tracking-wide">Registered</p>
                  <p className="text-base font-bold text-teal-600 dark:text-teal-400 mt-0.5">{selectedDrive.registeredDonors}</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">Donated</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedDrive.completedDonations}</p>
                </div>
              </div>

              {(selectedDrive.organizer || selectedDrive.contactNumber || selectedDrive.contactEmail) && (
                <div className="space-y-1.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-violet-500" />
                    Contact
                  </h4>
                  {selectedDrive.organizer && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Organizer:</span> {selectedDrive.organizer}
                    </p>
                  )}
                  {selectedDrive.contactNumber && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      {selectedDrive.contactNumber}
                    </p>
                  )}
                  {selectedDrive.contactEmail && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      {selectedDrive.contactEmail}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedDrive.isRegistered ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {selectedDrive.isRegistered ? "You're registered for this drive" : "You're not registered for this drive"}
                    </p>
                  </div>
                  {!selectedDrive.isRegistered && (selectedDrive.status === 'upcoming' || selectedDrive.status === 'ongoing') && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleRegister(selectedDrive.id);
                      }}
                      disabled={registering === selectedDrive.id}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {registering === selectedDrive.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Register now'
                      )}
                    </button>
                  )}
                  {selectedDrive.isRegistered && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openCancelModal(selectedDrive.id, selectedDrive.title);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                    >
                      Cancel registration
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4.5 w-4.5 h-[18px] w-[18px] text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Blood Drives
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {myRegisteredDrives.length > 0 
                  ? `You're registered for ${myRegisteredDrives.length} active drive${myRegisteredDrives.length > 1 ? 's' : ''}`
                  : 'Find and register for upcoming blood drives'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {totalRegisteredCount > 0 && (
              <Link
                href="/donors/blood-drives/registered"
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors text-xs sm:text-sm font-semibold flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5" />
                My Registrations ({totalRegisteredCount})
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={fetchBloodDrives}
              className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search blood drives…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors"
          >
            <option value="available">📋 Available (Upcoming &amp; Ongoing)</option>
            <option value="all">📋 All Drives</option>
            <option value="upcoming">⏳ Upcoming</option>
            <option value="ongoing">🟢 Ongoing</option>
            <option value="completed">✅ Completed</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
        </div>

        {/* My Registered Drives Section - Always shown first */}
        {myRegisteredDrives.length > 0 && (
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-teal-500 rounded-full" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-teal-500" />
                My Registered Drives ({myRegisteredDrives.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myRegisteredDrives.map((drive: BloodDrive) => (
                <div
                  key={drive.id}
                  className="bg-teal-50/50 dark:bg-teal-950/10 rounded-xl border border-teal-200 dark:border-teal-900 hover:border-teal-300 dark:hover:border-teal-800 transition-colors overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusColor(drive.status)}`}>
                        {getStatusIcon(drive.status)}
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {new Date(drive.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 line-clamp-1">
                      {drive.title}
                    </h3>

                    <div className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                      <MapPinIcon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{drive.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {drive.bloodTypesNeeded.slice(0, 3).map((type: string) => (
                        <span
                          key={type}
                          className="px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded"
                        >
                          {type}
                        </span>
                      ))}
                      {drive.bloodTypesNeeded.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold rounded">
                          +{drive.bloodTypesNeeded.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-teal-200/60 dark:border-teal-900/60">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                        <Heart className="w-3 h-3 fill-teal-500 text-teal-500" />
                        Registered
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={() => openDetailsModal(drive)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950/40 rounded-md transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => openCancelModal(drive.id, drive.title)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Drives Section - Only show available drives */}
        {(filter === 'available' || filter === 'all') && availableDrives.length > 0 && (
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Available Drives ({availableDrives.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableDrives.map((drive: BloodDrive) => (
                <div
                  key={drive.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusColor(drive.status)}`}>
                        {getStatusIcon(drive.status)}
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {new Date(drive.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 line-clamp-1">
                      {drive.title}
                    </h3>

                    <div className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                      <MapPinIcon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{drive.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {drive.bloodTypesNeeded.slice(0, 3).map((type: string) => (
                        <span
                          key={type}
                          className="px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded"
                        >
                          {type}
                        </span>
                      ))}
                      {drive.bloodTypesNeeded.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold rounded">
                          +{drive.bloodTypesNeeded.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                      <div className="text-center py-1.5">
                        <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Target</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{drive.targetDonors}</p>
                      </div>
                      <div className="text-center py-1.5">
                        <p className="text-[9px] font-semibold text-teal-500 uppercase tracking-wide">Registered</p>
                        <p className="text-xs font-bold text-teal-600 dark:text-teal-400">{drive.registeredDonors}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openDetailsModal(drive)}
                        className="flex-1 py-1.5 rounded-lg transition-colors font-semibold text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => handleRegister(drive.id)}
                        disabled={registering === drive.id}
                        className={`flex-1 py-1.5 rounded-lg transition-colors font-semibold text-xs flex items-center justify-center ${
                          drive.status === 'upcoming' || drive.status === 'ongoing'
                            ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                        }`}
                      >
                        {registering === drive.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          drive.status === 'upcoming' || drive.status === 'ongoing' ? 'Register' : 'Closed'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Drives Section - Only shown when filter is 'all' or 'completed' */}
        {(filter === 'all' || filter === 'completed') && completedDrives.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-zinc-400 rounded-full" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Past Drives ({completedDrives.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedDrives.map((drive: BloodDrive) => (
                <div
                  key={drive.id}
                  className="bg-zinc-50/60 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors overflow-hidden opacity-80"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusColor(drive.status)}`}>
                        {getStatusIcon(drive.status)}
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {new Date(drive.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 line-clamp-1">
                      {drive.title}
                    </h3>

                    <div className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                      <MapPinIcon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{drive.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {drive.bloodTypesNeeded.slice(0, 3).map((type: string) => (
                        <span
                          key={type}
                          className="px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded"
                        >
                          {type}
                        </span>
                      ))}
                      {drive.bloodTypesNeeded.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold rounded">
                          +{drive.bloodTypesNeeded.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                      <div className="text-center py-1.5">
                        <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Target</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{drive.targetDonors}</p>
                      </div>
                      <div className="text-center py-1.5">
                        <p className="text-[9px] font-semibold text-teal-500 uppercase tracking-wide">Registered</p>
                        <p className="text-xs font-bold text-teal-600 dark:text-teal-400">{drive.registeredDonors}</p>
                      </div>
                      <div className="text-center py-1.5">
                        <p className="text-[9px] font-semibold text-emerald-500 uppercase tracking-wide">Donated</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{drive.completedDonations}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() => openDetailsModal(drive)}
                        className="w-full py-1.5 rounded-lg transition-colors font-semibold text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredDrives.length === 0 && (
          <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
            <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-red-300 dark:text-red-800" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No blood drives found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery 
                ? 'Try adjusting your search or filter criteria.'
                : filter === 'available'
                ? 'There are no upcoming or ongoing blood drives right now — check back later.'
                : 'No blood drives match your current filter.'}
            </p>
            {totalRegisteredCount > 0 && (
              <Link
                href="/donors/blood-drives/registered"
                className="inline-block mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors text-xs font-semibold"
              >
                View My Registrations ({totalRegisteredCount})
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}