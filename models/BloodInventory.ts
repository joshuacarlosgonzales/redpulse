// models/BloodInventory.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBloodInventory extends Document {
  hospitalId: mongoose.Types.ObjectId;
  bloodType: string;
  units: number;
  minRequired: number;
  maxCapacity: number;
  expirationDate: Date;
  status: 'sufficient' | 'low' | 'critical' | 'out of stock';
  notes?: string;
  batchNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodInventorySchema = new Schema<IBloodInventory>(
  {
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hospital ID is required'],
      index: true
    },
    bloodType: {
      type: String,
      required: [true, 'Blood type is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    units: {
      type: Number,
      required: [true, 'Units are required'],
      default: 0,
      min: 0
    },
    minRequired: {
      type: Number,
      default: 15
    },
    maxCapacity: {
      type: Number,
      default: 60
    },
    expirationDate: {
      type: Date,
      required: [true, 'Expiration date is required']
    },
    status: {
      type: String,
      enum: ['sufficient', 'low', 'critical', 'out of stock'],
      default: 'sufficient'
    },
    notes: {
      type: String,
      default: ''
    },
    batchNumber: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
)

BloodInventorySchema.pre('save', async function () {
  const doc = this as unknown as IBloodInventory

  if (doc.units === 0) {
    doc.status = 'out of stock'
  } else if (doc.units <= 5) {
    doc.status = 'critical'
  } else if (doc.units <= doc.minRequired) {
    doc.status = 'low'
  } else {
    doc.status = 'sufficient'
  }

  if (doc.expirationDate && new Date(doc.expirationDate) < new Date()) {
    doc.status = 'out of stock'
  }
})

BloodInventorySchema.index({ hospitalId: 1, bloodType: 1 }, { unique: true })

const BloodInventory: Model<IBloodInventory> = mongoose.models.BloodInventory || mongoose.model<IBloodInventory>('BloodInventory', BloodInventorySchema)

export default BloodInventory