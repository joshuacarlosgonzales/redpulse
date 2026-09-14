// scripts/migrate-notifications.ts
import mongoose from 'mongoose';
import path from 'path';

// Register path aliases for ts-node
require('tsconfig-paths').register();

// Or use this approach if tsconfig-paths is not installed
import { config } from 'dotenv';
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/redpulse';

// Define the Notification schema directly in the script
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  donorName: String,
  donorEmail: String,
  hospitalName: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
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
    ],
    required: true,
  },
  category: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
  },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  sender: { type: String, default: 'RedPulse System' },
  sentBy: String,
  link: String,
  relatedId: mongoose.Schema.Types.ObjectId,
  relatedModel: String,
  data: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  action: {
    type: {
      type: String,
      enum: ['approve', 'reject', 'organize_drive'],
    },
    id: String,
    entity: {
      type: String,
      enum: ['hospital', 'donor', 'blood_drive', 'request'],
    },
    bloodType: String,
    units: Number,
    minRequired: Number,
    hospitalName: String,
    severity: String,
  },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

async function migrate() {
  try {
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Update notifications with BLOOD_DRIVE_NEEDED type
    const result1 = await Notification.updateMany(
      { type: 'BLOOD_DRIVE_NEEDED' },
      { $set: { type: 'BLOOD_DRIVE_NEEDED' } }
    );
    console.log(`✅ Updated ${result1.modifiedCount} notifications with type BLOOD_DRIVE_NEEDED`);

    // Update notifications with organize_drive action
    const result2 = await Notification.updateMany(
      { 'action.type': 'organize_drive' },
      { $set: { 'action.type': 'organize_drive' } }
    );
    console.log(`✅ Updated ${result2.modifiedCount} notifications with action type organize_drive`);

    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();