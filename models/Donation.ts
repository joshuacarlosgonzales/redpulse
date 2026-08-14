// models/Donation.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDonation extends Document {
  donorId: mongoose.Types.ObjectId
  hospitalId: mongoose.Types.ObjectId // ADD THIS FIELD
  donorName: string
  donorEmail?: string // ADD THIS
  donorPhone?: string // ADD THIS
  bloodType: string
  units: number
  date: Date
  status: 'Completed' | 'Pending' | 'Scheduled' | 'Cancelled'
  hospital: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

const DonationSchema: Schema<IDonation> = new Schema(
  {
    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
    },
    hospitalId: { // ADD THIS FIELD
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hospital ID is required'],
      index: true,
    },
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    donorEmail: { // ADD THIS
      type: String,
      trim: true,
      lowercase: true,
    },
    donorPhone: { // ADD THIS
      type: String,
      trim: true,
    },
    bloodType: {
      type: String,
      required: [true, 'Blood type is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    units: {
      type: Number,
      required: [true, 'Units are required'],
      min: [1, 'Must be at least 1 unit'],
      default: 1,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Scheduled', 'Cancelled'],
      default: 'Pending',
    },
    hospital: {
      type: String,
      required: [true, 'Hospital is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Add indexes for better performance
DonationSchema.index({ hospitalId: 1, status: 1, date: -1 })
DonationSchema.index({ bloodType: 1 })

const Donation: Model<IDonation> = mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema)

export default Donation