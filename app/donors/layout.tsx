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
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
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
        setProfile(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.replace('/');
      }
    };

    checkAuth();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-black dark:to-red-950/30">
      <DonorNavbar 
        onMenuClick={toggleSidebar}
        unreadCount={0}
        notifications={[]}
      />
      
      <div className="flex">
        <DonorSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
        
        <main className={`flex-1 transition-all duration-300 ${
          isMobile ? 'ml-0' : 'ml-64'
        } p-6`}>
          {children}
        </main>
      </div>
    </div>
  );
}