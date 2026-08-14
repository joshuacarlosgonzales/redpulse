import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodDrive from '@/models/BloodDrive'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const BloodDriveModel = BloodDrive as any

export async function GET(
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
        { error: 'Invalid blood drive ID format' },
        { status: 400 }
      )
    }

    const hospitalId = decoded.userId || decoded.id
    const bloodDrive = await BloodDriveModel.findOne({
      _id: id,
      hospitalId: hospitalId
    }).lean()

    if (!bloodDrive) {
      return NextResponse.json(
        { error: 'Blood drive not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        description: bloodDrive.description || '',
        location: bloodDrive.location,
        address: bloodDrive.address || '',
        date: bloodDrive.date,
        startTime: bloodDrive.startTime,
        endTime: bloodDrive.endTime,
        status: bloodDrive.status || 'upcoming',
        bloodTypesNeeded: bloodDrive.bloodTypesNeeded || [],
        targetDonors: bloodDrive.targetDonors || 0,
        registeredDonors: bloodDrive.registeredDonors || 0,
        completedDonations: bloodDrive.completedDonations || 0,
        organizer: bloodDrive.organizer || '',
        contactNumber: bloodDrive.contactNumber || '',
        contactEmail: bloodDrive.contactEmail || '',
        createdAt: bloodDrive.createdAt,
        updatedAt: bloodDrive.updatedAt,
      }
    })

  } catch (error: any) {
    console.error('Error fetching blood drive:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blood drive' },
      { status: 500 }
    )
  }
}

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
        { error: 'Invalid blood drive ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // ✅ Check if this is an approve or reject request
    // The approve/reject routes have their own handlers, so we skip those here
    // This route only handles regular blood drive updates
    const { action, registrantId } = body
    
    // If this is an approve or reject action, return 404 to let the approve/reject routes handle it
    if (action === 'approve' || action === 'reject' || registrantId) {
      return NextResponse.json(
        { error: 'This endpoint is for blood drive updates only. Use /approve or /reject for donor actions.' },
        { status: 404 }
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

    // Update fields
    if (body.title) bloodDrive.title = body.title
    if (body.description !== undefined) bloodDrive.description = body.description
    if (body.location) bloodDrive.location = body.location
    if (body.address !== undefined) bloodDrive.address = body.address
    if (body.date) bloodDrive.date = new Date(body.date)
    if (body.startTime) bloodDrive.startTime = body.startTime
    if (body.endTime) bloodDrive.endTime = body.endTime
    if (body.status) bloodDrive.status = body.status
    if (body.bloodTypesNeeded) bloodDrive.bloodTypesNeeded = body.bloodTypesNeeded
    if (body.targetDonors !== undefined) bloodDrive.targetDonors = body.targetDonors
    if (body.organizer !== undefined) bloodDrive.organizer = body.organizer
    if (body.contactNumber !== undefined) bloodDrive.contactNumber = body.contactNumber
    if (body.contactEmail !== undefined) bloodDrive.contactEmail = body.contactEmail

    await bloodDrive.save()

    return NextResponse.json({
      success: true,
      message: 'Blood drive updated successfully',
      data: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        status: bloodDrive.status,
        updatedAt: bloodDrive.updatedAt
      }
    })

  } catch (error: any) {
    console.error('Error updating blood drive:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update blood drive' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { error: 'Invalid blood drive ID format' },
        { status: 400 }
      )
    }

    const hospitalId = decoded.userId || decoded.id
    const bloodDrive = await BloodDriveModel.findOneAndDelete({
      _id: id,
      hospitalId: hospitalId
    })

    if (!bloodDrive) {
      return NextResponse.json(
        { error: 'Blood drive not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Blood drive deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting blood drive:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete blood drive' },
      { status: 500 }
    )
  }
}