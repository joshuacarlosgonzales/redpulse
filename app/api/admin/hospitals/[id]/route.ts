// app/api/admin/hospitals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Hospital from '@/models/Hospital'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    // Get token from header
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
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Await params for Next.js 15+
    const { id } = await params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid hospital ID format' },
        { status: 400 }
      )
    }

    // Find the hospital
    const hospital = await Hospital.findById(id)
      .populate('userId', 'fullName email phone')
      .lean()

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    // Transform response
    const transformedHospital = {
      id: hospital._id.toString(),
      userId: hospital.userId?._id?.toString() || '',
      hospitalName: hospital.hospitalName,
      hospitalLicense: hospital.hospitalLicense,
      hospitalAddress: hospital.hospitalAddress,
      hospitalPhone: hospital.hospitalPhone,
      hospitalType: hospital.hospitalType || '',
      hospitalCapacity: hospital.hospitalCapacity || 0,
      hospitalEmail: hospital.hospitalEmail || '',
      hospitalWebsite: hospital.hospitalWebsite || '',
      status: hospital.status || 'pending',
      rejectionReason: hospital.rejectionReason || '',
      approvedAt: hospital.approvedAt || null,
      adminName: hospital.userId?.fullName || 'N/A',
      adminEmail: hospital.userId?.email || 'N/A',
      adminPhone: hospital.userId?.phone || 'N/A',
      createdAt: hospital.createdAt,
      updatedAt: hospital.updatedAt
    }

    return NextResponse.json({
      success: true,
      hospital: transformedHospital
    })

  } catch (error: any) {
    console.error('Error fetching hospital:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hospital' },
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

    // Get token from header
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
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Await params for Next.js 15+
    const { id } = await params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid hospital ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      hospitalName,
      hospitalLicense,
      hospitalAddress,
      hospitalPhone,
      hospitalType,
      hospitalCapacity,
      hospitalEmail,
      hospitalWebsite,
    } = body

    // Find the hospital
    const hospital = await Hospital.findById(id)
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    // Update fields
    if (hospitalName) hospital.hospitalName = hospitalName
    if (hospitalLicense) hospital.hospitalLicense = hospitalLicense
    if (hospitalAddress) hospital.hospitalAddress = hospitalAddress
    if (hospitalPhone) hospital.hospitalPhone = hospitalPhone
    if (hospitalType) hospital.hospitalType = hospitalType
    if (hospitalCapacity !== undefined) hospital.hospitalCapacity = hospitalCapacity
    if (hospitalEmail) hospital.hospitalEmail = hospitalEmail
    if (hospitalWebsite) hospital.hospitalWebsite = hospitalWebsite

    await hospital.save()

    // Also update User model if needed
    if (hospital.userId) {
      const updateData: any = {}
      if (hospitalName) updateData.fullName = hospitalName
      if (hospitalEmail) updateData.email = hospitalEmail
      if (hospitalPhone) updateData.phone = hospitalPhone
      
      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(hospital.userId, updateData)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hospital updated successfully',
      hospital: {
        id: hospital._id.toString(),
        hospitalName: hospital.hospitalName,
        hospitalLicense: hospital.hospitalLicense,
        hospitalAddress: hospital.hospitalAddress,
        hospitalPhone: hospital.hospitalPhone,
        hospitalType: hospital.hospitalType,
        hospitalCapacity: hospital.hospitalCapacity,
        hospitalEmail: hospital.hospitalEmail,
        hospitalWebsite: hospital.hospitalWebsite,
        status: hospital.status,
        updatedAt: hospital.updatedAt
      }
    })

  } catch (error: any) {
    console.error('Error updating hospital:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update hospital' },
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

    // Get token from header
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
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Await params for Next.js 15+
    const { id } = await params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid hospital ID format' },
        { status: 400 }
      )
    }

    // Find and delete the hospital
    const hospital = await Hospital.findByIdAndDelete(id)
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    // Also delete the associated user if needed
    if (hospital.userId) {
      await User.findByIdAndDelete(hospital.userId)
    }

    console.log(`🗑️ Hospital ${hospital.hospitalName} deleted by admin ${decoded.userId}`)

    return NextResponse.json({
      success: true,
      message: 'Hospital deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting hospital:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete hospital' },
      { status: 500 }
    )
  }
}