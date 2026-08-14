// app/api/admin/hospitals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Hospital from '@/models/Hospital'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {}
    if (status !== 'all') {
      filter.status = status
    }

    if (search) {
      filter.$or = [
        { hospitalName: { $regex: search, $options: 'i' } },
        { hospitalLicense: { $regex: search, $options: 'i' } },
        { hospitalAddress: { $regex: search, $options: 'i' } }
      ]
    }

    // Get total count
    const total = await Hospital.countDocuments(filter)

    // Get hospitals with pagination
    const hospitals = await Hospital.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email phone')
      .lean()

    // Transform hospitals
    const transformedHospitals = hospitals.map((hospital: any) => ({
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
      rejectionReason: hospital.rejectionReason,
      approvedAt: hospital.approvedAt,
      adminName: hospital.userId?.fullName || 'N/A',
      adminEmail: hospital.userId?.email || 'N/A',
      adminPhone: hospital.userId?.phone || 'N/A',
      createdAt: hospital.createdAt,
      updatedAt: hospital.updatedAt
    }))

    return NextResponse.json({
      success: true,
      hospitals: transformedHospitals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching hospitals:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hospitals' },
      { status: 500 }
    )
  }
}