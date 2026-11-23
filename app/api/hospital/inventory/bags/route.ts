// app/api/hospital/inventory/bags/route.ts
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
    const bloodType = searchParams.get('bloodType') || 'all'
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const hospitalIdParam = searchParams.get('hospitalId')
    const skip = (page - 1) * limit

    let targetHospitalId: mongoose.Types.ObjectId
    if (decoded.role === 'admin' && hospitalIdParam) {
      if (!mongoose.Types.ObjectId.isValid(hospitalIdParam)) {
        return NextResponse.json({ error: 'Invalid hospitalId format' }, { status: 400 })
      }
      targetHospitalId = new mongoose.Types.ObjectId(hospitalIdParam)
    } else {
      targetHospitalId = new mongoose.Types.ObjectId(decoded.userId)
    }

    const cacheKey = `bags:${targetHospitalId}:${bloodType}:${status}:${search}:${page}:${limit}`

    const payload = await cached(cacheKey, 30_000, async () => {
      const query: any = { hospitalId: targetHospitalId }
      if (bloodType !== 'all') query.bloodType = bloodType
      if (status !== 'all') query.status = status

      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const matchingDonations = await Donation.find({
          hospitalId: targetHospitalId,
          donorName: { $regex: escaped, $options: 'i' },
        })
          .select('_id')
          .lean()

        query.$or = [
          { batchNumber: { $regex: escaped, $options: 'i' } },
          { donationId: { $in: matchingDonations.map((d) => d._id) } },
          { bloodType: { $regex: escaped, $options: 'i' } },
        ]
      }

      const total = await BloodBag.countDocuments(query)

      // Newest bags first
      const bags = await BloodBag.find(query)
        .sort({ donationDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      // Only real donation bags have a donationId — skip nulls before querying
      const bagDonationIds = bags
        .map((b: any) => b.donationId)
        .filter((id: any) => id != null)

      const donations = bagDonationIds.length
        ? await Donation.find({ _id: { $in: bagDonationIds } })
            .select('_id donorName donorEmail donorPhone')
            .lean()
        : []

      const donationMap = new Map(donations.map((d: any) => [d._id.toString(), d]))

      const now = new Date()
      const transformed = bags.map((bag: any) => {
        const donation = bag.donationId
          ? donationMap.get(bag.donationId.toString())
          : null
        const daysRemaining = Math.ceil(
          (new Date(bag.expirationDate).getTime() - now.getTime()) / 86_400_000
        )
        const isExpired = daysRemaining < 0
        return {
          id: bag._id.toString(),
          bloodType: bag.bloodType,
          units: bag.units || 1,
          donationId: bag.donationId?.toString() || null,
          sourceType: bag.sourceType || 'donation',
          sourceId: bag.sourceId?.toString() || null,
          donationDate: bag.donationDate,
          expirationDate: bag.expirationDate,
          status: isExpired ? 'expired' : bag.status,
          batchNumber: bag.batchNumber || bag._id.toString().slice(0, 12).toUpperCase(),
          location: bag.location || 'Main Storage',
          notes: bag.notes || '',
          daysRemaining: isExpired ? 0 : daysRemaining,
          isExpired,
          donorName: donation?.donorName || 'Manually Added',
          donorEmail: donation?.donorEmail || '',
          donorPhone: donation?.donorPhone || '',
        }
      })

      // Summary respects bloodType + search, but not status (so cards show all statuses)
      const summaryQuery: any = { hospitalId: targetHospitalId }
      if (bloodType !== 'all') summaryQuery.bloodType = bloodType
      if (search) summaryQuery.$or = query.$or

      const allBagsForSummary = await BloodBag.find(summaryQuery)
        .select('status expirationDate')
        .lean()

      const n = new Date()
      const summary = {
        total: allBagsForSummary.length,
        available: allBagsForSummary.filter(
          (b: any) => b.status === 'available' && new Date(b.expirationDate) > n
        ).length,
        used: allBagsForSummary.filter((b: any) => b.status === 'used').length,
        expired: allBagsForSummary.filter(
          (b: any) => b.status === 'expired' || new Date(b.expirationDate) <= n
        ).length,
        quarantined: allBagsForSummary.filter((b: any) => b.status === 'quarantined').length,
      }

      return {
        success: true,
        data: transformed,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        summary,
      }
    })

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' },
    })
  } catch (error: any) {
    console.error('Error fetching blood bags:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch blood bags' }, { status: 500 })
  }
}