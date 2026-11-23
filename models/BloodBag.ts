// models/BloodBag.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBloodBag extends Document {
  hospitalId: mongoose.Types.ObjectId
  bloodType: string
  units: number
  donationId: mongoose.Types.ObjectId | null
  sourceType: 'donation' | 'manual'
  sourceId: mongoose.Types.ObjectId | null
  donationDate: Date
  expirationDate: Date
  status: 'available' | 'used' | 'expired' | 'quarantined'
  batchNumber?: string
  location?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const BloodBagSchema = new Schema<IBloodBag>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bloodType: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    units: { type: Number, required: true, default: 1, min: 1 },

    // null for manual Add Stock bags; the Donation _id for recorded donations
    donationId: {
      type: Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['donation', 'manual'],
      default: 'donation',
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    donationDate: { type: Date, required: true },
    expirationDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['available', 'used', 'expired', 'quarantined'],
      default: 'available',
    },
    batchNumber: { type: String, default: '', trim: true },
    location: { type: String, default: 'Main Storage', trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

BloodBagSchema.index({ hospitalId: 1, bloodType: 1, status: 1 })
BloodBagSchema.index({ expirationDate: 1 })
BloodBagSchema.index({ donationId: 1 })
BloodBagSchema.index({ hospitalId: 1, donationDate: -1 })
BloodBagSchema.index({ hospitalId: 1, bloodType: 1, status: 1, expirationDate: 1 })

BloodBagSchema.pre('save', function () {
  const doc = this as IBloodBag
  if (
    doc.expirationDate &&
    new Date(doc.expirationDate) <= new Date() &&
    doc.status === 'available'
  ) {
    doc.status = 'expired'
  }
})

const BloodBag: Model<IBloodBag> =
  mongoose.models.BloodBag ||
  mongoose.model<IBloodBag>('BloodBag', BloodBagSchema)

export default BloodBag