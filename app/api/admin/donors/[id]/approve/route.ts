// app/api/admin/donors/[id]/approve/route.ts
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

    // Await params for Next.js 15+
    const { id } = await params

    // Get action and reason from request body
    const { action, reason } = await request.json()

    // Validate required fields
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

    // Try to find donor by _id first, then by userId
    let donor = await Donor.findById(id)
    
    // If not found by _id, try to find by userId
    if (!donor && mongoose.Types.ObjectId.isValid(id)) {
      donor = await Donor.findOne({ userId: id })
    }

    // If still not found, check if this is a User with role 'donor'
    let user = null
    if (!donor && mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id)
      if (user && user.role === 'donor') {
        // This is a User that doesn't have a Donor profile yet
        // We need to create a Donor profile for them
        console.log('🔄 Creating donor profile for user:', user.fullName)
        
        // Create donor profile from user data with ALL required fields
        donor = new Donor({
          userId: user._id,
          fullName: user.fullName || 'Unknown',
          email: user.email || '',
          phone: user.phone || '',
          bloodType: 'O+', // Default blood type
          address: 'Not specified',
          dateOfBirth: new Date('2000-01-01'), // Default date
          gender: 'Other', // ✅ Valid enum value: 'Male', 'Female', or 'Other'
          weight: 40, // ✅ Minimum weight is 40 kg
          status: action === 'approve' ? 'active' : 'inactive',
          isEligible: action === 'approve',
          totalDonations: 0,
          lastDonationDate: null,
          // Optional fields
          barangay: '',
          municipality: '',
          province: '',
          emergencyContact: '',
          medicalConditions: '',
          currentMedications: '',
          bloodPressure: '',
          temperature: 0,
          pulseRate: 0,
          hemoglobin: 0,
          emergencyName: '',
          emergencyRelationship: '',
          middleName: '',
        })

        if (action === 'approve') {
          donor.approvedBy = decoded.userId
          donor.approvedAt = new Date()
          
          // Generate digital ID
          const timestamp = Date.now().toString().slice(-6)
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
          donor.digitalId = `RP-${timestamp}-${random}`
          
          // Set next eligible date
          const nextDate = new Date()
          nextDate.setMonth(nextDate.getMonth() + 3)
          donor.nextEligibleDate = nextDate

          // Update user's isApproved flag
          if (donor.userId) {
            await User.findByIdAndUpdate(donor.userId, { 
              isApproved: true,
              isVerified: true,
              isActive: true
            })
          }
        } else {
          donor.rejectionReason = reason || 'Application rejected'
          // Update user's isApproved flag
          if (donor.userId) {
            await User.findByIdAndUpdate(donor.userId, { 
              isApproved: false,
              isVerified: true
            })
          }
        }

        await donor.save()
        console.log('✅ Created donor profile:', donor._id)
      }
    }

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Process approval/rejection for existing donor
    if (action === 'approve') {
      donor.status = 'active'
      donor.approvedBy = decoded.userId
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

      // Update user's isApproved flag
      if (donor.userId) {
        await User.findByIdAndUpdate(donor.userId, { 
          isApproved: true,
          isVerified: true,
          isActive: true
        })
      }

      console.log(`✅ Donor ${donor.fullName} approved by admin ${decoded.userId}`)
    } else if (action === 'reject') {
      donor.status = 'inactive'
      donor.rejectionReason = reason || 'Application rejected'
      donor.isEligible = false

      // Update user's isApproved flag
      if (donor.userId) {
        await User.findByIdAndUpdate(donor.userId, { 
          isApproved: false,
          isVerified: true
        })
      }

      console.log(`❌ Donor ${donor.fullName} rejected by admin ${decoded.userId}`)
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