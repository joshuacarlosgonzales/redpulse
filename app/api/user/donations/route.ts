// app/api/user/donations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import Donation from '@/models/Donation'
import User from '@/models/User'

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

    // Check if user exists
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Allow both donors and hospitals to view donations
    // For hospitals, show donations made to their hospital
    let filter: any = {}
    
    if (user.role === 'donor') {
      filter.donorId = decoded.userId
    } else if (user.role === 'hospital') {
      // Hospital users see donations made to their hospital
      const hospitalName = user.hospitalName || user.fullName
      filter.hospital = hospitalName
    } else {
      // Admin sees all
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || 'all'

    if (status !== 'all') {
      filter.status = status.charAt(0).toUpperCase() + status.slice(1)
    }

    console.log('🔍 Fetching donations with filter:', JSON.stringify(filter, null, 2))

    const donations = await Donation.find(filter)
      .sort({ date: -1 })
      .limit(limit)
      .lean()

    console.log(`📦 Found ${donations.length} donations`)

    // Transform donations
    const transformedDonations = donations.map((donation: any) => ({
      id: donation._id.toString(),
      date: donation.date || donation.createdAt || new Date(),
      location: donation.hospital || 'Unknown Hospital',
      status: donation.status ? donation.status.toLowerCase() : 'completed',
      points: donation.units ? donation.units * 10 : 10,
      hospitalName: donation.hospital || '',
      notes: donation.notes || ''
    }))

    return NextResponse.json({
      success: true,
      data: transformedDonations
    })

  } catch (error: any) {
    console.error('Error fetching user donations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}