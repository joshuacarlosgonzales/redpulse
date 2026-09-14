// components/layouts/DonorSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Syringe,
  History,
  User,
  Bell,
  LogOut,
  IdCard,
  X,
} from 'lucide-react';

interface DonorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  userData?: {
    fullName?: string;
    email?: string;
    [key: string]: any;
  };
}

export function DonorSidebar({ isOpen, onClose, isMobile, userData }: DonorSidebarProps) {
  const pathname = usePathname();

  // Use userData from props or fallback to defaults
  const donorName = userData?.fullName || 'Donor';
  const donorEmail = userData?.email || 'donor@example.com';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/donors/dashboard' },
    { id: 'blood-drives', label: 'Drives', icon: Calendar, href: '/donors/blood-drives' },
    { id: 'requests', label: 'Requests', icon: Syringe, href: '/donors/requests' },
    { id: 'history', label: 'History', icon: History, href: '/donors/history' },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const handleNavigation = (href: string) => {
    if (isMobile) {
      onClose();
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    return donorName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Bottom Navigation Bar for Mobile
  if (isMobile) {
    return (
      <>
        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-lg">
          <div className="flex items-center justify-around px-2 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`relative flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition min-w-[56px] ${
                    active
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''}`} />
                  <span className={`text-[10px] font-medium mt-0.5 ${active ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="absolute -top-0.5 w-8 h-0.5 bg-red-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile Sidebar Drawer */}
        <>
          {isOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
          )}
          <aside
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl transition-transform duration-300 max-h-[70vh] ${
              isOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
              </div>

              {/* Close button */}
              <div className="flex justify-end px-4">
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {/* Profile Section - Now using real user data */}
                <div className="flex items-center gap-3 p-3 mb-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold text-lg">
                    {getUserInitials()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white truncate">{donorName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{donorEmail}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-1">
                  <Link
                    href="/donors/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                  <Link
                    href="/donors/notifications"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <Bell className="h-5 w-5" />
                    Notifications
                  </Link>
                  <Link
                    href="/donors/digital-id"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    <IdCard className="h-5 w-5" />
                    Digital ID
                  </Link>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-3" />

                {/* Sign Out */}
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>

                <div className="text-center mt-4">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    RedPulse v1.0 • © {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </>
      </>
    );
  }

  // Desktop Sidebar - Updated with user data
  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64">
      <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
        {/* Profile Section at top of desktop sidebar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold text-sm">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 dark:text-white truncate text-sm">{donorName}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{donorEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 pt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
            <p>RedPulse v1.0</p>
            <p className="mt-0.5">© {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </div>
    </aside>
  );
}