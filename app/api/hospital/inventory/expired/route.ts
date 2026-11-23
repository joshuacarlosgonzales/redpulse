// app/api/hospital/inventory/expired/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodBag from '@/models/BloodBag'
import Donation from '@/models/Donation'
import { cached } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    } catch {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }
    if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized - Hospital admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10))
    const skip = (page - 1) * limit
    const bloodType = searchParams.get('bloodType') || 'all'
    const search = searchParams.get('search')?.trim() || ''

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }
    const hospitalId = new mongoose.Types.ObjectId(decoded.userId)

    const cacheKey = `expired:${hospitalId}:${bloodType}:${search}:${page}:${limit}`

    const payload = await cached(cacheKey, 30_000, async () => {
      const now = new Date()

      // NEW source: physical bags that are not used and are past expiry.
      const query: any = {
        hospitalId,
        status: { $nin: ['used', 'quarantined'] },
        expirationDate: { $lte: now },
      }
      if (bloodType !== 'all') query.bloodType = bloodType
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        query.$or = [{ bloodType: { $regex: escaped, $options: 'i' } }]
      }

      const [result] = await BloodBag.aggregate([
        { $match: query },
        {
          $facet: {
            page: [
              { $sort: { expirationDate: 1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $lookup: {
                  from: 'donations',
                  localField: 'donationId',
                  foreignField: '_id',
                  as: 'donation',
                },
              },
              { $unwind: { path: '$donation', preserveNullAndEmptyArrays: true } },
            ],
            summary: [
              {
                $group: {
                  _id: '$bloodType',
                  units: { $sum: { $ifNull: ['$units', 1] } },
                  count: { $sum: 1 },
                },
              },
            ],
            total: [{ $count: 'n' }],
          },
        },
      ])

      const transformed = result.page.map((bag: any) => {
        const expiryDate = new Date(bag.expirationDate)
        const daysOverdue = Math.max(
          1,
          Math.ceil((now.getTime() - expiryDate.getTime()) / 86_400_000)
        )
        const donation = bag.donation || {}
        return {
          id: bag._id.toString(),
          bloodType: bag.bloodType,
          units: bag.units || 1,
          donorName: donation.donorName || 'Unknown',
          donorEmail: donation.donorEmail || '',
          donorPhone: donation.donorPhone || '',
          donationDate: bag.donationDate || donation.date,
          expirationDate: bag.expirationDate,
          daysOverdue,
          hospital: donation.hospital || '',
          isWalkIn: donation.isWalkIn || false,
          notes: bag.notes || '',
          bloodDriveId: donation.bloodDriveId?.toString() || null,
        }
      })

      const total = result.total[0]?.n ?? 0
      const byBloodType = Object.fromEntries(
        result.summary.map((s: any) => [s._id, { units: s.units, count: s.count }])
      )

      return {
        success: true,
        data: transformed,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        summary: {
          totalExpired: total,
          totalUnits: result.summary.reduce((sum: number, s: any) => sum + s.units, 0),
          byBloodType,
        },
      }
    })

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' },
    })
  } catch (error: any) {
    console.error('Error fetching expired blood:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch expired blood' }, { status: 500 })
  }
}