// app/api/hospital/inventory/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodInventory from '@/models/BloodInventory'
import InventoryLog from '@/models/InventoryLog'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { cacheInvalidate } from '@/lib/cache'

function computeFrontendStatus(item: any): 'available' | 'not available' {
  const isExpired = new Date(item.expirationDate) < new Date()
  if (isExpired) return 'not available'
  if (!item.units || item.units <= 0) return 'not available'
  return 'available'
}

type RouteContext = { params: Promise<{ id: string }> }

async function authorize(
  request: NextRequest,
  context: RouteContext
): Promise<{ error: NextResponse } | { filter: any; decoded: any }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 }),
    }
  }

  const token = authHeader.split(' ')[1]

  let decoded: any
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
  } catch {
    return {
      error: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 }),
    }
  }

  if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Hospital or Admin access required' },
        { status: 403 }
      ),
    }
  }

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      error: NextResponse.json({ error: 'Invalid inventory ID format' }, { status: 400 }),
    }
  }

  const filter: any = { _id: id }
  if (decoded.role !== 'admin') {
    filter.hospitalId = new mongoose.Types.ObjectId(decoded.userId)
  }

  return { filter, decoded }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await dbConnect()

    const auth = await authorize(request, context)
    if ('error' in auth) return auth.error

    const item = await BloodInventory.findOne(auth.filter)
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: item._id.toString(),
        bloodType: item.bloodType,
        quantity: item.units,
        unit: 'units',
        minThreshold: item.minRequired ?? 15,
        maxThreshold: item.maxCapacity ?? 60,
        expiryDate: item.expirationDate,
        status: computeFrontendStatus(item),
        location: item.notes || 'Main Storage',
        notes: item.notes || '',
        hospitalId: item.hospitalId?.toString(),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await dbConnect()

    const auth = await authorize(request, context)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { quantity, expiryDate } = body

    const item = await BloodInventory.findOne(auth.filter)
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    const before = item.units
    let unitsChanged = false

    if (quantity !== undefined) {
      const qty = Number(quantity)
      if (!Number.isFinite(qty) || qty < 0) {
        return NextResponse.json({ error: 'quantity must be a non-negative number' }, { status: 400 })
      }
      item.units = qty
      unitsChanged = qty !== before
    }

    if (expiryDate) {
      const newExpiry = new Date(expiryDate)
      if (isNaN(newExpiry.getTime())) {
        return NextResponse.json({ error: 'expiryDate is not a valid date' }, { status: 400 })
      }
      item.expirationDate = newExpiry
    }

    await item.save()

    if (unitsChanged) {
      await InventoryLog.create({
        hospitalId: item.hospitalId,
        bloodType: item.bloodType,
        type: item.units > before ? 'add' : 'remove',
        source: 'manual',
        units: item.units - before,
        balanceBefore: before,
        balanceAfter: item.units,
        actorName: auth.decoded.email || 'Hospital Staff',
        actorId: new mongoose.Types.ObjectId(auth.decoded.userId),
        notes: 'Quantity adjusted via edit',
        expiryDate: item.expirationDate,
        metadata: { action: 'edit_quantity', inventoryId: item._id.toString() },
      })
    }

    cacheInvalidate('inventory:')
    cacheInvalidate('bags:')
    cacheInvalidate('expired:')
    cacheInvalidate('history:')

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        id: item._id.toString(),
        bloodType: item.bloodType,
        quantity: item.units,
        units: item.units,
        status: item.status,
      },
    })
  } catch (error: any) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await dbConnect()

    const auth = await authorize(request, context)
    if ('error' in auth) return auth.error

    const item = await BloodInventory.findOneAndDelete(auth.filter)
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    cacheInvalidate('inventory:')
    cacheInvalidate('bags:')
    cacheInvalidate('expired:')
    cacheInvalidate('history:')

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete inventory' },
      { status: 500 }
    )
  }
}