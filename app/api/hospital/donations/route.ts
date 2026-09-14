// app/api/hospital/donations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import Donation from '@/models/Donation'
import BloodInventory from '@/models/BloodInventory'
import User from '@/models/User'
import Donor from '@/models/Donor'

// Define valid status types
type DonorStatus = 'active' | 'inactive' | 'pending' | 'rejected'
type BackgroundCheckStatus = 'pending' | 'in-review' | 'cleared' | 'failed'
type RegistrationType = 'walk-in' | 'system'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const bloodType = searchParams.get('bloodType') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // ✅ Use hospitalId from token
    const hospitalObjectId = new mongoose.Types.ObjectId(decoded.userId)
    
    const filter: any = {
      hospitalId: hospitalObjectId
    }

    if (status !== 'all') filter.status = status
    if (bloodType !== 'all') filter.bloodType = bloodType

    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { hospital: { $regex: search, $options: 'i' } },
        { bloodType: { $regex: search, $options: 'i' } }
      ]
    }

    console.log('🔍 Donation filter:', JSON.stringify(filter, null, 2))

    const total = await Donation.countDocuments(filter)
    const donations = await Donation.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const transformedDonations = donations.map((donation: any) => ({
      id: donation._id.toString(),
      donorId: donation.donorId?.toString() || '',
      donorName: donation.donorName || 'Unknown Donor',
      donorEmail: donation.donorEmail || '',
      donorPhone: donation.donorPhone || '',
      bloodType: donation.bloodType || '',
      units: donation.units || 0,
      donationDate: donation.date || donation.createdAt,
      notes: donation.notes || '',
      status: donation.status || 'Pending',
      hospital: donation.hospital || 'Hospital',
      isWalkIn: donation.isWalkIn || false,
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt,
      expirationDate: donation.expirationDate || null
    }))

    return NextResponse.json({
      success: true,
      data: transformedDonations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching donations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    console.log('📥 Received donation body:', JSON.stringify(body, null, 2))

    const {
      donorName,
      donorEmail,
      donorPhone,
      bloodType,
      units,
      donationDate,
      notes,
      status = 'Completed',
      isWalkIn = false
    } = body

    // Validation
    if (!donorName || !donorName.trim()) {
      return NextResponse.json(
        { error: 'Donor name is required' },
        { status: 400 }
      )
    }

    if (!bloodType) {
      return NextResponse.json(
        { error: 'Blood type is required' },
        { status: 400 }
      )
    }

    if (!units || units < 1) {
      return NextResponse.json(
        { error: 'Valid units are required' },
        { status: 400 }
      )
    }

    if (!donationDate) {
      return NextResponse.json(
        { error: 'Donation date is required' },
        { status: 400 }
      )
    }

    // ============================================================
    // ✅ GET HOSPITAL INFO
    // ============================================================

    const hospitalName = user.hospitalName || user.fullName || 'Hospital'
    const hospitalEmail = user.email || 'Hospital Staff'
    const hospitalObjectId = new mongoose.Types.ObjectId(decoded.userId)

    console.log('🏥 Hospital Name:', hospitalName)
    console.log('📧 Hospital Email:', hospitalEmail)

    // ============================================================
    // ✅ PARSE DATES
    // ============================================================

    const donationDateObj = new Date(donationDate)
    const expirationDate = new Date(donationDateObj)
    expirationDate.setDate(expirationDate.getDate() + 42)

    // ============================================================
    // ✅ FIND OR CREATE DONOR PROFILE
    // ============================================================

    let donorProfile: any = null
    let donorObjectId: mongoose.Types.ObjectId | null = null

    // 1. First try to find donor by email in Donor collection
    if (donorEmail && donorEmail.trim()) {
      donorProfile = await Donor.findOne({
        email: donorEmail.trim().toLowerCase()
      })
      if (donorProfile) {
        console.log('✅ Found donor by email in Donor collection:', donorProfile._id)
        donorObjectId = donorProfile._id
      }
    }

    // 2. If not found by email, try by userId
    if (!donorProfile) {
      const matchedUser = await User.findOne({
        email: donorEmail?.trim().toLowerCase(),
        role: 'donor'
      })
      if (matchedUser) {
        donorProfile = await Donor.findOne({
          userId: matchedUser._id
        })
        if (donorProfile) {
          console.log('✅ Found donor by userId:', donorProfile._id)
          donorObjectId = donorProfile._id
        } else {
          // Create donor profile from user
          const timestamp = Date.now().toString()
          const donorData = {
            fullName: donorName.trim(),
            email: donorEmail?.trim() || `${donorName.replace(/\s/g, '').toLowerCase()}@donor.com`,
            phone: donorPhone || 'N/A',
            bloodType: bloodType,
            address: 'Registered Donor',
            barangay: 'Registered',
            municipality: 'Registered',
            province: 'Registered',
            dateOfBirth: new Date('2000-01-01'),
            gender: 'Other' as 'Other',
            weight: 50,
            status: 'active' as DonorStatus,
            isEligible: true,
            totalDonations: 0,
            lastDonationDate: null,
            nextEligibleDate: null,
            digitalId: `DONOR-${timestamp.slice(-8)}`,
            userId: matchedUser._id,
            isWalkIn: false,
            // ✅ FIX: Use 'system' (valid)
            registrationType: 'system' as RegistrationType,
            hospitalName: hospitalName,
            backgroundCheckStatus: 'cleared' as BackgroundCheckStatus,
            backgroundCheckDate: new Date(),
            backgroundCheckNotes: 'Registered donor',
            verifiedBy: hospitalEmail,
            verificationDate: new Date(),
            approvedBy: hospitalEmail,
            approvedAt: new Date(),
            emergencyContact: donorPhone || 'N/A',
            emergencyName: 'N/A',
            emergencyRelationship: 'Self',
          }
          donorProfile = await Donor.create(donorData)
          console.log('✅ Created donor profile from user:', donorProfile._id)
          donorObjectId = donorProfile._id
        }
      }
    }

    // 3. If still not found, create a new donor (walk-in)
    if (!donorProfile) {
      console.log('📝 Creating new walk-in donor profile...')
      
      const email = donorEmail?.trim() || `${donorName.replace(/\s/g, '').toLowerCase()}@walkin.com`
      let uniqueEmail = email
      let counter = 0
      
      while (true) {
        const existing = await Donor.findOne({ email: uniqueEmail })
        if (!existing) break
        counter++
        const namePart = donorName.replace(/\s/g, '').toLowerCase()
        uniqueEmail = `${namePart}${counter}@walkin.com`
        if (counter > 100) {
          uniqueEmail = `walkin_${Date.now()}@walkin.com`
          break
        }
      }

      const timestamp = Date.now().toString()
      const digitalId = `WALKIN-${timestamp.slice(-8)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`

      const donorData = {
        fullName: donorName.trim(),
        email: uniqueEmail,
        phone: donorPhone || 'N/A',
        bloodType: bloodType,
        address: 'Walk-in Donor',
        barangay: 'Walk-in',
        municipality: 'Walk-in',
        province: 'Walk-in',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Other' as 'Other',
        weight: 50,
        status: 'active' as DonorStatus,
        isEligible: true,
        totalDonations: 0,
        lastDonationDate: null,
        nextEligibleDate: null,
        digitalId: digitalId,
        userId: null,
        isWalkIn: true,
        // ✅ FIX: Use 'walk-in' (valid)
        registrationType: 'walk-in' as RegistrationType,
        hospitalName: hospitalName,
        backgroundCheckStatus: 'cleared' as BackgroundCheckStatus,
        backgroundCheckDate: new Date(),
        backgroundCheckNotes: 'Walk-in donor - automatically approved',
        verifiedBy: hospitalEmail,
        verificationDate: new Date(),
        approvedBy: hospitalEmail,
        approvedAt: new Date(),
        emergencyContact: donorPhone || 'N/A',
        emergencyName: 'N/A',
        emergencyRelationship: 'Self',
      }

      donorProfile = await Donor.create(donorData)
      console.log('✅ Created walk-in donor:', donorProfile._id)
      donorObjectId = donorProfile._id
    }

    // ============================================================
    // ✅ CREATE DONATION
    // ============================================================

    const donationData: any = {
      hospitalId: hospitalObjectId,
      donorId: donorObjectId || hospitalObjectId,
      donorName: donorName.trim(),
      donorEmail: donorEmail || '',
      donorPhone: donorPhone || '',
      bloodType: bloodType,
      units: units,
      date: donationDateObj,
      status: status as 'Completed' | 'Pending' | 'Scheduled' | 'Cancelled',
      hospital: hospitalName,
      notes: notes || '',
      isWalkIn: donorProfile?.isWalkIn || isWalkIn || false,
      expirationDate: expirationDate,
    }

    // ✅ Only add registrationType if the Donation model has this field
    // Check if the field exists in the schema
    if (donorProfile?.registrationType) {
      // Some models might not have this field, so we'll add it safely
      try {
        donationData.registrationType = donorProfile.registrationType
      } catch (e) {
        console.warn('⚠️ registrationType field not supported in Donation model')
      }
    }

    const donation = await Donation.create(donationData)
    console.log(`✅ Donation created: ${donorName} donated ${units} units of ${bloodType}`)

    // ============================================================
    // ✅ UPDATE DONOR PROFILE
    // ============================================================

    if (donorProfile) {
      donorProfile.lastDonationDate = donationDateObj
      donorProfile.totalDonations = (donorProfile.totalDonations || 0) + 1

      const nextEligibleDate = new Date(donationDateObj)
      nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3)
      donorProfile.nextEligibleDate = nextEligibleDate
      donorProfile.isEligible = false
      await donorProfile.save()
      console.log('✅ Donor profile updated')
    }

    // ============================================================
    // ✅ UPDATE INVENTORY - Only if donation is completed
    // ============================================================

    let inventoryUpdated = false
    let inventoryData = null

    if (status === 'Completed') {
      try {
        let inventory = await BloodInventory.findOne({
          hospitalId: hospitalObjectId,
          bloodType: bloodType
        })

        console.log(`🔍 Looking for inventory: hospitalId=${hospitalObjectId}, bloodType=${bloodType}`)

        if (inventory) {
          const oldUnits = inventory.units
          inventory.units += units

          if (expirationDate < inventory.expirationDate) {
            inventory.expirationDate = expirationDate
          }

          const donationNote = `+${units} units from ${donorName} on ${donationDateObj.toLocaleDateString()}`
          inventory.notes = inventory.notes
            ? `${inventory.notes} | ${donationNote}`
            : donationNote

          // Update status
          const minRequired = Number(inventory.minRequired || 15)
          if (inventory.units <= 0) {
            inventory.status = 'out of stock'
          } else if (inventory.units < minRequired) {
            inventory.status = 'critical'
          } else if (inventory.units < minRequired * 2) {
            inventory.status = 'low'
          } else {
            inventory.status = 'sufficient'
          }

          await inventory.save()
          inventoryUpdated = true
          inventoryData = inventory
          console.log(`📦 Inventory updated: ${bloodType} from ${oldUnits} to ${inventory.units} units (${inventory.status})`)
        } else {
          const newInventory = await BloodInventory.create({
            hospitalId: hospitalObjectId,
            bloodType: bloodType,
            units: units,
            minRequired: 15,
            maxCapacity: 60,
            expirationDate: expirationDate,
            notes: `Initial stock from donation by ${donorName} on ${donationDateObj.toLocaleDateString()}`,
            batchNumber: `DONATION-${Date.now()}`
          })
          inventoryUpdated = true
          inventoryData = newInventory
          console.log(`📦 New inventory created for ${bloodType}: ${units} units, expires on ${expirationDate.toLocaleDateString()}`)
        }
      } catch (inventoryError) {
        console.error('❌ Error updating inventory:', inventoryError)
      }
    }

    // ============================================================
    // ✅ RESPONSE
    // ============================================================

    const responseData: any = {
      id: donation._id.toString(),
      donorId: donation.donorId?.toString() || '',
      donorName: donation.donorName,
      bloodType: donation.bloodType,
      units: donation.units,
      status: donation.status,
      donationDate: donation.date,
      hospital: donation.hospital,
      expirationDate: status === 'Completed' ? expirationDate : null,
      inventoryUpdated: inventoryUpdated,
      isWalkIn: donation.isWalkIn || false,
      inventory: inventoryData ? {
        id: inventoryData._id.toString(),
        bloodType: inventoryData.bloodType,
        units: inventoryData.units,
        status: inventoryData.status
      } : null
    }

    // Only add registrationType if it exists on the donation
    if ((donation as any).registrationType) {
      responseData.registrationType = (donation as any).registrationType
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: status === 'Completed' && inventoryUpdated
        ? 'Donation recorded and inventory updated successfully! 🩸'
        : status === 'Completed' && !inventoryUpdated
        ? 'Donation recorded but inventory update failed. Please sync manually.'
        : 'Donation recorded successfully!'
    })

  } catch (error: any) {
    console.error('❌ Error creating donation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create donation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const donationId = searchParams.get('id')

    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return NextResponse.json(
        { error: 'Invalid donation ID format' },
        { status: 400 }
      )
    }

    const hospitalObjectId = new mongoose.Types.ObjectId(decoded.userId)

    const donation = await Donation.findOne({
      _id: donationId,
      hospitalId: hospitalObjectId
    })

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      )
    }

    if (donation.status === 'Completed') {
      const inventory = await BloodInventory.findOne({
        hospitalId: hospitalObjectId,
        bloodType: donation.bloodType
      })

      if (inventory) {
        inventory.units = Math.max(0, inventory.units - donation.units)
        await inventory.save()
        console.log(`📦 Inventory updated: ${donation.bloodType} now has ${inventory.units} units`)
      }
    }

    await Donation.findByIdAndDelete(donationId)

    return NextResponse.json({
      success: true,
      message: 'Donation deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error deleting donation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete donation' },
      { status: 500 }
    )
  }
}