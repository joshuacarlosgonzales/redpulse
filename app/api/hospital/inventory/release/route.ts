// app/api/hospital/inventory/release/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import BloodInventory from '@/models/BloodInventory'
import BloodRelease from '@/models/BloodRelease'
import User from '@/models/User'
import Hospital from '@/models/Hospital'
import { 
  getAuthenticatedHospitalUser, 
  getUserIdFromAuth,
  isAuthFailure 
} from '@/lib/hospitalAuth'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user
    const userId = getUserIdFromAuth(decoded)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid hospital ID in token' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    if (!user || user.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    let hospital = await Hospital.findOne({ userId })
    if (!hospital) {
      const hospitalName = user.hospitalName || user.fullName || 'Hospital'
      hospital = await Hospital.create({
        userId,
        hospitalName,
        hospitalAddress: '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        status: 'active',
      })
    }

    // ✅ FIXED: Use userObjectId for BloodInventory (references User._id)
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const body = await request.json()
    const {
      bloodType,
      units,
      patientName,
      patientAge,
      patientGender,
      hospitalWard,
      doctorName,
      reason,
      releaseDate,
      notes,
      requestId,
      donorName,
      donorEmail,
      donorPhone,
      donorBloodType
    } = body

    // Validate required fields
    if (!bloodType || !units || units < 1 || !patientName || !hospitalWard || !doctorName || !reason || !releaseDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const inventoryItem = await BloodInventory.findOne({
      hospitalId: userObjectId,
      bloodType: bloodType
    })

    if (!inventoryItem) {
      return NextResponse.json(
        { error: `No inventory found for blood type ${bloodType}` },
        { status: 404 }
      )
    }

    if (inventoryItem.units < units) {
      return NextResponse.json(
        { error: `Insufficient units. Available: ${inventoryItem.units}, Requested: ${units}` },
        { status: 400 }
      )
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const timestamp = Date.now().toString().slice(-8)
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const receiptNumber = `RCP-${timestamp}${random}`

      const releaseData = {
        hospitalId: userObjectId,
        inventoryId: inventoryItem._id,
        bloodType: bloodType,
        units: units,
        patientName: patientName,
        patientAge: patientAge || undefined,
        patientGender: patientGender || '',
        hospitalWard: hospitalWard,
        doctorName: doctorName,
        reason: reason,
        releaseDate: new Date(releaseDate),
        notes: notes || '',
        status: 'released',
        receiptNumber: receiptNumber,
        requestId: requestId || '',
        donorName: donorName || '',
        donorEmail: donorEmail || '',
        donorPhone: donorPhone || '',
        donorBloodType: donorBloodType || '',
        releasedBy: decoded.email || 'Hospital Staff',
      }

      const releaseRecord = await BloodRelease.create([releaseData], { session })

      inventoryItem.units = inventoryItem.units - units
      
      if (inventoryItem.units === 0) {
        inventoryItem.status = 'out of stock'
      } else if (inventoryItem.units <= 5) {
        inventoryItem.status = 'critical'
      } else if (inventoryItem.units <= inventoryItem.minRequired) {
        inventoryItem.status = 'low'
      } else {
        inventoryItem.status = 'sufficient'
      }

      const releaseNote = `📋 BLOOD RELEASE\n─────────────────────────────────────────────────\n  Donor       : ${donorName || 'N/A'}\n  Request ID  : ${requestId || 'N/A'}\n  Released    : ${new Date(releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n  Units       : ${units}\n  Blood Type  : ${bloodType}\n  Patient     : ${patientName}\n  Doctor      : ${doctorName}\n  Ward        : ${hospitalWard}\n─────────────────────────────────────────────────`
      
      inventoryItem.notes = inventoryItem.notes 
        ? `${inventoryItem.notes}\n\n${releaseNote}`
        : releaseNote

      await inventoryItem.save({ session })
      await session.commitTransaction()

      return NextResponse.json({
        success: true,
        message: `Released ${units} unit(s) of ${bloodType} for ${patientName}`,
        data: {
          releaseId: releaseRecord[0]._id.toString(),
          receiptNumber: receiptNumber,
          bloodType: bloodType,
          units: units,
          patientName: patientName,
          patientAge: patientAge,
          patientGender: patientGender,
          hospitalWard: hospitalWard,
          doctorName: doctorName,
          reason: reason,
          releaseDate: releaseRecord[0].releaseDate,
          remainingUnits: inventoryItem.units,
          status: inventoryItem.status,
          notes: notes,
          requestId: requestId,
          donorName: donorName,
          donorEmail: donorEmail,
          donorPhone: donorPhone,
          donorBloodType: donorBloodType,
          hospitalName: hospital.hospitalName,
          hospitalAddress: hospital.hospitalAddress || '',
          releasedBy: decoded.email || 'Hospital Staff',
        }
      }, { status: 201 })

    } catch (error) {
      await session.abortTransaction()
      console.error('❌ Transaction error:', error)
      throw error
    } finally {
      session.endSession()
    }

  } catch (error: any) {
    console.error('❌ Error releasing blood:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to release blood' },
      { status: 500 }
    )
  }
}