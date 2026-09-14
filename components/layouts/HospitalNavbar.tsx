"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Building,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Search,
  X,
  ChevronRight,
  Calendar,
  Droplet,
  AlertTriangle,
  Loader2,
  BellOff,
  MailCheck,
  Info,
  Heart,
  UserCircle,
} from "lucide-react";

interface HospitalProfile {
  id: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  hospitalLicense: string;
  hospitalType: string;
  status: "active" | "pending" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: string;
  _id?: string;
  subject: string;
  message: string;
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "BLOOD_DRIVE_NEEDED"
    | "CRITICAL_INVENTORY"
    | "LOW_INVENTORY";
  category?: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  sender?: string;
  link?: string;

  action?: {
    type: "organize_drive" | "approve" | "reject";
    entity: string;
    id: string;
    bloodType?: string;
    units?: number;
    minRequired?: number;
    hospitalName?: string;
    severity?: string;
  };

  data?: {
    bloodType?: string;
    units?: number;
    minRequired?: number;
    hospitalName?: string;
    severity?: string;
    daysUntilExpiry?: number;
    batchNumber?: string;
  };

  hospitalName?: string;
}

interface HospitalNavbarProps {
  onMenuClick?: () => void;
}

export function HospitalNavbar({
  onMenuClick,
}: HospitalNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);

  const [isAllNotificationsOpen, setIsAllNotificationsOpen] =
    useState(false);

  const [profile, setProfile] =
    useState<HospitalProfile | null>(null);

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const [showSetupNotification, setShowSetupNotification] =
    useState(false);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [allNotificationsLoading, setAllNotificationsLoading] =
    useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     FETCH NOTIFICATIONS
  ========================================================= */

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        "/api/hospital/notifications?limit=50",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(
          `Failed to fetch hospital notifications: ${response.status}`
        );
        return;
      }

      const data = await response.json();

      const formatted = (data.data || []).map(
        (notif: any, index: number) => ({
          ...notif,
          id:
            notif?._id?.toString() ||
            notif?.id?.toString() ||
            `notification-${index}`,
        })
      );

      setNotifications(formatted);

      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      } else {
        setUnreadCount(
          formatted.filter(
            (notification: Notification) =>
              !notification.isRead
          ).length
        );
      }
    } catch (error) {
      console.error(
        "Error fetching notifications:",
        error
      );
    }
  };

  /* =========================================================
     FETCH USER
  ========================================================= */

  const fetchUser = async () => {
    try {
      const userStr = localStorage.getItem("user");

      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error(
        "Error fetching user:",
        error
      );
    }
  };

  /* =========================================================
     FETCH PROFILE
  ========================================================= */

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        "/api/hospital/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.data) {
          setProfile(data.data);
        }
      }
    } catch (error) {
      console.error(
        "Error fetching hospital profile:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    setMounted(true);

    fetchUser();
    fetchProfile();
    fetchNotifications();

    const savedTheme =
      localStorage.getItem("redpulse-theme") ||
      localStorage.getItem("theme");

    const shouldBeDark =
      savedTheme === "dark" ||
      (savedTheme === "system" &&
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches);

    setIsDarkMode(shouldBeDark);

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const interval = setInterval(
      fetchNotifications,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     SETUP NOTIFICATION
  ========================================================= */

  useEffect(() => {
    if (!loading && profile) {
      if (
        !profile.hospitalName ||
        profile.status === "pending" ||
        profile.status === "inactive"
      ) {
        setShowSetupNotification(true);
      } else {
        setShowSetupNotification(false);
      }
    }
  }, [loading, profile]);

  /* =========================================================
     CLICK OUTSIDE
  ========================================================= */

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

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
     MARK AS READ
  ========================================================= */

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `/api/hospital/notifications/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "markAsRead",
          }),
        }
      );

      if (!response.ok) {
        return;
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((prev) =>
        Math.max(0, prev - 1)
      );
    } catch (error) {
      console.error(
        "Error marking notification as read:",
        error
      );
    }
  };

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        "/api/hospital/notifications/mark-all",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Error marking all as read:",
        error
      );
    }
  };

  /* =========================================================
     NOTIFICATION CLICK
  ========================================================= */

  const handleNotificationClick = (
    notification: Notification
  ) => {
    setIsNotificationsOpen(false);

    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  /* =========================================================
     VIEW ALL NOTIFICATIONS
  ========================================================= */

  const handleViewAllNotifications = async () => {
    setIsNotificationsOpen(false);
    setIsAllNotificationsOpen(true);

    setAllNotificationsLoading(true);

    try {
      await fetchNotifications();
    } finally {
      setAllNotificationsLoading(false);
    }
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
     DARK MODE
  ========================================================= */

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;

    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem(
      "redpulse-theme",
      newDarkMode ? "dark" : "light"
    );

    localStorage.setItem(
      "theme",
      newDarkMode ? "dark" : "light"
    );

    document.dispatchEvent(
      new Event("themechange")
    );
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const getInitials = (name: string) => {
    if (!name) return "H";

    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";

      case "pending":
        return "text-yellow-600 dark:text-yellow-400";

      case "inactive":
        return "text-red-600 dark:text-red-400";

      default:
        return "text-zinc-500 dark:text-zinc-400";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";

      case "pending":
        return "bg-yellow-500";

      case "inactive":
        return "bg-red-500";

      default:
        return "bg-zinc-400";
    }
  };

  const navigateToSettings = (tab?: string) => {
    if (tab) {
      router.push(
        `/hospital/settings?tab=${tab}`
      );
    } else {
      router.push("/hospital/settings");
    }

    setIsProfileOpen(false);
  };

  const isBloodDriveNotification = (
    notification: Notification
  ) => {
    return (
      notification.action?.type ===
        "organize_drive" ||
      notification.type ===
        "BLOOD_DRIVE_NEEDED"
    );
  };

  const isCriticalNotification = (
    notification: Notification
  ) => {
    return (
      notification.type ===
        "BLOOD_DRIVE_NEEDED" ||
      notification.type ===
        "CRITICAL_INVENTORY" ||
      notification.data?.severity ===
        "critical"
    );
  };

  const getNotificationIcon = (
    type: string
  ) => {
    if (
      type === "BLOOD_DRIVE_NEEDED" ||
      type === "CRITICAL_INVENTORY" ||
      type === "LOW_INVENTORY"
    ) {
      return (
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      );
    }

    switch (type) {
      case "success":
        return (
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        );

      case "error":
        return (
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        );

      case "warning":
        return (
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        );

      default:
        return (
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        );
    }
  };

  const getNotificationColor = (
    notification: Notification
  ) => {
    if (
      notification.type ===
        "BLOOD_DRIVE_NEEDED" ||
      notification.type ===
        "CRITICAL_INVENTORY" ||
      notification.type ===
        "LOW_INVENTORY"
    ) {
      return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
    }

    switch (notification.type) {
      case "success":
        return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";

      case "error":
        return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";

      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";

      default:
        return "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800";
    }
  };

  const formatDate = (
    dateString: string
  ) => {
    if (!dateString) {
      return "Unknown date";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    const now = new Date();

    const diffMs =
      now.getTime() -
      date.getTime();

    const diffMins = Math.floor(
      diffMs / 60000
    );

    const diffHours = Math.floor(
      diffMs / 3600000
    );

    const diffDays = Math.floor(
      diffMs / 86400000
    );

    if (diffMins < 1) {
      return "Just now";
    }

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString();
  };

  /* =========================================================
     HYDRATION / LOADING
  ========================================================= */

  if (!mounted || loading) {
    return (
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/90">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />

            <div className="hidden sm:block">
              <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-700 rounded mt-1 animate-pulse" />
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

  /* =========================================================
     MAIN NAVBAR
  ========================================================= */

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/90">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="flex items-center gap-3">

            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            </button>

            {/* MOBILE BRAND */}
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

            {/* PAGE TITLE */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                {getPageTitle()}
              </h1>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                RedPulse Hospital
              </p>
            </div>
          </div>

          {/* =================================================
              RIGHT
          ================================================= */}

          <div className="flex items-center gap-1 sm:gap-2">

            {/* SETUP NOTICE */}

            {showSetupNotification &&
              !profile?.hospitalName && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSetupNotification(false);
                    navigateToSettings("setup");
                  }}
                  className="hidden lg:flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs text-yellow-700 transition hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300 dark:hover:bg-yellow-950/50"
                >
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />

                  <span>
                    Setup your hospital
                  </span>

                  <ChevronRight className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                </button>
              )}

            {/* SEARCH */}

            <div className="hidden md:flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-900">
              <Search className="h-4 w-4 text-zinc-400" />

              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                className="w-28 border-0 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 lg:w-44 dark:text-zinc-200"
              />

              <kbd className="hidden rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-400 lg:block dark:border-zinc-700 dark:bg-zinc-800">
                ⌘K
              </kbd>
            </div>

            {/* DARK MODE */}

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

            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            <div
              ref={notificationRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setIsNotificationsOpen(
                    !isNotificationsOpen
                  )
                }
                className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px] text-zinc-500 dark:text-zinc-300" />

                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}

              {isNotificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() =>
                      setIsNotificationsOpen(false)
                    }
                  />

                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:w-96">

                    {/* HEADER */}

                    <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          Notifications
                        </h3>

                        {unreadCount > 0 && (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {unreadCount} unread
                          </p>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* LIST */}

                    <div className="max-h-96 overflow-y-auto">

                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />

                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications
                          .slice(0, 5)
                          .map((notification) => {
                            const isBloodDrive =
                              isBloodDriveNotification(
                                notification
                              );

                            const isCritical =
                              isCriticalNotification(
                                notification
                              );

                            return (
                              <div
                                key={notification.id}
                                onClick={() =>
                                  handleNotificationClick(
                                    notification
                                  )
                                }
                                className={`cursor-pointer border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                                  !notification.isRead
                                    ? "bg-red-50 dark:bg-red-950/20"
                                    : ""
                                }`}
                              >
                                <div className="flex items-start gap-3">

                                  {/* ICON */}

                                  <div
                                    className={`flex-shrink-0 rounded-full p-1.5 ${
                                      isBloodDrive
                                        ? "bg-red-100 dark:bg-red-900/30"
                                        : notification.type ===
                                          "success"
                                        ? "bg-green-100 dark:bg-green-900/30"
                                        : notification.type ===
                                              "error" ||
                                            notification.type ===
                                              "CRITICAL_INVENTORY"
                                        ? "bg-red-100 dark:bg-red-900/30"
                                        : notification.type ===
                                          "warning"
                                        ? "bg-yellow-100 dark:bg-yellow-900/30"
                                        : "bg-blue-100 dark:bg-blue-900/30"
                                    }`}
                                  >
                                    {isBloodDrive ? (
                                      <Calendar className="h-3 w-3 text-red-600 dark:text-red-400" />
                                    ) : (
                                      getNotificationIcon(
                                        notification.type
                                      )
                                    )}
                                  </div>

                                  {/* CONTENT */}

                                  <div className="min-w-0 flex-1">

                                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                                      {
                                        notification.subject
                                      }
                                    </p>

                                    <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                                      {
                                        notification.message
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                                      {formatDate(
                                        notification.createdAt
                                      )}
                                    </p>

                                    {isBloodDrive &&
                                      notification.data && (
                                        <div className="mt-1 flex items-center gap-2">

                                          <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                                            <Droplet className="h-3 w-3" />

                                            {notification
                                              .data
                                              .bloodType ||
                                              "Blood"}
                                          </span>

                                          {notification
                                            .data
                                            .units !==
                                            undefined && (
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                              {
                                                notification
                                                  .data
                                                  .units
                                              }{" "}
                                              units
                                            </span>
                                          )}

                                          {isCritical && (
                                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                              CRITICAL
                                            </span>
                                          )}
                                        </div>
                                      )}
                                  </div>

                                  {/* UNREAD */}

                                  {!notification.isRead && (
                                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                    {/* VIEW ALL */}

                    {notifications.length > 0 && (
                      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={
                            handleViewAllNotifications
                          }
                          className="w-full rounded-lg py-2 text-center text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* =================================================
                PROFILE
            ================================================= */}

            <div
              ref={profileRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setIsProfileOpen(
                    !isProfileOpen
                  )
                }
                className="group ml-1 flex items-center gap-2 rounded-lg p-1.5 outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-zinc-800"
                aria-label="Open hospital profile menu"
              >

                {/* AVATAR */}

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {profile?.hospitalName
                    ? getInitials(
                        profile.hospitalName
                      )
                    : "H"}
                </div>

                {/* NAME */}

                <div className="hidden min-w-0 text-left md:block">
                  <p className="max-w-32 truncate text-sm font-medium leading-none text-zinc-900 dark:text-white">
                    {profile?.hospitalName ||
                      "Hospital"}
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-[11px] leading-none text-zinc-500 dark:text-zinc-400">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${getStatusDot(
                        profile?.status ||
                          "pending"
                      )}`}
                    />

                    {profile?.status ||
                      "Pending"}
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-zinc-400 transition-transform md:block" />
              </button>

              {/* PROFILE DROPDOWN */}

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() =>
                      setIsProfileOpen(false)
                    }
                  />

                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">

                    {/* PROFILE HEADER */}

                    <div className="p-4">
                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          {profile?.hospitalName
                            ? getInitials(
                                profile.hospitalName
                              )
                            : "H"}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                            {profile?.hospitalName ||
                              "Hospital"}
                          </p>

                          <p className="truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                            {user?.email ||
                              profile?.hospitalEmail ||
                              "hospital@email.com"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-800" />

                    {/* MENU */}

                    <div className="p-2">

                      <button
                        type="button"
                        onClick={() =>
                          navigateToSettings(
                            "setup"
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Building className="h-4 w-4" />

                        <span>
                          Hospital Information
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigateToSettings(
                            "security"
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Settings className="h-4 w-4" />

                        <span>
                          Security Settings
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/help");
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <HelpCircle className="h-4 w-4" />

                        <span>
                          Help & Support
                        </span>
                      </button>
                    </div>

                    {/* LOGOUT */}

                    <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-4 w-4" />

                        <span>
                          Logout
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =======================================================
          ALL NOTIFICATIONS MODAL
      ======================================================= */}

      {isAllNotificationsOpen && (
        <div className="fixed inset-0 z-[100]">

          {/* BACKDROP */}

          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              setIsAllNotificationsOpen(false)
            }
          />

          {/* MODAL CONTAINER */}

          <div className="relative z-10 flex min-h-screen items-start justify-center overflow-y-auto p-4 sm:p-6 md:p-10">

            <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">

              {/* HEADER */}

              <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/95">

                <div className="flex items-center justify-between p-4 sm:p-5">

                  <div className="flex items-center gap-3">

                    <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                      <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white sm:text-xl">
                        All Notifications
                      </h2>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                        {unreadCount > 0
                          ? `You have ${unreadCount} unread notification${
                              unreadCount >
                              1
                                ? "s"
                                : ""
                            }`
                          : "All caught up!"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 sm:flex"
                      >
                        <MailCheck className="h-4 w-4" />
                        Mark all as read
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setIsAllNotificationsOpen(
                          false
                        )
                      }
                      className="rounded-lg p-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Close notifications"
                    >
                      <X className="h-5 w-5 text-zinc-500" />
                    </button>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="w-full border-t border-zinc-200 py-2.5 text-xs font-medium text-red-600 dark:border-zinc-800 sm:hidden"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* BODY */}

              <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6">

                {allNotificationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-red-500" />

                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">

                    <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                      <BellOff className="h-10 w-10 text-zinc-400" />
                    </div>

                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      No notifications
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      You're all caught up! Check back later.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">

                    {notifications.map(
                      (notification) => {
                        const isBloodDrive =
                          isBloodDriveNotification(
                            notification
                          );

                        const isCritical =
                          isCriticalNotification(
                            notification
                          );

                        return (
                          <div
                            key={notification.id}
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                            className={`cursor-pointer rounded-xl border p-4 transition hover:shadow-md ${
                              !notification.isRead
                                ? isBloodDrive
                                  ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30"
                                  : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                            }`}
                          >
                            <div className="flex items-start gap-4">

                              {/* ICON */}

                              <div
                                className={`flex-shrink-0 rounded-lg border p-2 ${getNotificationColor(
                                  notification
                                )}`}
                              >
                                {isBloodDrive ? (
                                  <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                                ) : (
                                  getNotificationIcon(
                                    notification.type
                                  )
                                )}
                              </div>

                              {/* CONTENT */}

                              <div className="min-w-0 flex-1">

                                <div className="flex items-start justify-between gap-3">

                                  <div className="min-w-0">

                                    <div className="flex flex-wrap items-center gap-2">

                                      <h4 className="font-semibold text-zinc-900 dark:text-white">
                                        {
                                          notification.subject
                                        }
                                      </h4>

                                      {!notification.isRead && (
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                            isBloodDrive
                                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                          }`}
                                        >
                                          {isBloodDrive
                                            ? "ACTION REQUIRED"
                                            : "NEW"}
                                        </span>
                                      )}
                                    </div>

                                    <p className="mt-1 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                                      {
                                        notification.message
                                      }
                                    </p>

                                    {/* BLOOD DETAILS */}

                                    {isBloodDrive &&
                                      notification.data && (
                                        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-50/70 p-3 dark:bg-red-950/20">

                                          <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                                            <Droplet className="h-4 w-4" />

                                            {notification
                                              .data
                                              .bloodType ||
                                              "Blood"}
                                          </span>

                                          {notification
                                            .data
                                            .units !==
                                            undefined && (
                                            <>
                                              <span className="text-zinc-300 dark:text-zinc-600">
                                                |
                                              </span>

                                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                Current:{" "}
                                                {
                                                  notification
                                                    .data
                                                    .units
                                                }{" "}
                                                units
                                              </span>
                                            </>
                                          )}

                                          {notification
                                            .data
                                            .minRequired !==
                                            undefined && (
                                            <>
                                              <span className="text-zinc-300 dark:text-zinc-600">
                                                |
                                              </span>

                                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                Min:{" "}
                                                {
                                                  notification
                                                    .data
                                                    .minRequired
                                                }{" "}
                                                units
                                              </span>
                                            </>
                                          )}

                                          {notification
                                            .data
                                            .daysUntilExpiry !==
                                            undefined && (
                                            <>
                                              <span className="text-zinc-300 dark:text-zinc-600">
                                                |
                                              </span>

                                              <span
                                                className={`text-sm ${
                                                  notification
                                                    .data
                                                    .daysUntilExpiry <=
                                                  3
                                                    ? "text-red-500"
                                                    : "text-yellow-500"
                                                }`}
                                              >
                                                ⏰{" "}
                                                {
                                                  notification
                                                    .data
                                                    .daysUntilExpiry
                                                }{" "}
                                                days left
                                              </span>
                                            </>
                                          )}

                                          <span
                                            className={`ml-auto rounded-full px-2 py-1 text-[10px] font-bold ${
                                              isCritical
                                                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                                : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            }`}
                                          >
                                            {isCritical
                                              ? "CRITICAL"
                                              : "URGENT"}
                                          </span>
                                        </div>
                                      )}

                                    {/* META */}

                                    <div className="mt-3 flex flex-wrap items-center gap-2">

                                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                        {formatDate(
                                          notification.createdAt
                                        )}
                                      </span>

                                      {notification.sender && (
                                        <>
                                          <span className="text-zinc-300 dark:text-zinc-600">
                                            •
                                          </span>

                                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            From:{" "}
                                            {
                                              notification.sender
                                            }
                                          </span>
                                        </>
                                      )}

                                      {notification.hospitalName && (
                                        <>
                                          <span className="text-zinc-300 dark:text-zinc-600">
                                            •
                                          </span>

                                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Hospital:{" "}
                                            {
                                              notification.hospitalName
                                            }
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {!notification.isRead && (
                                    <div className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER */}

              <div className="flex justify-end border-t border-zinc-200 p-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() =>
                    setIsAllNotificationsOpen(false)
                  }
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}