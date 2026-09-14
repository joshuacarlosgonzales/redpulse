// models/BloodDriveRegistration.ts

import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export interface IBloodDriveRegistration
  extends Document {
  donorId: mongoose.Types.ObjectId
  bloodDriveId: mongoose.Types.ObjectId

  status:
    | 'registered'
    | 'attended'
    | 'cancelled'

  registeredAt: Date
  attendedAt?: Date
  cancelledAt?: Date

  notes?: string

  createdAt: Date
  updatedAt: Date
}

const BloodDriveRegistrationSchema: Schema<IBloodDriveRegistration> =
  new Schema(
    {
      donorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Donor ID is required'],
        index: true,
      },

      bloodDriveId: {
        type: Schema.Types.ObjectId,
        ref: 'BloodDrive',
        required: [true, 'Blood drive ID is required'],
        index: true,
      },

      status: {
        type: String,
        enum: [
          'registered',
          'attended',
          'cancelled',
        ],
        default: 'registered',
        required: [true, 'Status is required'],
      },

      registeredAt: {
        type: Date,
        default: Date.now,
      },

      attendedAt: {
        type: Date,
        default: null,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },

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

// Prevent duplicate registration
BloodDriveRegistrationSchema.index(
  {
    donorId: 1,
    bloodDriveId: 1,
  },
  {
    unique: true,
  }
)

const BloodDriveRegistration: Model<IBloodDriveRegistration> =
  mongoose.models.BloodDriveRegistration ||
  mongoose.model<IBloodDriveRegistration>(
    'BloodDriveRegistration',
    BloodDriveRegistrationSchema
  )

export default BloodDriveRegistration