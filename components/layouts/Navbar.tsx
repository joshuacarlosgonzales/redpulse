// components/layouts/Navbar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Settings,
  Search,
  LogOut,
  Heart,
  Moon,
  Sun,
  HelpCircle,
  UserCircle,
  ChevronDown,
} from "lucide-react";

import AdminNotification from "@/components/AdminNotif/AdminNotification";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [userName, setUserName] = useState("John Doe");
  const [userEmail, setUserEmail] = useState("admin@redpulse.com");
  const [userRole, setUserRole] = useState("admin");

  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  /* =========================================================
     LOAD USER
  ========================================================= */

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      return;
    }

    try {
      const userData = JSON.parse(user);

      if (userData.fullName) {
        setUserName(userData.fullName);
      }

      if (userData.email) {
        setUserEmail(userData.email);
      }

      if (userData.role) {
        setUserRole(userData.role);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  /* =========================================================
     LOAD THEME
  ========================================================= */

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("redpulse-theme");
    
    const shouldBeDark = savedTheme === "dark" || 
      (savedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setIsDarkMode(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  /* =========================================================
     FETCH UNREAD COUNT
  ========================================================= */

  useEffect(() => {
    if (userRole === "admin") {
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch("/api/admin/notifications/unread-count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch unread count: ${response.status}`);
        return;
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.warn("Error fetching unread count:", error);
    }
  };

  /* =========================================================
     PAGE TITLE
  ========================================================= */

  const getPageTitle = () => {
    const path =
      pathname?.split("/").filter(Boolean).pop() ||
      "dashboard";

    return (
      path.charAt(0).toUpperCase() +
      path.slice(1).replace(/-/g, " ")
    );
  };

  /* =========================================================
     DARK MODE
  ========================================================= */

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("redpulse-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("redpulse-theme", "light");
    }

    document.dispatchEvent(new Event("themechange"));
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userData");

    sessionStorage.clear();

    document.cookie
      .split(";")
      .forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(
            /=.*/,
            `=;expires=${new Date().toUTCString()};path=/`
          );
      });

    window.location.href = "/";
  };

  /* =========================================================
     USER INITIALS
  ========================================================= */

  const getUserInitials = () => {
    const initials = userName
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return initials || "AD";
  };

  /* =========================================================
     USER ROLE
  ========================================================= */

  const getRoleName = () => {
    switch (userRole) {
      case "admin":
        return "Administrator";
      case "hospital":
        return "Hospital Admin";
      case "donor":
        return "Donor";
      default:
        return "User";
    }
  };

  /* =========================================================
     PROFILE ROUTES
  ========================================================= */

  const profilePath = `/${userRole}/profile`;
  const settingsPath = `/${userRole}/settings`;

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/90">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="hidden sm:block">
              <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mt-1 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-9 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/90">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">

          {/* LEFT */}
          <div className="flex items-center gap-3">

            {/* ✅ HAMBURGER MENU - Always visible now */}
            <button
              type="button"
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 shadow-sm shadow-red-200 dark:shadow-red-900/30">
                <Heart
                  className="h-4 w-4 text-white"
                  fill="currentColor"
                />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                RedPulse
              </span>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                RedPulse Administration
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1 sm:gap-2">

            <div className="hidden md:flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-900">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-28 border-0 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 lg:w-44 dark:text-zinc-200"
              />
              <kbd className="hidden rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-400 lg:block dark:border-zinc-700 dark:bg-zinc-800">
                ⌘K
              </kbd>
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-[18px] w-[18px] text-zinc-500 dark:text-zinc-300" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-zinc-500 dark:text-zinc-300" />
              )}
            </button>

            {/* NOTIFICATIONS */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px] text-zinc-500 dark:text-zinc-300" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* PROFILE DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="group ml-1 flex items-center gap-2 rounded-lg p-1.5 outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-zinc-800"
                    aria-label="Open profile menu"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      {getUserInitials()}
                    </div>
                    <div className="hidden min-w-0 text-left md:block">
                      <p className="max-w-32 truncate text-sm font-medium leading-none text-zinc-900 dark:text-white">
                        {userName}
                      </p>
                      <p className="mt-1 text-[11px] leading-none text-zinc-500 dark:text-zinc-400">
                        {getRoleName()}
                      </p>
                    </div>
                    <ChevronDown className="hidden h-4 w-4 text-zinc-400 transition-transform group-data-[state=open]:rotate-180 md:block" />
                  </button>
                }
              />

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 rounded-xl"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {getUserInitials()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                          {userName}
                        </p>
                        <p className="truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    render={
                      <Link href={profilePath} />
                    }
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={
                      <Link href={settingsPath} />
                    }
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={
                      <Link href="/help" />
                    }
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950/30 dark:focus:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ADMIN NOTIFICATIONS */}
      <AdminNotification
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}