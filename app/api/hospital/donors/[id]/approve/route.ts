// app/api/hospital/donors/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      if (!decoded) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        )
      }
      
      if (decoded.role !== 'hospital' && decoded.role !== 'admin') {
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

    const { id } = await params
    const { action, reason } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    const donor = await Donor.findById(id)
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      donor.status = 'active'
      donor.approvedBy = decoded.userId
      donor.approvedAt = new Date()
      donor.rejectionReason = undefined
      donor.isEligible = true
      
      if (!donor.digitalId) {
        const timestamp = Date.now().toString().slice(-6)
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        donor.digitalId = `RP-${timestamp}-${random}`
      }

      if (!donor.nextEligibleDate) {
        const nextDate = new Date()
        nextDate.setMonth(nextDate.getMonth() + 3)
        donor.nextEligibleDate = nextDate
      }

      if (donor.userId) {
        await User.findByIdAndUpdate(donor.userId, { 
          isApproved: true,
          isVerified: true,
          isActive: true,
          status: 'active'
        })
      }

      console.log(`✅ Donor ${donor.fullName} approved`)
    } else if (action === 'reject') {
      donor.status = 'inactive'
      donor.rejectionReason = reason || 'Application rejected'
      donor.isEligible = false

      if (donor.userId) {
        await User.findByIdAndUpdate(donor.userId, { 
          isApproved: false,
          isVerified: true,
          status: 'inactive'
        })
      }

      console.log(`❌ Donor ${donor.fullName} rejected`)
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
        isEligible: donor.isEligible,
        // ✅ Added missing fields
        backgroundCheckStatus: donor.backgroundCheckStatus || 'pending',
        backgroundCheckDate: donor.backgroundCheckDate || null,
        backgroundCheckNotes: donor.backgroundCheckNotes || '',
        verifiedBy: donor.verifiedBy || '',
        verificationDate: donor.verificationDate || null,
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