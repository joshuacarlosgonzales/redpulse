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
        <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">All Donations</h1>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={fetchAllDonations}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!error && donations.length === 0 ? (
          <div className="text-center py-12">
            <Droplet className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No Donations Found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">You haven't made any donations yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => {
              const hospitalName = donation.hospitalName || donation.location || 'Unknown Hospital';
              return (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                      <Droplet className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {new Date(donation.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                          {hospitalName}
                        </p>
                      </div>
                      {donation.notes && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{donation.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[donation.status] || statusColors.pending}`}>
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </span>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">+{donation.points} points</p>
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