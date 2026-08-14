// components/UserNotif/NotificationModal.tsx
'use client';

import { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  MailCheck,
  X,
  Clock
} from "lucide-react";

interface Notification {
  id: string;
  subject: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  sender?: string;
  link?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationModalProps) {
  const [loading, setLoading] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30';
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Bell className="h-6 w-6 text-red-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Stay updated with your donor status and announcements
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/30 rounded-lg transition"
              >
                <MailCheck className="h-4 w-4" />
                Mark All Read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="h-5 w-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No Notifications</h4>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id} // ✅ FIXED: Added unique key here
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`p-4 rounded-lg border transition cursor-pointer hover:shadow-md ${
                    !notif.isRead 
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20' 
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  } ${getNotificationTypeColor(notif.type)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium text-zinc-900 dark:text-white ${!notif.isRead ? 'font-bold' : ''}`}>
                          {notif.subject}
                        </h4>
                        {!notif.isRead && (
                          <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-line">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notif.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {notif.sender && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            From: {notif.sender}
                          </p>
                        )}
                      </div>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notif.id);
                        }}
                        className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}