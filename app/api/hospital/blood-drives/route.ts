import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodDrive from '@/models/BloodDrive'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const BloodDriveModel = BloodDrive as any
const UserModel = User as any

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

    // Get hospital ID from token - your login uses 'userId'
    const hospitalId = decoded.userId || decoded.id || decoded.sub || decoded._id
    
    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID not found in token' },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const query: any = { hospitalId: hospitalId }
    
    if (status !== 'all') {
      query.status = status
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } },
      ]
    }

    const bloodDrives = await BloodDriveModel.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await BloodDriveModel.countDocuments(query)

    const transformedDrives = bloodDrives.map((drive: any) => ({
      id: drive._id.toString(),
      title: drive.title,
      description: drive.description || '',
      location: drive.location,
      address: drive.address || '',
      date: drive.date,
      startTime: drive.startTime,
      endTime: drive.endTime,
      status: drive.status || 'upcoming',
      bloodTypesNeeded: drive.bloodTypesNeeded || [],
      targetDonors: drive.targetDonors || 0,
      registeredDonors: drive.registeredDonors || 0,
      completedDonations: drive.completedDonations || 0,
      organizer: drive.organizer || '',
      contactNumber: drive.contactNumber || '',
      contactEmail: drive.contactEmail || '',
      createdAt: drive.createdAt,
      updatedAt: drive.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: transformedDrives,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error: any) {
    console.error('Error fetching blood drives:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blood drives' },
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
    
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      
      console.log('🔍 Decoded token:', JSON.stringify(decoded, null, 2))
      
      if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized - Hospital or Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      console.error('JWT Error:', jwtError)
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    console.log('📝 Creating blood drive with data:', body)

    // Validate required fields
    if (!body.title || !body.location || !body.date || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Title, location, date, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Get hospital ID from token - your login uses 'userId'
    let hospitalId = decoded.userId || decoded.id || decoded.sub || decoded._id
    
    // If still no hospital ID, try to find the user by email
    if (!hospitalId && decoded.email) {
      console.log('🔍 Hospital ID not in token, fetching user by email:', decoded.email)
      const user = await UserModel.findOne({ email: decoded.email })
      if (user) {
        hospitalId = user._id
        console.log('✅ Found user ID from database:', hospitalId)
      }
    }
    
    if (!hospitalId) {
      console.error('❌ No hospital ID found in token. Decoded token:', decoded)
      return NextResponse.json(
        { error: 'Hospital ID not found in token. Please re-login.' },
        { status: 400 }
      )
    }

    // Ensure hospitalId is a valid ObjectId
    const hospitalIdString = hospitalId.toString()
    if (!mongoose.Types.ObjectId.isValid(hospitalIdString)) {
      console.error('❌ Invalid hospital ID format:', hospitalIdString)
      return NextResponse.json(
        { error: 'Invalid hospital ID format' },
        { status: 400 }
      )
    }

    console.log('🏥 Creating blood drive for hospital ID:', hospitalIdString)

    // ✅ Create a BloodDrive document
    const bloodDrive = new BloodDriveModel({
      title: body.title,
      description: body.description || '',
      location: body.location,
      address: body.address || '',
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'upcoming',
      bloodTypesNeeded: body.bloodTypesNeeded || [],
      targetDonors: body.targetDonors || 50,
      registeredDonors: 0,
      completedDonations: 0,
      organizer: body.organizer || '',
      contactNumber: body.contactNumber || '',
      contactEmail: body.contactEmail || '',
      registeredDonorIds: [],
      hospitalId: new mongoose.Types.ObjectId(hospitalIdString)
    })

    await bloodDrive.save()
    
    console.log('✅ Blood drive created successfully:', bloodDrive._id)

    return NextResponse.json({
      success: true,
      message: 'Blood drive created successfully',
      data: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        location: bloodDrive.location,
        date: bloodDrive.date,
        status: bloodDrive.status,
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error creating blood drive:', error)
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message).join(', ')
      return NextResponse.json(
        { error: messages },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create blood drive' },
      { status: 500 }
    )
  }
}