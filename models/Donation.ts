// models/Donation.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

const BLOOD_SHELF_LIFE_DAYS = 42

export interface IDonation extends Document {
  donorId: mongoose.Types.ObjectId
  bloodDriveId?: mongoose.Types.ObjectId
  hospitalId: mongoose.Types.ObjectId
  donorName: string
  donorEmail?: string
  donorPhone?: string
  bloodType: string
  units: number
  date: Date
  expirationDate: Date
  status: 'Completed' | 'Pending' | 'Scheduled' | 'Cancelled'
  hospital: string
  notes: string
  isWalkIn?: boolean
  createdAt: Date
  updatedAt: Date
}

const DonationSchema: Schema<IDonation> = new Schema(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Donor ID is required'] },
    bloodDriveId: { type: Schema.Types.ObjectId, ref: 'BloodDrive', default: null, index: true },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hospital ID is required'],
      index: true,
    },
    donorName: { type: String, required: [true, 'Donor name is required'], trim: true },
    donorEmail: { type: String, trim: true, lowercase: true },
    donorPhone: { type: String, trim: true },
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
    date: { type: Date, required: [true, 'Date is required'], default: Date.now },
    expirationDate: { type: Date, required: [true, 'Expiration date is required'], index: true },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Scheduled', 'Cancelled'],
      default: 'Pending',
    },
    hospital: { type: String, required: [true, 'Hospital is required'], trim: true },
    notes: { type: String, trim: true, default: '' },
    isWalkIn: { type: Boolean, default: false },
  },
  { timestamps: true }
)

DonationSchema.pre('validate', function () {
  const donation = this as IDonation
  if (donation.date && !donation.expirationDate) {
    const expirationDate = new Date(donation.date)
    expirationDate.setDate(expirationDate.getDate() + BLOOD_SHELF_LIFE_DAYS)
    donation.expirationDate = expirationDate
  }
})

// Create one BloodBag per unit on Completed donations.
// Non-blocking: errors are logged but don't reject the save,
// since the donation itself is the source of truth.
DonationSchema.post('save', async function (donation: IDonation) {
  if (donation.status !== 'Completed') return

  try {
    const BloodBagModel =
      mongoose.models.BloodBag || (await import('./BloodBag')).default

    // Idempotency: if bags for this donation already exist, skip.
    const existing = await BloodBagModel.countDocuments({ donationId: donation._id })
    if (existing > 0) return

    const stamp = Date.now().toString().slice(-6)

    const bags = Array.from({ length: donation.units }, (_, i) => ({
      hospitalId: donation.hospitalId,
      bloodType: donation.bloodType,
      units: 1,
      donationId: donation._id,
      sourceType: 'donation' as const,
      sourceId: donation._id,
      donationDate: donation.date,
      expirationDate: donation.expirationDate,
      status: 'available' as const,
      batchNumber: `${donation.bloodType}-${stamp}-${String.fromCharCode(65 + i)}`,
      location: 'Main Storage',
      notes: donation.notes || '',
    }))

    // ordered:false so one failure doesn't abort the batch
    await BloodBagModel.insertMany(bags, { ordered: false })
    console.log(`✅ Created ${bags.length} blood bag(s) for donation ${donation._id}`)
  } catch (error) {
    console.error('Error creating blood bags for donation:', donation._id, error)
  }
})

DonationSchema.index({ hospitalId: 1, status: 1, date: -1 })
DonationSchema.index({ bloodType: 1 })
DonationSchema.index({ bloodDriveId: 1 })
DonationSchema.index({ expirationDate: 1 })
DonationSchema.index({ hospitalId: 1, expirationDate: 1, status: 1 })

const Donation: Model<IDonation> =
  mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema)

export default Donation