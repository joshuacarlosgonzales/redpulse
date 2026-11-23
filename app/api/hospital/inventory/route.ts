// app/api/hospital/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import BloodInventory from '@/models/BloodInventory'
import BloodBag from '@/models/BloodBag'
import InventoryLog from '@/models/InventoryLog'
import { cached, cacheInvalidate } from '@/lib/cache'

// ============================================================
// Helpers
// ============================================================

function computeFrontendStatus(item: any): 'available' | 'not available' {
  const isExpired = new Date(item.expirationDate) < new Date()
  if (isExpired) return 'not available'
  if (!item.units || item.units <= 0) return 'not available'
  return 'available'
}

function auth(request: NextRequest): { decoded: any } | { error: NextResponse } {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 }) }
  }
  const token = authHeader.split(' ')[1]
  let decoded: any
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 }) }
  }
  if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
    return { error: NextResponse.json({ error: 'Unauthorized - Hospital admin access required' }, { status: 403 }) }
  }
  return { decoded }
}

function buildBatchNumber(bloodType: string, index: number): string {
  const stamp = Date.now().toString().slice(-6)
  const letter = String.fromCharCode(65 + (index % 26))
  return `${bloodType}-${stamp}-${letter}${index >= 26 ? index : ''}`
}

// ============================================================
// GET — list inventory
// ============================================================
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const a = auth(request)
    if ('error' in a) return a.error
    const { decoded } = a

    const { searchParams } = new URL(request.url)
    const bloodType = searchParams.get('bloodType')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const hospitalIdParam = searchParams.get('hospitalId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '100', 10) || 100))

    let targetHospitalId: mongoose.Types.ObjectId
    if (decoded.role === 'admin' && hospitalIdParam) {
      if (!mongoose.Types.ObjectId.isValid(hospitalIdParam)) {
        return NextResponse.json({ error: 'Invalid hospitalId format' }, { status: 400 })
      }
      targetHospitalId = new mongoose.Types.ObjectId(hospitalIdParam)
    } else {
      targetHospitalId = new mongoose.Types.ObjectId(decoded.userId)
    }

    const cacheKey = `inventory:${targetHospitalId}:${bloodType || 'all'}:${status || 'all'}:${search}`

    const payload = await cached(cacheKey, 15_000, async () => {
      const filter: any = { hospitalId: targetHospitalId }
      if (bloodType && bloodType !== 'all') filter.bloodType = bloodType
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        filter.$or = [
          { bloodType: { $regex: escaped, $options: 'i' } },
          { notes: { $regex: escaped, $options: 'i' } },
        ]
      }

      const inventory = await BloodInventory.find(filter)
        .select('bloodType units minRequired maxCapacity expirationDate status notes hospitalId createdAt updatedAt')
        .sort({ bloodType: 1 })
        .limit(500)
        .lean()

      const allTransformed = inventory.map((item: any) => ({
        id: item._id.toString(),
        bloodType: item.bloodType,
        quantity: item.units || 0,
        unit: 'units',
        minThreshold: item.minRequired ?? 15,
        maxThreshold: item.maxCapacity ?? 60,
        status: computeFrontendStatus(item),
        expiryDate: item.expirationDate,
        location: item.notes || 'Main Storage',
        notes: item.notes || '',
        hospitalId: item.hospitalId?.toString() || decoded.userId,
        lastUpdated: item.updatedAt || item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))

      const stats = {
        totalUnits: allTransformed.reduce((sum, i) => sum + i.quantity, 0),
        availableUnits: allTransformed
          .filter((i) => i.status === 'available')
          .reduce((sum, i) => sum + i.quantity, 0),
        notAvailableCount: allTransformed.filter((i) => i.status === 'not available').length,
        bloodTypesCount: allTransformed.length,
      }

      const statusFiltered =
        status && status !== 'all'
          ? allTransformed.filter((i) => i.status === status)
          : allTransformed

      const total = statusFiltered.length
      const totalPages = Math.max(1, Math.ceil(total / limit))
      const currentPage = Math.min(page, totalPages)
      const startIndex = (currentPage - 1) * limit
      const pageItems = statusFiltered.slice(startIndex, startIndex + limit)

      return {
        success: true,
        data: pageItems,
        stats,
        pagination: { total, page: currentPage, limit, totalPages },
      }
    })

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' },
    })
  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 })
  }
}

