// models/BloodInventory.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBloodInventory extends Document {
  hospitalId: mongoose.Types.ObjectId;
  bloodType: string;
  units: number;
  minRequired: number;
  maxCapacity: number;
  status: 'Sufficient' | 'Low' | 'Critical' | 'Out of Stock';
  expirationDate: Date;
  batchNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to determine status - returns the union type
export function getBloodStatus(
  units: number, 
  minRequired: number = 15
): 'Sufficient' | 'Low' | 'Critical' | 'Out of Stock' {
  if (units <= 0) return 'Out of Stock';
  if (units <= minRequired * 0.3) return 'Critical';
  if (units <= minRequired) return 'Low';
  return 'Sufficient';
}

const BloodInventorySchema = new Schema<IBloodInventory>(
  {
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital ID is required'],
      index: true,
    },
    bloodType: {
      type: String,
      required: [true, 'Blood type is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      index: true,
    },
    units: {
      type: Number,
      required: [true, 'Units are required'],
      default: 0,
      min: [0, 'Units cannot be negative'],
    },
    minRequired: {
      type: Number,
      required: [true, 'Minimum required is required'],
      default: 15,
      min: [1, 'Minimum required must be at least 1'],
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      default: 60,
      min: [1, 'Maximum capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['Sufficient', 'Low', 'Critical', 'Out of Stock'],
      default: 'Sufficient',
    },
    expirationDate: {
      type: Date,
      required: [true, 'Expiration date is required'],
      default: function() {
        return new Date(Date.now() + 42 * 24 * 60 * 60 * 1000);
      },
    },
    batchNumber: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

// Pre-save middleware - FIXED
BloodInventorySchema.pre('save', function(this: any, next: any) {
  const doc = this as IBloodInventory;
  doc.status = getBloodStatus(doc.units, doc.minRequired);
  next();
});

// Indexes
BloodInventorySchema.index({ hospitalId: 1, bloodType: 1 }, { unique: true });
BloodInventorySchema.index({ status: 1 });
BloodInventorySchema.index({ expirationDate: 1 });

// Create or retrieve the model
const BloodInventory: Model<IBloodInventory> = mongoose.models.BloodInventory as Model<IBloodInventory> || 
  mongoose.model<IBloodInventory>('BloodInventory', BloodInventorySchema)

export default BloodInventory