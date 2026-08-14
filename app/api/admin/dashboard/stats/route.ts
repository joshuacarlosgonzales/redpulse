// app/api/admin/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Hospital from '@/models/Hospital'
import BloodDrive from '@/models/BloodDrive'
import User from '@/models/User'
import Donation from '@/models/Donation'
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

    // Get counts
    const [
      totalHospitals,
      totalDonors,
      totalBloodDrives,
      totalDonations,
      pendingHospitals
    ] = await Promise.all([
      Hospital.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      BloodDrive.countDocuments(),
      Donation.countDocuments({ status: 'Completed' }),
      Hospital.countDocuments({ status: 'pending' })
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalHospitals,
        totalDonors,
        totalBloodDrives,
        totalDonations,
        pendingHospitals
      }
    })

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}