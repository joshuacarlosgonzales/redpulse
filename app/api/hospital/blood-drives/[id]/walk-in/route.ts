// app/api/hospital/blood-drives/[id]/walk-in/route.ts

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodDrive from '@/models/BloodDrive'
import Donation from '@/models/Donation'
import Donor from '@/models/Donor'
import User from '@/models/User'
import BloodInventory from '@/models/BloodInventory'
import { getAuthenticatedHospitalUser, getUserIdFromAuth, isAuthFailure } from '@/lib/hospitalAuth'
import mongoose from 'mongoose'

const BloodDriveModel = BloodDrive as any
const DonationModel = Donation as any
const DonorModel = Donor as any
const UserModel = User as any
const InventoryModel = BloodInventory as any

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user
    const hospitalId = getUserIdFromAuth(decoded)

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'Hospital ID not found' },
        { status: 400 }
      )
    }

    const { id } = await params
    const body = await request.json()

    console.log('📥 Walk-in donation request:', JSON.stringify(body, null, 2))

    // ============================================================
    // VALIDATION
    // ============================================================

    if (!body.fullName || body.fullName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Donor full name is required' },
        { status: 400 }
      )
    }

    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    if (!body.bloodType || !validBloodTypes.includes(body.bloodType)) {
      return NextResponse.json(
        { success: false, error: 'Valid blood type is required (A+, A-, B+, B-, AB+, AB-, O+, O-)' },
        { status: 400 }
      )
    }

    if (!body.donationDate) {
      return NextResponse.json(
        { success: false, error: 'Donation date is required' },
        { status: 400 }
      )
    }

    const donationDate = new Date(body.donationDate)
    if (isNaN(donationDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation date format' },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (body.email && body.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    const units = parseInt(body.units) || 1
    if (units < 1 || units > 5) {
      return NextResponse.json(
        { success: false, error: 'Units must be between 1 and 5' },
        { status: 400 }
      )
    }

    // ============================================================
    // FIND BLOOD DRIVE AND HOSPITAL USER
    // ============================================================

    console.log('🔍 Looking for blood drive:', { id, hospitalId })

    const bloodDrive = await BloodDriveModel.findOne({
      _id: id,
      hospitalId: new mongoose.Types.ObjectId(hospitalId)
    })

    if (!bloodDrive) {
      return NextResponse.json(
        { success: false, error: 'Blood drive not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get hospital user info
    const hospitalUser = await UserModel.findById(hospitalId)
      .select('email hospitalName fullName')
      .lean()

    const hospitalEmail = hospitalUser?.email || decoded.email || 'Hospital Staff'
    const hospitalName = hospitalUser?.hospitalName || hospitalUser?.fullName || 'Hospital'

    console.log('✅ Blood drive found:', bloodDrive._id)
    console.log('🏥 Hospital Name:', hospitalName)
    console.log('📧 Hospital Email:', hospitalEmail)

    // ============================================================
    // CREATE WALK-IN DONOR
    // ============================================================

    // Generate unique email
    const baseEmail = body.email?.trim() || `${body.fullName.replace(/\s/g, '').toLowerCase()}@walkin.com`
    let uniqueEmail = baseEmail
    let emailCounter = 0

    while (true) {
      const existing = await DonorModel.findOne({ email: uniqueEmail })
      if (!existing) break
      emailCounter++
      const namePart = body.fullName.replace(/\s/g, '').toLowerCase()
      uniqueEmail = `${namePart}${emailCounter}@walkin.com`
      if (emailCounter > 100) {
        uniqueEmail = `walkin_${Date.now()}@walkin.com`
        break
      }
    }

    console.log(`📧 Using email: ${uniqueEmail}`)

    // Generate digital ID
    const timestamp = Date.now().toString()
    const digitalId = `WALKIN-${timestamp.slice(-8)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`

    // ============================================================
    // ✅ CRITICAL FIX: Store approvedBy as EMAIL STRING
    // ============================================================

    const donorData = {
      // Personal info
      fullName: body.fullName.trim(),
      email: uniqueEmail,
      phone: body.phone?.trim() || 'N/A',
      bloodType: body.bloodType,
      
      // Address fields
      address: body.address || 'Walk-in Donor',
      barangay: body.barangay || 'Walk-in',
      municipality: body.municipality || 'Walk-in',
      province: body.province || 'Walk-in',
      
      // Demographic info
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : new Date('2000-01-01'),
      gender: body.gender || 'Other',
      weight: body.weight || 50,
      
      // Status fields
      status: 'active',
      isEligible: true,
      totalDonations: 0,
      lastDonationDate: null,
      nextEligibleDate: null,
      
      // IDs
      digitalId: digitalId,
      walkInDonorId: `WI-${timestamp.slice(-6)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      
      // Registration type
      registrationType: 'walk-in',
      isWalkIn: true,
      
      // User ID is null for walk-in
      userId: null,
      
      // Store hospitalId as ObjectId
      hospitalId: new mongoose.Types.ObjectId(hospitalId),
      hospitalName: hospitalName,
      
      // ✅ CRITICAL FIX: Store approvedBy as EMAIL STRING
      approvedBy: hospitalEmail,
      approvedAt: new Date(),
      
      // Background check - auto cleared
      backgroundCheckStatus: 'cleared',
      backgroundCheckDate: new Date(),
      backgroundCheckNotes: 'Walk-in donor - automatically approved by hospital',
      verifiedBy: hospitalEmail,
      verificationDate: new Date(),
      
      // Emergency contact
      emergencyContact: body.phone?.trim() || 'N/A',
      emergencyName: body.emergencyName || 'N/A',
      emergencyRelationship: body.emergencyRelationship || 'Self',
      
      // Medical info
      medicalConditions: body.medicalConditions || '',
      currentMedications: body.currentMedications || '',
    }

    console.log('📝 Creating walk-in donor with:')
    console.log('  - approvedBy:', donorData.approvedBy)
    console.log('  - hospitalId:', donorData.hospitalId)
    console.log('  - hospitalName:', donorData.hospitalName)

    let donorProfile
    try {
      donorProfile = await DonorModel.create(donorData)
      console.log('✅ Walk-in donor created with ID:', donorProfile._id.toString())
      console.log('✅ approvedBy:', donorProfile.approvedBy)
    } catch (createError: any) {
      console.error('❌ Failed to create donor:', createError)
      if (createError.code === 11000) {
        return NextResponse.json(
          { success: false, error: 'A donor with this email already exists. Please use different details.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create donor profile: ' + createError.message },
        { status: 500 }
      )
    }

    // ============================================================
    // ✅ FIX: CREATE DONATION RECORD - Ensure donorId is set correctly
    // ============================================================

    // Check for existing donation
    const existingDonation = await DonationModel.findOne({
      donorId: donorProfile._id,
      bloodDriveId: bloodDrive._id,
    })

    if (existingDonation) {
      console.log('⚠️ Donation already exists')
      return NextResponse.json({
        success: true,
        message: 'Donation already recorded for this donor',
        data: {
          donationId: existingDonation._id.toString(),
          donorId: donorProfile._id.toString(),
          donorName: donorProfile.fullName,
          donorEmail: donorProfile.email,
          donorPhone: donorProfile.phone,
          bloodType: donorProfile.bloodType,
          units: existingDonation.units,
          status: existingDonation.status,
          date: existingDonation.date,
          hospital: hospitalName,
          bloodDriveId: bloodDrive._id.toString(),
          bloodDriveTitle: bloodDrive.title,
          isNewDonor: false,
          digitalId: donorProfile.digitalId,
          isWalkIn: true,
          registrationType: donorProfile.registrationType,
          isApproved: true,
        }
      }, { status: 200 })
    }

    // Create donation
    const expirationDate = new Date(donationDate)
    expirationDate.setDate(expirationDate.getDate() + 42)

    // ✅ FIX: Make sure donorId is set correctly
    const donationData = {
      donorId: donorProfile._id,  // ← This is the key for linking donations to donor
      donorName: donorProfile.fullName,
      donorEmail: donorProfile.email,
      donorPhone: donorProfile.phone,
      bloodType: donorProfile.bloodType,
      units: units,
      date: donationDate,
      status: 'Completed',
      hospital: hospitalName,
      notes: `Walk-in donor for blood drive: ${bloodDrive.title}${body.notes ? ` | ${body.notes}` : ''}`,
      hospitalId: new mongoose.Types.ObjectId(hospitalId),
      bloodDriveId: bloodDrive._id,
      isWalkIn: true,
      registrationType: 'walk-in',
      expirationDate: expirationDate,
    }

    console.log('📝 Creating donation with donorId:', donationData.donorId)

    let donation
    try {
      donation = await DonationModel.create(donationData)
      console.log('✅ Donation created with ID:', donation._id.toString())
      console.log('✅ Donation donorId:', donation.donorId.toString())
    } catch (error) {
      console.error('❌ Failed to create donation:', error)
      await DonorModel.findByIdAndDelete(donorProfile._id)
      return NextResponse.json(
        { success: false, error: 'Failed to create donation record: ' + (error as any).message },
        { status: 500 }
      )
    }

    // ============================================================
    // UPDATE BLOOD DRIVE
    // ============================================================

    try {
      if (!bloodDrive.donorStatuses) {
        bloodDrive.donorStatuses = new Map()
      }
      bloodDrive.donorStatuses.set(donorProfile._id.toString(), 'completed')
      bloodDrive.completedDonations = (bloodDrive.completedDonations || 0) + 1
      bloodDrive.registeredDonors = (bloodDrive.registeredDonors || 0) + 1

      if (bloodDrive.registeredDonorIds) {
        const alreadyRegistered = bloodDrive.registeredDonorIds.some(
          (id: any) => id.toString() === donorProfile._id.toString()
        )
        if (!alreadyRegistered) {
          bloodDrive.registeredDonorIds.push(donorProfile._id)
        }
      }

      await bloodDrive.save()
      console.log('✅ Blood drive updated')
    } catch (error) {
      console.error('❌ Failed to update blood drive:', error)
    }

    // ============================================================
    // UPDATE DONOR PROFILE
    // ============================================================

    try {
      donorProfile.lastDonationDate = donationDate
      donorProfile.totalDonations = (donorProfile.totalDonations || 0) + 1

      const nextEligibleDate = new Date(donationDate)
      nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3)
      donorProfile.nextEligibleDate = nextEligibleDate
      donorProfile.isEligible = false
      await donorProfile.save()
      console.log('✅ Donor profile updated')
    } catch (error) {
      console.error('❌ Failed to update donor profile:', error)
    }

    // ============================================================
    // UPDATE INVENTORY
    // ============================================================

    let inventoryRecord
    try {
      inventoryRecord = await InventoryModel.findOne({
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
        bloodType: donorProfile.bloodType,
      })

      if (!inventoryRecord) {
        inventoryRecord = await InventoryModel.create({
          hospitalId: new mongoose.Types.ObjectId(hospitalId),
          bloodType: donorProfile.bloodType,
          units: units,
          minRequired: 5,
          expirationDate: expirationDate,
          status: 'sufficient',
          notes: `+${units} units from walk-in donor ${donorProfile.fullName} on ${donationDate.toLocaleDateString()}`,
          batchNumber: `WALKIN-${Date.now()}`,
          location: 'Main Storage',
        })
        console.log('✅ Inventory created')
      } else {
        inventoryRecord.units = Number(inventoryRecord.units || 0) + units

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

        const donationNote = `+${units} units from walk-in donor ${donorProfile.fullName}`
        inventoryRecord.notes = inventoryRecord.notes
          ? `${inventoryRecord.notes} | ${donationNote}`
          : donationNote

        await inventoryRecord.save()
        console.log('✅ Inventory updated')
      }
    } catch (error) {
      console.error('❌ Failed to update inventory:', error)
    }

    // ============================================================
    // GET COMPLETE DONOR FOR RESPONSE
    // ============================================================

    const completeDonor = await DonorModel.findById(donorProfile._id).lean()

    console.log('📤 Walk-in donor created successfully:')
    console.log('  - donorId:', completeDonor._id.toString())
    console.log('  - donorName:', completeDonor.fullName)
    console.log('  - approvedBy:', completeDonor.approvedBy)
    console.log('  - hospitalId:', completeDonor.hospitalId)

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      message: 'Walk-in donation recorded successfully! 🩸',
      data: {
        donationId: donation._id.toString(),
        donor: {
          id: completeDonor._id.toString(),
          fullName: completeDonor.fullName,
          email: completeDonor.email,
          phone: completeDonor.phone,
          bloodType: completeDonor.bloodType,
          digitalId: completeDonor.digitalId,
          isWalkIn: completeDonor.isWalkIn,
          registrationType: completeDonor.registrationType,
          hospitalId: completeDonor.hospitalId?.toString(),
          hospitalName: completeDonor.hospitalName,
          approvedBy: completeDonor.approvedBy,
          approvedAt: completeDonor.approvedAt,
          status: completeDonor.status,
          isEligible: completeDonor.isEligible,
          totalDonations: completeDonor.totalDonations,
          backgroundCheckStatus: completeDonor.backgroundCheckStatus,
        },
        donation: {
          id: donation._id.toString(),
          units: units,
          status: donation.status,
          date: donation.date,
          hospital: donation.hospital,
          bloodDriveId: bloodDrive._id.toString(),
          bloodDriveTitle: bloodDrive.title,
          expirationDate: expirationDate,
        },
        inventory: {
          id: inventoryRecord?._id?.toString() || null,
          units: Number(inventoryRecord?.units || 0),
          status: inventoryRecord?.status || null,
          updated: !!inventoryRecord,
        }
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error recording walk-in donation:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to record walk-in donation' },
      { status: 500 }
    )
  }
}