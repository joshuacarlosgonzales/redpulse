// models/BloodRelease.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IBloodRelease extends Document {
  hospitalId: mongoose.Types.ObjectId
  bloodType: string
  units: number
  patientName: string
  patientAge?: number
  patientGender?: string
  hospitalWard: string
  doctorName: string
  reason: string
  releaseDate: Date
  notes?: string
  status: string
  inventoryId?: mongoose.Types.ObjectId
  receiptNumber?: string
  requestId?: string
  donorName?: string
  donorEmail?: string
  donorPhone?: string
  donorBloodType?: string
  releasedBy?: string
  createdAt: Date
  updatedAt: Date
}

const BloodReleaseSchema = new Schema<IBloodRelease>(
  {
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'BloodInventory',
    },
    bloodType: {
      type: String,
      required: true,
      index: true,
    },
    units: {
      type: Number,
      required: true,
      min: 1,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientAge: {
      type: Number,
      min: 0,
      max: 150,
    },
    patientGender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    hospitalWard: {
      type: String,
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['released', 'used', 'cancelled'],
      default: 'released',
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    requestId: {
      type: String,
      default: '',
    },
    donorName: {
      type: String,
      default: '',
    },
    donorEmail: {
      type: String,
      default: '',
    },
    donorPhone: {
      type: String,
      default: '',
    },
    donorBloodType: {
      type: String,
      default: '',
    },
    releasedBy: {
      type: String,
      default: 'Hospital Staff',
    },
  },
  {
    timestamps: true,
  }
)

BloodReleaseSchema.index({ hospitalId: 1, bloodType: 1 })
BloodReleaseSchema.index({ releaseDate: -1 })
BloodReleaseSchema.index({ patientName: 1 })

export default mongoose.models.BloodRelease || mongoose.model<IBloodRelease>('BloodRelease', BloodReleaseSchema)