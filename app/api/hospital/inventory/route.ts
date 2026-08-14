// app/api/hospital/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodInventory from '@/models/BloodInventory'

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
        { error: 'Unauthorized - Hospital admin access required' },
        { status: 403 }
      )
    }

    console.log('👤 User ID:', decoded.userId)
    console.log('👤 User Role:', decoded.role)

    const { searchParams } = new URL(request.url)
    const bloodType = searchParams.get('bloodType')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    // Build filter - use the userId from token as hospitalId
    const filter: any = { hospitalId: new mongoose.Types.ObjectId(decoded.userId) }
    if (bloodType && bloodType !== 'all') filter.bloodType = bloodType
    if (status && status !== 'all') filter.status = status

    if (search) {
      filter.$or = [
        { bloodType: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ]
    }

    console.log('🔍 Filter:', JSON.stringify(filter, null, 2))

    const inventory = await BloodInventory.find(filter)
      .sort({ bloodType: 1 })
      .lean()

    console.log('📦 Found inventory items:', inventory.length)
    console.log('📦 Inventory data:', JSON.stringify(inventory, null, 2))

    // Transform data for frontend - Map units to quantity
    const transformedInventory = inventory.map((item: any) => {
      const isExpired = new Date(item.expirationDate) < new Date();
      
      // Map database status to frontend status
      let frontendStatus = 'available';
      if (isExpired) {
        frontendStatus = 'expired';
      } else {
        const dbStatus = item.status?.toLowerCase() || 'sufficient';
        if (dbStatus === 'out of stock' || item.units === 0) {
          frontendStatus = 'critical';
        } else if (dbStatus === 'critical') {
          frontendStatus = 'critical';
        } else if (dbStatus === 'low') {
          frontendStatus = 'low';
        } else {
          frontendStatus = 'available';
        }
      }

      return {
        id: item._id.toString(),
        bloodType: item.bloodType,
        quantity: item.units || 0,
        unit: 'units',
        minThreshold: item.minRequired || 15,
        maxThreshold: item.maxCapacity || 60,
        status: frontendStatus,
        expiryDate: item.expirationDate,
        location: item.notes || 'Main Storage',
        hospitalId: item.hospitalId?.toString() || decoded.userId,
        lastUpdated: item.updatedAt || item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    })

    console.log('📊 Transformed inventory:', JSON.stringify(transformedInventory, null, 2))

    // Calculate stats
    const stats = {
      totalUnits: transformedInventory.reduce((sum: number, item: any) => sum + item.quantity, 0),
      availableUnits: transformedInventory
        .filter((i: any) => i.status === 'available')
        .reduce((sum: number, item: any) => sum + item.quantity, 0),
      lowStockCount: transformedInventory.filter((i: any) => i.status === 'low').length,
      criticalCount: transformedInventory.filter((i: any) => i.status === 'critical').length,
    }

    return NextResponse.json({
      success: true,
      data: transformedInventory,
      stats: stats,
      pagination: {
        total: transformedInventory.length,
        page: 1,
        limit: transformedInventory.length,
        totalPages: 1
      }
    })

  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
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
        { error: 'Unauthorized - Hospital admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('📥 Received inventory body:', JSON.stringify(body, null, 2))

    const { bloodType, quantity, minThreshold, maxThreshold, expiryDate, location, notes } = body

    if (!bloodType || quantity === undefined || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields: bloodType, quantity, expiryDate' },
        { status: 400 }
      )
    }

    // Check if inventory already exists
    const existingInventory = await BloodInventory.findOne({
      hospitalId: new mongoose.Types.ObjectId(decoded.userId),
      bloodType: bloodType
    })

    if (existingInventory) {
      // Update existing inventory
      existingInventory.units += quantity
      existingInventory.minRequired = minThreshold || existingInventory.minRequired
      existingInventory.maxCapacity = maxThreshold || existingInventory.maxCapacity
      existingInventory.expirationDate = new Date(expiryDate)
      existingInventory.notes = notes || existingInventory.notes
      // Status will be updated by pre-save middleware
      await existingInventory.save()

      return NextResponse.json({
        success: true,
        data: {
          id: existingInventory._id.toString(),
          bloodType: existingInventory.bloodType,
          quantity: existingInventory.units,
          status: existingInventory.status,
          updatedAt: existingInventory.updatedAt
        },
        message: 'Inventory updated successfully'
      })
    }

    // Create new inventory (status will be set by pre-save middleware)
    const newInventory = await BloodInventory.create({
      hospitalId: new mongoose.Types.ObjectId(decoded.userId),
      bloodType: bloodType,
      units: quantity,
      minRequired: minThreshold || 15,
      maxCapacity: maxThreshold || 60,
      expirationDate: new Date(expiryDate),
      notes: notes || location || 'Added via inventory management'
    })

    console.log(`✅ Inventory created: ${bloodType} ${quantity} units`)

    return NextResponse.json({
      success: true,
      data: {
        id: newInventory._id.toString(),
        bloodType: newInventory.bloodType,
        quantity: newInventory.units,
        status: newInventory.status,
        createdAt: newInventory.createdAt
      },
      message: 'Inventory added successfully'
    })

  } catch (error: any) {
    console.error('Error adding inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add inventory' },
      { status: 500 }
    )
  }
}