import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { dbConnect } from '@/lib/db'

import BloodDrive from '@/models/BloodDrive'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import User from '@/models/User'

import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const BloodDriveRegistrationModel =
  BloodDriveRegistration as any

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const authHeader =
      request.headers.get('authorization')

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unauthorized - No token provided',
        },
        { status: 401 }
      )
    }

    const token =
      authHeader.split(' ')[1]

    let decoded: any

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as any

      if (
        decoded.role !== 'donor' &&
        decoded.role !== 'user' &&
        decoded.role !== 'admin'
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Unauthorized - Only donors can register for blood drives',
          },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unauthorized - Invalid token',
        },
        { status: 401 }
      )
    }

    // ============================================================
    // BLOOD DRIVE ID
    // ============================================================

    const { id } = await params

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid blood drive ID',
        },
        { status: 400 }
      )
    }

    // ============================================================
    // FIND BLOOD DRIVE
    // ============================================================

    const bloodDrive =
      await BloodDrive.findById(id)

    if (!bloodDrive) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Blood drive not found',
        },
        { status: 404 }
      )
    }

    // ============================================================
    // CHECK STATUS
    // ============================================================

    if (
      bloodDrive.status ===
        'cancelled' ||
      bloodDrive.status ===
        'completed'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `This blood drive is ${bloodDrive.status}. Registration is closed.`,
        },
        { status: 400 }
      )
    }

    // ============================================================
    // CHECK DATE
    // ============================================================

    if (
      new Date(
        bloodDrive.date
      ) < new Date() &&
      bloodDrive.status !==
        'ongoing'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This blood drive has already passed',
        },
        { status: 400 }
      )
    }

    // ============================================================
    // DONOR ID
    // ============================================================

    const donorId =
      decoded.userId

    if (!donorId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Donor ID not found in token',
        },
        { status: 400 }
      )
    }

    // ============================================================
    // CHECK EXISTING REGISTRATION
    // ============================================================

    const existingRegistration =
      await BloodDriveRegistrationModel.findOne(
        {
          donorId,
          bloodDriveId: id,
        }
      )

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You are already registered for this blood drive',
        },
        { status: 400 }
      )
    }

    // ============================================================
    // CHECK BLOOD DRIVE ARRAY
    // ============================================================

    if (
      bloodDrive.registeredDonorIds &&
      bloodDrive.registeredDonorIds.length >
        0
    ) {
      const isRegistered =
        bloodDrive.registeredDonorIds.some(
          (did: any) =>
            did.toString() ===
            donorId.toString()
        )

      if (isRegistered) {
        return NextResponse.json(
          {
            success: false,
            error:
              'You are already registered for this blood drive',
          },
          { status: 400 }
        )
      }
    }

    // ============================================================
    // CREATE REGISTRATION
    // ============================================================

    const registration =
      new BloodDriveRegistrationModel({
        donorId,

        bloodDriveId: id,

        status: 'registered',

        // ✅ ADDED
        donationStatus: 'pending',

        registeredAt:
          new Date(),

        notes:
          'Registered via donor portal',
      })

    await registration.save()

    console.log(
      '✅ BloodDriveRegistration created:',
      registration._id
    )

    // ============================================================
    // ADD DONOR TO BLOOD DRIVE
    // ============================================================

    if (
      !bloodDrive.registeredDonorIds
    ) {
      bloodDrive.registeredDonorIds =
        []
    }

    bloodDrive.registeredDonorIds.push(
      new mongoose.Types.ObjectId(
        donorId
      )
    )

    bloodDrive.registeredDonors =
      (
        bloodDrive.registeredDonors ||
        0
      ) + 1

    // ============================================================
    // DONOR STATUS
    // ============================================================

    if (!bloodDrive.donorStatuses) {
      bloodDrive.donorStatuses =
        new Map()
    }

    bloodDrive.donorStatuses.set(
      donorId.toString(),
      'pending'
    )

    await bloodDrive.save()

    console.log(
      '✅ Blood drive updated with new registrant'
    )

    // ============================================================
    // DONOR INFORMATION
    // ============================================================

    const donor =
      await User.findById(
        donorId
      ).select(
        'fullName email phone'
      )

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      message:
        'Successfully registered for blood drive! 🎉',

      data: {
        registrationId:
          registration._id.toString(),

        bloodDriveId:
          bloodDrive._id.toString(),

        title:
          bloodDrive.title,

        date:
          bloodDrive.date,

        location:
          bloodDrive.location,

        registeredDonors:
          bloodDrive.registeredDonors,

        donorName:
          donor?.fullName ||
          'Unknown',

        donorEmail:
          donor?.email || '',

        donorPhone:
          donor?.phone || '',

        status:
          'registered',

        // ✅ ADDED
        donationStatus:
          'pending',

        registeredAt:
          registration.registeredAt,
      },
    })
  } catch (error: any) {
    console.error(
      '❌ Error registering for blood drive:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Failed to register for blood drive',
      },
      { status: 500 }
    )
  }
}