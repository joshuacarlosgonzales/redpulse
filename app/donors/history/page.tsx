// app/donors/history/page.tsx
'use client';

import { useState, useEffect } from "react";
import {
  History,
  Droplet,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  MapPin
} from "lucide-react";
import Link from "next/link";

interface Donation {
  id: string;
  date: string;
  location: string;
  status: 'completed' | 'pending' | 'scheduled' | 'cancelled';
  points: number;
  hospitalName?: string;
  notes?: string;
}

export default function DonationHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalPoints: 0,
    lastDonationDate: ''
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/donations?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDonations(data.data || []);
        setStats({
          totalDonations: data.data?.length || 0,
          totalPoints: data.data?.reduce((sum: number, d: any) => sum + (d.points || 0), 0) || 0,
          lastDonationDate: data.data?.[0]?.date || ''
        });
      } else {
        // Mock data
        const mockDonations: Donation[] = [
          {
            id: '1',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'City Hospital',
            status: 'completed',
            points: 100,
            hospitalName: 'City Hospital',
            notes: 'Regular blood donation'
          },
          {
            id: '2',
            date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'General Hospital',
            status: 'completed',
            points: 100,
            hospitalName: 'General Hospital'
          }
        ];
        setDonations(mockDonations);
        setStats({
          totalDonations: mockDonations.length,
          totalPoints: 200,
          lastDonationDate: mockDonations[0].date
        });
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
      pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
      scheduled: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      cancelled: 'text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Donation History</h2>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Donations</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalDonations}</p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Points Earned</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalPoints}</p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Last Donation</p>
          <p className="text-lg font-medium text-zinc-900 dark:text-white">
            {stats.lastDonationDate ? new Date(stats.lastDonationDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No Donation History</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">You haven't made any donations yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((donation) => (
            <div
              key={donation.id}
              className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
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
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{donation.location}</p>
                  {donation.notes && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{donation.notes}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(donation.status)}`}>
                  {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                </span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">+{donation.points} points</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}