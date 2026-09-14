// app/api/hospital/donors/[id]/background-check/route.ts

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
    const { status: bgStatus, notes } = body

    if (!bgStatus) {
      return NextResponse.json(
        { error: 'Background check status is required' },
        { status: 400 }
      )
    }

    if (!['pending', 'cleared', 'failed', 'in-review'].includes(bgStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "pending", "cleared", "failed", or "in-review"' },
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
    // UPDATE BACKGROUND CHECK
    // ============================================================

    // ✅ FIX: Store verifiedBy as email for consistency
    if (decoded.role === 'hospital') {
      const hospitalId = getUserIdFromAuth(decoded)
      const hospitalUser = await User.findById(hospitalId)
        .select('email')
        .lean()
      donor.verifiedBy = hospitalUser?.email || decoded.email
    } else {
      donor.verifiedBy = decoded.email || decoded.userId || decoded.id
    }

    donor.backgroundCheckStatus = bgStatus
    donor.backgroundCheckDate = new Date()

    if (notes) {
      donor.backgroundCheckNotes = notes.trim()
    }

    // If background check is cleared, update donor eligibility
    if (bgStatus === 'cleared') {
      donor.isEligible = true
      // If donor was inactive due to failed check, reactivate
      if (donor.status === 'inactive' && donor.rejectionReason?.includes('background')) {
        donor.status = 'active'
        donor.rejectionReason = undefined
      }
    } else if (bgStatus === 'failed') {
      donor.isEligible = false
    }

    await donor.save()

    // Update linked User if exists
    if (donor.userId) {
      await User.findByIdAndUpdate(donor.userId, {
        backgroundCheckStatus: bgStatus,
        backgroundCheckDate: new Date(),
        ...(bgStatus === 'cleared' ? { isVerified: true } : {}),
        ...(bgStatus === 'failed' ? { isVerified: false } : {})
      })
    }

    console.log(`📋 Background check for ${donor.fullName} updated to: ${bgStatus}`)

    return NextResponse.json({
      success: true,
      message: `Background check status updated to ${bgStatus}`,
      donor: {
        id: donor._id.toString(),
        name: donor.fullName,
        email: donor.email,
        backgroundCheckStatus: donor.backgroundCheckStatus,
        backgroundCheckDate: donor.backgroundCheckDate,
        backgroundCheckNotes: donor.backgroundCheckNotes,
        verifiedBy: donor.verifiedBy,
        verificationDate: donor.verificationDate,
        isEligible: donor.isEligible,
        status: donor.status,
      },
    })
  } catch (error: any) {
    console.error('Error updating background check:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to update background check',
      },
      {
        status: 500,
      }
    )
  }
}