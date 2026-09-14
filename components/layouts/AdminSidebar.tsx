// components/layouts/AdminSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Hospital,
  Droplet,
  FileText,
  Settings,
  LogOut,
  X,
  Bell,
  UserCheck,
  Activity,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>(['reports']);
  const [userName, setUserName] = useState("joshua carlos gonzales");
  const [userRole, setUserRole] = useState("Administrator");
  const [userAvatar, setUserAvatar] = useState("JC");

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.fullName) {
          setUserName(userData.fullName);
          const initials = userData.fullName
            .split(' ')
            .map((word: string) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
          setUserAvatar(initials);
        }
        if (userData.role) {
          setUserRole(userData.role === 'admin' ? 'Administrator' : 'User');
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const toggleExpand = (item: string) => {
    setExpandedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const isActive = (path: string) => pathname === path;
  const isActiveParent = (paths: string[]) => paths.some(path => pathname?.startsWith(path));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      label: "Users",
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Donors",
      icon: UserCheck,
      href: "/admin/donors",
    },
    {
      label: "Hospitals",
      icon: Hospital,
      href: "/admin/hospitals",
    },
    {
      label: "Blood Inventory",
      icon: Droplet,
      href: "/admin/inventory",
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/admin/reports",
      children: [
        {
          label: "Requests",
          icon: Bell,
          href: "/admin/reports/requests",
        },
        {
          label: "Donations",
          icon: Droplet,
          href: "/admin/reports/donations",
        },
        {
          label: "Analytics",
          icon: Activity,
          href: "/admin/reports/analytics",
        },
      ],
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/admin/settings",
    },
  ];

  const getUserInitials = () => userAvatar;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-30
          h-screen w-72 lg:w-64 xl:w-72
          bg-gradient-to-b from-red-600 to-red-700 dark:from-red-800 dark:to-red-900
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                RedPulse
              </h1>
              <p className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
                Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-white/70 truncate">
                {userRole}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.label.toLowerCase());
            const isItemActive = isActive(item.href);
            const isParentActive = isActiveParent(item.children?.map(c => c.href) || []);

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleExpand(item.label.toLowerCase())}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 rounded-xl
                      transition-all duration-200 group
                      ${isParentActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="ml-9 space-y-1 border-l-2 border-white/10 pl-3">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2 rounded-xl text-sm
                              transition-all duration-200
                              ${isActive(child.href)
                                ? 'bg-white/20 text-white'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                              }
                            `}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                  transition-all duration-200 group
                  ${isItemActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 p-4 space-y-3">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>

          {/* Version Info */}
          <div className="px-4 pt-2">
            <p className="text-[10px] text-white/40 text-center leading-relaxed">
              v1.0.0
              <br />
              Blood Donor Registry System
              <br />
              Group F4 Matriks
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}