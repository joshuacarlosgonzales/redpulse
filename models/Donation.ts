// models/Donation.ts

import mongoose, { Schema, Document, Model } from 'mongoose'
import BloodBag from './BloodBag'

// ============================================================
// BLOOD SHELF LIFE
// ============================================================
// Set this according to the applicable blood product/storage
// rule used by your RedPulse system.
//
// Example: 42 days is commonly used for certain refrigerated
// red-cell products, but shelf life varies by component and
// storage/preservation method.
//
// IMPORTANT:
// Change this value if your system uses a different rule.
// ============================================================

const BLOOD_SHELF_LIFE_DAYS = 42

export interface IDonation extends Document {
  donorId: mongoose.Types.ObjectId

  // Links donation to the blood drive where it happened
  bloodDriveId?: mongoose.Types.ObjectId

  hospitalId: mongoose.Types.ObjectId

  donorName: string
  donorEmail?: string
  donorPhone?: string

  bloodType: string
  units: number

  // Date the donation was collected
  date: Date

  // Automatically calculated from the donation date
  expirationDate: Date

  status:
    | 'Completed'
    | 'Pending'
    | 'Scheduled'
    | 'Cancelled'

  hospital: string
  notes: string

  // ✅ Added for walk-in tracking
  isWalkIn?: boolean

  createdAt: Date
  updatedAt: Date
}

const DonationSchema: Schema<IDonation> = new Schema(
  {
    // ============================================================
    // DONOR
    // ============================================================

    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
    },

    // ============================================================
    // BLOOD DRIVE
    // ============================================================

    bloodDriveId: {
      type: Schema.Types.ObjectId,
      ref: 'BloodDrive',
      default: null,
      index: true,
    },

    // ============================================================
    // HOSPITAL
    // ============================================================

    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hospital ID is required'],
      index: true,
    },

    // ============================================================
    // DONOR INFORMATION
    // ============================================================

    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },

    donorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    donorPhone: {
      type: String,
      trim: true,
    },

    // ============================================================
    // BLOOD INFORMATION
    // ============================================================

    bloodType: {
      type: String,
      required: [true, 'Blood type is required'],
      enum: [
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
      ],
    },

    units: {
      type: Number,
      required: [true, 'Units are required'],
      min: [1, 'Must be at least 1 unit'],
      default: 1,
    },

    // ============================================================
    // DONATION DATE
    // ============================================================

    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },

    // ============================================================
    // AUTOMATIC EXPIRATION DATE
    // ============================================================
    //
    // The user does NOT need to enter this manually.
    //
    // Example:
    //
    // Donation Date:    August 18, 2026
    // Shelf Life:       42 days
    // Expiration Date:  September 29, 2026
    //
    // The pre-validation hook below calculates this automatically.
    // ============================================================

    expirationDate: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true,
    },

    // ============================================================
    // STATUS
    // ============================================================

    status: {
      type: String,
      enum: [
        'Completed',
        'Pending',
        'Scheduled',
        'Cancelled',
      ],
      default: 'Pending',
    },

    // ============================================================
    // HOSPITAL NAME
    // ============================================================

    hospital: {
      type: String,
      required: [true, 'Hospital is required'],
      trim: true,
    },

    // ============================================================
    // NOTES
    // ============================================================

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // ============================================================
    // ✅ WALK-IN FLAG
    // ============================================================

    isWalkIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// ============================================================
// AUTOMATIC EXPIRATION DATE CALCULATION
// ============================================================
//
// When a donation is created:
//
// date + BLOOD_SHELF_LIFE_DAYS = expirationDate
//
// The hospital only provides the donation date.
// The expiration date is calculated automatically.
//
// We use pre('validate') so that the required
// expirationDate field is populated before validation.
// ============================================================

DonationSchema.pre('validate', function () {
  const donation = this as IDonation

  // Calculate only when:
  // 1. There is a donation date
  // 2. expirationDate has not been manually/set previously
  if (donation.date && !donation.expirationDate) {
    const expirationDate = new Date(donation.date)

    expirationDate.setDate(
      expirationDate.getDate() + BLOOD_SHELF_LIFE_DAYS
    )

    donation.expirationDate = expirationDate
  }
})

// ============================================================
// ✅ AFTER SAVE: CREATE BLOOD BAGS FOR EACH UNIT
// ============================================================
// 
// When a donation is saved with status 'Completed',
// this automatically creates individual BloodBag records
// for each unit of the donation.
//
// Example: 3 units = 3 blood bags
// ============================================================

DonationSchema.post('save', async function(donation: IDonation) {
  try {
    // Only create blood bags for completed donations
    if (donation.status !== 'Completed') {
      console.log(`⏭️ Donation ${donation._id} is not completed, skipping blood bag creation`)
      return
    }

    // Check if blood bags already exist for this donation
    const BloodBagModel = mongoose.models.BloodBag || (await import('./BloodBag')).default
    const existingBags = await BloodBagModel.find({ donationId: donation._id })
    if (existingBags.length > 0) {
      console.log(`ℹ️ Blood bags already exist for donation ${donation._id}`)
      return
    }

    console.log(`📦 Creating ${donation.units} blood bag(s) for donation ${donation._id}`)

    const bags = []
    for (let i = 0; i < donation.units; i++) {
      const batchNumber = `${donation.bloodType}-${Date.now().toString().slice(-6)}-${String.fromCharCode(65 + i)}`
      
      bags.push({
        hospitalId: donation.hospitalId,
        bloodType: donation.bloodType,
        units: 1,
        donationId: donation._id,
        donationDate: donation.date,
        expirationDate: donation.expirationDate,
        status: 'available',
        batchNumber: batchNumber,
        location: 'Main Storage',
        notes: donation.notes || '',
      })
    }

    if (bags.length > 0) {
      const createdBags = await BloodBagModel.insertMany(bags)
      console.log(`✅ Created ${createdBags.length} blood bag(s) for donation ${donation._id}`)
      
      // Log bag details
      createdBags.forEach((bag: any, index: number) => {
        console.log(`  🩸 Bag ${index + 1}: ${bag.batchNumber} | ${bag.bloodType} | Expires: ${bag.expirationDate.toLocaleDateString()}`)
      })
    }
  } catch (error) {
    console.error('❌ Error creating blood bags for donation:', error)
  }
})

// ============================================================
// INDEXES
// ============================================================

DonationSchema.index({
  hospitalId: 1,
  status: 1,
  date: -1,
})

DonationSchema.index({
  bloodType: 1,
})

DonationSchema.index({
  bloodDriveId: 1,
})

DonationSchema.index({
  expirationDate: 1,
})

// ✅ Index for hospital + expiration queries
DonationSchema.index({
  hospitalId: 1,
  expirationDate: 1,
  status: 1,
})

// ============================================================
// MODEL
// ============================================================

const Donation: Model<IDonation> =
  mongoose.models.Donation ||
  mongoose.model<IDonation>(
    'Donation',
    DonationSchema
  )

export default Donation