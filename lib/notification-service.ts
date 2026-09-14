// lib/notification-service.ts
import Notification, { INotification, NotificationType } from '@/models/Notification';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface NotificationData {
  userId?: string;
  donorId?: string;
  donorName?: string;
  donorEmail?: string;
  hospitalName?: string;
  subject: string;
  message: string;
  type: NotificationType;
  category?: 'info' | 'success' | 'warning' | 'error';
  sender?: string;
  sentBy?: string;
  link?: string;
  relatedId?: string;
  relatedModel?: string;
  data?: Record<string, any>;
  action?: {
    type: 'approve' | 'reject' | 'organize_drive';
    id: string;
    entity: 'hospital' | 'donor' | 'blood_drive' | 'request';
    bloodType?: string;
    units?: number;
    minRequired?: number;
    hospitalName?: string;
    severity?: string;
  };
}

// ============================================================
// MAIN NOTIFICATION SERVICE CLASS
// ============================================================

export class NotificationService {
  /**
   * Create a single notification
   */
  static async create(data: NotificationData): Promise<INotification> {
    await dbConnect();

    const category = data.category || this.getCategoryForType(data.type);

    const notificationData: any = {
      ...data,
      category,
      sender: data.sender || 'RedPulse System',
      isRead: false,
      isDeleted: false,
    };

    // Handle ObjectId conversions
    if (data.userId) {
      notificationData.userId = new mongoose.Types.ObjectId(data.userId);
    }
    if (data.donorId) {
      notificationData.donorId = new mongoose.Types.ObjectId(data.donorId);
    }
    if (data.relatedId) {
      notificationData.relatedId = new mongoose.Types.ObjectId(data.relatedId);
    }

    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  static async createForMultipleUsers(
    userIds: string[],
    data: Omit<NotificationData, 'userId'>
  ): Promise<INotification[]> {
    await dbConnect();

    const category = data.category || this.getCategoryForType(data.type);

    const notifications = userIds.map((userId) => {
      const notificationData: any = {
        ...data,
        userId: new mongoose.Types.ObjectId(userId),
        category,
        sender: data.sender || 'RedPulse System',
        isRead: false,
        isDeleted: false,
      };

      if (data.donorId) {
        notificationData.donorId = new mongoose.Types.ObjectId(data.donorId);
      }
      if (data.relatedId) {
        notificationData.relatedId = new mongoose.Types.ObjectId(data.relatedId);
      }

      return notificationData;
    });

    const created = await Notification.insertMany(notifications);
    return created as INotification[];
  }

  /**
   * Get category for notification type
   */
  static getCategoryForType(type: NotificationType): 'info' | 'success' | 'warning' | 'error' {
    const categoryMap: Record<NotificationType, 'info' | 'success' | 'warning' | 'error'> = {
      NEW_REQUEST: 'warning',
      REQUEST_APPROVED: 'success',
      REQUEST_DECLINED: 'error',
      LOW_INVENTORY: 'warning',
      CRITICAL_INVENTORY: 'error',
      EXPIRING_BLOOD: 'warning',
      EXPIRED_BLOOD: 'error',
      NEW_DONOR: 'info',
      NEW_HOSPITAL: 'info',
      NEW_BLOOD_DRIVE: 'info',
      NEW_DONATION: 'success',
      NEW_BLOOD_REQUEST: 'warning',
      PENDING_BLOOD_REQUEST: 'warning',
      BLOOD_DRIVE_NEEDED: 'error',
    };
    return categoryMap[type] || 'info';
  }

  /**
   * Get display info for notification type
   */
  static getTypeDisplay(type: NotificationType): { icon: string; label: string } {
    const displayMap: Record<NotificationType, { icon: string; label: string }> = {
      NEW_REQUEST: { icon: '🩸', label: 'New Blood Request' },
      REQUEST_APPROVED: { icon: '✅', label: 'Request Approved' },
      REQUEST_DECLINED: { icon: '❌', label: 'Request Declined' },
      LOW_INVENTORY: { icon: '⚠️', label: 'Low Blood Inventory' },
      CRITICAL_INVENTORY: { icon: '🚨', label: 'Critical Blood Shortage' },
      EXPIRING_BLOOD: { icon: '🩸', label: 'Blood Expiring Soon' },
      EXPIRED_BLOOD: { icon: '🚨', label: 'Expired Blood' },
      NEW_DONOR: { icon: '👤', label: 'New Donor Registration' },
      NEW_HOSPITAL: { icon: '🏥', label: 'New Hospital Registration' },
      NEW_BLOOD_DRIVE: { icon: '📅', label: 'New Blood Drive' },
      NEW_DONATION: { icon: '🩸', label: 'New Donation Recorded' },
      NEW_BLOOD_REQUEST: { icon: '🩸', label: 'New Blood Request' },
      PENDING_BLOOD_REQUEST: { icon: '⏳', label: 'Pending Blood Request' },
      BLOOD_DRIVE_NEEDED: { icon: '📅', label: 'Blood Drive Needed' },
    };
    return displayMap[type] || { icon: '📌', label: 'Notification' };
  }

  /**
   * Get notifications by user ID
   */
  static async getByUser(
    userId: string,
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ): Promise<{ data: INotification[]; total: number; page: number; limit: number; totalPages: number }> {
    await dbConnect();

    const { limit = 50, page = 1, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    const [data, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get notifications by donor ID
   */
  static async getByDonor(
    donorId: string,
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ): Promise<{ data: INotification[]; total: number; page: number; limit: number; totalPages: number }> {
    await dbConnect();

    const { limit = 50, page = 1, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      donorId: new mongoose.Types.ObjectId(donorId),
      isDeleted: false,
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    const [data, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    await dbConnect();
    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
      isDeleted: false,
    });
  }

  /**
   * Get unread count for a donor
   */
  static async getUnreadCountByDonor(donorId: string): Promise<number> {
    await dbConnect();
    return Notification.countDocuments({
      donorId: new mongoose.Types.ObjectId(donorId),
      isRead: false,
      isDeleted: false,
    });
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string, userId: string): Promise<INotification | null> {
    await dbConnect();
    return Notification.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(userId), isDeleted: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  /**
   * Mark a notification as read by donor
   */
  static async markAsReadByDonor(id: string, donorId: string): Promise<INotification | null> {
    await dbConnect();
    return Notification.findOneAndUpdate(
      { _id: id, donorId: new mongoose.Types.ObjectId(donorId), isDeleted: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<any> {
    await dbConnect();
    return Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
        isDeleted: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
  }

  /**
   * Mark all notifications as read for a donor
   */
  static async markAllAsReadByDonor(donorId: string): Promise<any> {
    await dbConnect();
    return Notification.updateMany(
      {
        donorId: new mongoose.Types.ObjectId(donorId),
        isRead: false,
        isDeleted: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
  }

  /**
   * Delete a notification (soft delete)
   */
  static async delete(id: string, userId: string): Promise<INotification | null> {
    await dbConnect();
    return Notification.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(userId) },
      { isDeleted: true },
      { new: true }
    );
  }

  /**
   * Delete a notification by donor (soft delete)
   */
  static async deleteByDonor(id: string, donorId: string): Promise<INotification | null> {
    await dbConnect();
    return Notification.findOneAndUpdate(
      { _id: id, donorId: new mongoose.Types.ObjectId(donorId) },
      { isDeleted: true },
      { new: true }
    );
  }

  /**
   * Delete all notifications for a user (soft delete)
   */
  static async deleteAllByUser(userId: string): Promise<any> {
    await dbConnect();
    return Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId) },
      { isDeleted: true }
    );
  }
}

// ============================================================
// NOTIFICATION HELPER FUNCTIONS
// ============================================================

/**
 * Notify all admins
 */
export async function notifyAllAdmins(data: {
  subject: string;
  message: string;
  type: NotificationType;
  link?: string;
  data?: Record<string, any>;
}): Promise<INotification[]> {
  await dbConnect();

  try {
    const User = mongoose.models.User || (await import('@/models/User')).default;
    const admins = await User.find({ role: 'admin' });

    const notifications: INotification[] = [];
    for (const admin of admins) {
      const notification = await NotificationService.create({
        userId: admin._id.toString(),
        subject: data.subject,
        message: data.message,
        type: data.type,
        link: data.link,
        data: data.data,
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error notifying admins:', error);
    return [];
  }
}

// ============================================================
// INVENTORY ALERT NOTIFICATIONS
// ============================================================

export async function createLowInventoryNotification(inventoryData: {
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  currentUnits: number;
  minRequired: number;
}): Promise<INotification | INotification[]> {
  const { hospitalId, hospitalName, bloodType, currentUnits, minRequired } = inventoryData;

  await NotificationService.create({
    userId: hospitalId,
    hospitalName,
    subject: `⚠️ Low Blood Inventory Alert - ${bloodType}`,
    message: `${hospitalName} has low inventory of ${bloodType} blood. Current stock: ${currentUnits} units. Minimum required: ${minRequired} units. Please restock soon.`,
    type: 'LOW_INVENTORY',
    category: 'warning',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      currentUnits,
      minRequired,
      severity: 'low',
    },
  });

  return notifyAllAdmins({
    subject: `⚠️ Low Blood Inventory Alert - ${bloodType} at ${hospitalName}`,
    message: `${hospitalName} has low inventory of ${bloodType} blood. Current stock: ${currentUnits} units. Minimum required: ${minRequired} units. Please take action.`,
    type: 'LOW_INVENTORY',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      currentUnits,
      minRequired,
      severity: 'low',
    },
  });
}

export async function createCriticalInventoryNotification(inventoryData: {
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  currentUnits: number;
  minRequired: number;
}): Promise<INotification | INotification[]> {
  const { hospitalId, hospitalName, bloodType, currentUnits, minRequired } = inventoryData;

  await NotificationService.create({
    userId: hospitalId,
    hospitalName,
    subject: `🚨 CRITICAL Blood Inventory Alert - ${bloodType}`,
    message: `🚨 CRITICAL: ${hospitalName} has only ${currentUnits} units of ${bloodType} blood! Minimum required: ${minRequired} units. IMMEDIATE ACTION REQUIRED!`,
    type: 'CRITICAL_INVENTORY',
    category: 'error',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      currentUnits,
      minRequired,
      severity: 'critical',
    },
  });

  return notifyAllAdmins({
    subject: `🚨 CRITICAL Blood Inventory Alert - ${bloodType} at ${hospitalName}`,
    message: `🚨 CRITICAL: ${hospitalName} has only ${currentUnits} units of ${bloodType} blood! Minimum required: ${minRequired} units. IMMEDIATE ACTION REQUIRED!`,
    type: 'CRITICAL_INVENTORY',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      currentUnits,
      minRequired,
      severity: 'critical',
    },
  });
}

export async function createOutOfStockNotification(inventoryData: {
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  currentUnits: number;
  minRequired: number;
}): Promise<INotification | INotification[]> {
  const { hospitalId, hospitalName, bloodType, currentUnits, minRequired } = inventoryData;

  await NotificationService.create({
    userId: hospitalId,
    hospitalName,
    subject: `🚨 OUT OF STOCK - ${bloodType} Blood`,
    message: `🚨 ${hospitalName} is OUT OF STOCK of ${bloodType} blood! Current stock: ${currentUnits} units. Minimum required: ${minRequired} units. URGENT ACTION REQUIRED!`,
    type: 'CRITICAL_INVENTORY',
    category: 'error',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      currentUnits,
      minRequired,
      severity: 'out-of-stock',
    },
  });

  return notifyAllAdmins({
    subject: `🚨 OUT OF STOCK - ${bloodType} Blood at ${hospitalName}`,
    message: `🚨 ${hospitalName} is OUT OF STOCK of ${bloodType} blood! Current stock: ${currentUnits} units. Minimum required: ${minRequired} units. URGENT ACTION REQUIRED!`,
    type: 'CRITICAL_INVENTORY',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      currentUnits,
      minRequired,
      severity: 'out-of-stock',
    },
  });
}

export async function createExpiringBloodNotification(expiryData: {
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  units: number;
  expirationDate: Date;
  batchNumber: string;
  daysUntilExpiry?: number;
}): Promise<INotification | INotification[]> {
  const {
    hospitalId,
    hospitalName,
    bloodType,
    units,
    expirationDate,
    batchNumber,
    daysUntilExpiry,
  } = expiryData;

  const days = daysUntilExpiry || Math.ceil(
    (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const urgency = days <= 3 ? '🚨' : '⚠️';
  const urgencyText = days <= 3 ? 'URGENT' : 'Warning';

  await NotificationService.create({
    userId: hospitalId,
    hospitalName,
    subject: `${urgency} Blood Expiring Soon - ${bloodType}`,
    message: `${urgency} ${hospitalName} has ${units} unit(s) of ${bloodType} blood expiring in ${days} day(s). Batch: ${batchNumber}. Expiration date: ${new Date(expirationDate).toLocaleDateString()}. Please take action.`,
    type: 'EXPIRING_BLOOD',
    category: days <= 3 ? 'error' : 'warning',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      units,
      expirationDate,
      batchNumber,
      daysUntilExpiry: days,
      severity: days <= 3 ? 'urgent' : 'warning',
    },
  });

  return notifyAllAdmins({
    subject: `${urgency} Blood Expiring Soon - ${bloodType} at ${hospitalName}`,
    message: `${urgency} ${hospitalName} has ${units} unit(s) of ${bloodType} blood expiring in ${days} day(s). Batch: ${batchNumber}. Expiration date: ${new Date(expirationDate).toLocaleDateString()}. Please take action.`,
    type: 'EXPIRING_BLOOD',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      units,
      expirationDate,
      batchNumber,
      daysUntilExpiry: days,
      severity: days <= 3 ? 'urgent' : 'warning',
    },
  });
}

export async function createExpiredBloodNotification(expiryData: {
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  units: number;
  batchNumber: string;
  expirationDate: Date;
}): Promise<INotification | INotification[]> {
  const {
    hospitalId,
    hospitalName,
    bloodType,
    units,
    batchNumber,
    expirationDate,
  } = expiryData;

  await NotificationService.create({
    userId: hospitalId,
    hospitalName,
    subject: `🚨 EXPIRED BLOOD DETECTED - ${bloodType}`,
    message: `🚨 ${hospitalName} has ${units} unit(s) of ${bloodType} blood that have EXPIRED. Batch: ${batchNumber}. Expiration date: ${new Date(expirationDate).toLocaleDateString()}. Please dispose of immediately!`,
    type: 'EXPIRED_BLOOD',
    category: 'error',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      units,
      batchNumber,
      expirationDate,
      severity: 'expired',
    },
  });

  return notifyAllAdmins({
    subject: `🚨 EXPIRED BLOOD DETECTED - ${bloodType} at ${hospitalName}`,
    message: `🚨 ${hospitalName} has ${units} unit(s) of ${bloodType} blood that have EXPIRED. Batch: ${batchNumber}. Expiration date: ${new Date(expirationDate).toLocaleDateString()}. Please dispose of immediately!`,
    type: 'EXPIRED_BLOOD',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      units,
      batchNumber,
      expirationDate,
      severity: 'expired',
    },
  });
}

