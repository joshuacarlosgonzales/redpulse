import mongoose, {
  Schema,
  Document,
  Model,
} from 'mongoose'

export interface IBloodDrive extends Document {
  title: string
  description: string

  location: string
  address: string

  date: Date
  startTime: string
  endTime: string

  status:
    | 'upcoming'
    | 'ongoing'
    | 'completed'
    | 'cancelled'

  bloodTypesNeeded: string[]

  targetDonors: number
  registeredDonors: number
  completedDonations: number

  organizer: string
  contactNumber: string
  contactEmail: string

  registeredDonorIds: mongoose.Types.ObjectId[]

  donorStatuses: Map<string, string>

  hospitalId: mongoose.Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

// ============================================================
// ✅ SHARED STATUS CALCULATION
// Single source of truth for "what is this drive's status right
// now" — used by the API layer so every consumer (hospital
// dashboard, donor-facing pages, reports, filters, pagination)
// sees the same, accurate value instead of the stale `status`
// field that only gets set once at creation time.
// ============================================================
export type BloodDriveStatus =
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'cancelled'

export function calculateCurrentStatus(
  date: Date | string,
  startTime: string,
  endTime: string,
  storedStatus: string
): BloodDriveStatus {
  // A manually cancelled drive always stays cancelled
  if (storedStatus === 'cancelled') return 'cancelled'

  const now = new Date()
  const driveDate = new Date(date)

  if (isNaN(driveDate.getTime())) {
    // Can't parse the date — fall back to whatever was stored
    return (storedStatus as BloodDriveStatus) || 'upcoming'
  }

  const safeStart = startTime || '00:00'
  const safeEnd = endTime || '23:59'

  const [startHour, startMinute] = safeStart.split(':').map(Number)
  const [endHour, endMinute] = safeEnd.split(':').map(Number)

  const startDateTime = new Date(driveDate)
  startDateTime.setHours(startHour || 0, startMinute || 0, 0, 0)

  const endDateTime = new Date(driveDate)
  endDateTime.setHours(endHour || 23, endMinute || 59, 59, 999)

  const nowTime = now.getTime()
  const startTimeMs = startDateTime.getTime()
  const endTimeMs = endDateTime.getTime()

  // Same calendar day as today
  if (driveDate.toDateString() === now.toDateString()) {
    if (nowTime >= startTimeMs && nowTime <= endTimeMs) return 'ongoing'
    if (nowTime < startTimeMs) return 'upcoming'
    return 'completed'
  }

  // Any other day: purely date-based
  return driveDate.getTime() > nowTime ? 'upcoming' : 'completed'
}

const BloodDriveSchema: Schema<IBloodDrive> =
  new Schema(
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
        enum: [
          'upcoming',
          'ongoing',
          'completed',
          'cancelled',
        ],
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

// ============================================================
// ✅ VIRTUAL: currentStatus
// Lets you call `drive.currentStatus` on any document/lean object
// processed through the schema and always get the live status,
// without needing to remember to call the helper separately.
// (Lean queries won't get virtuals automatically — for those,
// use calculateCurrentStatus() directly, as the API route does.)
// ============================================================
BloodDriveSchema.virtual('currentStatus').get(function (
  this: IBloodDrive
) {
  return calculateCurrentStatus(
    this.date,
    this.startTime,
    this.endTime,
    this.status
  )
})

BloodDriveSchema.set('toJSON', { virtuals: true })
BloodDriveSchema.set('toObject', { virtuals: true })

// ============================================================
// INDEXES
// ============================================================

BloodDriveSchema.index({
  date: 1,
})

BloodDriveSchema.index({
  status: 1,
})

BloodDriveSchema.index({
  hospitalId: 1,
})

BloodDriveSchema.index({
  hospitalId: 1,
  date: 1,
})

BloodDriveSchema.index({
  registeredDonorIds: 1,
})

const BloodDrive: Model<IBloodDrive> =
  mongoose.models.BloodDrive ||
  mongoose.model<IBloodDrive>(
    'BloodDrive',
    BloodDriveSchema
  )

export default BloodDrive