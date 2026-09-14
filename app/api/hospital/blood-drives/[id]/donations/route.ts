import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodDrive from '@/models/BloodDrive'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import Donation from '@/models/Donation'
import Donor from '@/models/Donor'
import User from '@/models/User'
import BloodInventory from '@/models/BloodInventory'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const BloodDriveModel = BloodDrive as any
const RegistrationModel = BloodDriveRegistration as any
const DonationModel = Donation as any
const DonorModel = Donor as any
const UserModel = User as any
const InventoryModel = BloodInventory as any

// ============================================================
// AUTHENTICATION
// ============================================================

function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - No token provided',
        },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as any

    if (
      !decoded ||
      (decoded.role !== 'hospital' && decoded.role !== 'admin')
    ) {
      return {
        error: NextResponse.json(
          {
            success: false,
            error: 'Unauthorized - Hospital or Admin access required',
          },
          { status: 403 }
        ),
      }
    }

    return {
      decoded,
    }
  } catch (error) {
    console.error('JWT verification error:', error)

    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
        },
        { status: 401 }
      ),
    }
  }
}

// ============================================================
// GET - Get Donations for a Blood Drive
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const auth = authenticate(request)

    if (auth.error) {
      return auth.error
    }

    const decoded = auth.decoded
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blood drive ID',
        },
        { status: 400 }
      )
    }

    const hospitalId = decoded.userId || decoded.id

    const bloodDriveQuery: any = {
      _id: new mongoose.Types.ObjectId(id),
    }

    if (decoded.role === 'hospital') {
      if (!hospitalId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Hospital ID not found in token',
          },
          { status: 400 }
        )
      }

      bloodDriveQuery.hospitalId =
        new mongoose.Types.ObjectId(hospitalId)
    }

    const bloodDrive =
      await BloodDriveModel.findOne(bloodDriveQuery).lean()

    if (!bloodDrive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blood drive not found or unauthorized',
        },
        { status: 404 }
      )
    }

    const donations = await DonationModel.find({
      bloodDriveId: bloodDrive._id,
      hospitalId: bloodDrive.hospitalId,
    })
      .sort({ date: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: donations.map((donation: any) => ({
        id: donation._id.toString(),
        donorId: donation.donorId?.toString() || '',
        hospitalId: donation.hospitalId?.toString() || '',
        bloodDriveId: donation.bloodDriveId?.toString() || '',
        donorName: donation.donorName || 'Unknown Donor',
        donorEmail: donation.donorEmail || '',
        donorPhone: donation.donorPhone || '',
        bloodType: donation.bloodType || '',
        units: Number(donation.units || 0),
        date: donation.date || donation.createdAt || null,
        status: donation.status || 'Pending',
        hospital: donation.hospital || '',
        notes: donation.notes || '',
        isWalkIn: donation.isWalkIn || false,
        createdAt: donation.createdAt || null,
        updatedAt: donation.updatedAt || null,
      })),
    })
  } catch (error: any) {
    console.error('❌ Error fetching blood drive donations:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch blood drive donations',
      },
      { status: 500 }
    )
  }
}

