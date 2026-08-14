// components/donor/DonationHistoryModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Droplet,
  Clock,
  Plus,
  Save,
  MapPin,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Heart,
} from "lucide-react";
import { Donor } from "@/types/donor";
import { donorService } from "@/services/donorService";

interface DonationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  donor: Donor | null;
  onUpdate: (updatedDonor: any) => void;
}

interface DonationRecord {
  _id?: string;
  id?: string;
  date: string;
  amount: string;
  status: "completed" | "pending" | "cancelled";
  location: string;
  notes?: string;
}

export default function DonationHistoryModal({ 
  isOpen, 
  onClose, 
  donor, 
  onUpdate 
}: DonationHistoryModalProps) {
  const [isAddingDonation, setIsAddingDonation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDonation, setNewDonation] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "450ml",
    location: "",
    notes: "",
  });

  // Fetch donation history when modal opens
  useEffect(() => {
    if (isOpen && donor) {
      fetchDonationHistory();
    }
  }, [isOpen, donor]);

  const fetchDonationHistory = async () => {
    if (!donor) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch donor details with donation history
      const result = await donorService.getDonor(donor.id);
      
      if (result && (result as any).donationHistory) {
        const history = (result as any).donationHistory;
        // Map _id to id for consistent key usage
        const mappedHistory = history.map((item: any) => ({
          ...item,
          id: item._id || item.id || `donation-${Date.now()}-${Math.random()}`,
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        }));
        setDonations(mappedHistory);
      } else {
        setDonations([]);
      }
    } catch (err) {
      console.error('Failed to fetch donation history:', err);
      setError('Failed to load donation history');
      // Use sample data if API fails
      setDonations([
        {
          id: `sample-1-${Date.now()}`,
          date: donor.lastDonation || new Date().toISOString().split('T')[0],
          amount: "450ml",
          status: "completed",
          location: "Red Pulse Blood Bank",
          notes: "Regular donation",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonation = async () => {
    if (!donor) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare donation data with the addDonation flag
      const donationData = {
        addDonation: {
          date: newDonation.date,
          amount: newDonation.amount,
          location: newDonation.location || "Red Pulse Blood Bank",
          notes: newDonation.notes || "",
        },
        // Also update basic info to preserve other fields
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        bloodType: donor.bloodType,
        status: donor.status,
        barangay: donor.barangay || "",
        municipality: donor.municipality || "",
        province: donor.province || "",
        gender: donor.gender || "",
        dateOfBirth: donor.dateOfBirth || "",
        address: donor.address || "",
        weight: donor.weight || 65,
      };

      // Call API to add donation
      const updatedDonor = await donorService.updateDonor(donor.id, donationData);
      
      // Update local state with a unique ID
      const newDonationRecord: DonationRecord = {
        id: `donation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: newDonation.date,
        amount: newDonation.amount,
        status: "completed",
        location: newDonation.location || "Red Pulse Blood Bank",
        notes: newDonation.notes || "",
      };
      
      setDonations(prev => [newDonationRecord, ...prev]);

      // Update parent component with the updated donor data
      onUpdate(updatedDonor);
      
      // Reset form
      setIsAddingDonation(false);
      setNewDonation({
        date: new Date().toISOString().split('T')[0],
        amount: "450ml",
        location: "",
        notes: "",
      });

    } catch (err) {
      console.error('Failed to add donation:', err);
      setError(err instanceof Error ? err.message : 'Failed to add donation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !donor) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-xl">
              <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Donation History</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {donor.name} • {donor.totalDonations || 0} total donations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Donor Stats */}
        <div className="px-6 py-4 bg-red-50 dark:bg-red-950/10 border-b border-red-100 dark:border-red-900/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Blood Type</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{donor.bloodType}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Donations</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{donor.totalDonations || 0}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Last Donation</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {donor.lastDonation || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Next Eligible</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {donor.nextEligible || 'N/A'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 260px)" }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Donation Records</h4>
            <button
              onClick={() => setIsAddingDonation(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-1"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4" />
              Add Donation
            </button>
          </div>

          {/* Add Donation Form */}
          {isAddingDonation && (
            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h5 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-red-600" />
                Record New Donation
              </h5>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Donation Date</label>
                  <input
                    type="date"
                    value={newDonation.date}
                    onChange={(e) => setNewDonation({ ...newDonation, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Amount</label>
                  <select
                    value={newDonation.amount}
                    onChange={(e) => setNewDonation({ ...newDonation, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <option value="250ml">250ml</option>
                    <option value="350ml">350ml</option>
                    <option value="450ml">450ml</option>
                    <option value="500ml">500ml</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Location</label>
                  <input
                    type="text"
                    value={newDonation.location}
                    onChange={(e) => setNewDonation({ ...newDonation, location: e.target.value })}
                    placeholder="e.g., Red Pulse Blood Bank, City Hospital"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes (Optional)</label>
                  <input
                    type="text"
                    value={newDonation.notes}
                    onChange={(e) => setNewDonation({ ...newDonation, notes: e.target.value })}
                    placeholder="Additional notes about this donation"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddDonation}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Donation
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsAddingDonation(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Donation List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">Loading donation history...</span>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <Droplet className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
              <p>No donation records yet</p>
              <button
                onClick={() => setIsAddingDonation(true)}
                className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Record first donation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((donation, index) => {
                // Create a unique key using multiple fallbacks
                const uniqueKey = donation._id || donation.id || `donation-${index}-${Date.now()}-${Math.random()}`;
                return (
                  <div
                    key={uniqueKey}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 hover:border-red-200 dark:hover:border-red-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-lg">
                          <Droplet className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                              {donation.amount}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {donation.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {donation.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {donation.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                        #{typeof uniqueKey === 'string' ? uniqueKey.slice(-6) : index + 1}
                      </div>
                    </div>
                    {donation.notes && (
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 pl-11">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {donation.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-between items-center">
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            {donations.length} donation{donations.length !== 1 ? 's' : ''} recorded
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition border border-zinc-200 dark:border-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}