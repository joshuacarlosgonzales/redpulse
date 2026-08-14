// components/layouts/DonorSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Syringe,
  History,
  Shield,
  User,
  Bell,
  LogOut,
  Heart,
  IdCard,
  X
} from 'lucide-react';

interface DonorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export function DonorSidebar({ isOpen, onClose, isMobile }: DonorSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/donors/dashboard' },
    { id: 'blood-drives', label: 'Blood Drives', icon: Calendar, href: '/donors/blood-drives' },
    { id: 'requests', label: 'Blood Requests', icon: Syringe, href: '/donors/requests' },
    { id: 'history', label: 'Donation History', icon: History, href: '/donors/history' },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const handleNavigation = (href: string) => {
    if (isMobile) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/donors/dashboard" className="flex items-center gap-2">
        </Link>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
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
        <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          <p>RedPulse v1.0</p>
          <p className="mt-0.5">© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-zinc-900 shadow-2xl transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64">
      {sidebarContent}
    </aside>
  );
}