/**
 * Check and send inventory alerts
 */
export async function checkAndSendInventoryAlerts(
  specificHospitalId?: string,
  forceResend: boolean = false
): Promise<{
  success: boolean;
  notificationsSent: number;
  notifications?: INotification[];
  hospitalsChecked?: number;
  itemsChecked?: number;
  message?: string;
  error?: string;
}> {
  await dbConnect();

  try {
    const BloodInventory = mongoose.models.BloodInventory || (await import('@/models/BloodInventory')).default;
    const User = mongoose.models.User || (await import('@/models/User')).default;

    const filter: any = {};
    if (specificHospitalId && mongoose.Types.ObjectId.isValid(specificHospitalId)) {
      filter.hospitalId = new mongoose.Types.ObjectId(specificHospitalId);
    }

    const inventoryItems = await BloodInventory.find(filter).lean();

    if (inventoryItems.length === 0) {
      return {
        success: true,
        notificationsSent: 0,
        message: 'No inventory items found to check',
      };
    }

    const hospitalInventory: Record<string, any[]> = {};
    for (const item of inventoryItems) {
      const hospitalId = item.hospitalId?.toString();
      if (!hospitalId) continue;

      if (!hospitalInventory[hospitalId]) {
        hospitalInventory[hospitalId] = [];
      }
      hospitalInventory[hospitalId].push(item);
    }

    const hospitalIds = Object.keys(hospitalInventory);
    const hospitals = await User.find({
      _id: { $in: hospitalIds },
      role: 'hospital'
    }).select('hospitalName fullName').lean();

    const hospitalMap = new Map();
    hospitals.forEach((h: any) => {
      hospitalMap.set(h._id.toString(), h.hospitalName || h.fullName || 'Unknown Hospital');
    });

    const notifications: INotification[] = [];
    let notificationsSent = 0;

    for (const [hospitalId, items] of Object.entries(hospitalInventory)) {
      const hospitalName = hospitalMap.get(hospitalId) || 'Unknown Hospital';

      for (const item of items) {
        const units = item.units || 0;
        const minRequired = item.minRequired || 15;
        const bloodType = item.bloodType || 'Unknown';

        if (units === 0) {
          const result = await createOutOfStockNotification({
            hospitalId,
            hospitalName,
            bloodType,
            currentUnits: units,
            minRequired,
          });
          if (Array.isArray(result)) {
            notifications.push(...result);
          } else if (result) {
            notifications.push(result);
          }
          notificationsSent++;
        } else if (units <= 5) {
          const result = await createCriticalInventoryNotification({
            hospitalId,
            hospitalName,
            bloodType,
            currentUnits: units,
            minRequired,
          });
          if (Array.isArray(result)) {
            notifications.push(...result);
          } else if (result) {
            notifications.push(result);
          }
          notificationsSent++;
        } else if (units < minRequired) {
          const result = await createLowInventoryNotification({
            hospitalId,
            hospitalName,
            bloodType,
            currentUnits: units,
            minRequired,
          });
          if (Array.isArray(result)) {
            notifications.push(...result);
          } else if (result) {
            notifications.push(result);
          }
          notificationsSent++;
        }

        if (item.expirationDate) {
          const daysUntilExpiry = Math.ceil(
            (new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            const result = await createExpiringBloodNotification({
              hospitalId,
              hospitalName,
              bloodType,
              units,
              expirationDate: item.expirationDate,
              batchNumber: item.batchNumber || 'N/A',
              daysUntilExpiry,
            });
            if (Array.isArray(result)) {
              notifications.push(...result);
            } else if (result) {
              notifications.push(result);
            }
            notificationsSent++;
          }

          if (daysUntilExpiry < 0) {
            const result = await createExpiredBloodNotification({
              hospitalId,
              hospitalName,
              bloodType,
              units,
              batchNumber: item.batchNumber || 'N/A',
              expirationDate: item.expirationDate,
            });
            if (Array.isArray(result)) {
              notifications.push(...result);
            } else if (result) {
              notifications.push(result);
            }
            notificationsSent++;
          }
        }
      }
    }

    return {
      success: true,
      notificationsSent,
      notifications,
      hospitalsChecked: Object.keys(hospitalInventory).length,
      itemsChecked: inventoryItems.length,
    };
  } catch (error) {
    console.error('Error checking inventory alerts:', error);
    return {
      success: false,
      notificationsSent: 0,
      error: error instanceof Error ? error.message : 'Failed to check inventory alerts',
    };
  }
}

// ============================================================
// BLOOD DRIVE NOTIFICATIONS
// ============================================================

/**
 * Create notifications for a new blood drive
 * Accepts either 'id' or 'driveId' for flexibility
 */
export async function createNewBloodDriveNotificationWithAdmins(driveData: {
  id?: string;
  driveId?: string;
  title: string;
  location: string;
  date: string | Date;
  hospitalId: string;
  hospitalName: string;
}): Promise<INotification[]> {
  // Use either id or driveId
  const driveId = driveData.id || driveData.driveId || '';
  const { title, location, date, hospitalId, hospitalName } = driveData;
  const formattedDate = new Date(date).toLocaleDateString();

  // Notify the hospital
  await NotificationService.create({
    userId: hospitalId,
    hospitalName,
    subject: `📅 New Blood Drive Scheduled: ${title}`,
    message: `A new blood drive "${title}" has been scheduled for ${formattedDate} at ${location}.`,
    type: 'NEW_BLOOD_DRIVE',
    category: 'info',
    link: `/hospital/blood-drives/${driveId}`,
    data: {
      driveId,
      title,
      location,
      date,
      hospitalId,
      hospitalName,
    },
  });

  // Notify all admins
  return notifyAllAdmins({
    subject: `📅 New Blood Drive: ${title}`,
    message: `A new blood drive "${title}" has been scheduled for ${formattedDate} at ${location} by ${hospitalName}.`,
    type: 'NEW_BLOOD_DRIVE',
    link: `/admin/blood-drives/${driveId}`,
    data: {
      driveId,
      title,
      location,
      date,
      hospitalId,
      hospitalName,
    },
  });
}

// ============================================================
// DONOR NOTIFICATIONS
// ============================================================

export async function createNewDonorNotification(donorData: {
  userId: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
}): Promise<INotification> {
  return NotificationService.create({
    userId: donorData.userId,
    donorId: donorData.donorId,
    donorName: donorData.donorName,
    donorEmail: donorData.donorEmail,
    subject: '👤 New Donor Registration',
    message: `${donorData.donorName} (${donorData.donorEmail}) has registered as a new donor. Please review their profile.`,
    type: 'NEW_DONOR',
    category: 'info',
    link: `/admin/donors/${donorData.donorId}`,
    data: {
      donorId: donorData.donorId,
      donorName: donorData.donorName,
      donorEmail: donorData.donorEmail,
    },
    action: {
      type: 'approve',
      id: donorData.donorId,
      entity: 'donor',
    },
  });
}

// ============================================================
// HOSPITAL NOTIFICATIONS
// ============================================================

export async function createNewHospitalNotification(hospitalData: {
  hospitalId: string;
  hospitalName: string;
  email: string;
}): Promise<INotification> {
  return NotificationService.create({
    userId: hospitalData.hospitalId,
    hospitalName: hospitalData.hospitalName,
    subject: '🏥 New Hospital Registration',
    message: `${hospitalData.hospitalName} (${hospitalData.email}) has registered as a new hospital. Please review and approve.`,
    type: 'NEW_HOSPITAL',
    category: 'info',
    link: `/admin/hospitals/${hospitalData.hospitalId}`,
    data: {
      hospitalId: hospitalData.hospitalId,
      hospitalName: hospitalData.hospitalName,
      email: hospitalData.email,
    },
    action: {
      type: 'approve',
      id: hospitalData.hospitalId,
      entity: 'hospital',
    },
  });
}

// ============================================================
// BLOOD REQUEST NOTIFICATIONS
// ============================================================

export async function createBloodRequestNotification(requestData: {
  requestId: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  units: number;
  urgency: 'standard' | 'urgent' | 'critical';
}): Promise<INotification> {
  const urgencyEmoji = requestData.urgency === 'critical' ? '🚨' :
    requestData.urgency === 'urgent' ? '⚠️' : '🩸';
  const urgencyText = requestData.urgency.charAt(0).toUpperCase() + requestData.urgency.slice(1);

  return NotificationService.create({
    userId: requestData.hospitalId,
    hospitalName: requestData.hospitalName,
    subject: `${urgencyEmoji} ${urgencyText} Blood Request`,
    message: `${requestData.hospitalName} is requesting ${requestData.units} unit(s) of ${requestData.bloodType} blood.`,
    type: 'NEW_BLOOD_REQUEST',
    category: requestData.urgency === 'critical' ? 'error' : requestData.urgency === 'urgent' ? 'warning' : 'info',
    link: `/admin/requests/${requestData.requestId}`,
    data: {
      requestId: requestData.requestId,
      hospitalId: requestData.hospitalId,
      hospitalName: requestData.hospitalName,
      bloodType: requestData.bloodType,
      units: requestData.units,
      urgency: requestData.urgency,
    },
  });
}

export async function createRequestApprovedNotification(requestData: {
  requestId: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  units: number;
  approvedBy: string;
}): Promise<INotification> {
  return NotificationService.create({
    userId: requestData.hospitalId,
    hospitalName: requestData.hospitalName,
    subject: '✅ Blood Request Approved',
    message: `Your request for ${requestData.units} unit(s) of ${requestData.bloodType} blood has been approved by ${requestData.approvedBy}.`,
    type: 'REQUEST_APPROVED',
    category: 'success',
    link: `/hospital/requests/${requestData.requestId}`,
    data: {
      requestId: requestData.requestId,
      hospitalId: requestData.hospitalId,
      hospitalName: requestData.hospitalName,
      bloodType: requestData.bloodType,
      units: requestData.units,
      approvedBy: requestData.approvedBy,
    },
  });
}

export async function createRequestDeclinedNotification(requestData: {
  requestId: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  units: number;
  declinedBy: string;
  reason?: string;
}): Promise<INotification> {
  const reasonText = requestData.reason ? ` Reason: ${requestData.reason}` : '';

  return NotificationService.create({
    userId: requestData.hospitalId,
    hospitalName: requestData.hospitalName,
    subject: '❌ Blood Request Declined',
    message: `Your request for ${requestData.units} unit(s) of ${requestData.bloodType} blood has been declined by ${requestData.declinedBy}.${reasonText}`,
    type: 'REQUEST_DECLINED',
    category: 'error',
    link: `/hospital/requests/${requestData.requestId}`,
    data: {
      requestId: requestData.requestId,
      hospitalId: requestData.hospitalId,
      hospitalName: requestData.hospitalName,
      bloodType: requestData.bloodType,
      units: requestData.units,
      declinedBy: requestData.declinedBy,
      reason: requestData.reason,
    },
  });
}

// ============================================================
// DONATION NOTIFICATIONS
// ============================================================

export async function createNewDonationNotification(donationData: {
  donationId: string;
  donorId: string;
  donorName: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  units: number;
}): Promise<INotification[]> {
  const notifications: INotification[] = [];

  // Notify the hospital
  const hospitalNotification = await NotificationService.create({
    userId: donationData.hospitalId,
    hospitalName: donationData.hospitalName,
    donorId: donationData.donorId,
    donorName: donationData.donorName,
    subject: '🩸 New Donation Received',
    message: `${donationData.donorName} donated ${donationData.units} unit(s) of ${donationData.bloodType} blood at ${donationData.hospitalName}.`,
    type: 'NEW_DONATION',
    category: 'success',
    link: `/hospital/donations/${donationData.donationId}`,
    data: {
      donationId: donationData.donationId,
      donorId: donationData.donorId,
      donorName: donationData.donorName,
      bloodType: donationData.bloodType,
      units: donationData.units,
      hospitalId: donationData.hospitalId,
      hospitalName: donationData.hospitalName,
    },
  });
  notifications.push(hospitalNotification);

  // Notify the donor
  const donorNotification = await NotificationService.create({
    donorId: donationData.donorId,
    donorName: donationData.donorName,
    hospitalName: donationData.hospitalName,
    subject: '✅ Thank You for Your Donation!',
    message: `Thank you for donating ${donationData.units} unit(s) of ${donationData.bloodType} blood at ${donationData.hospitalName}. Your donation saves lives!`,
    type: 'NEW_DONATION',
    category: 'success',
    link: `/donor/donations/${donationData.donationId}`,
    data: {
      donationId: donationData.donationId,
      bloodType: donationData.bloodType,
      units: donationData.units,
      hospitalName: donationData.hospitalName,
    },
  });
  notifications.push(donorNotification);

  return notifications;
}

// ============================================================
// BLOOD DRIVE NEEDED NOTIFICATIONS (for inventory alerts)
// ============================================================

export async function createBloodDriveNeededNotification(data: {
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  units: number;
  minRequired: number;
  severity: 'critical' | 'warning';
  inventoryId: string;
}): Promise<INotification | INotification[]> {
  const { hospitalId, hospitalName, bloodType, units, minRequired, severity, inventoryId } = data;

  const severityText = severity === 'critical' ? '🚨 CRITICAL' : '⚠️ URGENT';
  const urgencyText = severity === 'critical'
    ? 'IMMEDIATE ACTION REQUIRED: Blood supply is critically low. Please organize a blood drive urgently to prevent shortage.'
    : 'Action recommended: Blood supply is below minimum levels. Please organize a blood drive to replenish stock.';

  const message = `${severityText} ALERT\n\nHospital: ${hospitalName}\nBlood Type: ${bloodType}\nCurrent Stock: ${units} units\nMinimum Required: ${minRequired} units\nDeficit: ${minRequired - units} units\n\n${urgencyText}\n\n📋 Please go to the Blood Drives section to create a new blood drive event for ${bloodType} blood.`;

  // Notify the hospital
  await NotificationService.create({
    userId: hospitalId,
    hospitalName,
    subject: `🚨 Blood Drive Needed: ${bloodType} ${severity === 'critical' ? 'Critical' : 'Low'} Stock Alert`,
    message,
    type: 'BLOOD_DRIVE_NEEDED',
    category: severity === 'critical' ? 'error' : 'warning',
    sender: 'RedPulse System',
    link: '/hospital/blood-drives',
    data: {
      bloodType,
      units,
      minRequired,
      hospitalName,
      severity,
      inventoryId,
    },
    action: {
      type: 'organize_drive',
      id: inventoryId,
      entity: 'blood_drive',
      bloodType,
      units,
      minRequired,
      hospitalName,
      severity,
    },
  });

  // Notify all admins
  return notifyAllAdmins({
    subject: `🚨 Blood Drive Needed: ${bloodType} ${severity === 'critical' ? 'Critical' : 'Low'} Stock Alert at ${hospitalName}`,
    message: `${hospitalName} needs a blood drive for ${bloodType} blood.\nCurrent Stock: ${units} units\nMinimum Required: ${minRequired} units\nDeficit: ${minRequired - units} units\n\nSeverity: ${severity.toUpperCase()}`,
    type: 'BLOOD_DRIVE_NEEDED',
    link: `/admin/inventory/${hospitalId}`,
    data: {
      hospitalId,
      hospitalName,
      bloodType,
      units,
      minRequired,
      severity,
      inventoryId,
    },
  });
}