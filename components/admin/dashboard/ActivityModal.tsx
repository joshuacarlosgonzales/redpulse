// components/admin/dashboard/ActivityModal.tsx
'use client';

import { useState } from 'react';
import {
  X,
  Loader2,
  Search,
  Filter,
  User,
  Calendar,
  Heart,
  Hospital,
  Building,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  Activity
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user?: string;
  status?: 'pending' | 'completed' | 'failed';
}

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
}

const getActivityIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    user_registered: <User className="h-4 w-4 text-blue-500" />,
    donor_approved: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    hospital_registered: <Hospital className="h-4 w-4 text-green-500" />,
    donation_made: <Heart className="h-4 w-4 text-red-500" />,
    emergency_request: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    account_suspended: <UserX className="h-4 w-4 text-red-500" />,
    hospital_approved: <Building className="h-4 w-4 text-emerald-500" />,
    donor_rejected: <UserX className="h-4 w-4 text-red-500" />,
    hospital_rejected: <Building className="h-4 w-4 text-red-500" />,
    blood_drive_created: <Calendar className="h-4 w-4 text-blue-500" />,
    blood_drive_registration: <UserPlus className="h-4 w-4 text-purple-500" />,
    blood_drive_completed: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    blood_drive_cancelled: <XCircle className="h-4 w-4 text-red-500" />
  };
  return icons[type] || <Activity className="h-4 w-4 text-gray-500" />;
};

const getStatusBadge = (status?: string) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    failed: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
  };
  return styles[status || ''] || '';
};

export default function ActivityModal({ isOpen, onClose, activities }: ActivityModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (!isOpen) return null;

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-xl">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">All Activity</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{activities.length} activities found</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
              <X className="h-5 w-5 text-zinc-500" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50 text-zinc-400" />
                <p className="text-zinc-500 dark:text-zinc-400">No activities found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                    <div className="p-2 rounded-full bg-white dark:bg-zinc-700 shadow-sm">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-900 dark:text-white">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                        {activity.status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(activity.status)}`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 rounded-b-2xl">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Showing {filteredActivities.length} of {activities.length} activities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}