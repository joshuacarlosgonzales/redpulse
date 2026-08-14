// models/Donor.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDonor extends Document {
  fullName: string
  email: string
  phone: string
  bloodType: string
  address: string
  dateOfBirth: Date
  gender: string
  weight: number
  lastDonationDate: Date | null
  isEligible: boolean
  totalDonations: number
  // Additional fields
  barangay?: string
  municipality?: string
  province?: string
  digitalId?: string
  emergencyContact?: string
  status?: 'active' | 'inactive' | 'pending' | 'rejected'
  nextEligibleDate?: Date | null
  medicalConditions?: string
  currentMedications?: string
  bloodPressure?: string
  temperature?: number
  pulseRate?: number
  hemoglobin?: number
  emergencyName?: string
  emergencyRelationship?: string
  middleName?: string
  // Approval fields
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  // ✅ Add userId field
  userId?: mongoose.Types.ObjectId
  // ✅ Background check fields
  backgroundCheckStatus?: 'pending' | 'in-review' | 'cleared' | 'failed'
  backgroundCheckDate?: Date
  backgroundCheckNotes?: string
  verifiedBy?: string
  verificationDate?: Date
  createdAt: Date
  updatedAt: Date
}

const DonorSchema: Schema<IDonor> = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    bloodType: {
      type: String,
      required: [true, 'Blood type is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [40, 'Weight must be at least 40 kg'],
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    isEligible: {
      type: Boolean,
      default: true,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
    // Additional fields
    barangay: {
      type: String,
      trim: true,
    },
    municipality: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
    },
    digitalId: {
      type: String,
      unique: true,
      sparse: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'rejected'],
      default: 'pending',
    },
    nextEligibleDate: {
      type: Date,
      default: null,
    },
    medicalConditions: {
      type: String,
      trim: true,
    },
    currentMedications: {
      type: String,
      trim: true,
    },
    bloodPressure: {
      type: String,
      trim: true,
    },
    temperature: {
      type: Number,
    },
    pulseRate: {
      type: Number,
    },
    hemoglobin: {
      type: Number,
    },
    emergencyName: {
      type: String,
      trim: true,
    },
    emergencyRelationship: {
      type: String,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    // Approval fields
    approvedBy: {
      type: String,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    // userId field
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    // ✅ Background check fields
    backgroundCheckStatus: {
      type: String,
      enum: ['pending', 'in-review', 'cleared', 'failed'],
      default: 'pending',
    },
    backgroundCheckDate: {
      type: Date,
      default: null,
    },
    backgroundCheckNotes: {
      type: String,
      default: '',
      trim: true,
    },
    verifiedBy: {
      type: String,
      ref: 'User',
    },
    verificationDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
DonorSchema.index({ bloodType: 1 })
DonorSchema.index({ status: 1 })
DonorSchema.index({ fullName: 1 })
DonorSchema.index({ createdAt: -1 })
DonorSchema.index({ userId: 1 })
DonorSchema.index({ backgroundCheckStatus: 1 }) // ✅ Index for background check

// Virtuals
DonorSchema.virtual('location').get(function() {
  if (this.barangay && this.municipality && this.province) {
    return `${this.barangay}, ${this.municipality}, ${this.province}`
  }
  return this.address || ''
})

DonorSchema.virtual('firstName').get(function() {
  return this.fullName.split(' ')[0] || ''
})

DonorSchema.virtual('lastName').get(function() {
  const parts = this.fullName.split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : ''
})

// Ensure virtuals are included in JSON output
DonorSchema.set('toJSON', { virtuals: true })
DonorSchema.set('toObject', { virtuals: true })

const Donor: Model<IDonor> = mongoose.models.Donor || mongoose.model<IDonor>('Donor', DonorSchema)

export default Donor