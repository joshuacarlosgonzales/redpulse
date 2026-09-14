// components/AdminNotif/AdminNotification.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  MailCheck,
  X,
  Clock,
  Check,
  X as XIcon,
  RefreshCw,
  Droplet,
  Package,
  Calendar,
  ChevronDown,
  ChevronRight,
  XCircle,
} from "lucide-react";

export type NotificationType =
  | "NEW_REQUEST"
  | "REQUEST_APPROVED"
  | "REQUEST_DECLINED"
  | "LOW_INVENTORY"
  | "CRITICAL_INVENTORY"
  | "EXPIRING_BLOOD"
  | "EXPIRED_BLOOD"
  | "NEW_DONOR"
  | "NEW_HOSPITAL"
  | "NEW_BLOOD_DRIVE"
  | "NEW_DONATION"
  | "NEW_BLOOD_REQUEST"
  | "PENDING_BLOOD_REQUEST"
  | "info"
  | "success"
  | "warning"
  | "error";

export interface Notification {
  id: string;
  _id?: string;
  userId?: string;
  donorId?: string;
  hospitalId?: string;

  donorName?: string;
  donorEmail?: string;
  hospitalName?: string;

  subject: string;
  message: string;

  type: NotificationType;

  category?: "info" | "success" | "warning" | "error";

  isRead: boolean;
  readAt?: string;

  sender: string;
  sentBy?: string;

  link?: string;
  relatedId?: string;
  relatedModel?: string;

  data?: Record<string, any>;

  createdAt: string;
  updatedAt?: string;

  /*
   * IMPORTANT:
   * Your backend currently does NOT allow "organize_drive"
   * in action.type.
   *
   * Therefore only use the action types that your backend
   * already accepts.
   */
  action?: {
    type: "approve" | "reject";
    id: string;
    entity: "hospital" | "donor" | "blood_drive" | "request";
    bloodType?: string;
    units?: number;
    minRequired?: number;
    hospitalName?: string;
    severity?: string;
  };
}

interface InventoryAlert {
  id: string;
  _id?: string;

  hospitalId: string;
  hospitalName: string;

  bloodType: string;

  units: number;
  minRequired: number;

  status: string;

  severity: "critical" | "warning" | "info";

  message: string;

  daysUntilExpiry?: number | null;
  daysOverdue?: number | null;

  batchNumber?: string;
  expirationDate?: string;

  createdAt: string;
}

interface InventoryAlertsData {
  lowStock: InventoryAlert[];
  criticalStock: InventoryAlert[];
  outOfStock: InventoryAlert[];
  expiringSoon: InventoryAlert[];
  expired: InventoryAlert[];
}

interface AdminNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

// ============================================================
// DESIGN TOKENS
// ============================================================

type Severity = "critical" | "warning" | "success" | "info";

const SEVERITY_STYLES: Record<
  Severity,
  {
    dot: string;
    text: string;
    chipBg: string;
    chipText: string;
    ring: string;
  }
> = {
  critical: {
    dot: "bg-rose-500",
    text: "text-rose-400",
    chipBg: "bg-rose-500/10",
    chipText: "text-rose-300",
    ring: "ring-rose-500/30",
  },

  warning: {
    dot: "bg-amber-500",
    text: "text-amber-400",
    chipBg: "bg-amber-500/10",
    chipText: "text-amber-300",
    ring: "ring-amber-500/30",
  },

  success: {
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    chipBg: "bg-emerald-500/10",
    chipText: "text-emerald-300",
    ring: "ring-emerald-500/30",
  },

  info: {
    dot: "bg-sky-500",
    text: "text-sky-400",
    chipBg: "bg-sky-500/10",
    chipText: "text-sky-300",
    ring: "ring-sky-500/30",
  },
};

// ============================================================
// NOTIFICATION TYPE META
// ============================================================

