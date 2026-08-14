"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  Droplet,
  Users,
  FileText,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  X,
  Building,
  Hospital,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>(['reports']);
  const [userName, setUserName] = useState("John Doe");

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.fullName) setUserName(userData.fullName);
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

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isActiveParent = (paths: string[]) => {
    return paths.some(path => pathname?.startsWith(path));
  };

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
      active: isActive("/admin/dashboard"),
    },
    {
      label: "Donors",
      icon: Users,
      href: "/admin/donors",
      active: isActive("/admin/donors"),
    },
    {
      label: "Hospitals",
      icon: Hospital,
      href: "/admin/hospitals",
      active: isActive("/admin/hospitals"),
    },
    {
      label: "Blood Inventory",
      icon: Droplet,
      href: "/admin/inventory",
      active: isActive("/admin/inventory"),
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/admin/reports",
      active: isActiveParent(["/admin/reports"]),
      // ✅ Make the parent clickable by adding the href
      children: [
        {
          label: "Requests",
          icon: Bell,
          href: "/admin/reports/requests",
          active: isActive("/admin/reports/requests"),
        },
        {
          label: "Donations",
          icon: Droplet,
          href: "/admin/reports/donations",
          active: isActive("/admin/reports/donations"),
        },
        {
          label: "Analytics",
          icon: Settings,
          href: "/admin/reports/analytics",
          active: isActive("/admin/reports/analytics"),
        },
      ],
    },
  ];

  const getUserInitials = () => {
    return userName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
          bg-white dark:bg-zinc-900
          border-r border-zinc-200/60 dark:border-zinc-800/60
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-200 dark:shadow-red-900/30">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                RedPulse
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wider uppercase">
                Admin Panel
              </p>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.label.toLowerCase());

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  {/* Parent item - now clickable */}
                  <Link
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                      // Toggle expansion when clicked
                      toggleExpand(item.label.toLowerCase());
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 rounded-xl
                      transition-all duration-200 group
                      ${item.active || isActiveParent(item.children?.map(c => c.href) || [])
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 transition-colors ${
                        item.active || isActiveParent(item.children?.map(c => c.href) || [])
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                      }`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpand(item.label.toLowerCase());
                      }}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </Link>

                  {isExpanded && (
                    <div className="ml-9 space-y-1 border-l-2 border-zinc-200/60 dark:border-zinc-800/60 pl-3">
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
                              ${child.active
                                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
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
                  ${item.active
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-colors ${
                  item.active
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                }`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-4 border-t border-zinc-200/60 dark:border-zinc-800/60" />
        </nav>

        {/* User Profile */}
        <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 p-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold text-sm">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                Administrator
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition text-red-500 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}