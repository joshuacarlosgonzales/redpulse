// app/api/hospital/donations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import Donation from '@/models/Donation'
import BloodInventory from '@/models/BloodInventory'
import User from '@/models/User'

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
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const bloodType = searchParams.get('bloodType') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Use hospitalId from token
    const filter: any = { 
      hospitalId: new mongoose.Types.ObjectId(decoded.userId) 
    }
    
    if (status !== 'all') filter.status = status
    if (bloodType !== 'all') filter.bloodType = bloodType
    
    if (search) {
      filter.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { hospital: { $regex: search, $options: 'i' } },
        { bloodType: { $regex: search, $options: 'i' } }
      ]
    }

    console.log('🔍 Donation filter:', JSON.stringify(filter, null, 2))

    const total = await Donation.countDocuments(filter)
    const donations = await Donation.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const transformedDonations = donations.map((donation: any) => ({
      id: donation._id.toString(),
      donorId: donation.donorId?.toString() || '',
      donorName: donation.donorName || 'Unknown Donor',
      donorEmail: donation.donorEmail || '',
      donorPhone: donation.donorPhone || '',
      bloodType: donation.bloodType || '',
      units: donation.units || 0,
      donationDate: donation.date || donation.createdAt,
      notes: donation.notes || '',
      status: donation.status || 'Pending',
      hospital: donation.hospital || 'Hospital',
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: transformedDonations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching donations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch donations' },
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
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    console.log('📥 Received donation body:', JSON.stringify(body, null, 2))

    const {
      donorName,
      donorEmail,
      donorPhone,
      bloodType,
      units,
      donationDate,
      notes,
      status = 'Completed'
    } = body

    // Validation
    if (!donorName || !donorName.trim()) {
      return NextResponse.json(
        { error: 'Donor name is required' },
        { status: 400 }
      )
    }

    if (!bloodType) {
      return NextResponse.json(
        { error: 'Blood type is required' },
        { status: 400 }
      )
    }

    if (!units || units < 1) {
      return NextResponse.json(
        { error: 'Valid units are required' },
        { status: 400 }
      )
    }

    if (!donationDate) {
      return NextResponse.json(
        { error: 'Donation date is required' },
        { status: 400 }
      )
    }

    // Get hospital name
    const hospitalName = user.hospitalName || user.fullName || 'Hospital'

    // Parse donation date
    const donationDateObj = new Date(donationDate)
    
    // Calculate expiration date (42 days from donation date)
    const expirationDate = new Date(donationDateObj)
    expirationDate.setDate(expirationDate.getDate() + 42)

    // Create donation with hospitalId
    const donationData = {
      donorId: new mongoose.Types.ObjectId(decoded.userId),
      hospitalId: new mongoose.Types.ObjectId(decoded.userId), // CRITICAL: Add hospitalId
      donorName: donorName.trim(),
      donorEmail: donorEmail || '',
      donorPhone: donorPhone || '',
      bloodType: bloodType,
      units: units,
      date: donationDateObj,
      status: status,
      hospital: hospitalName,
      notes: notes || '',
    }

    const donation = await Donation.create(donationData)
    console.log(`✅ Donation created: ${donorName} donated ${units} units of ${bloodType}`)

    // UPDATE INVENTORY - Only if donation is completed
    let inventoryUpdated = false
    if (status === 'Completed') {
      try {
        // Find existing inventory
        let inventory = await BloodInventory.findOne({
          hospitalId: new mongoose.Types.ObjectId(decoded.userId),
          bloodType: bloodType
        })

        if (inventory) {
          // Update existing inventory
          inventory.units += units
          
          // Update expiration date if this donation has a later expiration
          if (expirationDate > inventory.expirationDate) {
            inventory.expirationDate = expirationDate
          }
          
          // Update notes with donation history
          const donationNote = `+${units} units from ${donorName} on ${donationDateObj.toLocaleDateString()}`
          inventory.notes = inventory.notes 
            ? `${inventory.notes} | ${donationNote}`
            : donationNote
          
          await inventory.save()
          inventoryUpdated = true
          console.log(`📦 Inventory updated: ${bloodType} now has ${inventory.units} units (${inventory.status})`)
        } else {
          // Create new inventory
          await BloodInventory.create({
            hospitalId: new mongoose.Types.ObjectId(decoded.userId),
            bloodType: bloodType,
            units: units,
            minRequired: 15,
            maxCapacity: 60,
            expirationDate: expirationDate,
            notes: `Initial stock from donation by ${donorName} on ${donationDateObj.toLocaleDateString()}`,
            batchNumber: `DONATION-${Date.now()}`
          })
          inventoryUpdated = true
          console.log(`📦 New inventory created for ${bloodType}: ${units} units, expires on ${expirationDate.toLocaleDateString()}`)
        }
      } catch (inventoryError) {
        console.error('❌ Error updating inventory:', inventoryError)
        // Don't fail the donation if inventory update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: donation._id.toString(),
        donorName: donation.donorName,
        bloodType: donation.bloodType,
        units: donation.units,
        status: donation.status,
        donationDate: donation.date,
        hospital: donation.hospital,
        expirationDate: status === 'Completed' ? expirationDate : null,
        inventoryUpdated: inventoryUpdated
      },
      message: status === 'Completed' && inventoryUpdated
        ? 'Donation recorded and inventory updated successfully! 🩸' 
        : status === 'Completed' && !inventoryUpdated
        ? 'Donation recorded but inventory update failed. Please sync manually.'
        : 'Donation recorded successfully!'
    })

  } catch (error: any) {
    console.error('❌ Error creating donation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create donation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const donationId = searchParams.get('id')

    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return NextResponse.json(
        { error: 'Invalid donation ID format' },
        { status: 400 }
      )
    }

    const donation = await Donation.findOne({
      _id: donationId,
      hospitalId: new mongoose.Types.ObjectId(decoded.userId)
    })

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Update inventory if donation was completed
    if (donation.status === 'Completed') {
      const inventory = await BloodInventory.findOne({
        hospitalId: new mongoose.Types.ObjectId(decoded.userId),
        bloodType: donation.bloodType
      })

      if (inventory) {
        inventory.units = Math.max(0, inventory.units - donation.units)
        await inventory.save()
        console.log(`📦 Inventory updated: ${donation.bloodType} now has ${inventory.units} units`)
      }
    }

    await Donation.findByIdAndDelete(donationId)

    return NextResponse.json({
      success: true,
      message: 'Donation deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error deleting donation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete donation' },
      { status: 500 }
    )
  }
}