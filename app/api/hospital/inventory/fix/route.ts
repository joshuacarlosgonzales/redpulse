// app/api/hospital/inventory/fix/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodInventory from '@/models/BloodInventory'
import Donation from '@/models/Donation'

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

    console.log(`🔄 Syncing inventory for hospital ID: ${decoded.userId}`)

    const hospitalId = new mongoose.Types.ObjectId(decoded.userId)

    // Get all completed donations for this hospital using hospitalId
    const donations = await Donation.find({
      hospitalId: hospitalId,
      status: 'Completed'
    }).sort({ date: 1 })

    console.log(`📊 Found ${donations.length} completed donations`)

    if (donations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed donations found to sync',
        data: { bloodTypesUpdated: 0 }
      })
    }

    // Group donations by blood type
    const bloodTypeMap = new Map()
    
    for (const donation of donations) {
      const existing = bloodTypeMap.get(donation.bloodType)
      if (existing) {
        existing.units += donation.units
        if (donation.date < existing.earliestDate) {
          existing.earliestDate = donation.date
        }
      } else {
        bloodTypeMap.set(donation.bloodType, {
          bloodType: donation.bloodType,
          units: donation.units,
          earliestDate: donation.date,
          donationCount: 1
        })
      }
    }

    console.log('📊 Grouped by blood type:', Object.fromEntries(bloodTypeMap))

    let updatedCount = 0
    const results = []

    // Create or update inventory for each blood type
    for (const [bloodType, data] of bloodTypeMap) {
      // Calculate expiry date (42 days from earliest donation)
      const expiryDate = new Date(data.earliestDate)
      expiryDate.setDate(expiryDate.getDate() + 42)

      // Check if inventory already exists
      const existing = await BloodInventory.findOne({
        hospitalId: hospitalId,
        bloodType: bloodType
      })

      if (existing) {
        // Update existing inventory
        existing.units = data.units
        existing.expirationDate = expiryDate
        existing.notes = `Synced from ${data.donationCount} donations. Total units: ${data.units}`
        await existing.save()
        
        results.push({
          bloodType,
          action: 'updated',
          units: data.units,
          donationCount: data.donationCount,
          expiryDate: expiryDate
        })
        updatedCount++
        console.log(`✅ Updated inventory for ${bloodType}: ${data.units} units`)
      } else if (data.units > 0) {
        // Create new inventory
        const newInventory = await BloodInventory.create({
          hospitalId: hospitalId,
          bloodType: bloodType,
          units: data.units,
          minRequired: 15,
          maxCapacity: 60,
          expirationDate: expiryDate,
          notes: `Auto-created from ${data.donationCount} donation(s) on ${new Date().toLocaleDateString()}`,
          batchNumber: `SYNC-${Date.now()}`
        })
        
        results.push({
          bloodType,
          action: 'created',
          units: data.units,
          donationCount: data.donationCount,
          expiryDate: expiryDate
        })
        updatedCount++
        console.log(`✅ Created inventory for ${bloodType}: ${data.units} units`)
      }
    }

    // Get final inventory state
    const finalInventory = await BloodInventory.find({
      hospitalId: hospitalId
    }).lean()

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updatedCount} blood types from ${donations.length} donations`,
      data: {
        donationsProcessed: donations.length,
        bloodTypesUpdated: updatedCount,
        results: results,
        inventory: finalInventory.map((item: any) => ({
          id: item._id.toString(),
          bloodType: item.bloodType,
          units: item.units,
          status: item.status,
          minRequired: item.minRequired,
          maxCapacity: item.maxCapacity,
          expirationDate: item.expirationDate,
          notes: item.notes
        }))
      }
    })

  } catch (error: any) {
    console.error('❌ Error syncing inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync inventory' },
      { status: 500 }
    )
  }
}