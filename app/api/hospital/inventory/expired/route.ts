// app/api/hospital/inventory/expired/route.ts

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import Donation from '@/models/Donation'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    let decoded: any

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as any
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // ============================================================
    // ROLE CHECK
    // ============================================================

    if (
      !decoded ||
      (decoded.role !== 'hospital' && decoded.role !== 'admin')
    ) {
      return NextResponse.json(
        {
          error:
            'Unauthorized - Hospital admin access required',
        },
        { status: 403 }
      )
    }

    // ============================================================
    // QUERY PARAMETERS
    // ============================================================

    const { searchParams } = new URL(request.url)

    const page = Math.max(
      1,
      parseInt(searchParams.get('page') || '1', 10)
    )

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(searchParams.get('limit') || '10', 10)
      )
    )

    const skip = (page - 1) * limit

    const bloodType =
      searchParams.get('bloodType') || 'all'

    const search =
      searchParams.get('search')?.trim() || ''

    // ============================================================
    // HOSPITAL ID
    // ============================================================

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const hospitalId = new mongoose.Types.ObjectId(
      decoded.userId
    )

    // ============================================================
    // EXPIRED BLOOD QUERY
    // ============================================================

    const query: any = {
      hospitalId,
      status: 'Completed',

      // Automatically expired based on current date/time
      expirationDate: {
        $lte: new Date(),
      },
    }

    // ============================================================
    // BLOOD TYPE FILTER
    // ============================================================

    if (bloodType !== 'all') {
      query.bloodType = bloodType
    }

    // ============================================================
    // SEARCH FILTER
    // ============================================================

    if (search) {
      query.$or = [
        {
          donorName: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          bloodType: {
            $regex: search,
            $options: 'i',
          },
        },
      ]
    }

    // ============================================================
    // TOTAL COUNT
    // ============================================================

    const total = await Donation.countDocuments(query)

    // ============================================================
    // PAGINATED RESULTS
    // ============================================================

    const expiredDonations = await Donation.find(query)
      .sort({ expirationDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // ============================================================
    // TRANSFORM DATA FOR FRONTEND
    // ============================================================

    const now = new Date()

    const transformed = expiredDonations.map(
      (donation: any) => {
        const expiryDate = new Date(
          donation.expirationDate
        )

        const daysOverdue = Math.max(
          1,
          Math.ceil(
            (now.getTime() - expiryDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )

        return {
          id: donation._id.toString(),

          bloodType: donation.bloodType,

          units: donation.units || 1,

          donorName:
            donation.donorName || 'Unknown',

          donorEmail:
            donation.donorEmail || '',

          donorPhone:
            donation.donorPhone || '',

          donationDate: donation.date,

          expirationDate:
            donation.expirationDate,

          daysOverdue,

          hospital:
            donation.hospital || '',

          isWalkIn:
            donation.isWalkIn || false,

          notes:
            donation.notes || '',

          bloodDriveId:
            donation.bloodDriveId?.toString() || null,
        }
      }
    )

    // ============================================================
    // SUMMARY
    // ============================================================
    //
    // Calculate summary from ALL matching expired records,
    // not only the current page.
    // ============================================================

    const summaryData = await Donation.find(query)
      .select('bloodType units')
      .lean()

    const summary = {
      totalExpired: total,

      totalUnits: summaryData.reduce(
        (sum, donation: any) =>
          sum + (donation.units || 1),
        0
      ),

      byBloodType: summaryData.reduce(
        (acc: any, donation: any) => {
          const type = donation.bloodType

          if (!acc[type]) {
            acc[type] = {
              units: 0,
              count: 0,
            }
          }

          acc[type].units +=
            donation.units || 1

          acc[type].count += 1

          return acc
        },
        {}
      ),
    }

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      data: transformed,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit),
      },

      summary,
    })
  } catch (error: any) {
    console.error(
      '❌ Error fetching expired blood:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to fetch expired blood',
      },
      { status: 500 }
    )
  }
}