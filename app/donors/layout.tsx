// app/donors/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DonorNavbar } from '@/components/layouts/DonorNavbar';
import { DonorSidebar } from '@/components/layouts/DonorSidebar';

export default function DonorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.replace('/');
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'donor') {
          router.replace('/');
          return;
        }

        // Fetch complete donor profile from API
        const userId = user.id || user.userId;
        const response = await fetch(`/api/donors/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const donorData = data.data || data;
          
          // Merge API data with localStorage data
          setProfile({
            ...user,
            ...donorData,
            fullName: donorData.fullName || user.fullName || user.name || 'Donor',
            email: donorData.email || user.email || 'donor@example.com',
          });
        } else {
          // Fallback to localStorage data
          setProfile(user);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to localStorage data
        const user = JSON.parse(userStr);
        setProfile(user);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchProfile();

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading state while fetching profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30">
      <DonorNavbar 
        onMenuClick={toggleSidebar}
        isMobile={isMobile}
      />
      
      <div className="flex">
        <DonorSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          userData={profile}
        />
        
        <main className={`flex-1 transition-all duration-300 ${
          isMobile ? 'ml-0 pb-20' : 'ml-64'
        } p-4 sm:p-6`}>
          {children}
        </main>
      </div>
    </div>
  );
}