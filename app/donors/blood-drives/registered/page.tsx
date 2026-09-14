// app/donors/blood-drives/registered/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Heart,
  MapPin,
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
  CalendarDays,
  History,
  RotateCw
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

export default function RegisteredBloodDrivesPage() {
  const [loading, setLoading] = useState(true);
  const [bloodDrives, setBloodDrives] = useState<BloodDrive[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed'>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [selectedDriveTitle, setSelectedDriveTitle] = useState<string>("");
  const [selectedDrive, setSelectedDrive] = useState<BloodDrive | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
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
    fetchRegisteredDrives();
  }, []);

  const fetchRegisteredDrives = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/user/blood-drives/registered', {
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
        let errorMessage = 'Failed to load registered drives';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText || 'Failed to load registered drives'}`;
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

      const formattedDrives: BloodDrive[] = drives.map((drive: any) => {
        // Calculate actual status based on date
        let actualStatus = drive.status || 'upcoming';
        const driveDate = new Date(drive.date);
        const today = new Date();
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const driveDateOnly = new Date(driveDate.getFullYear(), driveDate.getMonth(), driveDate.getDate());

        // If date has passed, mark as completed
        if (driveDateOnly < todayDateOnly && (drive.status === 'upcoming' || drive.status === 'ongoing')) {
          actualStatus = 'completed';
        }

        // If date is today, mark as ongoing (if it was upcoming)
        if (driveDateOnly.getTime() === todayDateOnly.getTime() && drive.status === 'upcoming') {
          actualStatus = 'ongoing';
        }

        return {
          id: drive.id || drive._id,
          title: drive.title || 'Untitled Blood Drive',
          description: drive.description || '',
          location: drive.location || 'Location not specified',
          address: drive.address || '',
          date: drive.date || new Date().toISOString(),
          startTime: drive.startTime || '09:00',
          endTime: drive.endTime || '17:00',
          status: actualStatus,
          bloodTypesNeeded: drive.bloodTypesNeeded || [],
          targetDonors: drive.targetDonors || 0,
          registeredDonors: drive.registeredDonors || 0,
          completedDonations: drive.completedDonations || 0,
          organizer: drive.organizer || '',
          contactNumber: drive.contactNumber || '',
          contactEmail: drive.contactEmail || '',
          isRegistered: true,
        };
      });

      // Sort by date (upcoming first)
      const sortedDrives = formattedDrives.sort((a: BloodDrive, b: BloodDrive) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setBloodDrives(sortedDrives);

      if (sortedDrives.length === 0) {
        showToast('info', 'You are not registered for any blood drives yet.');
      }
    } catch (error) {
      console.error('Error fetching registered drives:', error);
      showToast('error', 'Failed to load registered drives. Please refresh the page.');
      setBloodDrives([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

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
        // Refresh the list after cancellation
        await fetchRegisteredDrives();
        showToast('success', 'Successfully cancelled your registration.');
        setShowCancelModal(false);
        setSelectedDriveId(null);
        setSelectedDriveTitle('');
      } else {
        showToast('error', data.error || 'Failed to cancel registration. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      showToast('error', 'Failed to cancel registration. Please try again.');
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
      upcoming: 'bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400',
      ongoing: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
      completed: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400',
      cancelled: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
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

  // Filter drives based on selected filter
  const filteredDrives = bloodDrives.filter((drive: BloodDrive) => {
    if (filter === 'completed') {
      return drive.status === 'completed';
    }
    // 'all' - shows only active drives (upcoming and ongoing)
    return drive.status === 'upcoming' || drive.status === 'ongoing';
  });

  // Count drives by status
  const activeCount = bloodDrives.filter((d: BloodDrive) => d.status === 'upcoming' || d.status === 'ongoing').length;
  const completedCount = bloodDrives.filter((d: BloodDrive) => d.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full border-[3px] border-rose-100 dark:border-rose-950/40" />
            <div className="absolute inset-0 h-12 w-12 border-[3px] border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading your registrations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 left-4 sm:left-auto z-50 p-4 rounded-xl shadow-lg border max-w-md backdrop-blur-sm ${
          toast.type === 'success'
            ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : toast.type === 'error'
            ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-sky-50/95 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
        }`}>
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <Check className="h-5 w-5 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Info className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Cancel Registration Confirmation Modal */}
      {showCancelModal && selectedDriveId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
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
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Keep Registration
                </button>
                <button
                  onClick={() => handleCancelRegistration(selectedDriveId)}
                  disabled={cancelling === selectedDriveId}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">Blood Drive Details</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    View full information about this blood drive
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDrive(null);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white truncate">{selectedDrive.title}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(selectedDrive.status)}`}>
                    {getStatusIcon(selectedDrive.status)}
                    {selectedDrive.status.charAt(0).toUpperCase() + selectedDrive.status.slice(1)}
                  </span>
                </div>
                <span className="text-sm text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                  {new Date(selectedDrive.date).toLocaleDateString()}
                </span>
              </div>

              {selectedDrive.description && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedDrive.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-rose-500" />
                    Location
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedDrive.location}</p>
                  {selectedDrive.address && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedDrive.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-sky-500" />
                    Date &amp; Time
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

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <HeartIcon className="w-4 h-4 text-rose-500" />
                  Blood Types Needed
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDrive.bloodTypesNeeded.map((type: string) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-lg"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Target Donors</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{selectedDrive.targetDonors}</p>
                </div>
                <div className="text-center p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl">
                  <p className="text-xs text-sky-600 dark:text-sky-400">Registered</p>
                  <p className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-0.5">{selectedDrive.registeredDonors}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Donated</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedDrive.completedDonations}</p>
                </div>
              </div>

              {(selectedDrive.organizer || selectedDrive.contactNumber || selectedDrive.contactEmail) && (
                <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-500" />
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

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      You are registered for this drive
                    </p>
                  </div>
                  {selectedDrive.status !== 'completed' && selectedDrive.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openCancelModal(selectedDrive.id, selectedDrive.title);
                      }}
                      className="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition"
                    >
                      Cancel Registration
                    </button>
                  )}
                  {(selectedDrive.status === 'completed' || selectedDrive.status === 'cancelled') && (
                    <span className="px-4 py-2 text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      {selectedDrive.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
              Blood Drives
            </p>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                <Heart className="h-4 w-4 text-rose-600" />
              </span>
              My Registrations
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
              {activeCount > 0
                ? `You're registered for ${activeCount} active blood drive${activeCount > 1 ? 's' : ''}`
                : 'You have no active registrations'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/donors/blood-drives"
              className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition text-sm font-semibold flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to All Drives</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <button
              onClick={fetchRegisteredDrives}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition text-sm font-semibold flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs - All (Active) and Completed */}
        {bloodDrives.length > 0 && (
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                filter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                filter === 'completed'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <History className="w-4 h-4" />
              Completed ({completedCount})
            </button>
          </div>
        )}

        {filteredDrives.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              {filter === 'completed' ? (
                <History className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
              ) : (
                <Heart className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
              )}
            </div>
            <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              {filter === 'completed'
                ? 'No completed drives'
                : 'No active registrations'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              {filter === 'completed'
                ? "You haven't completed any blood drives yet."
                : "You don't have any active blood drive registrations. Check out available drives!"}
            </p>
            <Link
              href="/donors/blood-drives"
              className="inline-flex items-center gap-1.5 mt-5 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition text-sm font-semibold"
            >
              Browse Available Drives
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDrives.map((drive: BloodDrive) => {
              const isCompleted = drive.status === 'completed';
              const isCancelled = drive.status === 'cancelled';
              const isActive = drive.status === 'upcoming' || drive.status === 'ongoing';

              return (
                <div
                  key={drive.id}
                  className={`rounded-2xl border transition-all overflow-hidden hover:shadow-md ${
                    isCompleted
                      ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                      : isCancelled
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                      : 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-900'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(drive.status)}`}>
                        {getStatusIcon(drive.status)}
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {new Date(drive.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className={`text-base font-semibold mb-2 line-clamp-1 ${
                      isCompleted || isCancelled
                        ? 'text-zinc-500 dark:text-zinc-400'
                        : 'text-zinc-900 dark:text-white'
                    }`}>
                      {drive.title}
                    </h3>

                    <div className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                      <MapPinIcon className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{drive.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {drive.bloodTypesNeeded.slice(0, 3).map((type: string) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded"
                        >
                          {type}
                        </span>
                      ))}
                      {drive.bloodTypesNeeded.length > 3 && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium rounded">
                          +{drive.bloodTypesNeeded.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Target</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">{drive.targetDonors}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Registered</p>
                        <p className="text-sm font-semibold text-sky-600 dark:text-sky-400 mt-0.5">{drive.registeredDonors}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openDetailsModal(drive)}
                        className="flex-1 py-2.5 rounded-xl transition font-semibold text-sm bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/50 flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {isActive && (
                        <button
                          onClick={() => openCancelModal(drive.id, drive.title)}
                          disabled={cancelling === drive.id}
                          className="px-4 py-2.5 rounded-xl transition font-semibold text-sm bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {cancelling === drive.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Cancel
                        </button>
                      )}
                      {isCompleted && (
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Completed
                        </button>
                      )}
                      {isCancelled && (
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancelled
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}