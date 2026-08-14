// app/api/admin/donors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params for Next.js 15+
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    // Try to find by donor _id first
    let donor = await Donor.findById(id).lean()
    
    // If not found, try to find by userId
    if (!donor) {
      donor = await Donor.findOne({ userId: id }).lean()
    }

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Fetch user data separately if userId exists
    let userData = null
    if (donor.userId) {
      userData = await User.findById(donor.userId)
        .select('fullName email phone isVerified isApproved')
        .lean()
    }

    const transformedDonor = {
      id: donor._id.toString(),
      userId: donor.userId?.toString() || '',
      fullName: donor.fullName,
      email: donor.email,
      phone: donor.phone,
      bloodType: donor.bloodType,
      address: donor.address,
      dateOfBirth: donor.dateOfBirth,
      gender: donor.gender,
      weight: donor.weight,
      barangay: donor.barangay || '',
      municipality: donor.municipality || '',
      province: donor.province || '',
      digitalId: donor.digitalId || '',
      emergencyContact: donor.emergencyContact || '',
      status: donor.status || 'pending',
      isEligible: donor.isEligible,
      totalDonations: donor.totalDonations || 0,
      lastDonationDate: donor.lastDonationDate,
      nextEligibleDate: donor.nextEligibleDate,
      medicalConditions: donor.medicalConditions || '',
      currentMedications: donor.currentMedications || '',
      bloodPressure: donor.bloodPressure || '',
      temperature: donor.temperature,
      pulseRate: donor.pulseRate,
      hemoglobin: donor.hemoglobin,
      emergencyName: donor.emergencyName || '',
      emergencyRelationship: donor.emergencyRelationship || '',
      middleName: donor.middleName || '',
      approvedBy: donor.approvedBy || '',
      approvedAt: donor.approvedAt || null,
      rejectionReason: donor.rejectionReason || '',
      userVerified: userData?.isVerified || false,
      userApproved: userData?.isApproved || false,
      userEmail: userData?.email || '',
      userName: userData?.fullName || '',
      userPhone: userData?.phone || '',
      createdAt: donor.createdAt,
      updatedAt: donor.updatedAt
    }

    return NextResponse.json({
      success: true,
      donor: transformedDonor
    })

  } catch (error: any) {
    console.error('Error fetching donor:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch donor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params for Next.js 15+
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      bloodType,
      address,
      dateOfBirth,
      gender,
      weight,
      barangay,
      municipality,
      province,
      emergencyContact,
      medicalConditions,
      currentMedications,
      bloodPressure,
      temperature,
      pulseRate,
      hemoglobin,
      emergencyName,
      emergencyRelationship,
      middleName,
    } = body

    // Try to find by donor _id first, then by userId
    let donor = await Donor.findById(id)
    if (!donor) {
      donor = await Donor.findOne({ userId: id })
    }

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Update donor fields
    if (fullName) donor.fullName = fullName
    if (email) donor.email = email
    if (phone) donor.phone = phone
    if (bloodType) donor.bloodType = bloodType
    if (address) donor.address = address
    if (dateOfBirth) donor.dateOfBirth = new Date(dateOfBirth)
    if (gender) donor.gender = gender
    if (weight) donor.weight = weight
    if (barangay !== undefined) donor.barangay = barangay
    if (municipality !== undefined) donor.municipality = municipality
    if (province !== undefined) donor.province = province
    if (emergencyContact !== undefined) donor.emergencyContact = emergencyContact
    if (medicalConditions !== undefined) donor.medicalConditions = medicalConditions
    if (currentMedications !== undefined) donor.currentMedications = currentMedications
    if (bloodPressure !== undefined) donor.bloodPressure = bloodPressure
    if (temperature !== undefined) donor.temperature = temperature
    if (pulseRate !== undefined) donor.pulseRate = pulseRate
    if (hemoglobin !== undefined) donor.hemoglobin = hemoglobin
    if (emergencyName !== undefined) donor.emergencyName = emergencyName
    if (emergencyRelationship !== undefined) donor.emergencyRelationship = emergencyRelationship
    if (middleName !== undefined) donor.middleName = middleName

    await donor.save()

    // Update User model if needed
    if (donor.userId) {
      const updateData: any = {}
      if (fullName) updateData.fullName = fullName
      if (email) updateData.email = email
      if (phone) updateData.phone = phone
      
      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(donor.userId, updateData)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Donor updated successfully',
      donor: {
        id: donor._id.toString(),
        fullName: donor.fullName,
        email: donor.email,
        status: donor.status,
        updatedAt: donor.updatedAt
      }
    })

  } catch (error: any) {
    console.error('Error updating donor:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update donor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params for Next.js 15+
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    // Try to find by donor _id first, then by userId
    let donor = await Donor.findById(id)
    if (!donor) {
      donor = await Donor.findOne({ userId: id })
    }

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Store donor info before deletion
    const donorName = donor.fullName
    const donorUserId = donor.userId

    // Delete the donor
    await Donor.findByIdAndDelete(donor._id)

    // Also delete the associated user if needed
    if (donorUserId) {
      await User.findByIdAndDelete(donorUserId)
    }

    console.log(`🗑️ Donor ${donorName} deleted by admin ${decoded.userId}`)

    return NextResponse.json({
      success: true,
      message: 'Donor deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting donor:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete donor' },
      { status: 500 }
    )
  }
}