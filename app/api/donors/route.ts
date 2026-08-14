// app/api/donors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const bloodType = searchParams.get('bloodType') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {}

    if (status !== 'all') {
      filter.status = status
    }

    if (bloodType !== 'all') {
      filter.bloodType = bloodType
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { digitalId: { $regex: search, $options: 'i' } },
        { barangay: { $regex: search, $options: 'i' } },
        { municipality: { $regex: search, $options: 'i' } },
        { province: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ]
    }

    // Get total count for pagination
    const total = await Donor.countDocuments(filter)

    // Get donors with pagination and sorting
    const donors = await Donor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Transform donors to match the frontend format
    const transformedDonors = donors.map((donor: any) => ({
      id: donor._id.toString(),
      name: donor.fullName,
      email: donor.email,
      phone: donor.phone,
      bloodType: donor.bloodType,
      location: donor.location || donor.address || '',
      status: donor.status || 'pending',
      lastDonation: donor.lastDonationDate 
        ? new Date(donor.lastDonationDate).toISOString().split('T')[0] 
        : 'No donations yet',
      totalDonations: donor.totalDonations || 0,
      registered: donor.createdAt 
        ? new Date(donor.createdAt).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      nextEligible: donor.nextEligibleDate 
        ? new Date(donor.nextEligibleDate).toISOString().split('T')[0] 
        : 'Not yet eligible',
      emergencyContact: donor.emergencyContact || '',
      digitalId: donor.digitalId || `RP-${String(donors.indexOf(donor) + 1).padStart(3, '0')}`,
      // Additional data for details view
      firstName: donor.fullName.split(' ')[0] || '',
      middleName: donor.middleName || '',
      lastName: donor.fullName.split(' ').slice(1).join(' ') || '',
      gender: donor.gender,
      dateOfBirth: donor.dateOfBirth ? new Date(donor.dateOfBirth).toISOString().split('T')[0] : '',
      age: donor.dateOfBirth 
        ? new Date().getFullYear() - new Date(donor.dateOfBirth).getFullYear() 
        : 0,
      address: donor.address || '',
      barangay: donor.barangay || '',
      municipality: donor.municipality || '',
      province: donor.province || '',
      weight: donor.weight,
      bloodPressure: donor.bloodPressure || '',
      temperature: donor.temperature || 0,
      pulseRate: donor.pulseRate || 0,
      hemoglobin: donor.hemoglobin || 0,
      medicalConditions: donor.medicalConditions || '',
      currentMedications: donor.currentMedications || '',
      emergencyName: donor.emergencyName || '',
      emergencyRelationship: donor.emergencyRelationship || '',
      isEligible: donor.isEligible,
    }))

    return NextResponse.json({
      donors: transformedDonors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching donors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()

    // Generate digital ID
    const donorCount = await Donor.countDocuments()
    const year = new Date().getFullYear()
    const digitalId = `RP-${year}-${String(donorCount + 1).padStart(3, '0')}`

    // Calculate age if not provided
    let age = body.age
    if (!age && body.dateOfBirth) {
      const birthDate = new Date(body.dateOfBirth)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    // Build full name
    const fullName = `${body.firstName} ${body.middleName ? body.middleName + ' ' : ''}${body.lastName}`

    // Create donor data
    const donorData = {
      fullName,
      email: body.email,
      phone: body.mobileNumber,
      bloodType: body.bloodType,
      address: body.address || `${body.barangay}, ${body.municipality}, ${body.province}`,
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender,
      weight: parseFloat(body.weight),
      lastDonationDate: body.lastDonationDate ? new Date(body.lastDonationDate) : null,
      isEligible: body.donorStatus?.toLowerCase() === 'active',
      totalDonations: 0,
      // Additional fields
      barangay: body.barangay,
      municipality: body.municipality,
      province: body.province,
      digitalId,
      emergencyContact: body.emergencyContact,
      status: body.donorStatus?.toLowerCase() || 'pending',
      nextEligibleDate: body.nextEligibleDate ? new Date(body.nextEligibleDate) : null,
      medicalConditions: body.medicalConditions || '',
      currentMedications: body.currentMedications || '',
      bloodPressure: body.bloodPressure || '',
      temperature: body.temperature ? parseFloat(body.temperature) : undefined,
      pulseRate: body.pulseRate ? parseInt(body.pulseRate) : undefined,
      hemoglobin: body.hemoglobin ? parseFloat(body.hemoglobin) : undefined,
      emergencyName: body.emergencyName || '',
      emergencyRelationship: body.emergencyRelationship || '',
      middleName: body.middleName || '',
    }

    // Check if donor with email already exists
    const existingDonor = await Donor.findOne({ email: body.email })
    if (existingDonor) {
      return NextResponse.json(
        { error: 'A donor with this email already exists' },
        { status: 400 }
      )
    }

    const donor = await Donor.create(donorData)

    // Transform response
    const transformedDonor = {
      id: donor._id.toString(),
      name: donor.fullName,
      email: donor.email,
      phone: donor.phone,
      bloodType: donor.bloodType,
      location: (donor as any).location || donor.address || '',
      status: donor.status || 'pending',
      lastDonation: donor.lastDonationDate 
        ? new Date(donor.lastDonationDate).toISOString().split('T')[0] 
        : 'No donations yet',
      totalDonations: donor.totalDonations || 0,
      registered: donor.createdAt 
        ? new Date(donor.createdAt).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      nextEligible: donor.nextEligibleDate 
        ? new Date(donor.nextEligibleDate).toISOString().split('T')[0] 
        : 'Not yet eligible',
      emergencyContact: donor.emergencyContact || '',
      digitalId: donor.digitalId || '',
    }

    return NextResponse.json(transformedDonor, { status: 201 })
  } catch (error: any) {
    console.error('Error creating donor:', error)
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json(
        { error: `A donor with this ${field} already exists` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create donor' },
      { status: 500 }
    )
  }
}