// ============================================================
// POST - Confirm Donor Donation From Blood Drive
// ============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const auth = authenticate(request)

    if (auth.error) {
      return auth.error
    }

    const decoded = auth.decoded
    const { id } = await params

    // ========================================================
    // VALIDATE BLOOD DRIVE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blood drive ID',
        },
        { status: 400 }
      )
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body = await request.json()

    console.log(
      '📥 Blood drive donation confirmation request:',
      JSON.stringify(body, null, 2)
    )

    const donorId = body.donorId
    const units = Number(body.units || 1)
    const requestedBloodType = body.bloodType
    const notes = typeof body.notes === 'string' ? body.notes.trim() : ''

    // ========================================================
    // VALIDATE DONOR ID
    // ========================================================

    if (!donorId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Donor ID is required',
        },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(donorId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid donor ID',
        },
        { status: 400 }
      )
    }

    // ========================================================
    // VALIDATE UNITS
    // ========================================================

    if (!Number.isFinite(units) || units < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Units must be at least 1',
        },
        { status: 400 }
      )
    }

    // ========================================================
    // FIND BLOOD DRIVE
    // ========================================================

    const hospitalIdFromToken = decoded.userId || decoded.id

    const bloodDriveQuery: any = {
      _id: new mongoose.Types.ObjectId(id),
    }

    if (decoded.role === 'hospital') {
      if (!hospitalIdFromToken) {
        return NextResponse.json(
          {
            success: false,
            error: 'Hospital ID not found in token',
          },
          { status: 400 }
        )
      }

      if (!mongoose.Types.ObjectId.isValid(hospitalIdFromToken)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid hospital ID',
          },
          { status: 400 }
        )
      }

      bloodDriveQuery.hospitalId =
        new mongoose.Types.ObjectId(hospitalIdFromToken)
    }

    const bloodDrive = await BloodDriveModel.findOne(bloodDriveQuery)

    if (!bloodDrive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blood drive not found or unauthorized',
        },
        { status: 404 }
      )
    }

    // ========================================================
    // ✅ GET HOSPITAL USER INFO FOR CONSISTENT NAMING
    // ========================================================

    const hospitalUser = await UserModel.findById(bloodDrive.hospitalId)
    const hospitalName = hospitalUser?.hospitalName || 
                         hospitalUser?.fullName || 
                         hospitalUser?.name || 
                         'Hospital'
    const hospitalEmail = hospitalUser?.email || decoded.email || 'Hospital Staff'

    console.log('🏥 Hospital Name:', hospitalName)
    console.log('📧 Hospital Email:', hospitalEmail)

    // ========================================================
    // FIND DONOR PROFILE - FIXED FOR WALK-IN DONORS
    // ========================================================

    let donorProfile = null
    let donorUser = null

    // 1. First try to find donor by ID directly
    donorProfile = await DonorModel.findById(donorId)
    
    if (donorProfile) {
      console.log('✅ Found donor by ID:', donorProfile._id)
      
      // If donor has a userId, try to get the user
      if (donorProfile.userId) {
        donorUser = await UserModel.findById(donorProfile.userId)
      }
    }

    // 2. If not found by ID, try by userId (for registered donors)
    if (!donorProfile) {
      donorUser = await UserModel.findOne({
        _id: new mongoose.Types.ObjectId(donorId),
        role: 'donor',
      })

      if (donorUser) {
        donorProfile = await DonorModel.findOne({
          userId: donorUser._id,
        })
        if (donorProfile) {
          console.log('✅ Found donor by userId:', donorProfile._id)
        }
      }
    }

    // 3. If still not found, try by email (for walk-in donors)
    if (!donorProfile && body.donorEmail) {
      donorProfile = await DonorModel.findOne({
        email: body.donorEmail,
      })
      if (donorProfile) {
        console.log('✅ Found donor by email:', donorProfile._id)
      }
    }

    // 4. If still not found, create a new donor (for walk-in)
    if (!donorProfile) {
      console.log('📝 Donor not found, creating new donor profile...')
      
      const email = body.donorEmail || `${body.donorName?.replace(/\s/g, '').toLowerCase()}@donor.com`
      let uniqueEmail = email
      let counter = 0
      
      while (true) {
        const existing = await DonorModel.findOne({ email: uniqueEmail })
        if (!existing) break
        counter++
        uniqueEmail = `${email.split('@')[0]}${counter}@${email.split('@')[1] || 'donor.com'}`
        if (counter > 100) {
          uniqueEmail = `donor_${Date.now()}@donor.com`
          break
        }
      }

      // ✅ Generate digital ID
      const timestamp = Date.now().toString()
      const digitalId = `DONOR-${timestamp.slice(-8)}`

      // ✅ Create donor with full info and hospital tracking
      const donorData = {
        fullName: body.donorName || 'Unknown Donor',
        email: uniqueEmail,
        phone: body.donorPhone || 'N/A',
        bloodType: requestedBloodType || 'O+',
        address: 'Registered Donor',
        barangay: 'Registered',
        municipality: 'Registered',
        province: 'Registered',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Other',
        weight: 50,
        status: 'active',
        isEligible: true,
        totalDonations: 0,
        lastDonationDate: null,
        nextEligibleDate: null,
        digitalId: digitalId,
        userId: null,
        isWalkIn: true,
        registrationType: 'walk-in', // ✅ Track registration type
        hospitalName: hospitalName, // ✅ Track which hospital created this donor
        backgroundCheckStatus: 'cleared',
        backgroundCheckDate: new Date(),
        backgroundCheckNotes: 'Auto-created for donation',
        verifiedBy: hospitalEmail, // ✅ Use hospital email
        verificationDate: new Date(),
        approvedBy: hospitalEmail, // ✅ Use hospital email
        approvedAt: new Date(),
        emergencyContact: body.donorPhone || 'N/A',
      }

      donorProfile = await DonorModel.create(donorData)
      console.log('✅ Created new donor:', donorProfile._id)
      console.log('✅ Donor hospitalName:', donorProfile.hospitalName)
      console.log('✅ Donor approvedBy:', donorProfile.approvedBy)
    }

    // ========================================================
    // VERIFY BLOOD DRIVE REGISTRATION
    // ========================================================

    // Check if donor is registered for this blood drive
    const donorIdStr = donorProfile._id.toString()
    const registeredDonorIds = bloodDrive.registeredDonorIds || []
    
    const isRegistered = registeredDonorIds.some(
      (id: any) => id.toString() === donorIdStr
    )

    // Also check registration model if available
    let registration = null
    if (donorUser) {
      registration = await RegistrationModel.findOne({
        donorId: donorUser._id,
        bloodDriveId: bloodDrive._id,
      })
    }

    // If not registered, register them now (for walk-ins)
    if (!isRegistered && !registration) {
      console.log('📝 Registering walk-in donor to blood drive...')
      
      // Add to registeredDonorIds
      bloodDrive.registeredDonorIds.push(donorProfile._id)
      
      // Set donor status
      if (!bloodDrive.donorStatuses) {
        bloodDrive.donorStatuses = new Map()
      }
      bloodDrive.donorStatuses.set(donorIdStr, 'approved')
      
      // Increment registered donors count
      bloodDrive.registeredDonors = (bloodDrive.registeredDonors || 0) + 1
      
      await bloodDrive.save()
      console.log('✅ Walk-in donor registered to blood drive')
    }

    // ========================================================
    // DETERMINE BLOOD TYPE
    // ========================================================

    const bloodType = requestedBloodType || donorProfile.bloodType || 'O+'

    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

    if (!bloodType || !validBloodTypes.includes(bloodType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid donor blood type is required',
        },
        { status: 400 }
      )
    }

    // ========================================================
    // CHECK FOR EXISTING DONATION
    // ========================================================

    const existingDonation = await DonationModel.findOne({
      donorId: donorProfile._id,
      hospitalId: bloodDrive.hospitalId,
      bloodDriveId: bloodDrive._id,
    })

    if (existingDonation) {
      return NextResponse.json(
        {
          success: true,
          message: 'Donation already recorded for this donor',
          data: {
            donationId: existingDonation._id.toString(),
            donorId: donorProfile._id.toString(),
            donorName: donorProfile.fullName,
            bloodType: donorProfile.bloodType,
            units: existingDonation.units,
            status: existingDonation.status,
          }
        },
        { status: 200 }
      )
    }

    // ========================================================
    // DONOR NAME / CONTACT
    // ========================================================

    const donorName = donorProfile.fullName || 'Unknown Donor'
    const donorEmail = donorProfile.email || ''
    const donorPhone = donorProfile.phone || ''

    // ========================================================
    // DONATION DATE
    // ========================================================

    const donationDate = body.donationDate ? new Date(body.donationDate) : new Date()

    if (Number.isNaN(donationDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid donation date',
        },
        { status: 400 }
      )
    }

    // ========================================================
    // EXPIRATION DATE
    // ========================================================

    const expirationDate = new Date(donationDate)
    expirationDate.setDate(expirationDate.getDate() + 42)

    // ========================================================
    // ✅ CREATE DONATION WITH CONSISTENT HOSPITAL INFO
    // ========================================================

    const donationData = {
      donorId: donorProfile._id,
      hospitalId: bloodDrive.hospitalId,
      bloodDriveId: bloodDrive._id,
      donorName: donorName,
      donorEmail: donorEmail,
      donorPhone: donorPhone,
      bloodType: bloodType,
      units: units,
      date: donationDate,
      status: 'Completed' as const,
      hospital: hospitalName, // ✅ Use hospital name from User model
      notes: `Blood Drive: ${bloodDrive.title}${notes ? ` | ${notes}` : ''}`,
      isWalkIn: donorProfile.isWalkIn || false,
      expirationDate: expirationDate, // ✅ Add expiration date
    }

    console.log('💾 Creating donation with:', {
      donorName: donationData.donorName,
      bloodType: donationData.bloodType,
      units: donationData.units,
      hospital: donationData.hospital,
      hospitalId: donationData.hospitalId?.toString(),
      isWalkIn: donationData.isWalkIn,
    })

    const donation = await DonationModel.create(donationData)
    console.log('✅ Donation created:', donation._id.toString())

    // ========================================================
    // UPDATE REGISTRATION
    // ========================================================

    if (registration) {
      registration.status = 'attended'
      registration.attendedAt = donationDate
      registration.notes = registration.notes
        ? `${registration.notes} | Donation confirmed`
        : 'Donation confirmed'
      await registration.save()
    }

    // ========================================================
    // UPDATE BLOOD DRIVE
    // ========================================================

    if (!bloodDrive.donorStatuses) {
      bloodDrive.donorStatuses = new Map()
    }

    bloodDrive.donorStatuses.set(donorProfile._id.toString(), 'completed')
    bloodDrive.completedDonations = Number(bloodDrive.completedDonations || 0) + 1
    await bloodDrive.save()

    // ========================================================
    // UPDATE DONOR PROFILE
    // ========================================================

    donorProfile.lastDonationDate = donationDate
    donorProfile.totalDonations = (donorProfile.totalDonations || 0) + 1

    const nextEligibleDate = new Date(donationDate)
    nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3)
    donorProfile.nextEligibleDate = nextEligibleDate
    donorProfile.isEligible = false
    await donorProfile.save()

    // ========================================================
    // UPDATE BLOOD INVENTORY
    // ========================================================

    let inventoryRecord = await InventoryModel.findOne({
      hospitalId: bloodDrive.hospitalId,
      bloodType: bloodType,
    })

    if (!inventoryRecord) {
      inventoryRecord = await InventoryModel.create({
        hospitalId: bloodDrive.hospitalId,
        bloodType: bloodType,
        units: units,
        minRequired: 5,
        expirationDate: expirationDate,
        status: 'sufficient',
        notes: `+${units} units from ${donorName} on ${donationDate.toLocaleDateString()} for blood drive: ${bloodDrive.title}`,
        batchNumber: `BD-${Date.now()}`,
        location: 'Main Storage',
      })
      console.log('✅ Inventory created for blood type:', bloodType)
    } else {
      const oldUnits = Number(inventoryRecord.units || 0)
      inventoryRecord.units = oldUnits + units

      const minRequired = Number(inventoryRecord.minRequired || 5)
      if (inventoryRecord.units <= 0) {
        inventoryRecord.status = 'out of stock'
      } else if (inventoryRecord.units < minRequired) {
        inventoryRecord.status = 'critical'
      } else if (inventoryRecord.units < minRequired * 2) {
        inventoryRecord.status = 'low'
      } else {
        inventoryRecord.status = 'sufficient'
      }

      if (!inventoryRecord.expirationDate) {
        inventoryRecord.expirationDate = expirationDate
      }

      const donationNote = `+${units} units from ${donorName} on ${donationDate.toLocaleDateString()} for blood drive: ${bloodDrive.title}`
      inventoryRecord.notes = inventoryRecord.notes
        ? `${inventoryRecord.notes} | ${donationNote}`
        : donationNote

      await inventoryRecord.save()
      console.log('✅ Inventory updated:', bloodType, 'from', oldUnits, 'to', inventoryRecord.units)
    }

    // ========================================================
    // ✅ RESPONSE WITH COMPLETE DATA
    // ========================================================

    return NextResponse.json(
      {
        success: true,
        message: 'Donation confirmed successfully and blood inventory updated! 🩸',
        data: {
          donationId: donation._id.toString(),
          donorId: donorProfile._id.toString(),
          donorName: donation.donorName,
          donorEmail: donation.donorEmail,
          donorPhone: donation.donorPhone,
          bloodType: donation.bloodType,
          units: donation.units,
          status: donation.status,
          date: donation.date,
          hospital: donation.hospital,
          hospitalId: donation.hospitalId?.toString(),
          bloodDriveId: bloodDrive._id.toString(),
          bloodDriveTitle: bloodDrive.title,
          registrationStatus: 'attended',
          inventoryUpdated: true,
          inventoryId: inventoryRecord?._id?.toString() || null,
          inventoryUnits: Number(inventoryRecord?.units || 0),
          inventoryStatus: inventoryRecord?.status || null,
          expirationDate: expirationDate,
          isWalkIn: donorProfile.isWalkIn || false,
          isApproved: true,
          approvedBy: donorProfile.approvedBy,
          hospitalName: donorProfile.hospitalName || hospitalName,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Error confirming blood drive donation:', error)

    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((err: any) => err.message)
      return NextResponse.json(
        {
          success: false,
          error: 'Donation validation failed',
          details,
        },
        { status: 400 }
      )
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'This donation already exists',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to confirm donation',
      },
      { status: 500 }
    )
  }
}