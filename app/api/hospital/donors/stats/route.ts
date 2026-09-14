// app/api/hospital/donors/stats/route.ts

import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import Donation from '@/models/Donation'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import User from '@/models/User'

import {
  getAuthenticatedHospitalUser,
  getUserIdFromAuth,
  isAuthFailure,
} from '@/lib/hospitalAuth'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const auth = getAuthenticatedHospitalUser(request)

    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user
    const hospitalId = decoded.role === 'hospital'
      ? getUserIdFromAuth(decoded)
      : null

    // ============================================================
    // GET HOSPITAL EMAIL for walk-in donor filtering
    // ============================================================

    const hospitalUser = await User.findById(hospitalId)
      .select('email')
      .lean()

    const hospitalEmail = hospitalUser?.email || decoded.email

    // ============================================================
    // QUERY PARAMETERS (for filtering stats)
    // ============================================================

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const bloodType = searchParams.get('bloodType') || ''

    // ============================================================
    // BUILD BASE QUERY
    // ============================================================

    const baseQuery: any = {}

    // Filter by status if provided
    if (status !== 'all' && status) {
      const validStatuses = ['pending', 'active', 'inactive', 'approved', 'rejected']
      if (validStatuses.includes(status)) {
        baseQuery.status = status
      }
    }

    // Filter by blood type if provided
    if (bloodType && bloodType !== 'all') {
      baseQuery.bloodType = bloodType
    }

    // ============================================================
    // GET DONOR IDS (for hospital filtering)
    // ============================================================

    let allowedDonorIds: mongoose.Types.ObjectId[] = []

    if (hospitalId) {
      // ✅ Get donor IDs that have donations at this hospital
      const donationDonorIds = await Donation.distinct('donorId', {
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
        status: 'Completed'
      })

      // ✅ Get walk-in donors for THIS hospital ONLY (filter by approvedBy email)
      const walkInDonors = await Donor.distinct('_id', {
        isWalkIn: true,
        approvedBy: hospitalEmail
      })

      // ✅ Get donors from blood drive registrations
      const bloodDriveDonorIds = await BloodDriveRegistration.distinct('donorId', {
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
        status: { $in: ['registered', 'attended'] }
      })

      const allDonorIds = [...donationDonorIds, ...walkInDonors, ...bloodDriveDonorIds]

      allowedDonorIds = Array.from(
        new Set(allDonorIds.map(id => id.toString()))
      ).map(id => new mongoose.Types.ObjectId(id))

      console.log(`Stats - Found ${allowedDonorIds.length} donors for this hospital`)
      console.log(`   - From donations: ${donationDonorIds.length}`)
      console.log(`   - Walk-in donors: ${walkInDonors.length}`)
      console.log(`   - From blood drives: ${bloodDriveDonorIds.length}`)

      if (allowedDonorIds.length > 0) {
        baseQuery._id = { $in: allowedDonorIds }
      } else {
        // No donors for this hospital
        return NextResponse.json({
          success: true,
          stats: {
            total: 0,
            active: 0,
            pending: 0,
            cleared: 0,
            participated: 0,
          }
        })
      }
    }

    // ============================================================
    // CALCULATE STATS (All in parallel)
    // ============================================================

    const [total, active, pending, cleared, participated] = await Promise.all([
      // Total donors
      Donor.countDocuments(baseQuery),

      // Active/Approved donors
      Donor.countDocuments({
        ...baseQuery,
        status: { $in: ['active', 'approved'] }
      }),

      // Pending donors
      Donor.countDocuments({
        ...baseQuery,
        status: 'pending'
      }),

      // Background cleared
      Donor.countDocuments({
        ...baseQuery,
        backgroundCheckStatus: { $in: ['cleared'] }
      }),

      // Donors who have attended at least one event
      (async () => {
        if (allowedDonorIds.length === 0 && !hospitalId) {
          // For admin, get all donors who attended events
          const attendedDonors = await BloodDriveRegistration.distinct('donorId', {
            status: 'attended'
          })
          return attendedDonors.length
        }

        // For hospital, filter by allowed donors
        const attendedDonors = await BloodDriveRegistration.distinct('donorId', {
          status: 'attended',
          ...(allowedDonorIds.length > 0 ? {
            donorId: { $in: allowedDonorIds }
          } : {})
        })

        return attendedDonors.length
      })()
    ])

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      stats: {
        total,
        active,
        pending,
        cleared,
        participated,
      }
    })
  } catch (error: any) {
    console.error('Error fetching donor stats:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch stats',
      },
      {
        status: 500,
      }
    )
  }
}