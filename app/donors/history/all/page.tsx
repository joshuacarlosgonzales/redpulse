// app/donors/history/all/page.tsx
'use client';

import { useState, useEffect } from "react";
import { ArrowLeft, Droplet, Building2, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Donation } from "@/components/donation/DonationHistory";

const statusColors: Record<Donation['status'], string> = {
  completed: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  scheduled: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  cancelled: 'text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
};

export default function AllDonationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);

  useEffect(() => {
    fetchAllDonations();
  }, []);

  const fetchAllDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to be logged in to view your donation history.');
        return;
      }

      const response = await fetch('/api/user/donations?limit=500', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load donation history (${response.status})`);
      }

      const data = await response.json();
      const allDonations: Donation[] = data.data || [];
      allDonations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDonations(allDonations);
    } catch (err: any) {
      console.error('Error fetching donations:', err);
      setError(err.message || 'Failed to load donation history. Please try again.');
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-1 py-2.5 min-h-[44px] text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition mb-3 sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        Back
      </button>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h1 className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-white mb-4 sm:mb-6">
          All Donations
        </h1>

        {error && (
          <div className="mb-4 sm:mb-6 flex items-start gap-2.5 sm:gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 sm:p-4 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium">{error}</p>
              <button
                onClick={fetchAllDonations}
                className="mt-2 text-xs sm:text-sm font-medium underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!error && donations.length === 0 ? (
          <div className="text-center py-10 sm:py-12">
            <Droplet className="h-12 w-12 sm:h-16 sm:w-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-zinc-700 dark:text-zinc-300">No Donations Found</h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">You haven't made any donations yet.</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            {donations.map((donation) => {
              const hospitalName = donation.hospitalName || donation.location || 'Unknown Hospital';
              return (
                <div
                  key={donation.id}
                  className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                    <Droplet className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-medium text-zinc-900 dark:text-white truncate">
                          {new Date(donation.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                          <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 truncate">
                            {hospitalName}
                          </p>
                        </div>
                        {donation.notes && (
                          <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-2">
                            {donation.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 flex-shrink-0">
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full border ${statusColors[donation.status] || statusColors.pending}`}>
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </span>
                        <p className="text-[11px] sm:text-sm text-zinc-500 dark:text-zinc-400 sm:mt-1">
                          +{donation.points} pts
                        </p>
                      </div>
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