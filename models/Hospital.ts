// models/Hospital.ts
import mongoose from 'mongoose';

const HospitalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  hospitalLicense: {
    type: String,
    required: true,
    unique: true
  },
  hospitalAddress: {
    type: String,
    required: true
  },
  hospitalPhone: {
    type: String,
    required: true
  },
  hospitalType: {
    type: String,
    enum: ['General Hospital', 'Specialty Hospital', 'Teaching Hospital', 'Community Hospital', 'Private Hospital', 'Public Hospital', 'Military Hospital', 'Other'],
    default: 'General Hospital'
  },
  hospitalCapacity: {
    type: Number,
    default: 0
  },
  hospitalEmail: {
    type: String
  },
  hospitalWebsite: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Hospital || mongoose.model('Hospital', HospitalSchema);