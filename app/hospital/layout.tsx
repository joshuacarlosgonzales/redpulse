// app/hospital/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { HospitalNavbar } from '@/components/layouts/HospitalNavbar';
import { HospitalSidebar } from '@/components/layouts/HospitalSidebar';
import HospitalProfileModal from '@/components/hospital/HospitalProfileModal';
import { HospitalSetupModal } from '@/components/hospital/HospitalSetupModal';
import { Footer } from '@/components/layouts/Footer';

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/hospital/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.data?.filter((n: any) => !n.isRead).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/hospital/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/hospital/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleProfileUpdate = () => {
    // Refresh any data that needs to be updated after profile change
    fetchNotifications();
  };

  const handleSetupComplete = () => {
    // Refresh data after setup is complete
    fetchNotifications();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex">
      {/* Sidebar */}
      <HospitalSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar */}
        <HospitalNavbar 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          unreadCount={unreadCount}
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />

        {/* Page Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Modals */}
      <HospitalProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdate={handleProfileUpdate}
      />

      <HospitalSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSetupComplete={handleSetupComplete}
      />
    </div>
  );
}