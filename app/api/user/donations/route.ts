// app/api/user/donations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import Donation from '@/models/Donation'
import User from '@/models/User'
import Donor from '@/models/Donor'

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
    let filter: any = {}

    if (user.role === 'donor') {
      // ✅ FIX: Get the actual donorId from the Donor model
      // First try to find donor by userId
      let donorProfile = await Donor.findOne({ userId: decoded.userId })
      
      // If not found by userId, try by email
      if (!donorProfile) {
        donorProfile = await Donor.findOne({ email: user.email })
      }

      if (donorProfile) {
        // Use the donor's _id from the Donor model
        filter.donorId = donorProfile._id
        console.log(`🔍 Using donorId: ${donorProfile._id} for user: ${user.email}`)
      } else {
        // Fallback: try to find by donorId in donation records
        // Check if any donations exist with this userId as donorId
        const existingDonation = await Donation.findOne({ donorId: decoded.userId })
        if (existingDonation) {
          filter.donorId = decoded.userId
          console.log(`⚠️ Using userId: ${decoded.userId} as donorId (found existing donations)`)
        } else {
          // Last resort: try to find by donorEmail
          filter.donorEmail = user.email
          console.log(`⚠️ Using donorEmail: ${user.email} as filter`)
        }
      }
    } else if (user.role === 'hospital') {
      filter.hospitalId = decoded.userId
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

    let donations = await Donation.find(filter)
      .sort({ date: -1 })
      .limit(limit)
      .lean()

    // ✅ If no donations found and we have a donorId, try alternative lookup
    if (donations.length === 0 && filter.donorId) {
      console.log('🔍 No donations found with donorId, trying by donorEmail...')
      const donor = await Donor.findById(filter.donorId)
      if (donor && donor.email) {
        const emailFilter = { donorEmail: donor.email }
        console.log('🔍 Trying email filter:', emailFilter)
        donations = await Donation.find(emailFilter)
          .sort({ date: -1 })
          .limit(limit)
          .lean()
      }
    }

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