const TYPE_META: Record<
  string,
  {
    label: string;
    severity: Severity;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  NEW_REQUEST: {
    label: "New Blood Request",
    severity: "warning",
    icon: Droplet,
  },

  REQUEST_APPROVED: {
    label: "Request Approved",
    severity: "success",
    icon: CheckCircle,
  },

  REQUEST_DECLINED: {
    label: "Request Declined",
    severity: "critical",
    icon: XCircle,
  },

  LOW_INVENTORY: {
    label: "Low Blood Inventory",
    severity: "warning",
    icon: AlertTriangle,
  },

  CRITICAL_INVENTORY: {
    label: "Critical Blood Shortage",
    severity: "critical",
    icon: AlertCircle,
  },

  EXPIRING_BLOOD: {
    label: "Blood Expiring Soon",
    severity: "warning",
    icon: Clock,
  },

  EXPIRED_BLOOD: {
    label: "Expired Blood",
    severity: "critical",
    icon: AlertCircle,
  },

  NEW_DONOR: {
    label: "New Donor Registration",
    severity: "info",
    icon: Info,
  },

  NEW_HOSPITAL: {
    label: "New Hospital Registration",
    severity: "info",
    icon: Info,
  },

  NEW_BLOOD_DRIVE: {
    label: "New Blood Drive",
    severity: "info",
    icon: Calendar,
  },

  NEW_DONATION: {
    label: "New Donation Recorded",
    severity: "success",
    icon: Droplet,
  },

  NEW_BLOOD_REQUEST: {
    label: "New Blood Request",
    severity: "warning",
    icon: Droplet,
  },

  PENDING_BLOOD_REQUEST: {
    label: "Pending Blood Request",
    severity: "warning",
    icon: Clock,
  },

  /*
   * BLOOD_DRIVE_NEEDED intentionally removed.
   *
   * The backend rejected it because it is not in
   * the Notification schema enum.
   */

  success: {
    label: "Success",
    severity: "success",
    icon: CheckCircle,
  },

  warning: {
    label: "Warning",
    severity: "warning",
    icon: AlertTriangle,
  },

  error: {
    label: "Error",
    severity: "critical",
    icon: AlertCircle,
  },

  info: {
    label: "Information",
    severity: "info",
    icon: Info,
  },
};

function getTypeMeta(type: string) {
  return (
    TYPE_META[type] || {
      label: "Notification",
      severity: "info" as Severity,
      icon: Bell,
    }
  );
}

// ============================================================
// ALERT SECTION META
// ============================================================

function getAlertSectionMeta(
  type: string
): {
  label: string;
  severity: Severity;
  icon: React.ComponentType<{ className?: string }>;
} {
  switch (type) {
    case "outOfStock":
      return {
        label: "Out of Stock",
        severity: "critical",
        icon: XCircle,
      };

    case "criticalStock":
      return {
        label: "Critical Stock",
        severity: "critical",
        icon: AlertCircle,
      };

    case "lowStock":
      return {
        label: "Low Stock",
        severity: "warning",
        icon: AlertTriangle,
      };

    case "expiringSoon":
      return {
        label: "Expiring Soon",
        severity: "warning",
        icon: Clock,
      };

    case "expired":
      return {
        label: "Expired",
        severity: "critical",
        icon: XCircle,
      };

    default:
      return {
        label: "Alerts",
        severity: "info",
        icon: Bell,
      };
  }
}

// ============================================================
// BLOOD DRIVE MESSAGE
// ============================================================

const generateBloodDriveMessage = (
  alert: InventoryAlert
): string => {
  const severityText =
    alert.severity === "critical"
      ? "🚨 CRITICAL"
      : "⚠️ URGENT";

  const urgencyText =
    alert.severity === "critical"
      ? "IMMEDIATE ACTION REQUIRED: Blood supply is critically low. Please organize a blood drive urgently to prevent shortage."
      : "Action recommended: Blood supply is below minimum levels. Please organize a blood drive to replenish stock.";

  let message = `${severityText} ALERT\n`;

  message += `Hospital: ${alert.hospitalName}\n`;
  message += `Blood Type: ${alert.bloodType}\n`;
  message += `Current Stock: ${alert.units} units\n`;
  message += `Minimum Required: ${alert.minRequired} units\n`;
  message += `Deficit: ${Math.max(
    0,
    alert.minRequired - alert.units
  )} units\n`;

  if (
    alert.daysUntilExpiry !== undefined &&
    alert.daysUntilExpiry !== null &&
    alert.daysUntilExpiry > 0
  ) {
    message += `\n⏰ Expires in: ${alert.daysUntilExpiry} days\n`;
  }

  if (
    alert.daysOverdue !== undefined &&
    alert.daysOverdue !== null &&
    alert.daysOverdue > 0
  ) {
    message += `\n📅 Overdue by: ${alert.daysOverdue} days\n`;
  }

  message += `\n${urgencyText}\n\n`;

  message +=
    `📋 Please go to the Blood Drives section to create ` +
    `a new blood drive event for ${alert.bloodType} blood.`;

  return message;
};

