"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  MailCheck,
  Loader2,
  Calendar,
  Droplet,
  X,
  RefreshCw,
  Clock,
  Package,
  ChevronRight,
} from "lucide-react";

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
    | "LOW_INVENTORY"
    | string;

  category?: "info" | "success" | "warning" | "error";

  isRead: boolean;

  createdAt: string;

  sender?: string;

  link?: string;

  hospitalName?: string;

  action?: {
    type: "organize_drive" | "approve" | "reject" | string;
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
    daysUntilExpiry?: number | null;
    daysOverdue?: number | null;
    batchNumber?: string;
    expirationDate?: string;
    inventoryId?: string;
    requiresBloodDrive?: boolean;
  };
}

interface HospitalNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

type Severity = "critical" | "warning" | "success" | "info";

const SEVERITY_STYLES: Record<
  Severity,
  {
    text: string;
    dot: string;
    bg: string;
    border: string;
    badge: string;
  }
> = {
  critical: {
    text: "text-rose-400",
    dot: "bg-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    badge: "bg-rose-500/10 text-rose-300",
  },

  warning: {
    text: "text-amber-400",
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-300",
  },

  success: {
    text: "text-emerald-400",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-300",
  },

  info: {
    text: "text-sky-400",
    dot: "bg-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    badge: "bg-sky-500/10 text-sky-300",
  },
};

function getNotificationMeta(type: string, severity?: string) {
  const normalizedSeverity =
    severity === "critical"
      ? "critical"
      : type === "success"
      ? "success"
      : type === "warning"
      ? "warning"
      : type === "error" ||
        type === "BLOOD_DRIVE_NEEDED" ||
        type === "CRITICAL_INVENTORY"
      ? "critical"
      : type === "LOW_INVENTORY"
      ? "warning"
      : "info";

  if (
    type === "BLOOD_DRIVE_NEEDED" ||
    type === "CRITICAL_INVENTORY"
  ) {
    return {
      label: "Critical Inventory",
      severity: "critical" as Severity,
      icon: AlertTriangle,
    };
  }

  if (type === "LOW_INVENTORY") {
    return {
      label: "Low Inventory",
      severity: "warning" as Severity,
      icon: AlertTriangle,
    };
  }

  if (type === "success") {
    return {
      label: "Success",
      severity: "success" as Severity,
      icon: CheckCircle,
    };
  }

  if (type === "warning") {
    return {
      label: "Warning",
      severity: "warning" as Severity,
      icon: AlertTriangle,
    };
  }

  if (type === "error") {
    return {
      label: "Error",
      severity: "critical" as Severity,
      icon: AlertCircle,
    };
  }

  return {
    label: "Information",
    severity: normalizedSeverity as Severity,
    icon: Info,
  };
}

