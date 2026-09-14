// app/api/admin/donors/route.ts

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

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

    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const bloodType = searchParams.get('bloodType') || ''
    const registrationType = searchParams.get('registrationType') || 'all'

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = 8

    const skip = (page - 1) * limit

    // ============ BUILD QUERIES ============
    
    // Build Donor query
    const donorQuery: any = {}

    if (status !== 'all' && status) {
      const statusMap: Record<string, string> = {
        active: 'active',
        approved: 'active',
        pending: 'pending',
        inactive: 'inactive',
        rejected: 'inactive',
      }
      donorQuery.status = statusMap[status] || status
    }

    if (bloodType && bloodType !== 'all') {
      donorQuery.bloodType = bloodType
    }

    if (registrationType && registrationType !== 'all') {
      donorQuery.registrationType = registrationType
    }

    if (search) {
      donorQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { digitalId: { $regex: search, $options: 'i' } },
      ]
    }

    // Build User query for system-registered donors (role: 'donor')
    const userQuery: any = {
      role: 'donor',
    }

    // Get all user IDs that already have donor records
    const allExistingDonorUserIds = await Donor.distinct('userId')
    const existingUserIds = allExistingDonorUserIds
      .filter(id => id !== null && id !== undefined)
      .map(id => id.toString())

    // Exclude users that already have a donor record
    if (existingUserIds.length > 0) {
      userQuery._id = {
        $nin: existingUserIds.map(
          (id: string) => new mongoose.Types.ObjectId(id)
        ),
      }
    }

    // Add search filter to userQuery
    if (search) {
      userQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    // Add status filter for users
    if (status !== 'all' && status) {
      if (status === 'active' || status === 'approved') {
        userQuery.isApproved = true
      } else if (status === 'pending') {
        userQuery.isApproved = { $in: [false, null, undefined] }
      } else if (status === 'inactive') {
        userQuery.isApproved = false
      }
    }

    // ============ FIX: Registration type filter for users ============
    // Users are ALWAYS 'system' type, so we need to handle this properly
    if (registrationType === 'walk-in') {
      // If filtering for walk-in donors, we should NOT include any users
      // Set a condition that will never match any user
      userQuery._id = { $eq: null } // This ensures no users are returned
    }
    // If registrationType is 'system' or 'all', users are included (they are system by default)

    // ============ GET TOTAL COUNTS ============
    
    // Get total count of donors in Donor collection
    const donorTotalCount = await Donor.countDocuments(donorQuery)
    
    // Get total count of users that match the query
    const userTotalCount = await User.countDocuments(userQuery)
    
    // Total combined count
    const total = donorTotalCount + userTotalCount

    // ============ FETCH DONORS WITH PAGINATION ============
    
    let donorDocs: any[] = []
    let userDonors: any[] = []

    // Fetch donor documents with pagination
    if (donorTotalCount > 0) {
      const donorSkip = Math.min(skip, donorTotalCount)
      const donorLimit = Math.min(limit, donorTotalCount - donorSkip)
      
      if (donorLimit > 0) {
        donorDocs = await Donor.find(donorQuery)
          .sort({ createdAt: -1 })
          .skip(donorSkip)
          .limit(donorLimit)
          .lean() as any[]
      }
    }

    // Calculate remaining slots after donors
    const remainingSlots = limit - donorDocs.length
    
    if (remainingSlots > 0 && userTotalCount > 0) {
      // Calculate skip for users
      let userSkip = 0
      if (skip >= donorTotalCount) {
        userSkip = skip - donorTotalCount
      }
      
      // Ensure userSkip doesn't exceed userTotalCount
      if (userSkip < userTotalCount) {
        const userLimit = Math.min(remainingSlots, userTotalCount - userSkip)
        
        if (userLimit > 0) {
          userDonors = await User.find(userQuery)
            .sort({ createdAt: -1 })
            .skip(userSkip)
            .limit(userLimit)
            .lean() as any[]
        }
      }
    }

    // ============ COMBINE AND TRANSFORM ============
    
    // Combine both lists (donors first, then users)
    let allDonors = [...donorDocs, ...userDonors]

    // Transform donors for frontend
    const transformedDonors = allDonors.map((donor: any) => {
      const isUser = donor && typeof donor.role === 'string' && donor.role === 'donor'

      let donorStatus = 'pending'

      if (isUser) {
        donorStatus = donor.isApproved ? 'active' : 'pending'
      } else {
        donorStatus = donor.status || 'pending'
      }

      const isWalkIn = donor.isWalkIn === true || donor.registrationType === 'walk-in'
      const regType = isWalkIn ? 'walk-in' : donor.registrationType || 'system'

      if (isWalkIn) {
        donorStatus = 'active'
      }

      return {
        id: donor._id.toString(),
        _id: donor._id.toString(),
        userId: isUser ? donor._id.toString() : donor.userId?.toString() || '',
        fullName: donor.fullName || 'Unknown',
        email: donor.email || '',
        phone: donor.phone || '',
        bloodType: donor.bloodType || 'Unknown',
        status: donorStatus,
        registrationType: regType,
        isWalkIn,
        location: donor.address || donor.barangay || '',
        lastDonation: donor.lastDonationDate
          ? new Date(donor.lastDonationDate).toISOString().split('T')[0]
          : 'No donations yet',
        totalDonations: donor.donationCount || donor.totalDonations || 0,
        registered: donor.createdAt
          ? new Date(donor.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        nextEligible: donor.nextEligibleDate
          ? new Date(donor.nextEligibleDate).toISOString().split('T')[0]
          : 'Not yet eligible',
        digitalId: donor.digitalId || '',
        address: donor.address || '',
        barangay: donor.barangay || '',
        municipality: donor.municipality || '',
        province: donor.province || '',
        dateOfBirth: donor.dateOfBirth
          ? new Date(donor.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: donor.gender || '',
        weight: donor.weight || 0,
        emergencyContact: donor.emergencyContact || '',
        medicalConditions: donor.medicalConditions || '',
        currentMedications: donor.currentMedications || '',
        approvedBy: donor.approvedBy || '',
        approvedAt: donor.approvedAt || null,
        rejectionReason: donor.rejectionReason || '',
        isEligible: donor.isEligible || donor.isApproved || false,
        points: (donor.donationCount || donor.totalDonations || 0) * 10,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
        isFromUserCollection: isUser,
        emergencyName: donor.emergencyName || '',
        emergencyRelationship: donor.emergencyRelationship || '',
      }
    })

    // Calculate total pages based on combined total
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      donors: transformedDonors,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('Error fetching donors:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch donors',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const {
      userId,
      fullName,
      email,
      phone,
      bloodType,
      address,
      dateOfBirth,
      gender,
      weight,
      registrationType,
      isWalkIn,
    } = body

    if (!fullName || !email || !bloodType) {
      return NextResponse.json(
        { error: 'Full name, email, and blood type are required' },
        { status: 400 }
      )
    }

    const existingDonor = await Donor.findOne({ email })

    if (existingDonor) {
      return NextResponse.json(
        { error: 'Donor with this email already exists' },
        { status: 400 }
      )
    }

    const isWalkInDonor = registrationType === 'walk-in' || isWalkIn === true

    const digitalId = isWalkInDonor
      ? `WALKIN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      : ''

    const donorData: any = {
      userId: userId || null,
      fullName,
      email,
      phone: phone || '',
      bloodType,
      address: address || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || '',
      weight: weight || 0,
      status: isWalkInDonor ? 'active' : 'pending',
      registrationType: isWalkInDonor ? 'walk-in' : registrationType || 'system',
      isWalkIn: isWalkInDonor,
      isEligible: isWalkInDonor ? true : false,
      totalDonations: 0,
      barangay: '',
      municipality: '',
      province: '',
      emergencyContact: '',
      medicalConditions: '',
      currentMedications: '',
      digitalId,
    }

    if (isWalkInDonor) {
      donorData.approvedAt = new Date()
    }

    const donor = new Donor(donorData)
    await donor.save()

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      await User.findByIdAndUpdate(userId, {
        isApproved: isWalkInDonor ? true : false,
        isVerified: true,
      })
    }

    const donorObj = donor.toObject ? donor.toObject() : donor

    return NextResponse.json(
      {
        success: true,
        message: isWalkInDonor
          ? 'Walk-in donor created successfully and activated!'
          : 'Donor created successfully',
        donor: {
          id: donorObj._id.toString(),
          fullName: donorObj.fullName,
          email: donorObj.email,
          status: donorObj.status,
          registrationType: donorObj.registrationType || 'system',
          digitalId: donorObj.digitalId || '',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating donor:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to create donor',
      },
      { status: 500 }
    )
  }
}