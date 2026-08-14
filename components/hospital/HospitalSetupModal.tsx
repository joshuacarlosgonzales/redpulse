// components/hospital/HospitalSetupModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Building,
  MapPin,
  Phone,
  Mail,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Hospital,
  Shield,
  Award
} from 'lucide-react';

interface HospitalSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete?: () => void;
}

export function HospitalSetupModal({ isOpen, onClose, onSetupComplete }: HospitalSetupModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    hospitalType: 'General Hospital'
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/hospital/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setProfile(data.data);
          setFormData({
            hospitalName: data.data.hospitalName || '',
            hospitalAddress: data.data.hospitalAddress || '',
            hospitalPhone: data.data.hospitalPhone || '',
            hospitalType: data.data.hospitalType || 'General Hospital'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Please login again' });
        return;
      }

      const response = await fetch('/api/hospital/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Hospital setup completed successfully! 🏥' });
        if (onSetupComplete) onSetupComplete();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to setup hospital' });
      }
    } catch (error) {
      console.error('Error setting up hospital:', error);
      setMessage({ type: 'error', text: 'Failed to setup hospital' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {profile?.hospitalName ? 'Update Hospital Setup' : 'Hospital Setup'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {profile?.hospitalName 
                ? 'Update your hospital information' 
                : 'Configure your hospital to receive blood requests'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
                  message.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
              )}

              {/* Current Status */}
              {profile?.hospitalName && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Current hospital: <strong>{profile.hospitalName}</strong>
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Status: {profile.status || 'Active'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={formData.hospitalName}
                      onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter your hospital name"
                      required
                    />
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    This must match exactly what donors will enter when requesting blood
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Hospital Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={formData.hospitalAddress}
                      onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter hospital address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        type="tel"
                        value={formData.hospitalPhone}
                        onChange={(e) => setFormData({ ...formData, hospitalPhone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="(02) 1234-5678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Hospital Type
                    </label>
                    <div className="relative">
                      <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <select
                        value={formData.hospitalType}
                        onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                      >
                        <option value="General Hospital">General Hospital</option>
                        <option value="Specialty Hospital">Specialty Hospital</option>
                        <option value="Teaching Hospital">Teaching Hospital</option>
                        <option value="Community Hospital">Community Hospital</option>
                        <option value="Private Hospital">Private Hospital</option>
                        <option value="Public Hospital">Public Hospital</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="email"
                      value={profile?.hospitalEmail || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Email is managed in your account settings</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {saving ? 'Saving...' : profile?.hospitalName ? 'Update Hospital' : 'Set Up Hospital'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Help Section */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>💡 Tip:</strong> Make sure your hospital name matches exactly what donors will enter when requesting blood. 
                  This ensures requests are properly routed to your hospital.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}