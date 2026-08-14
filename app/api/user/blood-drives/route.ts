// app/api/user/blood-drives/route.ts
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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'upcoming'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Build query - only show upcoming and ongoing blood drives
    const query: any = {
      status: { $in: ['upcoming', 'ongoing'] },
      date: { $gte: new Date() } // Only future or current dates
    }

    // Get blood drives
    const bloodDrives = await BloodDrive.find(query)
      .sort({ date: 1 })
      .limit(limit)
      .lean()

    // Get donor ID from decoded token
    const donorId = decoded.userId

    // Transform data and check registration status
    const transformedDrives = bloodDrives.map((drive: any) => {
      const isRegistered = drive.registeredDonorIds?.some(
        (id: any) => id.toString() === donorId
      )

      return {
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
        isRegistered: isRegistered || false,
        createdAt: drive.createdAt,
        updatedAt: drive.updatedAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedDrives,
      pagination: {
        total: transformedDrives.length,
        page: 1,
        limit,
        totalPages: 1,
      }
    })

  } catch (error: any) {
    console.error('Error fetching blood drives for donor:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blood drives' },
      { status: 500 }
    )
  }
}