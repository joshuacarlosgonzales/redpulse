import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { dbConnect } from '@/lib/db'

import BloodDrive from '@/models/BloodDrive'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import Donation from '@/models/Donation'
import Donor from '@/models/Donor'

import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string
      donorId: string
    }>
  }
) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    } catch {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    if (decoded.role !== 'hospital' && decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Hospital or Admin access required' },
        { status: 403 }
      )
    }

    // ============================================================
    // PARAMS
    // ============================================================

    const { id: bloodDriveId, donorId } = await params

    if (!mongoose.Types.ObjectId.isValid(bloodDriveId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid blood drive ID' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(donorId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid donor ID' },
        { status: 400 }
      )
    }

    // ============================================================
    // FIND BLOOD DRIVE
    // ============================================================

    const bloodDrive = await BloodDrive.findById(bloodDriveId)

    if (!bloodDrive) {
      return NextResponse.json(
        { success: false, error: 'Blood drive not found' },
        { status: 404 }
      )
    }

    // ============================================================
    // HOSPITAL OWNERSHIP
    // ============================================================

    if (
      decoded.role === 'hospital' &&
      bloodDrive.hospitalId?.toString() !==
        (decoded.userId || decoded.id).toString()
    ) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to manage this blood drive' },
        { status: 403 }
      )
    }

    // ============================================================
    // FIND REGISTRATION
    // ============================================================

    const registration = await BloodDriveRegistration.findOne({
      donorId,
      bloodDriveId,
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Donor is not registered for this blood drive' },
        { status: 404 }
      )
    }

    // ============================================================
    // GET DONOR INFO
    // ============================================================

    const donor = await Donor.findById(donorId)

    // ============================================================
    // MARK ATTENDED
    // ============================================================

    // Update registration
    registration.status = 'attended'
    registration.attendedAt = new Date()
    // ✅ Remove donationStatus since it doesn't exist on the model
    // registration.donationStatus = 'approved' // ❌ Remove this line

    await registration.save()

    // ============================================================
    // UPDATE BLOOD DRIVE STATUS
    // ============================================================

    if (!bloodDrive.donorStatuses) {
      bloodDrive.donorStatuses = new Map()
    }

    bloodDrive.donorStatuses.set(donorId.toString(), 'approved')

    await bloodDrive.save()

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      message: 'Donor marked as attended',
      data: {
        donorId,
        bloodDriveId,
        status: 'attended',
        attendedAt: registration.attendedAt,
        donorName: donor?.fullName || 'Unknown Donor',
      },
    })

  } catch (error: any) {
    console.error('Error marking donor attended:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to mark donor as attended',
      },
      { status: 500 }
    )
  }
}