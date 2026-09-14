import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodBag from '@/models/BloodBag'
import Donation from '@/models/Donation'

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

    if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10)
    const bloodType = searchParams.get('bloodType') || 'all'
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const hospitalIdParam = searchParams.get('hospitalId')
    const skip = (page - 1) * limit

    // FIXED: Properly scope to hospital or allow admin cross-hospital access
    let targetHospitalId: mongoose.Types.ObjectId
    
    if (decoded.role === 'admin') {
      // Admins can optionally filter by specific hospital
      if (hospitalIdParam) {
        if (!mongoose.Types.ObjectId.isValid(hospitalIdParam)) {
          return NextResponse.json(
            { error: 'Invalid hospitalId format' },
            { status: 400 }
          )
        }
        targetHospitalId = new mongoose.Types.ObjectId(hospitalIdParam)
      } else {
        // If no hospitalId specified, use the userId from token
        targetHospitalId = new mongoose.Types.ObjectId(decoded.userId)
      }
    } else {
      // Hospital users are always scoped to their own hospital
      targetHospitalId = new mongoose.Types.ObjectId(decoded.userId)
    }

    // Build query
    const query: any = { hospitalId: targetHospitalId }
    if (bloodType !== 'all') query.bloodType = bloodType
    if (status !== 'all') query.status = status

    // Search by batch number or donor name (join with Donation)
    if (search) {
      // First find donations with matching donor names
      const matchingDonations = await Donation.find({
        hospitalId: targetHospitalId,
        donorName: { $regex: search, $options: 'i' }
      }).select('_id').lean()

      const donationIds = matchingDonations.map(d => d._id)

      query.$or = [
        { batchNumber: { $regex: search, $options: 'i' } },
        { donationId: { $in: donationIds } },
        { bloodType: { $regex: search, $options: 'i' } },
      ]
    }

    // Get total count
    const total = await BloodBag.countDocuments(query)

    // Get blood bags with pagination
    const bags = await BloodBag.find(query)
      .sort({ expirationDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get donor names for each bag
    const bagIds = bags.map(b => b.donationId)
    const donations = await Donation.find({
      _id: { $in: bagIds }
    }).select('_id donorName donorEmail donorPhone').lean()

    const donationMap = new Map()
    donations.forEach((d: any) => {
      donationMap.set(d._id.toString(), d)
    })

    // Transform data
    const transformed = bags.map((bag: any) => {
      const donation = donationMap.get(bag.donationId?.toString())
      const now = new Date()
      const expiryDate = new Date(bag.expirationDate)
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isExpired = daysRemaining < 0

      return {
        id: bag._id.toString(),
        bloodType: bag.bloodType,
        units: bag.units || 1,
        donationId: bag.donationId?.toString(),
        donationDate: bag.donationDate,
        expirationDate: bag.expirationDate,
        status: isExpired ? 'expired' : bag.status,
        batchNumber: bag.batchNumber || bag._id.toString().slice(0, 12).toUpperCase(),
        location: bag.location || 'Main Storage',
        notes: bag.notes || '',
        daysRemaining: isExpired ? 0 : daysRemaining,
        isExpired: isExpired,
        donorName: donation?.donorName || 'Unknown',
        donorEmail: donation?.donorEmail || '',
        donorPhone: donation?.donorPhone || '',
      }
    })

    // Summary stats - calculate from ALL bags for this hospital (not just filtered)
    const allBagsForHospital = await BloodBag.find({ 
      hospitalId: targetHospitalId 
    }).lean()
    
    const now = new Date()
    
    const summary = {
      total: allBagsForHospital.length,
      available: allBagsForHospital.filter(b => 
        b.status === 'available' && new Date(b.expirationDate) > now
      ).length,
      used: allBagsForHospital.filter(b => b.status === 'used').length,
      expired: allBagsForHospital.filter(b => 
        b.status === 'expired' || new Date(b.expirationDate) <= now
      ).length,
      quarantined: allBagsForHospital.filter(b => b.status === 'quarantined').length,
    }

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: summary,
    })

  } catch (error: any) {
    console.error('❌ Error fetching blood bags:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blood bags' },
      { status: 500 }
    )
  }
}