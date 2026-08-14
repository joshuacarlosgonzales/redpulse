// models/BloodRequest.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBloodRequest extends Document {
  donorId: mongoose.Types.ObjectId;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  bloodType: string;
  quantity: number;
  urgency: 'critical' | 'urgent' | 'normal';
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled' | 'rejected';
  requestDate: Date;
  requiredDate: Date;
  hospitalName: string;
  hospitalAddress: string;
  hospitalId?: mongoose.Types.ObjectId; // Changed from null to optional
  patientName?: string;
  patientAge?: number; // Changed from null to optional
  notes?: string;
  requestMethod?: 'emergency' | 'scheduled' | 'routine';
  department?: string;
  doctorName?: string;
  contactNumber?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
  {
    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true,
    },
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    donorEmail: {
      type: String,
      required: [true, 'Donor email is required'],
      trim: true,
      lowercase: true,
    },
    donorPhone: {
      type: String,
      required: [true, 'Donor phone is required'],
      trim: true,
    },
    bloodType: {
      type: String,
      required: [true, 'Blood type is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    urgency: {
      type: String,
      enum: ['critical', 'urgent', 'normal'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'fulfilled', 'cancelled', 'rejected'],
      default: 'pending',
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    requiredDate: {
      type: Date,
      required: [true, 'Required date is required'],
    },
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    hospitalAddress: {
      type: String,
      default: '',
      trim: true,
    },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: false,
    },
    patientName: {
      type: String,
      default: '',
      trim: true,
    },
    patientAge: {
      type: Number,
      required: false,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    requestMethod: {
      type: String,
      enum: ['emergency', 'scheduled', 'routine'],
      default: 'routine',
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    doctorName: {
      type: String,
      default: '',
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
BloodRequestSchema.index({ donorId: 1, status: 1 });
BloodRequestSchema.index({ hospitalName: 1, status: 1 });
BloodRequestSchema.index({ hospitalId: 1, status: 1 });
BloodRequestSchema.index({ bloodType: 1, urgency: 1 });
BloodRequestSchema.index({ requiredDate: 1 });
BloodRequestSchema.index({ status: 1, createdAt: -1 });

const BloodRequest: Model<IBloodRequest> = mongoose.models.BloodRequest || 
  mongoose.model<IBloodRequest>('BloodRequest', BloodRequestSchema)

export default BloodRequest