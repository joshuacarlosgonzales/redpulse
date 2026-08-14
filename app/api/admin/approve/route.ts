// app/api/admin/donors/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
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
    
    // ⭐ Declare decoded here so it's accessible outside the try block
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

    // Get request body
    const { donorId, action, reason } = await request.json()

    if (!donorId || !action) {
      return NextResponse.json(
        { error: 'Donor ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Validate donor ID
    if (!mongoose.Types.ObjectId.isValid(donorId)) {
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    // Find the donor
    const donor = await Donor.findById(donorId)
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Process approval
    if (action === 'approve') {
      donor.status = 'active'
      donor.approvedBy = decoded.userId  // ✅ Now decoded is accessible
      donor.approvedAt = new Date()
      donor.rejectionReason = undefined
      donor.isEligible = true
      
      // Generate digital ID if not exists
      if (!donor.digitalId) {
        const timestamp = Date.now().toString().slice(-6)
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        donor.digitalId = `RP-${timestamp}-${random}`
      }

      // Set next eligible date if not set
      if (!donor.nextEligibleDate) {
        const nextDate = new Date()
        nextDate.setMonth(nextDate.getMonth() + 3)
        donor.nextEligibleDate = nextDate
      }
    } else if (action === 'reject') {
      donor.status = 'inactive'
      donor.rejectionReason = reason || 'Application rejected'
      donor.isEligible = false
    }

    await donor.save()

    return NextResponse.json({
      success: true,
      message: `Donor ${action}d successfully`,
      donor: {
        id: donor._id.toString(),
        name: donor.fullName,
        email: donor.email,
        status: donor.status,
        approvedAt: donor.approvedAt,
        rejectionReason: donor.rejectionReason,
        digitalId: donor.digitalId,
      }
    })

  } catch (error: any) {
    console.error('Error processing donor approval:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}