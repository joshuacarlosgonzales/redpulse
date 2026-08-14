import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodDrive from '@/models/BloodDrive'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const BloodDriveModel = BloodDrive as any
const BloodDriveRegistrationModel = BloodDriveRegistration as any
const UserModel = User as any

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized - Hospital or Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid blood drive ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { registrantId } = body

    if (!registrantId) {
      return NextResponse.json(
        { error: 'Registrant ID is required' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(registrantId)) {
      return NextResponse.json(
        { error: 'Invalid registrant ID' },
        { status: 400 }
      )
    }

    const hospitalId = decoded.userId || decoded.id
    const bloodDrive = await BloodDriveModel.findOne({
      _id: id,
      hospitalId: hospitalId
    })

    if (!bloodDrive) {
      return NextResponse.json(
        { error: 'Blood drive not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if donor is registered
    const donorIndex = bloodDrive.registeredDonorIds.findIndex(
      (donorId: any) => donorId.toString() === registrantId
    )

    if (donorIndex === -1) {
      return NextResponse.json(
        { error: 'Donor is not registered for this blood drive' },
        { status: 404 }
      )
    }

    // Update donor status in donorStatuses
    if (!bloodDrive.donorStatuses) {
      bloodDrive.donorStatuses = new Map()
    }
    bloodDrive.donorStatuses.set(registrantId, 'approved')
    await bloodDrive.save()

    // Update BloodDriveRegistration status
    const registration = await BloodDriveRegistrationModel.findOne({
      donorId: registrantId,
      bloodDriveId: id
    })

    if (registration) {
      registration.status = 'attended'
      registration.attendedAt = new Date()
      await registration.save()
    }

    const donor = await UserModel.findById(registrantId).select('fullName email')

    return NextResponse.json({
      success: true,
      message: `Donor approved successfully`,
      data: {
        donorId: registrantId,
        donorName: donor?.fullName || 'Unknown',
        bloodDriveId: id,
        status: 'approved'
      }
    })

  } catch (error: any) {
    console.error('Error approving donor:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve donor' },
      { status: 500 }
    )
  }
}