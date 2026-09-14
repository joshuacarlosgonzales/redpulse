import dbConnect from '@/lib/mongodb';
import Notification, { INotification, NotificationType } from '@/models/Notification';
import mongoose from 'mongoose';

export class NotificationService {
  static async create(data: {
    userId?: string;
    donorId?: string;
    donorName?: string;
    donorEmail?: string;
    hospitalName?: string;
    subject: string;
    message: string;
    type: NotificationType;
    category: 'info' | 'success' | 'warning' | 'error';
    sender?: string;
    sentBy?: string;
    link?: string;
    relatedId?: string;
    relatedModel?: string;
    data?: Record<string, any>;
    action?: {
      type: 'approve' | 'reject';
      id: string;
      entity: 'hospital' | 'donor' | 'blood_drive' | 'request';
    };
  }) {
    await dbConnect();
    return Notification.create({
      userId: data.userId,
      donorId: data.donorId,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      hospitalName: data.hospitalName,
      subject: data.subject,
      message: data.message,
      type: data.type,
      category: data.category || 'info',
      sender: data.sender || 'RedPulse System',
      sentBy: data.sentBy,
      link: data.link,
      relatedId: data.relatedId ? new mongoose.Types.ObjectId(data.relatedId) : undefined,
      relatedModel: data.relatedModel,
      data: data.data || {},
      action: data.action,
      isRead: false,
      isDeleted: false,
    });
  }

  static async getByUser(
    userId: string,
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ) {
    await dbConnect();
    const { limit = 10, page = 1, unreadOnly = false } = options;
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

  static async getByDonor(
    donorId: string,
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ) {
    await dbConnect();
    const { limit = 10, page = 1, unreadOnly = false } = options;
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

  static async getUnreadCount(userId: string) {
    await dbConnect();
    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
      isDeleted: false,
    });
  }

  static async getUnreadCountByDonor(donorId: string) {
    await dbConnect();
    return Notification.countDocuments({
      donorId: new mongoose.Types.ObjectId(donorId),
      isRead: false,
      isDeleted: false,
    });
  }

  static async markAsRead(id: string, userId: string) {
    await dbConnect();
    return Notification.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(userId), isDeleted: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  static async markAsReadByDonor(id: string, donorId: string) {
    await dbConnect();
    return Notification.findOneAndUpdate(
      { _id: id, donorId: new mongoose.Types.ObjectId(donorId), isDeleted: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string) {
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

  static async markAllAsReadByDonor(donorId: string) {
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

  static async delete(id: string, userId: string) {
    await dbConnect();
    return Notification.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(userId) },
      { isDeleted: true },
      { new: true }
    );
  }

  static async deleteByDonor(id: string, donorId: string) {
    await dbConnect();
    return Notification.findOneAndUpdate(
      { _id: id, donorId: new mongoose.Types.ObjectId(donorId) },
      { isDeleted: true },
      { new: true }
    );
  }
}