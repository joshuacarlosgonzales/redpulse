// app/hospital/setup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  MapPin,
  Phone,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Mail
} from 'lucide-react';

export default function HospitalSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    hospitalType: 'General Hospital'
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Use the existing profile API to create/update hospital
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
        setTimeout(() => {
          router.push('/hospital/dashboard');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to setup hospital' });
      }
    } catch (error) {
      console.error('Error setting up hospital:', error);
      setMessage({ type: 'error', text: 'Failed to setup hospital' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href="/hospital/dashboard">
            <button className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200/60 dark:border-zinc-800/60 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Set Up Your Hospital</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Configure your hospital to start receiving blood requests from donors
            </p>
          </div>

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
                  placeholder="Enter your hospital name"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  placeholder="Enter hospital address"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    placeholder="Enter hospital phone number"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Hospital Type
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <select
                    value={formData.hospitalType}
                    onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {loading ? 'Setting up...' : 'Set Up Hospital'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
              Once set up, donors will be able to request blood from your hospital.
              Make sure the hospital name matches exactly what donors will enter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}