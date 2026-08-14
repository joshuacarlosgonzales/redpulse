// app/api/hospital/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodRequest from '@/models/BloodRequest'
import User from '@/models/User'
import Hospital from '@/models/Hospital'

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

    // Check if user is hospital
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    // Get the hospital record for this user
    const hospital = await Hospital.findOne({ userId: decoded.userId })
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital record not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const urgency = searchParams.get('urgency') || ''

    // Build filter - use hospitalId for exact matching
    const filter: any = { 
      hospitalId: hospital._id
    }

    if (status !== 'all') {
      filter.status = status
    }

    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { bloodType: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } }
      ]
    }

    if (urgency) {
      filter.urgency = urgency
    }

    console.log('🔍 Hospital requests filter:', JSON.stringify(filter, null, 2))

    const requests = await BloodRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean()

    console.log(`📦 Found ${requests.length} requests for hospital ${hospital.hospitalName}`)

    // Transform data
    const transformedRequests = requests.map((req: any) => ({
      id: req._id.toString(),
      donorId: req.donorId?.toString() || '',
      donorName: req.donorName || 'Unknown Donor',
      donorEmail: req.donorEmail || '',
      donorPhone: req.donorPhone || '',
      donorBloodType: req.bloodType || '',
      bloodType: req.bloodType || '',
      quantity: req.quantity || 1,
      urgency: req.urgency || 'normal',
      status: req.status || 'pending',
      requestDate: req.requestDate || req.createdAt,
      requiredDate: req.requiredDate,
      hospitalName: req.hospitalName || hospital.hospitalName,
      hospitalAddress: req.hospitalAddress || hospital.hospitalAddress || '',
      patientName: req.patientName || '',
      patientAge: req.patientAge || null,
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
      debug: {
        hospitalId: hospital._id,
        hospitalName: hospital.hospitalName,
        totalRequests: transformedRequests.length,
        filter: filter
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching hospital requests:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Check if user is hospital
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    // Get the hospital record
    const hospital = await Hospital.findOne({ userId: decoded.userId })
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital record not found' },
        { status: 404 }
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

    const body = await request.json()
    const { status, rejectionReason } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Find and update the request - ensure it belongs to this hospital
    const bloodRequest = await BloodRequest.findOne({
      _id: requestId,
      hospitalId: hospital._id
    })

    if (!bloodRequest) {
      return NextResponse.json(
        { error: 'Request not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update status
    bloodRequest.status = status
    
    if (status === 'approved') {
      bloodRequest.approvedBy = decoded.userId
      bloodRequest.approvedAt = new Date()
    }
    
    if (status === 'rejected' && rejectionReason) {
      bloodRequest.rejectionReason = rejectionReason
    }

    await bloodRequest.save()

    console.log(`✅ Request ${requestId} updated to ${status} by hospital ${hospital.hospitalName}`)

    return NextResponse.json({
      success: true,
      data: {
        id: bloodRequest._id.toString(),
        status: bloodRequest.status,
        updatedAt: bloodRequest.updatedAt
      },
      message: `Request ${status} successfully`
    })

  } catch (error: any) {
    console.error('❌ Error updating request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update request' },
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

    // Check if user is hospital
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    // Get the hospital record
    const hospital = await Hospital.findOne({ userId: decoded.userId })
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital record not found' },
        { status: 404 }
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

    // Find and delete the request - ensure it belongs to this hospital
    const bloodRequest = await BloodRequest.findOne({
      _id: requestId,
      hospitalId: hospital._id
    })

    if (!bloodRequest) {
      return NextResponse.json(
        { error: 'Request not found or unauthorized' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending requests
    if (bloodRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be deleted' },
        { status: 400 }
      )
    }

    await BloodRequest.deleteOne({ _id: requestId })

    console.log(`🗑️ Request ${requestId} deleted by hospital ${hospital.hospitalName}`)

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error deleting request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete request' },
      { status: 500 }
    )
  }
}