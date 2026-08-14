// models/BloodDrive.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBloodDrive extends Document {
  title: string;
  description: string;
  location: string;
  address: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  bloodTypesNeeded: string[];
  targetDonors: number;
  registeredDonors: number;
  completedDonations: number;
  organizer: string;
  contactNumber: string;
  contactEmail: string;
  registeredDonorIds: mongoose.Types.ObjectId[];
  donorStatuses: Map<string, string>; // ✅ Added: Track donor approval status
  hospitalId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BloodDriveSchema: Schema<IBloodDrive> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    bloodTypesNeeded: {
      type: [String],
      default: [],
    },
    targetDonors: {
      type: Number,
      default: 50,
      min: 1,
    },
    registeredDonors: {
      type: Number,
      default: 0,
    },
    completedDonations: {
      type: Number,
      default: 0,
    },
    organizer: {
      type: String,
      default: '',
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
    },
    registeredDonorIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    donorStatuses: {
      type: Map,
      of: String,
      default: {},
    },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hospital ID is required'],
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for faster queries
BloodDriveSchema.index({ date: 1 })
BloodDriveSchema.index({ status: 1 })
BloodDriveSchema.index({ hospitalId: 1 })

const BloodDrive: Model<IBloodDrive> = 
  mongoose.models.BloodDrive || 
  mongoose.model<IBloodDrive>('BloodDrive', BloodDriveSchema)

export default BloodDrive