// models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  fullName: string
  email: string
  phone: string
  bloodType: string
  password: string
  role: 'donor' | 'hospital' | 'admin'
  isActive: boolean
  isVerified: boolean
  isApproved: boolean
  // Donor-specific fields
  donationCount: number
  lastDonation: Date
  nextEligibleDate: Date
  // Hospital-specific fields
  hospitalName?: string
  hospitalLicense?: string
  hospitalAddress?: string
  hospitalPhone?: string
  hospitalType?: string
  hospitalCapacity?: number
  hospitalEmail?: string
  hospitalWebsite?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema<IUser> = new Schema(
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
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
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
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['donor', 'hospital', 'admin'],
      default: 'donor',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    // Donor-specific fields
    donationCount: {
      type: Number,
      default: 0,
    },
    lastDonation: {
      type: Date,
    },
    nextEligibleDate: {
      type: Date,
    },
    // Hospital-specific fields
    hospitalName: {
      type: String,
      required: function(this: IUser) {
        return this.role === 'hospital';
      },
    },
    hospitalLicense: {
      type: String,
      required: function(this: IUser) {
        return this.role === 'hospital';
      },
    },
    hospitalAddress: {
      type: String,
      required: function(this: IUser) {
        return this.role === 'hospital';
      },
    },
    hospitalPhone: {
      type: String,
      required: function(this: IUser) {
        return this.role === 'hospital';
      },
    },
    hospitalType: {
      type: String,
      trim: true,
    },
    hospitalCapacity: {
      type: Number,
      default: 0,
    },
    hospitalEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    hospitalWebsite: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Remove password from JSON responses
UserSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

// Create indexes
UserSchema.index({ role: 1 })
UserSchema.index({ bloodType: 1 })

// ✅ FIXED: Explicitly specify the collection name as 'users'
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users')

export default User