// components/DonationHistory.tsx
'use client';

import { useState, useEffect, useMemo } from "react";
import {
  History,
  Droplet,
  Loader2,
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";

export interface Donation {
  id: string;
  date: string;
  location: string;
  status: 'completed' | 'pending' | 'scheduled' | 'cancelled';
  points: number;
  hospitalName?: string;
  notes?: string;
}

interface HospitalGroup {
  hospitalName: string;
  donations: Donation[];
  totalPoints: number;
  lastDate: string;
}

const PAGE_SIZE = 8;

const statusColors: Record<Donation['status'], string> = {
  completed: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  pending: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  scheduled: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
  cancelled: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
};

export default function DonationHistory() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedHospitals, setExpandedHospitals] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalPoints: 0,
    lastDonationDate: '',
    hospitalsCount: 0
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to be logged in to view your donation history.');
        return;
      }

      const response = await fetch('/api/user/donations?limit=500', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load donation history (${response.status})`);
      }

      const data = await response.json();
      const allDonations: Donation[] = data.data || [];

      allDonations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const uniqueHospitals = new Set(
        allDonations.map((d) => d.hospitalName || d.location).filter(Boolean)
      );

      setDonations(allDonations);
      setStats({
        totalDonations: allDonations.length,
        totalPoints: allDonations.reduce((sum, d) => sum + (d.points || 0), 0),
        lastDonationDate: allDonations[0]?.date || '',
        hospitalsCount: uniqueHospitals.size
      });
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to load donation history. Please try again.');
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setVisibleCount((prev) => prev + PAGE_SIZE);
    setLoadingMore(false);
  };

  const toggleHospital = (hospitalName: string) => {
    setExpandedHospitals((prev) => ({ ...prev, [hospitalName]: !prev[hospitalName] }));
  };

  // Group donations by hospital — donations is already sorted newest-first,
  // so each group's donation list stays newest-first too.
  const hospitalGroups: HospitalGroup[] = useMemo(() => {
    const map = new Map<string, Donation[]>();
    donations.forEach((d) => {
      const key = d.hospitalName || d.location || 'Unknown Hospital';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });

    return Array.from(map.entries())
      .map(([hospitalName, list]) => ({
        hospitalName,
        donations: list,
        totalPoints: list.reduce((sum, d) => sum + (d.points || 0), 0),
        lastDate: list[0]?.date || ''
      }))
      .sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
  }, [donations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <div className="text-center">
          <div className="h-9 w-9 rounded-full border-2 border-zinc-100 dark:border-zinc-800 border-t-red-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 tracking-wide">Loading history…</p>
        </div>
      </div>
    );
  }

  const visibleGroups = hospitalGroups.slice(0, visibleCount);
  const hasMore = visibleCount < hospitalGroups.length;

  const DonationRow = ({ donation }: { donation: Donation }) => (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 flex items-center justify-center flex-shrink-0">
          <Droplet className="h-3 w-3 text-red-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white truncate">
            {new Date(donation.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          {donation.notes && (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{donation.notes}</p>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${statusColors[donation.status] || statusColors.pending}`}>
          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
        </span>
        <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">+{donation.points} pts</p>
      </div>
    </div>
  );

  const HospitalGroupCard = ({ group }: { group: HospitalGroup }) => {
    const isOpen = !!expandedHospitals[group.hospitalName];
    return (
      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <button
          onClick={() => toggleHospital(group.hospitalName)}
          className="w-full flex items-center justify-between gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white truncate">
                {group.hospitalName}
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {group.donations.length} donation{group.donations.length > 1 ? 's' : ''} · +{group.totalPoints} pts · last {new Date(group.lastDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          )}
        </button>

        {isOpen && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 p-2 space-y-1 bg-zinc-50/50 dark:bg-zinc-950/20">
            {group.donations.map((donation) => (
              <DonationRow key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <History className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            </div>
            Donation History
          </h2>
          {donations.length > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              View all
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-3 text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium">{error}</p>
              <button
                onClick={fetchHistory}
                className="mt-1 text-xs font-semibold underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl mb-4 overflow-hidden">
          <div className="p-3">
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Donations</p>
            <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{stats.totalDonations}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Points</p>
            <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 mt-0.5">{stats.totalPoints}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Hospitals</p>
            <p className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 mt-0.5">{stats.hospitalsCount}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Last visit</p>
            <p className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-1">
              {stats.lastDonationDate ? new Date(stats.lastDonationDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {!error && donations.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
            <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-3">
              <History className="h-6 w-6 text-red-300 dark:text-red-800" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No donation history</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Your donations will show up here once recorded.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {visibleGroups.map((group) => (
                <HospitalGroupCard key={group.hospitalName} group={group} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    `Load more hospitals (${hospitalGroups.length - visibleCount} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/40 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-900/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                All hospitals
                <span className="ml-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">({hospitalGroups.length})</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
              {hospitalGroups.map((group) => (
                <HospitalGroupCard key={group.hospitalName} group={group} />
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-3 sm:p-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}