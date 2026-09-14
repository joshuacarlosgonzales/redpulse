import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodInventory from '@/models/BloodInventory'

// Shared logic for deriving the frontend-facing status from a raw inventory
// document. Keeping this in one place means the GET list route and the
// status filter always agree on what "available" / "low" / "critical" /
// "expired" mean.
function computeFrontendStatus(item: any): 'available' | 'low' | 'critical' | 'expired' {
  const isExpired = new Date(item.expirationDate) < new Date()
  if (isExpired) return 'expired'

  const dbStatus = item.status?.toLowerCase() || 'sufficient'
  if (dbStatus === 'out of stock' || item.units === 0) return 'critical'
  if (dbStatus === 'critical') return 'critical'
  if (dbStatus === 'low') return 'low'
  return 'available'
}

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

    const { searchParams } = new URL(request.url)
    const bloodType = searchParams.get('bloodType')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const hospitalIdParam = searchParams.get('hospitalId')

    // Real pagination support
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10)

    // Build filter
    const filter: any = {}

    // Admins can see across hospitals (optionally scoped via ?hospitalId=),
    // whereas hospital users are always scoped to their own hospitalId.
    if (decoded.role === 'admin') {
      if (hospitalIdParam) {
        if (!mongoose.Types.ObjectId.isValid(hospitalIdParam)) {
          return NextResponse.json(
            { error: 'Invalid hospitalId format' },
            { status: 400 }
          )
        }
        filter.hospitalId = new mongoose.Types.ObjectId(hospitalIdParam)
      }
    } else {
      filter.hospitalId = new mongoose.Types.ObjectId(decoded.userId)
    }

    if (bloodType && bloodType !== 'all') filter.bloodType = bloodType

    if (search) {
      filter.$or = [
        { bloodType: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ]
    }

    // Note: `status` is intentionally NOT applied as a raw Mongo filter here.
    // The DB's status field doesn't share the same vocabulary as the
    // frontend's status ('available' | 'low' | 'critical' | 'expired'), and
    // "expired" isn't a stored status at all - it's derived from
    // expirationDate. So we fetch first, then filter using the same
    // computeFrontendStatus() logic the response itself uses.
    const inventory = await BloodInventory.find(filter)
      .sort({ bloodType: 1 })
      .lean()

    // Transform data for frontend - Map units to quantity
    const allTransformed = inventory.map((item: any) => ({
      id: item._id.toString(),
      bloodType: item.bloodType,
      quantity: item.units || 0,
      unit: 'units',
      minThreshold: item.minRequired || 15,
      maxThreshold: item.maxCapacity || 60,
      status: computeFrontendStatus(item),
      expiryDate: item.expirationDate,
      location: item.notes || 'Main Storage',
      hospitalId: item.hospitalId?.toString() || decoded.userId,
      lastUpdated: item.updatedAt || item.createdAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))

    // Stats reflect the full filtered set (bloodType/search/hospital scope)
    // regardless of the status filter, so summary cards stay accurate even
    // when a status filter narrows the visible rows.
    const stats = {
      totalUnits: allTransformed.reduce((sum: number, item: any) => sum + item.quantity, 0),
      availableUnits: allTransformed
        .filter((i: any) => i.status === 'available')
        .reduce((sum: number, item: any) => sum + item.quantity, 0),
      lowStockCount: allTransformed.filter((i: any) => i.status === 'low').length,
      criticalCount: allTransformed.filter((i: any) => i.status === 'critical').length,
    }

    // Status filter now compares against the same derived status
    // used everywhere else, instead of the unmatched raw DB field.
    const statusFiltered = status && status !== 'all'
      ? allTransformed.filter((i: any) => i.status === status)
      : allTransformed

    const total = statusFiltered.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const currentPage = Math.min(page, totalPages)
    const startIndex = (currentPage - 1) * limit
    const pageItems = statusFiltered.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      data: pageItems,
      stats: stats,
      pagination: {
        total,
        page: currentPage,
        limit,
        totalPages
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

    const { bloodType, quantity, minThreshold, maxThreshold, expiryDate, location, notes, hospitalId: hospitalIdParam } = body

    if (!bloodType || quantity === undefined || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields: bloodType, quantity, expiryDate' },
        { status: 400 }
      )
    }

    // Admins may create/update stock on behalf of a specific
    // hospital by passing hospitalId in the body. Hospital users are always
    // scoped to their own account.
    let targetHospitalId: mongoose.Types.ObjectId
    if (decoded.role === 'admin') {
      if (!hospitalIdParam || !mongoose.Types.ObjectId.isValid(hospitalIdParam)) {
        return NextResponse.json(
          { error: 'hospitalId is required and must be valid when creating inventory as an admin' },
          { status: 400 }
        )
      }
      targetHospitalId = new mongoose.Types.ObjectId(hospitalIdParam)
    } else {
      targetHospitalId = new mongoose.Types.ObjectId(decoded.userId)
    }

    // Only merge into an existing batch of the same blood type if
    // that batch is NOT already expired.
    const existingInventory = await BloodInventory.findOne({
      hospitalId: targetHospitalId,
      bloodType: bloodType,
      expirationDate: { $gte: new Date() }
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
      hospitalId: targetHospitalId,
      bloodType: bloodType,
      units: quantity,
      minRequired: minThreshold || 15,
      maxCapacity: maxThreshold || 60,
      expirationDate: new Date(expiryDate),
      notes: notes || location || 'Added via inventory management'
    })

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