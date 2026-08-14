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



    // Get query parameters

    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get('search') || ''

    const status = searchParams.get('status') || 'all'

    const bloodType = searchParams.get('bloodType') || ''

    const page = parseInt(searchParams.get('page') || '1')

    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit



    // ✅ Get donors from both collections

    // First, get donor profiles

    const donorQuery: any = {}

    if (status !== 'all' && status) {

      const statusMap: Record<string, string> = {

        'active': 'active',

        'approved': 'active',

        'pending': 'pending',

        'inactive': 'inactive',

        'rejected': 'inactive'

      }

      donorQuery.status = statusMap[status] || status

    }

    if (bloodType && bloodType !== 'all') {

      donorQuery.bloodType = bloodType

    }

    if (search) {

      donorQuery.$or = [

        { fullName: { $regex: search, $options: 'i' } },

        { email: { $regex: search, $options: 'i' } },

        { phone: { $regex: search, $options: 'i' } },

        { digitalId: { $regex: search, $options: 'i' } },

      ]

    }



    // Get donors from donor collection

    const donorDocs = await Donor.find(donorQuery)

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit)

      .lean()



    // Get IDs of donors to exclude from user query

    const donorUserIds = donorDocs

      .map(d => d.userId?.toString())

      .filter(id => id)



    // ✅ Also get users with role donor that don't have donor profiles

    const userQuery: any = { role: 'donor' }

    if (search) {

      userQuery.$or = [

        { fullName: { $regex: search, $options: 'i' } },

        { email: { $regex: search, $options: 'i' } },

        { phone: { $regex: search, $options: 'i' } },

      ]

    }



    // Exclude users that already have donor profiles

    if (donorUserIds.length > 0) {

      userQuery._id = { $nin: donorUserIds }

    }



    const userDonors = await User.find(userQuery)

      .sort({ createdAt: -1 })

      .lean()



    // Combine both results

    const allDonors = [...donorDocs, ...userDonors]

    const total = await Donor.countDocuments(donorQuery) + await User.countDocuments(userQuery)



    // Transform combined donors

    const transformedDonors = allDonors.map((donor: any) => {

      // Check if this is a User document or Donor document

      const isUserDoc = donor.role === 'donor'

      

      return {

        id: donor._id.toString(),

        userId: isUserDoc ? donor._id.toString() : donor.userId?.toString() || '',

        fullName: donor.fullName || 'Unknown',

        email: donor.email || '',

        phone: donor.phone || '',

        bloodType: donor.bloodType || 'Unknown',

        status: donor.status || (donor.isApproved ? 'active' : 'pending'),

        location: donor.address || '',

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

        dateOfBirth: donor.dateOfBirth ? new Date(donor.dateOfBirth).toISOString().split('T')[0] : '',

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

        // Add a flag to identify if this is from User collection

        isFromUserCollection: isUserDoc

      }

    })



    return NextResponse.json({

      success: true,

      donors: transformedDonors,

      pagination: {

        total,

        page,

        limit,

        totalPages: Math.ceil(total / limit),

      }

    })



  } catch (error: any) {

    console.error('Error fetching donors:', error)

    return NextResponse.json(

      { error: error.message || 'Failed to fetch donors' },

      { status: 500 }

    )

  }

}



// POST endpoint to create a new donor

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



    const body = await request.json()

    const { userId, fullName, email, phone, bloodType, address, dateOfBirth, gender, weight } = body



    // Validate required fields

    if (!fullName || !email || !bloodType) {

      return NextResponse.json(

        { error: 'Full name, email, and blood type are required' },

        { status: 400 }

      )

    }



    // Check if donor already exists

    const existingDonor = await Donor.findOne({ email })

    if (existingDonor) {

      return NextResponse.json(

        { error: 'Donor with this email already exists' },

        { status: 400 }

      )

    }



    // Create donor

    const donor = new Donor({

      userId: userId || null,

      fullName,

      email,

      phone: phone || '',

      bloodType,

      address: address || '',

      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,

      gender: gender || '',

      weight: weight || 0,

      status: 'pending',

      isEligible: false,

      totalDonations: 0,

      barangay: '',

      municipality: '',

      province: '',

      emergencyContact: '',

      medicalConditions: '',

      currentMedications: '',

    })



    await donor.save()



    // Update user if userId provided

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {

      await User.findByIdAndUpdate(userId, {

        isApproved: false,

        isVerified: true

      })

    }



    return NextResponse.json({

      success: true,

      message: 'Donor created successfully',

      donor: {

        id: donor._id.toString(),

        fullName: donor.fullName,

        email: donor.email,

        status: donor.status

      }

    }, { status: 201 })



  } catch (error: any) {

    console.error('Error creating donor:', error)

    return NextResponse.json(

      { error: error.message || 'Failed to create donor' },

      { status: 500 }

    )

  }

}