export default function HospitalNotification({
  isOpen,
  onClose,
  onRefresh: externalRefresh,
}: HospitalNotificationProps) {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view notifications");
        return;
      }

      const response = await fetch(
        "/api/hospital/notifications?limit=50",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        setError("Session expired. Please login again.");
        return;
      }

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error ||
            "Failed to fetch notifications"
        );
      }

      const data = await response.json();

      const formattedNotifications: Notification[] = (
        Array.isArray(data.data) ? data.data : []
      ).map((notif: any, index: number) => ({
        ...notif,

        id:
          notif._id ||
          notif.id ||
          `notification-${index}`,

        _id: notif._id || notif.id,

        data: notif.data || {},

        action: notif.action || undefined,
      }));

      setNotifications(formattedNotifications);

      setUnreadCount(
        typeof data.unreadCount === "number"
          ? data.unreadCount
          : formattedNotifications.filter(
              (notification) =>
                !notification.isRead
            ).length
      );
    } catch (error) {
      console.error(
        "Error fetching hospital notifications:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // EFFECT
  // ============================================================

  useEffect(() => {
    if (!isOpen) return;

    fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // ============================================================
  // ESCAPE KEY
  // ============================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, onClose]);

  // ============================================================
  // BODY SCROLL
  // ============================================================

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ============================================================
  // MARK AS READ
  // ============================================================

  const markAsRead = async (
    notificationId: string,
    link?: string
  ) => {
    if (!notificationId) return;

    try {
      setActionLoading(notificationId);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to continue");
        return;
      }

      const response = await fetch(
        `/api/hospital/notifications/${notificationId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "markAsRead",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark notification as read"
        );
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
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

      if (link) {
        onClose();
        router.push(link);
      }
    } catch (error) {
      console.error(
        "Error marking notification as read:",
        error
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to continue");
        return;
      }

      const response = await fetch(
        "/api/hospital/notifications/mark-all",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark all notifications as read"
        );
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
        "Error marking all notifications as read:",
        error
      );
    }
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    if (externalRefresh) {
      externalRefresh();
      return;
    }

    await fetchNotifications();
  };

  // ============================================================
  // NOTIFICATION CLICK
  // ============================================================

  const handleNotificationClick = (
    notification: Notification
  ) => {
    if (!notification.isRead) {
      markAsRead(
        notification.id,
        notification.link
      );
      return;
    }

    if (notification.link) {
      onClose();
      router.push(notification.link);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    const now = new Date();

    const diffMs =
      now.getTime() - date.getTime();

    const diffMinutes = Math.floor(
      diffMs / 60000
    );

    const diffHours = Math.floor(
      diffMs / 3600000
    );

    const diffDays = Math.floor(
      diffMs / 86400000
    );

    if (diffMinutes < 1) {
      return "Just now";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // BLOOD DRIVE
  // ============================================================

  const isBloodDriveNotification = (
    notification: Notification
  ) => {
    return (
      notification.type ===
        "BLOOD_DRIVE_NEEDED" ||
      notification.action?.type ===
        "organize_drive" ||
      notification.data?.requiresBloodDrive ===
        true
    );
  };

  // ============================================================
  // CLOSE
  // ============================================================

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="shrink-0 border-b border-zinc-800 bg-zinc-950 px-6 pt-5">
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
                <Bell className="h-4.5 w-4.5 text-rose-400" />
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
                  Notification Center
                </h3>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Blood inventory alerts and hospital updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Refresh */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                title="Refresh notifications"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Header Stats */}
          <div className="flex items-center justify-between border-t border-zinc-800/70 pt-3 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Notifications
              </span>

              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
              >
                <MailCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* CONTENT */}
        {/* ================================================== */}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Loading */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 className="mb-3 h-6 w-6 animate-spin" />

              <p className="text-sm">
                Loading notifications...
              </p>
            </div>
          ) : error ? (
            /* Error */
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
                <AlertCircle className="h-6 w-6 text-rose-400" />
              </div>

              <h4 className="text-sm font-medium text-zinc-200">
                Couldn't load notifications
              </h4>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchNotifications}
                className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            /* Empty */
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900">
                <BellOff className="h-6 w-6 text-zinc-600" />
              </div>

              <h4 className="text-sm font-medium text-zinc-200">
                You're all caught up
              </h4>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                New blood inventory alerts and
                system notifications will appear
                here.
              </p>
            </div>
          ) : (
            /* Notification List */
            <div className="space-y-2.5">
              {notifications.map(
                (notification, index) => {
                  const notificationId =
                    notification.id ||
                    notification._id ||
                    `notification-${index}`;

                  const isUnread =
                    !notification.isRead;

                  const isBloodDrive =
                    isBloodDriveNotification(
                      notification
                    );

                  const isCritical =
                    notification.type ===
                      "CRITICAL_INVENTORY" ||
                    notification.data
                      ?.severity === "critical" ||
                    notification.type ===
                      "BLOOD_DRIVE_NEEDED";

                  const meta =
                    getNotificationMeta(
                      notification.type,
                      notification.data
                        ?.severity
                    );

                  const styles =
                    SEVERITY_STYLES[
                      meta.severity
                    ];

                  const TypeIcon =
                    isBloodDrive
                      ? Calendar
                      : meta.icon;

                  const isActionLoading =
                    actionLoading ===
                    notificationId;

                  return (
                    <div
                      key={notificationId}
                      className={`rounded-xl border p-4 transition ${
                        isUnread
                          ? isBloodDrive
                            ? "border-rose-500/30 bg-rose-500/[0.04]"
                            : "border-zinc-800 bg-zinc-900/50"
                          : "border-zinc-800/60 bg-transparent opacity-75"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.bg}`}
                        >
                          <TypeIcon
                            className={`h-4 w-4 ${styles.text}`}
                          />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          {/* Top Row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wider ${styles.text}`}
                                >
                                  {meta.label}
                                </span>

                                {isUnread && (
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                                  />
                                )}
                              </div>

                              <h4 className="mt-1 text-sm font-semibold text-zinc-100">
                                {notification.subject ||
                                  "Notification"}
                              </h4>
                            </div>

                            <span className="shrink-0 whitespace-nowrap text-[11px] text-zinc-600">
                              {formatDate(
                                notification.createdAt
                              )}
                            </span>
                          </div>

                          {/* Message */}
                          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                            {notification.message ||
                              "No message available."}
                          </p>

                          {/* Blood Drive Details */}
                          {isBloodDrive &&
                            notification.data && (
                              <div className="mt-3 rounded-lg border border-rose-500/15 bg-rose-500/[0.04] p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Droplet className="h-4 w-4 text-rose-400" />

                                    <span className="text-sm font-semibold text-zinc-200">
                                      Blood Supply
                                    </span>
                                  </div>

                                  <span
                                    className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles.badge}`}
                                  >
                                    {isCritical
                                      ? "Critical"
                                      : "Urgent"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  <div className="rounded-md bg-zinc-900/70 p-2">
                                    <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                                      Blood Type
                                    </p>

                                    <p className="mt-0.5 text-sm font-semibold text-rose-400">
                                      {notification
                                        .data
                                        .bloodType ||
                                        "Unknown"}
                                    </p>
                                  </div>

                                  <div className="rounded-md bg-zinc-900/70 p-2">
                                    <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                                      Current
                                    </p>

                                    <p className="mt-0.5 text-sm font-semibold text-zinc-200">
                                      {notification
                                        .data
                                        .units ||
                                        0}{" "}
                                      units
                                    </p>
                                  </div>

                                  <div className="rounded-md bg-zinc-900/70 p-2">
                                    <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                                      Minimum
                                    </p>

                                    <p className="mt-0.5 text-sm font-semibold text-zinc-200">
                                      {notification
                                        .data
                                        .minRequired ||
                                        0}{" "}
                                      units
                                    </p>
                                  </div>

                                  <div className="rounded-md bg-zinc-900/70 p-2">
                                    <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                                      Status
                                    </p>

                                    <p
                                      className={`mt-0.5 text-sm font-semibold ${styles.text}`}
                                    >
                                      {isCritical
                                        ? "Critical"
                                        : "Low"}
                                    </p>
                                  </div>
                                </div>

                                {/* Expiration */}
                                {notification
                                  .data
                                  .daysUntilExpiry !==
                                  undefined &&
                                  notification.data
                                    .daysUntilExpiry !==
                                    null && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                                      <Clock className="h-3.5 w-3.5" />

                                      <span
                                        className={
                                          notification
                                            .data
                                            .daysUntilExpiry <=
                                          3
                                            ? "text-rose-400"
                                            : "text-amber-400"
                                        }
                                      >
                                        Expires in{" "}
                                        {
                                          notification
                                            .data
                                            .daysUntilExpiry
                                        }{" "}
                                        day(s)
                                      </span>
                                    </div>
                                  )}
                              </div>
                            )}

                          {/* Footer */}
                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                            {notification.sender && (
                              <span className="text-[11px] text-zinc-600">
                                From{" "}
                                {
                                  notification.sender
                                }
                              </span>
                            )}

                            {notification.hospitalName && (
                              <span className="text-[11px] text-zinc-600">
                                Hospital:{" "}
                                {
                                  notification.hospitalName
                                }
                              </span>
                            )}

                            {notification.link && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleNotificationClick(
                                    notification
                                  )
                                }
                                className="ml-auto flex items-center gap-1 text-xs font-medium text-rose-400 transition hover:text-rose-300"
                              >
                                View details
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Mark Read / Blood Drive */}
                            {isUnread && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  if (
                                    isBloodDrive
                                  ) {
                                    const confirmed =
                                      window.confirm(
                                        `Mark this notification as read and go to Blood Drives to create a blood drive for ${
                                          notification
                                            .data
                                            ?.bloodType ||
                                          "blood"
                                        }?`
                                      );

                                    if (
                                      !confirmed
                                    ) {
                                      return;
                                    }

                                    markAsRead(
                                      notificationId,
                                      "/hospital/blood-drives"
                                    );

                                    return;
                                  }

                                  markAsRead(
                                    notificationId,
                                    notification.link
                                  );
                                }}
                                disabled={
                                  isActionLoading
                                }
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isBloodDrive
                                    ? "bg-rose-600 text-white hover:bg-rose-500"
                                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                                }`}
                              >
                                {isActionLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isBloodDrive ? (
                                  <>
                                    <Calendar className="h-3.5 w-3.5" />
                                    Create Blood Drive
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Mark read
                                  </>
                                )}
                              </button>
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
      </div>
    </div>
  );
}