// ============================================================
// POST — add stock, create bags, log to InventoryLog
// ============================================================
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const a = auth(request)
    if ('error' in a) return a.error
    const { decoded } = a

    const body = await request.json()
    const {
      bloodType,
      quantity,
      minThreshold,
      maxThreshold,
      expiryDate,
      location,
      notes,
      hospitalId: hospitalIdParam,
    } = body

    if (!bloodType || quantity === undefined || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields: bloodType, quantity, expiryDate' },
        { status: 400 }
      )
    }

    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: 'quantity must be greater than 0' }, { status: 400 })
    }

    const newExpiry = new Date(expiryDate)
    if (isNaN(newExpiry.getTime())) {
      return NextResponse.json({ error: 'expiryDate is not a valid date' }, { status: 400 })
    }

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

    const actorId = new mongoose.Types.ObjectId(decoded.userId)
    const actorName = decoded.email || 'Hospital Staff'
    const lookup = { hospitalId: targetHospitalId, bloodType }

    const session = await mongoose.startSession()
    session.startTransaction()

    let inventory: any
    let balanceBefore = 0
    let createdNewInventory = false
    let bagsToCreate = 0
    let deleteExpiredBags = false
    let wasExpired = false
    let logType: 'add' | 'remove' = 'add'
    let logUnits = qty
    let logNote = notes || location || `Added ${qty} units`

    try {
      inventory = await BloodInventory.findOne(lookup).session(session)

      if (inventory) {
        balanceBefore = inventory.units
        wasExpired = new Date(inventory.expirationDate) < new Date()

        if (wasExpired) {
          deleteExpiredBags = true
          inventory.units = qty
          inventory.expirationDate = newExpiry
          logType = 'add'
          logUnits = qty
          logNote = `Expired stock (${balanceBefore} units) replaced with ${qty} new units`
        } else {
          inventory.units += qty
          if (newExpiry > inventory.expirationDate) {
            inventory.expirationDate = newExpiry
          }
          logType = 'add'
          logUnits = qty
        }

        inventory.minRequired = minThreshold ?? inventory.minRequired
        inventory.maxCapacity = maxThreshold ?? inventory.maxCapacity
        inventory.notes = notes || location || inventory.notes
        await inventory.save({ session })
      } else {
        createdNewInventory = true
        const created = await BloodInventory.create(
          [
            {
              hospitalId: targetHospitalId,
              bloodType,
              units: qty,
              minRequired: minThreshold ?? 15,
              maxCapacity: maxThreshold ?? 60,
              expirationDate: newExpiry,
              notes: notes || location || 'Added via inventory management',
            },
          ],
          { session }
        )
        inventory = created[0]
        logType = 'add'
        logUnits = qty
      }

      const deltaUnits = createdNewInventory ? qty : inventory.units - balanceBefore
      if (deltaUnits !== 0 || createdNewInventory) {
        await InventoryLog.create(
          [
            {
              hospitalId: targetHospitalId,
              bloodType,
              type: logType,
              source: 'manual',
              units: logUnits,
              balanceBefore,
              balanceAfter: inventory.units,
              actorName,
              actorId,
              notes: logNote,
              expiryDate: newExpiry,
              metadata: {
                action: createdNewInventory
                  ? 'create'
                  : wasExpired
                  ? 'replace_expired'
                  : 'merge',
                inventoryId: inventory._id.toString(),
                bagsCreated: qty,
              },
            },
          ],
          { session }
        )
      }

      await session.commitTransaction()
      bagsToCreate = qty
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }

    // ---- Post-commit: create bags (failure here does NOT roll back inventory) ----
    let bagsCreated = 0
    if (bagsToCreate > 0) {
      try {
        if (deleteExpiredBags) {
          await BloodBag.deleteMany({
            hospitalId: targetHospitalId,
            bloodType,
            status: { $in: ['available', 'expired'] },
          })
        }

        const bagDocs = Array.from({ length: bagsToCreate }, (_, i) => ({
          hospitalId: targetHospitalId,
          bloodType,
          units: 1,
          donationId: null,
          sourceType: 'manual' as const,
          sourceId: inventory._id,
          donationDate: new Date(),
          expirationDate: newExpiry,
          status: 'available' as const,
          batchNumber: buildBatchNumber(bloodType, i),
          location: location || 'Main Storage',
          notes: notes || 'Manually added via Add Stock',
        }))

        const inserted = await BloodBag.insertMany(bagDocs, { ordered: false })
        bagsCreated = inserted.length
      } catch (bagErr: any) {
        console.error('⚠️ Bag creation failed but inventory was updated:', bagErr)
      }
    }

    cacheInvalidate('inventory:')
    cacheInvalidate('bags:')
    cacheInvalidate('expired:')
    cacheInvalidate('history:')

    return NextResponse.json({
      success: true,
      data: {
        id: inventory._id.toString(),
        bloodType: inventory.bloodType,
        quantity: inventory.units,
        status: inventory.status,
        bagsCreated,
        updatedAt: inventory.updatedAt,
      },
      message: bagsCreated > 0
        ? `Inventory updated: ${bagsCreated} new bag(s) created`
        : `Inventory updated (bag creation skipped)`,
    })
  } catch (error: any) {
    console.error('Error adding inventory:', error)
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'Inventory for this blood type already exists for this hospital. Please retry.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to add inventory' },
      { status: 500 }
    )
  }
}