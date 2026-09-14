import mongoose, { Schema, Document, Model } from "mongoose";

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export const NOTIFICATION_TYPES = [
  "NEW_REQUEST",
  "REQUEST_APPROVED",
  "REQUEST_DECLINED",
  "LOW_INVENTORY",
  "CRITICAL_INVENTORY",
  "EXPIRING_BLOOD",
  "EXPIRED_BLOOD",
  "NEW_DONOR",
  "NEW_HOSPITAL",
  "NEW_BLOOD_DRIVE",
  "NEW_DONATION",
  "NEW_BLOOD_REQUEST",
  "PENDING_BLOOD_REQUEST",
  "BLOOD_DRIVE_NEEDED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ============================================================
// ACTION TYPES
// ============================================================

export const NOTIFICATION_ACTION_TYPES = [
  "approve",
  "reject",
  "organize_drive",
] as const;

export type NotificationActionType =
  (typeof NOTIFICATION_ACTION_TYPES)[number];

// ============================================================
// ACTION ENTITIES
// ============================================================

export const NOTIFICATION_ACTION_ENTITIES = [
  "hospital",
  "donor",
  "blood_drive",
  "request",
] as const;

export type NotificationActionEntity =
  (typeof NOTIFICATION_ACTION_ENTITIES)[number];

// ============================================================
// CATEGORY
// ============================================================

export type NotificationCategory =
  | "info"
  | "success"
  | "warning"
  | "error";

// ============================================================
// ACTION INTERFACE
// ============================================================

export interface INotificationAction {
  type: NotificationActionType;
  id: string;
  entity: NotificationActionEntity;

  bloodType?: string;
  units?: number;
  minRequired?: number;
  hospitalName?: string;
  severity?: string;
}

// ============================================================
// NOTIFICATION INTERFACE
// ============================================================

export interface INotification extends Document {
  /**
   * The User._id of the person who should receive
   * this notification.
   *
   * IMPORTANT:
   * This is the primary recipient field.
   */
  userId?: mongoose.Types.ObjectId;

  /**
   * Optional related Donor._id.
   */
  donorId?: mongoose.Types.ObjectId;

  /**
   * Optional related Hospital/User._id.
   *
   * This is NOT the primary recipient.
   */
  hospitalId?: mongoose.Types.ObjectId;

  donorName?: string;
  donorEmail?: string;

  hospitalName?: string;

  subject: string;
  message: string;

  type: NotificationType;

  category: NotificationCategory;

  isRead: boolean;
  readAt?: Date | null;

  sender: string;
  sentBy?: string;

  link?: string;

  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;

  data?: Record<string, any>;

  action?: INotificationAction;

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// ACTION SCHEMA
// ============================================================

const NotificationActionSchema = new Schema<INotificationAction>(
  {
    type: {
      type: String,
      enum: NOTIFICATION_ACTION_TYPES,
      required: true,
    },

    id: {
      type: String,
      required: true,
    },

    entity: {
      type: String,
      enum: NOTIFICATION_ACTION_ENTITIES,
      required: true,
    },

    bloodType: {
      type: String,
    },

    units: {
      type: Number,
    },

    minRequired: {
      type: Number,
    },

    hospitalName: {
      type: String,
    },

    severity: {
      type: String,
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// MAIN SCHEMA
// ============================================================

const NotificationSchema = new Schema<INotification>(
  {
    // ========================================================
    // PRIMARY RECIPIENT
    // ========================================================

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // ========================================================
    // RELATED DONOR
    // ========================================================

    donorId: {
      type: Schema.Types.ObjectId,
      ref: "Donor",
      required: false,
      index: true,
    },

    // ========================================================
    // RELATED HOSPITAL
    // ========================================================

    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    donorName: {
      type: String,
      trim: true,
    },

    donorEmail: {
      type: String,
      trim: true,
    },

    hospitalName: {
      type: String,
      trim: true,
    },

    // ========================================================
    // CONTENT
    // ========================================================

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },

    // ========================================================
    // TYPE
    // ========================================================

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: [true, "Notification type is required"],
      index: true,
    },

    // ========================================================
    // CATEGORY
    // ========================================================

    category: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },

    // ========================================================
    // READ STATUS
    // ========================================================

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // SENDER
    // ========================================================

    sender: {
      type: String,
      default: "RedPulse System",
      trim: true,
    },

    sentBy: {
      type: String,
      trim: true,
    },

    // ========================================================
    // LINK
    // ========================================================

    link: {
      type: String,
      trim: true,
    },

    // ========================================================
    // RELATED ENTITY
    // ========================================================

    relatedId: {
      type: Schema.Types.ObjectId,
      required: false,
    },

    relatedModel: {
      type: String,
      trim: true,
    },

    // ========================================================
    // EXTRA DATA
    // ========================================================

    data: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    // ========================================================
    // ACTION
    // ========================================================

    action: {
      type: NotificationActionSchema,
      required: false,
    },

    // ========================================================
    // SOFT DELETE
    // ========================================================

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

NotificationSchema.index({
  userId: 1,
  isDeleted: 1,
  isRead: 1,
  createdAt: -1,
});

NotificationSchema.index({
  donorId: 1,
  isDeleted: 1,
  isRead: 1,
  createdAt: -1,
});

NotificationSchema.index({
  hospitalId: 1,
  isDeleted: 1,
  isRead: 1,
  createdAt: -1,
});

NotificationSchema.index({
  type: 1,
  createdAt: -1,
});

NotificationSchema.index({
  isDeleted: 1,
  createdAt: -1,
});

// ============================================================
// MODEL
// ============================================================

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>(
    "Notification",
    NotificationSchema
  );

export default Notification;