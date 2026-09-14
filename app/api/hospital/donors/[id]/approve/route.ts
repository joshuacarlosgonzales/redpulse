// app/api/hospital/donors/[id]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import User from '@/models/User'
import Donation from '@/models/Donation'

import {
  getAuthenticatedHospitalUser,
  getUserIdFromAuth,
  isAuthFailure,
} from '@/lib/hospitalAuth'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION - Using helper consistently
    // ============================================================

    const auth = getAuthenticatedHospitalUser(request)

    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user

    // ============================================================
    // PARAMETER
    // ============================================================

    const { id } = await params

    const body = await request.json()
    const { action, reason } = body

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

    // ============================================================
    // FIND DONOR
    // ============================================================

    const donor = await Donor.findById(id)

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // ============================================================
    // 🔴 FIXED: HOSPITAL OWNERSHIP CHECK
    // ============================================================

    if (decoded.role === 'hospital') {
      const hospitalId = getUserIdFromAuth(decoded)

      if (!hospitalId) {
        console.error('❌ Hospital ID not found in token')
        return NextResponse.json(
          { error: 'Invalid hospital authentication' },
          { status: 401 }
        )
      }

      const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId)

      // Get hospital email for walk-in donor check
      const hospitalUser = await User.findById(hospitalId)
        .select('email')
        .lean()
      const hospitalEmail = hospitalUser?.email || decoded.email

      // Check if this hospital has access to this donor
      let hasAccess = false

      // 1. Check if donor has completed donation at this hospital
      const hasDonation = await Donation.exists({
        donorId: donor._id,
        hospitalId: hospitalObjectId,
        status: 'Completed'
      })

      if (hasDonation) {
        hasAccess = true
      }

      // 2. Check if this is a walk-in donor created by this hospital
      if (donor.isWalkIn && donor.approvedBy === hospitalEmail) {
        hasAccess = true
      }

      // 3. Check if donor is registered for a blood drive at this hospital
      if (!hasAccess) {
        const BloodDriveRegistration = (await import('@/models/BloodDriveRegistration')).default
        const isRegistered = await BloodDriveRegistration.exists({
          donorId: donor._id,
          hospitalId: hospitalObjectId,
          status: { $in: ['registered', 'attended'] }
        })

        if (isRegistered) {
          hasAccess = true
        }
      }

      if (!hasAccess) {
        console.warn(`🔒 Hospital ${hospitalEmail} attempted to access donor ${donor._id} without permission`)
        return NextResponse.json(
          { error: 'Access denied - donor does not belong to your hospital' },
          { status: 403 }
        )
      }

      console.log(`✅ Hospital ${hospitalEmail} verified for donor ${donor._id}`)
    }

    // ============================================================
    // APPROVE
    // ============================================================

    if (action === 'approve') {
      // ✅ FIX: Store email for walk-in donors, ID for regular donors
      if (decoded.role === 'hospital') {
        const hospitalId = getUserIdFromAuth(decoded)
        const hospitalUser = await User.findById(hospitalId)
          .select('email')
          .lean()
        const hospitalEmail = hospitalUser?.email || decoded.email

        // Store email for walk-in donors, ID for regular donors
        if (donor.isWalkIn) {
          donor.approvedBy = hospitalEmail
        } else {
          donor.approvedBy = decoded.userId || decoded.id
        }
      } else {
        // Admin approval
        donor.approvedBy = decoded.userId || decoded.id
      }

      donor.status = 'active'
      donor.approvedAt = new Date()
      donor.rejectionReason = undefined
      donor.isEligible = true

      // Generate digital ID if missing
      if (!donor.digitalId) {
        const timestamp = Date.now().toString().slice(-6)
        const random = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0')
        donor.digitalId = `RP-${timestamp}-${random}`
      }

      // Set next eligible date if missing
      if (!donor.nextEligibleDate) {
        const nextDate = new Date()
        nextDate.setMonth(nextDate.getMonth() + 3)
        donor.nextEligibleDate = nextDate
      }

      // Update linked User
      if (donor.userId) {
        await User.findByIdAndUpdate(
          donor.userId,
          {
            isApproved: true,
            isVerified: true,
            isActive: true,
            status: 'active',
          }
        )
      }

      console.log(`✅ Donor ${donor.fullName} approved by ${donor.approvedBy}`)
    }

    // ============================================================
    // REJECT
    // ============================================================

    else if (action === 'reject') {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }

      donor.status = 'inactive'
      donor.rejectionReason = reason.trim()
      donor.isEligible = false

      if (donor.userId) {
        await User.findByIdAndUpdate(
          donor.userId,
          {
            isApproved: false,
            isVerified: true,
            status: 'inactive',
          }
        )
      }

      console.log(`❌ Donor ${donor.fullName} rejected`)
    }

    // ============================================================
    // SAVE
    // ============================================================

    await donor.save()

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      message: `Donor ${action}d successfully`,
      donor: {
        id: donor._id.toString(),
        name: donor.fullName,
        email: donor.email,
        status: donor.status,
        approvedAt: donor.approvedAt,
        approvedBy: donor.approvedBy,
        rejectionReason: donor.rejectionReason,
        digitalId: donor.digitalId,
        isEligible: donor.isEligible,
        backgroundCheckStatus: donor.backgroundCheckStatus || 'pending',
        backgroundCheckDate: donor.backgroundCheckDate || null,
        backgroundCheckNotes: donor.backgroundCheckNotes || '',
        verifiedBy: donor.verifiedBy || '',
        verificationDate: donor.verificationDate || null,
      },
    })
  } catch (error: any) {
    console.error('Error processing donor approval:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to process request',
      },
      {
        status: 500,
      }
    )
  }
}