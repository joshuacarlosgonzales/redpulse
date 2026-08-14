// app/api/user/blood-drives/registered/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import BloodDrive from '@/models/BloodDrive'
import jwt from 'jsonwebtoken'

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
      if (decoded.role !== 'donor' && decoded.role !== 'user') {
        return NextResponse.json(
          { error: 'Unauthorized - Donor access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const donorId = decoded.userId

    // Find all blood drives where this donor is registered
    const bloodDrives = await BloodDrive.find({
      registeredDonorIds: donorId
    })
    .sort({ date: 1 })
    .lean()

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
      isRegistered: true,
      createdAt: drive.createdAt,
      updatedAt: drive.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: transformedDrives,
    })

  } catch (error: any) {
    console.error('Error fetching registered drives:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registered drives' },
      { status: 500 }
    )
  }
}