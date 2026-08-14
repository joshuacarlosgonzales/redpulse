// app/api/donors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import mongoose from 'mongoose'

// FIX: Wrap params in Promise for Next.js 15+
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    // Await the params
    const { id } = await params

    console.log('GET Donor - ID received:', id)

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId:', id)
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    const donor = await Donor.findById(id).lean()

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

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
      donationHistory: (donor as any).donationHistory || [],
    }

    return NextResponse.json(transformedDonor)
  } catch (error) {
    console.error('Error fetching donor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donor' },
      { status: 500 }
    )
  }
}

// FIX: Wrap params in Promise for Next.js 15+
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    // Await the params
    const { id } = await params

    console.log('🔵 PUT Donor - Raw ID received:', id)
    console.log('🔵 PUT Donor - ID type:', typeof id)

    // Validate that ID exists
    if (!id) {
      console.error('❌ No ID provided')
      return NextResponse.json(
        { error: 'Donor ID is required' },
        { status: 400 }
      )
    }

    // Clean the ID
    const cleanId = id.toString().trim()
    console.log('🔵 PUT Donor - Clean ID:', cleanId)

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      console.error('❌ Invalid ObjectId format:', cleanId)
      return NextResponse.json(
        { error: `Invalid donor ID format: "${cleanId}"` },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('🔵 PUT Donor - Request body:', body)

    // Find existing donor
    const existingDonor = await Donor.findById(cleanId)
    if (!existingDonor) {
      console.error('❌ Donor not found with ID:', cleanId)
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    console.log('✅ Donor found:', existingDonor._id)

    // Check if email is being changed and if it's already taken
    if (body.email && body.email !== existingDonor.email) {
      const emailExists = await Donor.findOne({ 
        email: body.email, 
        _id: { $ne: cleanId } 
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already taken by another donor' },
          { status: 400 }
        )
      }
    }

    // Build full name
    const firstName = body.firstName || existingDonor.fullName.split(' ')[0] || ''
    const middleName = body.middleName || existingDonor.middleName || ''
    const lastName = body.lastName || existingDonor.fullName.split(' ').slice(1).join(' ') || ''
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim()

    // Build update data
    const updateData: any = {
      fullName: fullName || existingDonor.fullName,
      email: body.email || existingDonor.email,
      phone: body.mobileNumber || body.phone || existingDonor.phone,
      bloodType: body.bloodType || existingDonor.bloodType,
      address: body.address || existingDonor.address || '',
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : existingDonor.dateOfBirth,
      gender: body.gender || existingDonor.gender,
      weight: body.weight ? parseFloat(body.weight) : existingDonor.weight,
      barangay: body.barangay || existingDonor.barangay || '',
      municipality: body.municipality || existingDonor.municipality || '',
      province: body.province || existingDonor.province || '',
      emergencyContact: body.emergencyContact || existingDonor.emergencyContact || '',
      status: body.status || body.donorStatus ? (body.status || body.donorStatus).toLowerCase() : existingDonor.status || 'pending',
      medicalConditions: body.medicalConditions !== undefined ? body.medicalConditions : existingDonor.medicalConditions || '',
      currentMedications: body.currentMedications !== undefined ? body.currentMedications : existingDonor.currentMedications || '',
      bloodPressure: body.bloodPressure || existingDonor.bloodPressure || '',
      emergencyName: body.emergencyName || existingDonor.emergencyName || '',
      emergencyRelationship: body.emergencyRelationship || existingDonor.emergencyRelationship || '',
      middleName: body.middleName || existingDonor.middleName || '',
      isEligible: body.status ? body.status.toLowerCase() === 'active' : existingDonor.isEligible || true,
    }

    // Handle location from barangay/municipality/province if provided
    if (body.barangay || body.municipality || body.province) {
      const barangay = body.barangay || existingDonor.barangay || ''
      const municipality = body.municipality || existingDonor.municipality || ''
      const province = body.province || existingDonor.province || ''
      updateData.address = `${barangay}, ${municipality}, ${province}`.trim()
    }

    // Handle optional date fields
    if (body.lastDonation) {
      updateData.lastDonationDate = new Date(body.lastDonation)
    } else if (body.lastDonationDate !== undefined) {
      updateData.lastDonationDate = body.lastDonationDate ? new Date(body.lastDonationDate) : null
    }

    if (body.nextEligible) {
      updateData.nextEligibleDate = new Date(body.nextEligible)
    } else if (body.nextEligibleDate !== undefined) {
      updateData.nextEligibleDate = body.nextEligibleDate ? new Date(body.nextEligibleDate) : null
    }

    // Handle numeric fields
    if (body.temperature !== undefined && body.temperature !== '') {
      updateData.temperature = parseFloat(body.temperature)
    }
    if (body.pulseRate !== undefined && body.pulseRate !== '') {
      updateData.pulseRate = parseInt(body.pulseRate)
    }
    if (body.hemoglobin !== undefined && body.hemoglobin !== '') {
      updateData.hemoglobin = parseFloat(body.hemoglobin)
    }
    
    // IMPORTANT: Only update totalDonations if explicitly provided
    // This prevents resetting to 0 when editing other fields
    if (body.totalDonations !== undefined && body.totalDonations !== null) {
      updateData.totalDonations = parseInt(body.totalDonations) || 0
    }

    // ============================================
    // HANDLE ADDING A NEW DONATION
    // ============================================
    if (body.addDonation) {
      console.log('🔵 Adding donation:', body.addDonation)
      
      const donation = {
        date: new Date(body.addDonation.date),
        amount: body.addDonation.amount || '450ml',
        location: body.addDonation.location || 'Red Pulse Blood Bank',
        notes: body.addDonation.notes || '',
        status: body.addDonation.status || 'completed'
      }

      // Use $push to add to donation history array
      updateData.$push = { donationHistory: donation }
      
      // Update donation stats
      updateData.totalDonations = (existingDonor.totalDonations || 0) + 1
      updateData.lastDonationDate = new Date(body.addDonation.date)
      
      // Calculate next eligible date (3 months from last donation)
      const nextDate = new Date(body.addDonation.date)
      nextDate.setMonth(nextDate.getMonth() + 3)
      updateData.nextEligibleDate = nextDate
      
      // Update eligibility
      const now = new Date()
      updateData.isEligible = now >= nextDate
      
      console.log('🔵 Donation stats updated:', {
        totalDonations: updateData.totalDonations,
        lastDonationDate: updateData.lastDonationDate,
        nextEligibleDate: updateData.nextEligibleDate,
        isEligible: updateData.isEligible
      })
    }

    console.log('🔵 PUT Donor - Update data:', JSON.stringify(updateData, null, 2))

    // Perform the update
    const donor = await Donor.findByIdAndUpdate(
      cleanId,
      updateData,
      { new: true, runValidators: true }
    ).lean()

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Transform response with all fields
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
      barangay: donor.barangay || '',
      municipality: donor.municipality || '',
      province: donor.province || '',
      dateOfBirth: donor.dateOfBirth ? new Date(donor.dateOfBirth).toISOString().split('T')[0] : '',
      gender: donor.gender || '',
      address: donor.address || '',
      weight: donor.weight || 0,
      bloodPressure: donor.bloodPressure || '',
      temperature: donor.temperature || 0,
      pulseRate: donor.pulseRate || 0,
      hemoglobin: donor.hemoglobin || 0,
      medicalConditions: donor.medicalConditions || '',
      currentMedications: donor.currentMedications || '',
      emergencyName: donor.emergencyName || '',
      emergencyRelationship: donor.emergencyRelationship || '',
      donationHistory: (donor as any).donationHistory || [],
    }

    console.log('✅ Donor updated successfully:', {
      id: transformedDonor.id,
      name: transformedDonor.name,
      totalDonations: transformedDonor.totalDonations,
      donationCount: (donor as any).donationHistory?.length || 0
    })
    
    return NextResponse.json(transformedDonor)
  } catch (error: any) {
    console.error('❌ Error updating donor:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update donor' },
      { status: 500 }
    )
  }
}

// FIX: Wrap params in Promise for Next.js 15+
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    // Await the params
    const { id } = await params

    console.log('DELETE Donor - ID received:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'Donor ID is required' },
        { status: 400 }
      )
    }

    const cleanId = id.toString().trim()

    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      console.log('Invalid ObjectId:', cleanId)
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    const donor = await Donor.findByIdAndDelete(cleanId)

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Donor deleted successfully',
      id: donor._id.toString(),
    })
  } catch (error) {
    console.error('Error deleting donor:', error)
    return NextResponse.json(
      { error: 'Failed to delete donor' },
      { status: 500 }
    )
  }
}