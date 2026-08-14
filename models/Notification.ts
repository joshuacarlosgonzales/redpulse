import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed from 'true' to 'false'
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: false // Add this field
  },
  donorName: {
    type: String,
    required: false
  },
  donorEmail: {
    type: String,
    required: false
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  sender: {
    type: String,
    default: 'RedPulse Admin'
  },
  sentBy: {
    type: String,
    required: false
  },
  link: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ donorId: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);