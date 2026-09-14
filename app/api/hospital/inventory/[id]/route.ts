import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodInventory from '@/models/BloodInventory'
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
      if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized - Hospital or Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid inventory ID format' },
        { status: 400 }
      )
    }

    // Scope lookup to the caller's hospital so one hospital
    // cannot view another hospital's inventory record by guessing the id.
    // Admins are allowed to view any record.
    const filter: any = { _id: id }
    if (decoded.role !== 'admin') {
      filter.hospitalId = new mongoose.Types.ObjectId(decoded.userId)
    }

    const item = await BloodInventory.findOne(filter)
    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    const isExpired = new Date(item.expirationDate) < new Date()
    let frontendStatus = 'available'
    if (isExpired) {
      frontendStatus = 'expired'
    } else {
      const dbStatus = item.status?.toLowerCase() || 'sufficient'
      if (dbStatus === 'out of stock' || item.units === 0) {
        frontendStatus = 'critical'
      } else if (dbStatus === 'critical') {
        frontendStatus = 'critical'
      } else if (dbStatus === 'low') {
        frontendStatus = 'low'
      } else {
        frontendStatus = 'available'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: item._id.toString(),
        bloodType: item.bloodType,
        quantity: item.units,
        unit: 'units',
        minThreshold: item.minRequired || 15,
        maxThreshold: item.maxCapacity || 60,
        expiryDate: item.expirationDate,
        status: frontendStatus,
        location: item.notes || 'Main Storage',
        hospitalId: item.hospitalId?.toString(),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }
    })

  } catch (error: any) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory item' },
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
      if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized - Hospital or Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid inventory ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { quantity, expiryDate } = body

    // Scope lookup to the caller's hospital so one hospital
    // cannot edit another hospital's inventory record by guessing the id.
    const filter: any = { _id: id }
    if (decoded.role !== 'admin') {
      filter.hospitalId = new mongoose.Types.ObjectId(decoded.userId)
    }

    const item = await BloodInventory.findOne(filter)
    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    if (quantity !== undefined) {
      item.units = quantity
      // Status will be updated by pre-save middleware
    }

    if (expiryDate) {
      item.expirationDate = new Date(expiryDate)
    }

    await item.save()

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        id: item._id.toString(),
        bloodType: item.bloodType,
        units: item.units,
        status: item.status,
      }
    })

  } catch (error: any) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
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
      if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized - Hospital or Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid inventory ID format' },
        { status: 400 }
      )
    }

    // Scope delete to the caller's hospital so one hospital
    // cannot delete another hospital's inventory record by guessing the id.
    const filter: any = { _id: id }
    if (decoded.role !== 'admin') {
      filter.hospitalId = new mongoose.Types.ObjectId(decoded.userId)
    }

    const item = await BloodInventory.findOneAndDelete(filter)
    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete inventory' },
      { status: 500 }
    )
  }
}