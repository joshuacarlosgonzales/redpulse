// app/api/hospital/inventory/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodInventory from '@/models/BloodInventory'

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
        { error: 'Unauthorized - Hospital admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bloodType, units } = body

    if (!bloodType || !units) {
      return NextResponse.json(
        { error: 'Missing required fields: bloodType, units' },
        { status: 400 }
      )
    }

    // Find the inventory item
    const inventoryItem = await BloodInventory.findOne({
      hospitalId: new mongoose.Types.ObjectId(decoded.userId),
      bloodType: bloodType
    })

    if (!inventoryItem) {
      return NextResponse.json({
        available: false,
        availableUnits: 0,
        requestedUnits: units,
        bloodType: bloodType,
        message: `No inventory found for ${bloodType}`
      })
    }

    // Check if expired
    if (inventoryItem.expirationDate && new Date(inventoryItem.expirationDate) < new Date()) {
      return NextResponse.json({
        available: false,
        availableUnits: inventoryItem.units,
        requestedUnits: units,
        bloodType: bloodType,
        message: `Inventory for ${bloodType} has expired`
      })
    }

    const available = inventoryItem.units >= units

    return NextResponse.json({
      available: available,
      availableUnits: inventoryItem.units,
      requestedUnits: units,
      bloodType: bloodType,
      status: inventoryItem.status,
      message: available 
        ? `Sufficient inventory available for ${bloodType} (${inventoryItem.units} units available)` 
        : `Insufficient inventory for ${bloodType}. Available: ${inventoryItem.units} units`
    })

  } catch (error: any) {
    console.error('Error checking inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check inventory' },
      { status: 500 }
    )
  }
}