// ============================================================
// COMPONENT
// ============================================================

export default function AdminNotification({
  isOpen,
  onClose,
  onRefresh: externalRefresh,
}: AdminNotificationProps) {
  const [activeTab, setActiveTab] = useState<
    "notifications" | "alerts"
  >("notifications");

  // ============================================================
  // NOTIFICATION STATE
  // ============================================================

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(
    null
  );

  // ============================================================
  // INVENTORY ALERT STATE
  // ============================================================

  const [inventoryAlerts, setInventoryAlerts] =
    useState<InventoryAlertsData>({
      lowStock: [],
      criticalStock: [],
      outOfStock: [],
      expiringSoon: [],
      expired: [],
    });

  const [inventorySummary, setInventorySummary] = useState({
    totalAlerts: 0,
    lowStock: 0,
    criticalStock: 0,
    outOfStock: 0,
    expiringSoon: 0,
    expired: 0,
  });

  const [inventoryLoading, setInventoryLoading] =
    useState(false);

  const [inventoryError, setInventoryError] =
    useState<string | null>(null);

  const [resolvingId, setResolvingId] =
    useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    criticalStock: true,
    outOfStock: true,
    lowStock: true,
    expiringSoon: true,
    expired: true,
  });

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view notifications");
        return;
      }

      const response = await fetch(
        "/api/admin/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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
            `Failed to fetch notifications (${response.status})`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Failed to fetch notifications"
        );
      }

      const formattedNotifications = (
        Array.isArray(data.data) ? data.data : []
      ).map((notif: any) => ({
        ...notif,

        id: notif._id || notif.id,

        _id: notif._id || notif.id,

        userId:
          typeof notif.userId === "object"
            ? notif.userId?._id
            : notif.userId,

        donorId:
          typeof notif.donorId === "object"
            ? notif.donorId?._id
            : notif.donorId,

        donorName:
          notif.donorId?.fullName ||
          notif.donorName ||
          "",

        donorEmail:
          notif.donorId?.email ||
          notif.donorEmail ||
          "",

        userName:
          notif.userId?.fullName ||
          notif.userName ||
          "",

        userEmail:
          notif.userId?.email ||
          notif.userEmail ||
          "",
      }));

      setNotifications(formattedNotifications);

      setUnreadCount(
        typeof data.unreadCount === "number"
          ? data.unreadCount
          : 0
      );
    } catch (error) {
      console.error(
        "Error fetching notifications:",
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
  };

  // ============================================================
  // FETCH INVENTORY ALERTS
  // ============================================================

  const fetchInventoryAlerts = async () => {
    try {
      setInventoryLoading(true);
      setInventoryError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setInventoryError(
          "Please login to view inventory alerts"
        );
        return;
      }

      const response = await fetch(
        "/api/admin/blood-inventory/alerts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        setInventoryError(
          "Session expired. Please login again."
        );
        return;
      }

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error ||
            "Failed to fetch inventory alerts"
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Failed to fetch inventory alerts"
        );
      }

      setInventoryAlerts({
        lowStock: data.data?.lowStock || [],
        criticalStock: data.data?.criticalStock || [],
        outOfStock: data.data?.outOfStock || [],
        expiringSoon: data.data?.expiringSoon || [],
        expired: data.data?.expired || [],
      });

      setInventorySummary({
        totalAlerts: data.summary?.totalAlerts || 0,
        lowStock: data.summary?.lowStock || 0,
        criticalStock:
          data.summary?.criticalStock || 0,
        outOfStock:
          data.summary?.outOfStock || 0,
        expiringSoon:
          data.summary?.expiringSoon || 0,
        expired: data.summary?.expired || 0,
      });
    } catch (error) {
      console.error(
        "Error fetching inventory alerts:",
        error
      );

      setInventoryError(
        error instanceof Error
          ? error.message
          : "Failed to load inventory alerts"
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  // ============================================================
  // RESOLVE ALERT
  // ============================================================
const resolveAlert = async (
  inventoryId: string,
  inventoryAlert: InventoryAlert
) => {
  if (!inventoryId || inventoryId.trim() === "") {
    window.alert(
      "Error: Alert ID is missing. Please refresh and try again."
    );
    return;
  }

  const confirmed = window.confirm(
    `This will notify ${
      inventoryAlert.hospitalName || "the hospital"
    } to organize a blood drive for ${
      inventoryAlert.bloodType || "blood"
    }. Continue?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setResolvingId(inventoryId);

    const token = localStorage.getItem("token");

    if (!token) {
      setInventoryError("Please login to resolve alert");
      return;
    }

    // ========================================================
    // GET HOSPITAL ID
    // ========================================================

    let hospitalId = inventoryAlert.hospitalId;
    let hospitalName = inventoryAlert.hospitalName || "Hospital";

    if (!hospitalId) {
      try {
        const hospitalResponse = await fetch(
          `/api/admin/hospitals/search?name=${encodeURIComponent(
            hospitalName
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (hospitalResponse.ok) {
          const hospitalData = await hospitalResponse.json();

          if (
            Array.isArray(hospitalData.data) &&
            hospitalData.data.length > 0
          ) {
            hospitalId = hospitalData.data[0]._id;
            hospitalName = hospitalData.data[0].hospitalName || hospitalName;
          }
        }
      } catch (searchError) {
        console.error("Hospital lookup error:", searchError);
      }
    }

    if (!hospitalId) {
      window.alert(
        `Could not find hospital "${hospitalName}". Please make sure the hospital is registered.`
      );
      setResolvingId(null);
      return;
    }

    // ========================================================
    // RESOLVE INVENTORY ALERT
    // ========================================================

    const resolveUrl = `/api/admin/blood-inventory/alerts/${inventoryId}/resolve`;

    const resolveResponse = await fetch(resolveUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resolvedBy: "admin",
        resolvedAt: new Date().toISOString(),
      }),
    });

    const resolveText = await resolveResponse.text();

    if (!resolveResponse.ok) {
      let errorMessage = "Failed to resolve inventory alert";

      try {
        const errorData = JSON.parse(resolveText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = resolveText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    console.log("Inventory alert resolved successfully");

    // ========================================================
    // CREATE HOSPITAL NOTIFICATION
    // ========================================================

   const notificationPayload = {
  hospitalId,
  subject: `Blood Drive Needed: ${inventoryAlert.bloodType || 'Blood'} ${inventoryAlert.severity === "critical" ? "Critical" : "Low"} Stock Alert`,
  message: generateBloodDriveMessage(inventoryAlert),
  type: "BLOOD_DRIVE_NEEDED", // ✅ Use this - it's in your model enum
  category: inventoryAlert.severity === "critical" ? "error" : "warning",
  sender: "RedPulse System",
  link: "/hospital/blood-drives",
  // ❌ DO NOT include action field - it causes validation errors
  data: {
    alertType: "BLOOD_DRIVE_NEEDED",
    bloodType: inventoryAlert.bloodType || "Unknown",
    units: inventoryAlert.units || 0,
    minRequired: inventoryAlert.minRequired || 0,
    deficit: Math.max(0, (inventoryAlert.minRequired || 0) - (inventoryAlert.units || 0)),
    hospitalId,
    hospitalName,
    severity: inventoryAlert.severity || "warning",
    daysUntilExpiry: inventoryAlert.daysUntilExpiry ?? null,
    daysOverdue: inventoryAlert.daysOverdue ?? null,
    batchNumber: inventoryAlert.batchNumber ?? null,
    expirationDate: inventoryAlert.expirationDate ?? null,
    inventoryId,
    requiresBloodDrive: true,
  },
};

    console.log("Sending hospital notification:", notificationPayload);

    const notificationResponse = await fetch(
      "/api/admin/notifications/create",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationPayload),
      }
    );

    const notificationText = await notificationResponse.text();

    if (!notificationResponse.ok) {
      let errorMessage = "Failed to send notification";

      try {
        const errorData = JSON.parse(notificationText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = notificationText || errorMessage;
      }

      console.error("Notification creation failed:", errorMessage);

      window.alert(
        `⚠️ Alert resolved but notification failed to send.\n\n` +
          `Error: ${errorMessage}\n\n` +
          `Please manually notify ${hospitalName} to organize a blood drive.`
      );

      await fetchInventoryAlerts();
      setResolvingId(null);
      return;
    }

    console.log("Hospital notification sent successfully");

    // ========================================================
    // REFRESH DATA
    // ========================================================

    await fetchInventoryAlerts();
    await fetchNotifications();

    window.alert(
      `✅ Alert resolved successfully!\n\n` +
        `${hospitalName} has been notified to organize a blood drive.`
    );
  } catch (error) {
    console.error("Error resolving inventory alert:", error);

    window.alert(
      error instanceof Error
        ? `❌ Error: ${error.message}`
        : "Failed to resolve alert. Please try again."
    );
  } finally {
    setResolvingId(null);
  }
};
  // ============================================================
  // TOGGLE SECTION
  // ============================================================

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ============================================================
  // MARK AS READ
  // ============================================================

  const markAsRead = async (
    notificationId: string
  ) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Please login to mark notifications as read"
        );
        return;
      }

      if (!notificationId) {
        return;
      }

      const response = await fetch(
        `/api/admin/notifications/${notificationId}/read`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark as read"
        );
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ||
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt:
                  new Date().toISOString(),
              }
            : notification
        )
      );

      setUnreadCount((prev) =>
        Math.max(0, prev - 1)
      );
    } catch (error) {
      console.error(
        "Error marking as read:",
        error
      );
    }
  };

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Please login to mark all as read"
        );
        return;
      }

      const response = await fetch(
        "/api/admin/notifications/read-all",
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark all as read"
        );
      }

      const now =
        new Date().toISOString();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: now,
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

  // ============================================================
  // APPROVE
  // ============================================================

  const handleApprove = async (
    id: string,
    entity: string
  ) => {
    try {
      setActionLoading(id);

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Please login to approve"
        );
        return;
      }

      const response = await fetch(
        `/api/admin/${entity}s/${id}/approve`,
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
          `Failed to approve ${entity}`
        );
      }

      await fetchNotifications();

      window.alert(
        `${entity} approved successfully!`
      );
    } catch (error) {
      console.error(
        "Error approving:",
        error
      );

      window.alert(
        `Failed to approve ${entity}. Please try again.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // REJECT
  // ============================================================

  const handleReject = async (
    id: string,
    entity: string
  ) => {
    try {
      setActionLoading(id);

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Please login to reject"
        );
        return;
      }

      const response = await fetch(
        `/api/admin/${entity}s/${id}/reject`,
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
          `Failed to reject ${entity}`
        );
      }

      await fetchNotifications();

      window.alert(
        `${entity} rejected successfully!`
      );
    } catch (error) {
      console.error(
        "Error rejecting:",
        error
      );

      window.alert(
        `Failed to reject ${entity}. Please try again.`
      );
    } finally {
      setActionLoading(null);
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

    await Promise.all([
      fetchNotifications(),
      fetchInventoryAlerts(),
    ]);
  };

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    fetchNotifications();
    fetchInventoryAlerts();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEsc = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEsc
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEsc
      );
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [isOpen]);

  // ============================================================
  // CLOSED
  // ============================================================

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // FORMAT HELPERS
  // ============================================================

  const formatDate = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown date";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );
  };

  const formatTime = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  // ============================================================
  // RENDER ALERT LIST
  // ============================================================

  const renderAlertList = (
    alerts: InventoryAlert[],
    type: string,
    sectionLabel: string
  ) => {
    if (alerts.length === 0) {
      return null;
    }

    const isExpanded =
      expandedSections[type] !== false;

    const meta =
      getAlertSectionMeta(type);

    const styles =
      SEVERITY_STYLES[
        meta.severity
      ];

    const SectionIcon =
      meta.icon;

    return (
      <div className="mb-3 overflow-hidden rounded-lg border border-zinc-800">
        {/* Section Header */}
        <button
          type="button"
          onClick={() =>
            toggleSection(type)
          }
          className="flex w-full items-center justify-between bg-zinc-900/60 px-4 py-3 transition hover:bg-zinc-900"
        >
          <div className="flex items-center gap-2.5">
            <SectionIcon
              className={`h-4 w-4 ${styles.text}`}
            />

            <span className="text-sm font-medium text-zinc-200">
              {sectionLabel}
            </span>

            <span className="text-xs text-zinc-500">
              ({alerts.length})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={
                `rounded px-2 py-0.5 text-[10px] ` +
                `font-semibold uppercase tracking-wider ` +
                `${styles.chipBg} ${styles.chipText}`
              }
            >
              {meta.severity ===
              "critical"
                ? "Urgent"
                : "Warning"}
            </span>

            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            )}
          </div>
        </button>

        {/* Section Content */}
        {isExpanded && (
          <div className="divide-y divide-zinc-800/80 border-t border-zinc-800 bg-zinc-950/40">
            {alerts.map((alert, index) => {
              /*
               * IMPORTANT:
               * Do NOT use Math.random() for React keys.
               * Math.random() changes every render and can
               * cause unnecessary remounting.
               */
              const alertId =
                alert.id ||
                alert._id ||
                `${type}-${alert.hospitalId}-${alert.bloodType}-${index}`;

              return (
                <div
                  key={alertId}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Alert Details */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-zinc-100">
                          {alert.hospitalName ||
                            "Unknown Hospital"}
                        </span>

                        <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">
                          {alert.bloodType ||
                            "Unknown"}
                        </span>
                      </div>

                      <p className="text-sm leading-relaxed text-zinc-400">
                        {alert.message ||
                          "No message available"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Droplet className="h-3 w-3" />
                          {alert.units || 0}{" "}
                          units
                        </span>

                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Min{" "}
                          {alert.minRequired ||
                            0}
                        </span>

                        {alert.batchNumber &&
                          alert.batchNumber !==
                            "N/A" && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {
                                alert.batchNumber
                              }
                            </span>
                          )}

                        {alert.daysUntilExpiry !==
                          undefined &&
                          alert.daysUntilExpiry !==
                            null &&
                          alert.daysUntilExpiry >
                            0 && (
                            <span
                              className={
                                `flex items-center gap-1 ` +
                                `${
                                  alert.daysUntilExpiry <=
                                  3
                                    ? "text-rose-400"
                                    : "text-amber-400"
                                }`
                              }
                            >
                              <Clock className="h-3 w-3" />

                              {
                                alert.daysUntilExpiry
                              }{" "}
                              day(s) left
                            </span>
                          )}

                        {alert.daysOverdue !==
                          undefined &&
                          alert.daysOverdue !==
                            null &&
                          alert.daysOverdue >
                            0 && (
                            <span className="flex items-center gap-1 text-rose-400">
                              <XCircle className="h-3 w-3" />

                              {
                                alert.daysOverdue
                              }{" "}
                              day(s) overdue
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Resolve Button */}
                    <button
                      type="button"
                      onClick={() => {
                        resolveAlert(
                          alertId,
                          alert
                        );
                      }}
                      disabled={
                        resolvingId ===
                          alertId ||
                        !alertId
                      }
                      className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-600 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resolvingId ===
                      alertId ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        "Resolve & Notify"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="shrink-0 border-b border-zinc-800 bg-zinc-950 px-6 pt-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900">
                <Bell className="h-4 w-4 text-rose-500" />
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
                  Notification Center
                </h3>

                <p className="text-xs text-zinc-500">
                  {activeTab ===
                  "notifications"
                    ? "Registrations, blood requests, and system updates"
                    : "Blood inventory stock and expiration monitoring"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Refresh */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={
                  loading ||
                  inventoryLoading
                }
                className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={
                    `h-4 w-4 ` +
                    `${
                      loading ||
                      inventoryLoading
                        ? "animate-spin"
                        : ""
                    }`
                  }
                />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close notifications"
                className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ================================================== */}
          {/* TABS */}
          {/* ================================================== */}

          <div className="flex items-center gap-6">
            {/* Notifications */}
            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "notifications"
                )
              }
              className={
                `relative flex items-center gap-2 pb-3 ` +
                `text-xs font-semibold uppercase tracking-wider transition ` +
                `${
                  activeTab ===
                  "notifications"
                    ? "text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`
              }
            >
              Notifications

              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">
                  {unreadCount}
                </span>
              )}

              {activeTab ===
                "notifications" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Inventory Alerts */}
            <button
              type="button"
              onClick={() =>
                setActiveTab("alerts")
              }
              className={
                `relative flex items-center gap-2 pb-3 ` +
                `text-xs font-semibold uppercase tracking-wider transition ` +
                `${
                  activeTab ===
                  "alerts"
                    ? "text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`
              }
            >
              Inventory Alerts

              {inventorySummary.totalAlerts >
                0 && (
                <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">
                  {
                    inventorySummary.totalAlerts
                  }
                </span>
              )}

              {activeTab ===
                "alerts" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Mark all read */}
            {activeTab ===
              "notifications" &&
              unreadCount > 0 && (
                <button
                  type="button"
                  onClick={
                    markAllAsRead
                  }
                  className="ml-auto mb-3 flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-zinc-200"
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
          {/* ================================================= */}
          {/* NOTIFICATIONS TAB */}
          {/* ================================================= */}

          {activeTab ===
          "notifications" ? (
            <>
              {/* Loading */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <RefreshCw className="mb-3 h-6 w-6 animate-spin" />

                  <p className="text-sm">
                    Loading notifications…
                  </p>
                </div>
              ) : error ? (
                /* Error */
                <div className="py-16 text-center">
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-500/70" />

                  <h4 className="text-sm font-medium text-zinc-200">
                    Couldn't load
                    notifications
                  </h4>

                  <p className="mt-1 text-xs text-zinc-500">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={
                      fetchNotifications
                    }
                    className="mt-4 rounded-md border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900"
                  >
                    Try again
                  </button>
                </div>
              ) : notifications.length ===
                0 ? (
                /* Empty */
                <div className="py-16 text-center">
                  <BellOff className="mx-auto mb-3 h-10 w-10 text-zinc-700" />

                  <h4 className="text-sm font-medium text-zinc-300">
                    You're all caught up
                  </h4>

                  <p className="mt-1 text-xs text-zinc-500">
                    New registrations and
                    updates will appear
                    here.
                  </p>
                </div>
              ) : (
                /* Notification list */
                <div className="space-y-2.5">
                  {notifications.map(
                    (notif, index) => {
                      const notificationId =
                        notif.id ||
                        notif._id ||
                        `notification-${index}`;

                      const isLoading =
                        actionLoading ===
                        notificationId;

                      const meta =
                        getTypeMeta(
                          notif.type
                        );

                      const styles =
                        SEVERITY_STYLES[
                          meta.severity
                        ];

                      const TypeIcon =
                        meta.icon;

                      const isUnread =
                        !notif.isRead;

                      return (
                        <div
                          key={
                            notificationId
                          }
                          className={
                            `rounded-lg border p-4 transition ` +
                            `${
                              isUnread
                                ? "border-zinc-800 bg-zinc-900/50"
                                : "border-zinc-800/60 bg-transparent opacity-70"
                            }`
                          }
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div
                              className={
                                `mt-0.5 flex h-8 w-8 shrink-0 ` +
                                `items-center justify-center rounded-md ` +
                                `${styles.chipBg}`
                              }
                            >
                              <TypeIcon
                                className={`h-4 w-4 ${styles.text}`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={
                                        `text-[10px] font-semibold uppercase ` +
                                        `tracking-wider ${styles.text}`
                                      }
                                    >
                                      {
                                        meta.label
                                      }
                                    </span>

                                    {isUnread && (
                                      <span
                                        className={
                                          `h-1.5 w-1.5 rounded-full ` +
                                          `${styles.dot}`
                                        }
                                      />
                                    )}
                                  </div>

                                  <h4 className="mt-0.5 truncate text-sm font-medium text-zinc-100">
                                    {
                                      notif.subject
                                    }
                                  </h4>
                                </div>

                                <span className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-zinc-500">
                                  {formatDate(
                                    notif.createdAt
                                  )}

                                  {formatTime(
                                    notif.createdAt
                                  ) &&
                                    `, ${formatTime(
                                      notif.createdAt
                                    )}`}
                                </span>
                              </div>

                              {/* Message */}
                              <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                                {
                                  notif.message
                                }
                              </p>

                              {/* Approve / Reject */}
                              {notif.action &&
                                notif.action
                                  .type ===
                                  "approve" &&
                                isUnread && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleApprove(
                                          notif
                                            .action!
                                            .id,
                                          notif
                                            .action!
                                            .entity
                                        )
                                      }
                                      disabled={
                                        isLoading
                                      }
                                      className="flex items-center gap-1.5 rounded-md bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isLoading ? (
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
                                      )}

                                      Approve
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleReject(
                                          notif
                                            .action!
                                            .id,
                                          notif
                                            .action!
                                            .entity
                                        )
                                      }
                                      disabled={
                                        isLoading
                                      }
                                      className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-rose-600 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isLoading ? (
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                                      ) : (
                                        <XIcon className="h-3.5 w-3.5" />
                                      )}

                                      Reject
                                    </button>
                                  </div>
                                )}

                              {/* Footer */}
                              <div className="mt-3 flex items-center gap-4">
                                {notif.sender &&
                                  notif.sender !==
                                    "RedPulse System" && (
                                    <span className="text-[11px] text-zinc-600">
                                      From{" "}
                                      {
                                        notif.sender
                                      }
                                    </span>
                                  )}

                                {notif.link && (
                                  <Link
                                    href={
                                      notif.link
                                    }
                                    className="text-xs font-medium text-rose-400 transition hover:text-rose-300"
                                    onClick={
                                      onClose
                                    }
                                  >
                                    More →
                                  </Link>
                                )}

                                {isUnread && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAsRead(
                                        notificationId
                                      )
                                    }
                                    className="ml-auto text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
                                  >
                                    Mark read
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
            </>
          ) : (
            /* ================================================= */
            /* INVENTORY ALERTS TAB */
            /* ================================================= */

            <>
              {inventoryLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <RefreshCw className="mb-3 h-6 w-6 animate-spin" />

                  <p className="text-sm">
                    Loading inventory alerts…
                  </p>
                </div>
              ) : inventoryError ? (
                <div className="py-16 text-center">
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-500/70" />

                  <h4 className="text-sm font-medium text-zinc-200">
                    Couldn't load alerts
                  </h4>

                  <p className="mt-1 text-xs text-zinc-500">
                    {inventoryError}
                  </p>

                  <button
                    type="button"
                    onClick={
                      fetchInventoryAlerts
                    }
                    className="mt-4 rounded-md border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900"
                  >
                    Try again
                  </button>
                </div>
              ) : inventorySummary.totalAlerts ===
                0 ? (
                <div className="py-16 text-center">
                  <BellOff className="mx-auto mb-3 h-10 w-10 text-zinc-700" />

                  <h4 className="text-sm font-medium text-zinc-300">
                    Inventory is healthy
                  </h4>

                  <p className="mt-1 text-xs text-zinc-500">
                    No stock or expiration
                    issues at the moment.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Summary */}
                  <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {[
                      {
                        label:
                          "Out of Stock",
                        value:
                          inventorySummary.outOfStock,
                        severity:
                          "critical" as Severity,
                      },

                      {
                        label:
                          "Critical",
                        value:
                          inventorySummary.criticalStock,
                        severity:
                          "critical" as Severity,
                      },

                      {
                        label:
                          "Low Stock",
                        value:
                          inventorySummary.lowStock,
                        severity:
                          "warning" as Severity,
                      },

                      {
                        label:
                          "Expiring Soon",
                        value:
                          inventorySummary.expiringSoon,
                        severity:
                          "warning" as Severity,
                      },

                      {
                        label:
                          "Expired",
                        value:
                          inventorySummary.expired,
                        severity:
                          "critical" as Severity,
                      },
                    ]
                      .filter(
                        (item) =>
                          item.value > 0
                      )
                      .map(
                        (item) => (
                          <div
                            key={
                              item.label
                            }
                            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center"
                          >
                            <p className="text-[11px] text-zinc-500">
                              {
                                item.label
                              }
                            </p>

                            <p
                              className={
                                `mt-0.5 text-lg font-semibold ` +
                                `${SEVERITY_STYLES[
                                  item.severity
                                ].text}`
                              }
                            >
                              {
                                item.value
                              }
                            </p>
                          </div>
                        )
                      )}
                  </div>

                  {/* Alert Sections */}
                  {renderAlertList(
                    inventoryAlerts.outOfStock,
                    "outOfStock",
                    "Out of Stock"
                  )}

                  {renderAlertList(
                    inventoryAlerts.criticalStock,
                    "criticalStock",
                    "Critical Stock"
                  )}

                  {renderAlertList(
                    inventoryAlerts.lowStock,
                    "lowStock",
                    "Low Stock"
                  )}

                  {renderAlertList(
                    inventoryAlerts.expiringSoon,
                    "expiringSoon",
                    "Expiring Soon"
                  )}

                  {renderAlertList(
                    inventoryAlerts.expired,
                    "expired",
                    "Expired"
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}