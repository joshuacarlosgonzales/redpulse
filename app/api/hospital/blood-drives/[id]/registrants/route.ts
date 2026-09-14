import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { dbConnect } from '@/lib/db'

import BloodDrive from '@/models/BloodDrive'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import User from '@/models/User'
import Donor from '@/models/Donor'
import Donation from '@/models/Donation'

import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

interface Registrant {
  id: string
  fullName: string
  email: string
  phone: string
  bloodType: string
  registeredAt: Date
  status: 'registered' | 'attended' | 'cancelled'
  donationStatus: 'pending' | 'approved' | 'rejected' | 'completed'
  isWalkIn?: boolean
  donationId?: string | null
  donationDate?: Date | null
  units?: number
  notes?: string
}

const BloodDriveModel = BloodDrive as any
const BloodDriveRegistrationModel = BloodDriveRegistration as any
const UserModel = User as any
const DonorModel = Donor as any
const DonationModel = Donation as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

      if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized - Hospital or Admin access required' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // ============================================================
    // PARAMETER
    // ============================================================

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid blood drive ID' },
        { status: 400 }
      )
    }

    // ============================================================
    // HOSPITAL ID
    // ============================================================

    const hospitalId = decoded.userId || decoded.id

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID not found in token' },
        { status: 400 }
      )
    }

    // ============================================================
    // FIND BLOOD DRIVE
    // ============================================================

    const bloodDrive = await BloodDriveModel.findOne({
      _id: id,
      ...(decoded.role === 'hospital' ? { hospitalId: hospitalId } : {}),
    })

    if (!bloodDrive) {
      return NextResponse.json(
        { error: 'Blood drive not found or unauthorized' },
        { status: 404 }
      )
    }

    const registrants: Registrant[] = []

    // ============================================================
    // GET REGISTERED DONOR IDs
    // ============================================================

    const registeredDonorIds = bloodDrive.registeredDonorIds || []
    const donorStatuses = bloodDrive.donorStatuses || new Map()

    console.log(`📋 Found ${registeredDonorIds.length} registered donor IDs`)
    console.log(`📋 Donor statuses:`, Object.fromEntries(donorStatuses))

    // ============================================================
    // FETCH DONATIONS FOR THIS BLOOD DRIVE
    // ============================================================

    const donations = await DonationModel.find({
      bloodDriveId: bloodDrive._id,
      hospitalId: bloodDrive.hospitalId,
    }).lean()

    console.log(`📋 Found ${donations.length} donations for this blood drive`)

    // Create a map of donorId to donation
    const donationMap = new Map<string, any>()
    donations.forEach((donation: any) => {
      const donorId = donation.donorId?.toString()
      if (donorId) {
        // If multiple donations, keep the most recent one
        if (!donationMap.has(donorId) || new Date(donation.date) > new Date(donationMap.get(donorId).date)) {
          donationMap.set(donorId, donation)
        }
      }
    })

    // ============================================================
    // PROCESS EACH REGISTERED DONOR
    // ============================================================

    for (const donorId of registeredDonorIds) {
      const donorIdStr = donorId.toString()
      console.log(`🔍 Processing donor: ${donorIdStr}`)

      // ============================================================
      // STEP 1: Try to find in Donor model directly (WALK-IN DONORS)
      // ============================================================
      
      let donor = await DonorModel.findById(donorId).lean()
      let user = null
      let isWalkIn = false

      if (donor) {
        console.log(`✅ Found donor in Donor model: ${donor.fullName}`)
        isWalkIn = donor.isWalkIn || false
        
        // If donor has a userId, try to get the user
        if (donor.userId) {
          user = await UserModel.findById(donor.userId).select('fullName email phone bloodType').lean()
        }
      } else {
        // ============================================================
        // STEP 2: Try to find by userId in User model
        // ============================================================
        
        user = await UserModel.findById(donorId).select('fullName email phone bloodType createdAt').lean()
        
        if (user) {
          console.log(`✅ Found user: ${user.fullName}`)
          // Try to find donor profile with this userId
          donor = await DonorModel.findOne({ userId: user._id }).lean()
          if (donor) {
            console.log(`✅ Found donor profile for user: ${donor.fullName}`)
            isWalkIn = donor.isWalkIn || false
          }
        }
      }

      // ============================================================
      // STEP 3: If still not found, check if there's a donation
      // ============================================================
      
      let donation = donationMap.get(donorIdStr)

      if (!donor && !user && !donation) {
        console.log(`⚠️ No donor, user, or donation found for ID: ${donorIdStr}`)
        registrants.push({
          id: donorIdStr,
          fullName: `Unknown (${donorIdStr.slice(-6)})`,
          email: '',
          phone: '',
          bloodType: 'Unknown',
          registeredAt: new Date(),
          status: 'registered',
          donationStatus: 'pending',
          isWalkIn: false,
        })
        continue
      }

      // ============================================================
      // STEP 4: Build registrant data
      // ============================================================
      
      // ✅ Get donation status from donorStatuses (this is the single source of truth)
      const donorStatus = donorStatuses.get(donorIdStr) || 'pending'
      
      // ✅ Determine donation status - PRIORITIZE donorStatus from blood drive
      let donationStatus: 'pending' | 'approved' | 'rejected' | 'completed' = 'pending'
      let status: 'registered' | 'attended' | 'cancelled' = 'registered'
      
      // ✅ First check donorStatus from blood drive
      if (donorStatus === 'completed') {
        donationStatus = 'completed'
        status = 'attended'
      } else if (donorStatus === 'approved') {
        donationStatus = 'approved'
        status = 'registered'
      } else if (donorStatus === 'rejected') {
        donationStatus = 'rejected'
        status = 'cancelled'
      } else {
        // Only check donation if donorStatus is still 'pending'
        if (donation && donation.status === 'Completed') {
          donationStatus = 'completed'
          status = 'attended'
        } else {
          donationStatus = 'pending'
          status = 'registered'
        }
      }

      // ✅ Double-check with donation if status is not completed
      // This ensures consistency
      if (donationStatus !== 'completed' && donation && donation.status === 'Completed') {
        donationStatus = 'completed'
        status = 'attended'
      }

      // ✅ If donorStatus is 'completed' but donation doesn't exist yet,
      // keep it as 'completed' (this can happen during the transition)
      if (donorStatus === 'completed' && !donation) {
        donationStatus = 'completed'
        status = 'attended'
      }

      console.log(`📝 ${donorStatus} -> ${donationStatus} for ${donorIdStr}`)

      // Get the best available name
      let fullName = ''
      let email = ''
      let phone = ''
      let bloodType = ''

      if (donor) {
        fullName = donor.fullName || user?.fullName || 'Unknown Donor'
        email = donor.email || user?.email || ''
        phone = donor.phone || user?.phone || ''
        bloodType = donor.bloodType || user?.bloodType || 'Unknown'
      } else if (user) {
        fullName = user.fullName || 'Unknown User'
        email = user.email || ''
        phone = user.phone || ''
        bloodType = user.bloodType || 'Unknown'
      } else if (donation) {
        // Use donation data
        fullName = donation.donorName || 'Unknown Donor'
        email = donation.donorEmail || ''
        phone = donation.donorPhone || ''
        bloodType = donation.bloodType || 'Unknown'
      }

      console.log(`📝 Registrant: ${fullName} (${email}), isWalkIn: ${isWalkIn}, status: ${donationStatus}`)

      registrants.push({
        id: donorIdStr,
        fullName: fullName,
        email: email,
        phone: phone,
        bloodType: bloodType,
        registeredAt: donor?.createdAt || user?.createdAt || donation?.createdAt || new Date(),
        status: status,
        donationStatus: donationStatus,
        isWalkIn: isWalkIn,
        donationId: donation?._id?.toString() || null,
        donationDate: donation?.date || null,
        units: donation?.units || 0,
        notes: donation?.notes || '',
      })
    }

    // ============================================================
    // SORT REGISTRANTS
    // ============================================================

    registrants.sort((a, b) => {
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    })

    console.log(`✅ Returning ${registrants.length} registrants`)

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      data: registrants,
      total: registrants.length,
      bloodDrive: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        date: bloodDrive.date,
        status: bloodDrive.status,
        registeredDonors: bloodDrive.registeredDonors,
      },
    })

  } catch (error: any) {
    console.error('❌ Error fetching registrants:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to fetch registrants' },
      { status: 500 }
    )
  }
}