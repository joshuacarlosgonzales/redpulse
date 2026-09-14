// models/BloodBag.ts

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBloodBag extends Document {
  hospitalId: mongoose.Types.ObjectId
  bloodType: string
  units: number
  donationId: mongoose.Types.ObjectId
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
    // ============================================================
    // HOSPITAL
    // ============================================================

    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ============================================================
    // BLOOD TYPE
    // ============================================================

    bloodType: {
      type: String,
      required: true,
      enum: [
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
      ],
    },

    // ============================================================
    // UNITS
    // ============================================================

    units: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    // ============================================================
    // DONATION
    // ============================================================

    donationId: {
      type: Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      index: true,
    },

    donationDate: {
      type: Date,
      required: true,
    },

    // ============================================================
    // EXPIRATION
    // ============================================================

    expirationDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ============================================================
    // STATUS
    // ============================================================

    status: {
      type: String,
      enum: [
        'available',
        'used',
        'expired',
        'quarantined',
      ],
      default: 'available',
    },

    // ============================================================
    // BATCH
    // ============================================================

    batchNumber: {
      type: String,
      default: '',
      trim: true,
    },

    // ============================================================
    // STORAGE LOCATION
    // ============================================================

    location: {
      type: String,
      default: 'Main Storage',
      trim: true,
    },

    // ============================================================
    // NOTES
    // ============================================================

    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// ============================================================
// INDEXES
// ============================================================

BloodBagSchema.index({
  hospitalId: 1,
  bloodType: 1,
  status: 1,
})

BloodBagSchema.index({
  expirationDate: 1,
})

BloodBagSchema.index({
  donationId: 1,
})

// ============================================================
// AUTOMATIC STATUS CHECK BEFORE SAVE
// ============================================================
//
// If the BloodBag is saved after its expiration date,
// automatically mark it as expired.
//
// IMPORTANT:
// This hook only runs when the document is saved.
// Your API should ALSO check expirationDate against
// the current date when displaying inventory.
// ============================================================

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

// ============================================================
// MODEL
// ============================================================

const BloodBag: Model<IBloodBag> =
  mongoose.models.BloodBag ||
  mongoose.model<IBloodBag>(
    'BloodBag',
    BloodBagSchema
  )

export default BloodBag