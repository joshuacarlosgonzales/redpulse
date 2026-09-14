// models/InventoryAlert.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryAlert extends Document {
  inventoryId: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  units: number;
  minRequired: number;
  status: 'active' | 'resolved' | 'dismissed';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  daysUntilExpiry?: number;
  daysOverdue?: number;
  batchNumber?: string;
  expirationDate?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryAlertSchema = new Schema<IInventoryAlert>(
  {
    inventoryId: {
      type: String,
      required: true,
      index: true,
    },
    hospitalId: {
      type: String,
      required: true,
      index: true,
    },
    hospitalName: {
      type: String,
      required: true,
    },
    bloodType: {
      type: String,
      required: true,
    },
    units: {
      type: Number,
      required: true,
    },
    minRequired: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'dismissed'],
      default: 'active',
      index: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    daysUntilExpiry: {
      type: Number,
    },
    daysOverdue: {
      type: Number,
    },
    batchNumber: {
      type: String,
    },
    expirationDate: {
      type: String,
    },
    resolvedBy: {
      type: String,
    },
    resolvedAt: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
InventoryAlertSchema.index({ hospitalId: 1, status: 1 });
InventoryAlertSchema.index({ severity: 1, status: 1 });
InventoryAlertSchema.index({ createdAt: -1 });

// Check if model exists before creating a new one
const InventoryAlert = mongoose.models.InventoryAlert || 
  mongoose.model<IInventoryAlert>('InventoryAlert', InventoryAlertSchema);

export default InventoryAlert;