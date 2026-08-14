// app/donors/requests/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Syringe,
  Plus,
  Eye,
  XCircle,
  AlertTriangle,
  Ambulance,
  Hospital as HospitalIcon,
  Loader2,
  CheckCircle,
  Info,
  Calendar,
  Clock
} from "lucide-react";
import BloodRequestModal from "@/components/DonorRequest/BloodRequestModal";

interface BloodRequest {
  id: string;
  hospitalName: string;
  hospitalAddress: string;
  bloodType: string;
  quantity: string;
  urgency: 'critical' | 'urgent' | 'normal';
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled';
  requestDate: string;
  requiredDate: string;
  patientName?: string;
  patientAge?: number;
  notes?: string;
  requestMethod?: 'emergency' | 'scheduled' | 'routine';
  department?: string;
  doctorName?: string;
  contactNumber?: string;
}

export default function BloodRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'critical', label: '🚨 Critical', color: 'text-red-600 bg-red-100' },
    { value: 'urgent', label: '⚡ Urgent', color: 'text-orange-600 bg-orange-100' },
    { value: 'normal', label: '📋 Normal', color: 'text-blue-600 bg-blue-100' }
  ];
  const requestMethods = [
    { value: 'emergency', label: '🚑 Emergency', description: 'Immediate blood needed for emergency surgery' },
    { value: 'scheduled', label: '📅 Scheduled', description: 'Planned blood transfusion for scheduled procedure' },
    { value: 'routine', label: '🔄 Routine', description: 'Regular blood supply for ongoing treatment' }
  ];
  const departments = ['Emergency Room', 'Surgery', 'Internal Medicine', 'Pediatrics', 'Oncology', 'Maternity', 'ICU', 'General Ward'];

  useEffect(() => {
    fetchRequests();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/blood-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBloodRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/blood-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bloodType: formData.bloodType,
          quantity: parseInt(formData.quantity) || 1,
          urgency: formData.urgency || 'normal',
          requiredDate: formData.requiredDate,
          notes: formData.notes || '',
          requestMethod: formData.requestMethod || 'routine',
          department: formData.department || '',
          doctorName: formData.doctorName || '',
          contactNumber: formData.contactNumber || '',
          hospitalId: formData.hospitalId,
          patientName: formData.patientName || '',
          patientAge: formData.patientAge || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBloodRequests(prev => [data.data, ...prev]);
        setShowRequestModal(false);
        alert('Blood request submitted successfully! 🩸');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to submit request');
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/blood-requests?id=${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBloodRequests(prev => 
          prev.map(r => 
            r.id === requestId ? { ...r, status: 'cancelled' as const } : r
          )
        );
        alert('Request cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Failed to cancel request');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
      approved: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
      fulfilled: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
      cancelled: 'text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      urgent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return colors[urgency as keyof typeof colors];
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Blood Requests</h2>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Request Methods Quick Guide */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-2">
          <Info className="h-4 w-4" />
          Request Methods Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {requestMethods.map((method) => (
            <div key={method.value} className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{method.label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{method.description}</p>
            </div>
          ))}
        </div>
      </div>

      {bloodRequests.length === 0 ? (
        <div className="text-center py-12">
          <Syringe className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No Blood Requests</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">You haven't made any blood requests yet.</p>
          <button
            onClick={() => setShowRequestModal(true)}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Make Your First Request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bloodRequests.map((request) => (
            <div
              key={request.id}
              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    request.urgency === 'critical' ? 'bg-red-50 dark:bg-red-950/30' :
                    request.urgency === 'urgent' ? 'bg-orange-50 dark:bg-orange-950/30' :
                    'bg-blue-50 dark:bg-blue-950/30'
                  }`}>
                    {request.urgency === 'critical' ? <AlertTriangle className="h-6 w-6 text-red-600" /> :
                     request.urgency === 'urgent' ? <Ambulance className="h-6 w-6 text-orange-600" /> :
                     <HospitalIcon className="h-6 w-6 text-blue-600" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {request.bloodType} - {request.quantity}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {request.hospitalName} • Required: {new Date(request.requiredDate).toLocaleDateString()}
                    </p>
                    {request.notes && (
                      <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                        Note: {request.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => cancelRequest(request.id)}
                      className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition flex items-center gap-1"
                    >
                      <XCircle className="h-3 w-3" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BloodRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleCreateRequest}
        bloodTypes={bloodTypes}
        urgencyLevels={urgencyLevels}
        requestMethods={requestMethods}
        departments={departments}
        profileName={user?.fullName}
      />
    </div>
  );
}