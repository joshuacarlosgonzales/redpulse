// app/api/user/blood-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodRequest from '@/models/BloodRequest'
import User from '@/models/User'
import Hospital from '@/models/Hospital'

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

    if (!decoded || decoded.role !== 'donor') {
      return NextResponse.json(
        { error: 'Unauthorized - Donor access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('📥 Received blood request body:', JSON.stringify(body, null, 2))

    const {
      bloodType,
      quantity,
      urgency,
      requiredDate,
      notes,
      requestMethod,
      department,
      doctorName,
      contactNumber,
      hospitalId,
      patientName,
      patientAge
    } = body

    // Validate required fields
    if (!bloodType) {
      return NextResponse.json(
        { error: 'Blood type is required' },
        { status: 400 }
      )
    }

    if (!requiredDate) {
      return NextResponse.json(
        { error: 'Required date is required' },
        { status: 400 }
      )
    }

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital selection is required' },
        { status: 400 }
      )
    }

    // Get donor info
    const donor = await User.findById(decoded.userId)
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Look up the hospital by ID
    const hospital = await Hospital.findById(hospitalId)
    
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found. Please select a valid hospital from the list.' },
        { status: 404 }
      )
    }

    if (hospital.status !== 'active') {
      return NextResponse.json(
        { error: 'This hospital is not currently accepting requests. Please select another hospital.' },
        { status: 400 }
      )
    }

    // Create blood request - ensure all fields match the schema
    const bloodRequestData = {
      donorId: new mongoose.Types.ObjectId(decoded.userId),
      donorName: donor.fullName || 'Donor',
      donorEmail: donor.email || '',
      donorPhone: donor.phone || '',
      bloodType: bloodType,
      quantity: Number(quantity) || 1,
      urgency: urgency || 'normal',
      requiredDate: new Date(requiredDate),
      requestDate: new Date(),
      status: 'pending' as const,
      hospitalName: hospital.hospitalName,
      hospitalAddress: hospital.hospitalAddress || '',
      hospitalId: hospital._id,
      notes: notes || '',
      requestMethod: requestMethod || 'routine',
      department: department || '',
      doctorName: doctorName || '',
      contactNumber: contactNumber || donor.phone || '',
      patientName: patientName || '',
      patientAge: patientAge ? Number(patientAge) : undefined, // Use undefined instead of null
    }

    const bloodRequest = await BloodRequest.create(bloodRequestData)

    console.log(`✅ Blood request created by ${donor.fullName}: ${bloodType} - ${quantity} units for ${hospital.hospitalName}`)

    return NextResponse.json({
      success: true,
      data: {
        id: (bloodRequest._id as mongoose.Types.ObjectId).toString(),
        bloodType: bloodRequest.bloodType,
        quantity: bloodRequest.quantity,
        urgency: bloodRequest.urgency,
        status: bloodRequest.status,
        requiredDate: bloodRequest.requiredDate,
        hospitalName: bloodRequest.hospitalName,
        hospitalId: bloodRequest.hospitalId,
        createdAt: bloodRequest.createdAt
      },
      message: 'Blood request submitted successfully! 🩸'
    })

  } catch (error: any) {
    console.error('❌ Error creating blood request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create blood request' },
      { status: 500 }
    )
  }
}

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

    if (!decoded || decoded.role !== 'donor') {
      return NextResponse.json(
        { error: 'Unauthorized - Donor access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const filter: any = { donorId: new mongoose.Types.ObjectId(decoded.userId) }
    if (status !== 'all') filter.status = status

    const total = await BloodRequest.countDocuments(filter)

    const requests = await BloodRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const transformedRequests = requests.map((req: any) => ({
      id: req._id.toString(),
      bloodType: req.bloodType,
      quantity: req.quantity,
      urgency: req.urgency,
      status: req.status,
      requestDate: req.requestDate,
      requiredDate: req.requiredDate,
      hospitalName: req.hospitalName,
      hospitalAddress: req.hospitalAddress || '',
      patientName: req.patientName || '',
      patientAge: req.patientAge || undefined,
      notes: req.notes || '',
      requestMethod: req.requestMethod || 'routine',
      department: req.department || '',
      doctorName: req.doctorName || '',
      contactNumber: req.contactNumber || '',
      createdAt: req.createdAt,
      updatedAt: req.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: transformedRequests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching blood requests:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blood requests' },
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

    if (!decoded || decoded.role !== 'donor') {
      return NextResponse.json(
        { error: 'Unauthorized - Donor access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    const bloodRequest = await BloodRequest.findOne({
      _id: new mongoose.Types.ObjectId(requestId),
      donorId: new mongoose.Types.ObjectId(decoded.userId)
    })

    if (!bloodRequest) {
      return NextResponse.json(
        { error: 'Blood request not found or unauthorized' },
        { status: 404 }
      )
    }

    if (bloodRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be cancelled' },
        { status: 400 }
      )
    }

    bloodRequest.status = 'cancelled' as const
    await bloodRequest.save()

    return NextResponse.json({
      success: true,
      message: 'Request cancelled successfully'
    })

  } catch (error: any) {
    console.error('Error cancelling request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel request' },
      { status: 500 }
    )
  }
}