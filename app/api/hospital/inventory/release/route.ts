// app/api/hospital/inventory/release/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import BloodInventory from '@/models/BloodInventory'
import BloodBag from '@/models/BloodBag'
import BloodRelease from '@/models/BloodRelease'
import InventoryLog from '@/models/InventoryLog'
import User from '@/models/User'
import Hospital from '@/models/Hospital'
import { cacheInvalidate } from '@/lib/cache'
import {
  getAuthenticatedHospitalUser,
  getUserIdFromAuth,
  isAuthFailure,
} from '@/lib/hospitalAuth'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) return auth.response

    const decoded = auth.user
    const userId = getUserIdFromAuth(decoded)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid hospital ID in token' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user || user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized - Hospital access required' }, { status: 403 })
    }

    let hospital = await Hospital.findOne({ userId })
    if (!hospital) {
      hospital = await Hospital.create({
        userId,
        hospitalName: user.hospitalName || user.fullName || 'Hospital',
        hospitalAddress: '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        status: 'active',
      })
    }

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
      donorBloodType,
    } = body

    if (
      !bloodType ||
      !units ||
      units < 1 ||
      !patientName ||
      !hospitalWard ||
      !doctorName ||
      !reason ||
      !releaseDate
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const inventoryItem = await BloodInventory.findOne({
      hospitalId: userObjectId,
      bloodType,
    })

    if (!inventoryItem) {
      return NextResponse.json({ error: `No inventory found for blood type ${bloodType}` }, { status: 404 })
    }

    if (new Date(inventoryItem.expirationDate) < new Date()) {
      return NextResponse.json(
        { error: `Inventory for ${bloodType} has expired. Dispose and restock before releasing.` },
        { status: 400 }
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

      // Mark N oldest available bags as used
      const bagsToMark = await BloodBag.find({
        hospitalId: userObjectId,
        bloodType,
        status: 'available',
        expirationDate: { $gt: new Date() },
      })
        .sort({ expirationDate: 1 })
        .limit(units)
        .session(session)

      if (bagsToMark.length < units) {
        await session.abortTransaction()
        return NextResponse.json(
          {
            error: `Only ${bagsToMark.length} non-expired bag(s) available for ${bloodType}, but ${units} requested.`,
          },
          { status: 400 }
        )
      }

      for (const bag of bagsToMark) {
        bag.status = 'used'
        await bag.save({ session })
      }

      const releaseRecord = await BloodRelease.create(
        [
          {
            hospitalId: userObjectId,
            inventoryId: inventoryItem._id,
            bloodType,
            units,
            patientName,
            patientAge: patientAge || undefined,
            patientGender: patientGender || '',
            hospitalWard,
            doctorName,
            reason,
            releaseDate: new Date(releaseDate),
            notes: notes || '',
            status: 'released',
            receiptNumber,
            requestId: requestId || '',
            donorName: donorName || '',
            donorEmail: donorEmail || '',
            donorPhone: donorPhone || '',
            donorBloodType: donorBloodType || '',
            releasedBy: decoded.email || 'Hospital Staff',
          },
        ],
        { session }
      )

      const before = inventoryItem.units
      inventoryItem.units = inventoryItem.units - units
      await inventoryItem.save({ session })

      await InventoryLog.create(
        [
          {
            hospitalId: userObjectId,
            bloodType,
            type: 'release',
            source: 'release',
            units: -units,
            balanceBefore: before,
            balanceAfter: inventoryItem.units,
            actorName: decoded.email || 'Hospital Staff',
            actorId: userObjectId,
            patientName,
            doctorName,
            hospitalWard,
            reason,
            notes: notes || '',
            receiptNumber,
            metadata: { releaseId: releaseRecord[0]._id.toString(), requestId: requestId || '' },
          },
        ],
        { session }
      )

      await session.commitTransaction()

      cacheInvalidate('inventory:')
      cacheInvalidate('bags:')
      cacheInvalidate('expired:')
      cacheInvalidate('history:')

      return NextResponse.json(
        {
          success: true,
          message: `Released ${units} unit(s) of ${bloodType} for ${patientName}`,
          data: {
            releaseId: releaseRecord[0]._id.toString(),
            receiptNumber,
            bloodType,
            units,
            patientName,
            patientAge,
            patientGender,
            hospitalWard,
            doctorName,
            reason,
            releaseDate: releaseRecord[0].releaseDate,
            remainingUnits: inventoryItem.units,
            status: inventoryItem.status,
            notes,
            requestId,
            donorName,
            donorEmail,
            donorPhone,
            donorBloodType,
            hospitalName: hospital.hospitalName,
            hospitalAddress: hospital.hospitalAddress || '',
            releasedBy: decoded.email || 'Hospital Staff',
          },
        },
        { status: 201 }
      )
    } catch (error) {
      await session.abortTransaction()
      console.error('Transaction error:', error)
      throw error
    } finally {
      session.endSession()
    }
  } catch (error: any) {
    console.error('Error releasing blood:', error)
    return NextResponse.json({ error: error.message || 'Failed to release blood' }, { status: 500 })
  }
}