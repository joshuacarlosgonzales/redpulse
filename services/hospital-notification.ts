// services/hospital-notification.ts
import { NotificationService } from '@/lib/notification-service';
import { NotificationType } from '@/models/Notification';

export class HospitalNotificationService {
  /**
   * Send a notification to a hospital
   */
  static async sendToHospital(
    hospitalUserId: string,
    subject: string,
    message: string,
    type: NotificationType = 'NEW_BLOOD_REQUEST',
    category: 'info' | 'success' | 'warning' | 'error' = 'info',
    sender?: string,
    link?: string,
    data?: Record<string, any>
  ) {
    return NotificationService.create({
      userId: hospitalUserId,
      subject,
      message,
      type,
      category,
      sender: sender || 'RedPulse System',
      link,
      data,
    });
  }

  /**
   * Get all notifications for a hospital
   */
  static async getHospitalNotifications(
    userId: string,
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ) {
    return NotificationService.getByUser(userId, options);
  }

  /**
   * Get unread count for a hospital
   */
  static async getUnreadCount(userId: string) {
    return NotificationService.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return NotificationService.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    return NotificationService.markAllAsRead(userId);
  }

  /**
   * Delete a notification (soft delete)
   */
  static async deleteNotification(notificationId: string, userId: string) {
    return NotificationService.delete(notificationId, userId);
  }

  /**
   * Send a notification about a new blood request
   */
  static async notifyNewBloodRequest(
    hospitalUserId: string,
    hospitalName: string,
    bloodType: string,
    quantity: number
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'New Blood Request',
      `A new blood request for ${bloodType} (${quantity} units) has been created`,
      'NEW_BLOOD_REQUEST',
      'info',
      'Blood Request System',
      '/hospital/requests',
      { bloodType, quantity, hospitalName }
    );
  }

  /**
   * Send a notification about pending blood request
   */
  static async notifyPendingBloodRequest(
    hospitalUserId: string,
    requestId: string,
    bloodType: string
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'Pending Blood Request',
      `Your blood request for ${bloodType} is still pending`,
      'PENDING_BLOOD_REQUEST',
      'warning',
      'Blood Request System',
      `/hospital/requests/${requestId}`,
      { requestId, bloodType }
    );
  }

  /**
   * Send a notification about request approved
   */
  static async notifyRequestApproved(
    hospitalUserId: string,
    requestId: string,
    bloodType: string,
    quantity: number
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'Blood Request Approved',
      `Your request for ${bloodType} (${quantity} units) has been approved`,
      'REQUEST_APPROVED',
      'success',
      'Blood Request System',
      `/hospital/requests/${requestId}`,
      { requestId, bloodType, quantity }
    );
  }

  /**
   * Send a notification about request declined
   */
  static async notifyRequestDeclined(
    hospitalUserId: string,
    requestId: string,
    bloodType: string,
    reason?: string
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'Blood Request Declined',
      `Your request for ${bloodType} has been declined${reason ? `: ${reason}` : ''}`,
      'REQUEST_DECLINED',
      'error',
      'Blood Request System',
      `/hospital/requests/${requestId}`,
      { requestId, bloodType, reason }
    );
  }

  /**
   * Send a notification about new donation
   */
  static async notifyNewDonation(
    hospitalUserId: string,
    donorName: string,
    bloodType: string,
    quantity: number
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'New Donation Received',
      `A new donation of ${bloodType} (${quantity} units) has been received from ${donorName}`,
      'NEW_DONATION',
      'success',
      'Donation System',
      '/hospital/inventory',
      { donorName, bloodType, quantity }
    );
  }

  /**
   * Send a notification about low inventory
   */
  static async notifyLowInventory(
    hospitalUserId: string,
    bloodType: string,
    currentStock: number,
    threshold: number
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'Low Inventory Alert',
      `${bloodType} inventory is low (${currentStock} units remaining, threshold: ${threshold})`,
      'LOW_INVENTORY',
      'warning',
      'Inventory System',
      '/hospital/inventory',
      { bloodType, currentStock, threshold }
    );
  }

  /**
   * Send a notification about critical inventory
   */
  static async notifyCriticalInventory(
    hospitalUserId: string,
    bloodType: string,
    currentStock: number
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'Critical Inventory Alert',
      `${bloodType} inventory is critically low (${currentStock} units remaining)! Immediate action required.`,
      'CRITICAL_INVENTORY',
      'error',
      'Inventory System',
      '/hospital/inventory',
      { bloodType, currentStock }
    );
  }

  /**
   * Send a notification about expiring blood
   */
  static async notifyExpiringBlood(
    hospitalUserId: string,
    bloodType: string,
    expiryDate: Date,
    quantity: number
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'Expiring Blood Alert',
      `${quantity} units of ${bloodType} will expire on ${expiryDate.toLocaleDateString()}`,
      'EXPIRING_BLOOD',
      'warning',
      'Inventory System',
      '/hospital/inventory',
      { bloodType, expiryDate, quantity }
    );
  }

  /**
   * Send a notification about expired blood
   */
  static async notifyExpiredBlood(
    hospitalUserId: string,
    bloodType: string,
    quantity: number
  ) {
    return this.sendToHospital(
      hospitalUserId,
      'Expired Blood Alert',
      `${quantity} units of ${bloodType} have expired and been removed from inventory`,
      'EXPIRED_BLOOD',
      'error',
      'Inventory System',
      '/hospital/inventory',
      { bloodType, quantity }
    );
  }

  /**
   * Send a notification about new hospital registration (to admin)
   */
  static async notifyNewHospitalToAdmin(
    adminUserId: string,
    hospitalName: string,
    hospitalEmail: string
  ) {
    return NotificationService.create({
      userId: adminUserId,
      subject: 'New Hospital Registration',
      message: `${hospitalName} (${hospitalEmail}) has registered and is pending approval`,
      type: 'NEW_HOSPITAL',
      category: 'info',
      sender: 'RedPulse System',
      link: '/admin/hospitals',
      data: { hospitalName, hospitalEmail }
    });
  }

  /**
   * Send hospital setup reminder
   */
  static async sendSetupReminder(hospitalUserId: string) {
    return this.sendToHospital(
      hospitalUserId,
      'Complete Hospital Setup',
      'Your hospital profile is not fully set up. Please complete your hospital information to start accepting bookings.',
      'NEW_HOSPITAL',
      'warning',
      'System',
      '/hospital/settings?tab=setup',
      { reminder: true }
    );
  }
}