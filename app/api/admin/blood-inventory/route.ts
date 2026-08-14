// app/api/admin/blood-inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Hospital from '@/models/Hospital'
import BloodInventory from '@/models/BloodInventory'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

// Helper function to determine status
function getBloodStatus(units: number, minRequired: number = 15): string {
  if (units <= 0) return 'Out of Stock';
  if (units <= minRequired * 0.3) return 'Critical';
  if (units <= minRequired) return 'Low';
  return 'Sufficient';
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
      console.log('👤 User ID:', decoded?.userId, 'Role:', decoded?.role)
      
      if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'hospital')) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin or Hospital access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      console.error('JWT Error:', jwtError)
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')
    const bloodType = searchParams.get('bloodType')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    // Build filter
    const filter: any = {}
    
    if (decoded.role === 'hospital') {
      filter.hospitalId = new mongoose.Types.ObjectId(decoded.userId)
    } else if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      filter.hospitalId = new mongoose.Types.ObjectId(hospitalId)
    }
    
    if (bloodType) filter.bloodType = bloodType
    if (status) filter.status = status

    // Search filter
    let hospitalIds: string[] = [];
    if (search) {
      try {
        const hospitals = await Hospital.find({
          $or: [
            { hospitalName: { $regex: search, $options: 'i' } },
            { hospitalAddress: { $regex: search, $options: 'i' } }
          ]
        }).select('_id').lean()
        
        hospitalIds = hospitals.map((h: any) => h._id.toString())
        
        if (hospitalIds.length > 0) {
          filter.hospitalId = { $in: hospitalIds.map(id => new mongoose.Types.ObjectId(id)) }
        } else {
          return NextResponse.json({
            success: true,
            data: [],
            stats: {
              totalHospitals: 0,
              totalBloodUnits: 0,
              criticalHospitals: 0,
              lowStockHospitals: 0,
              bloodTypeBreakdown: {}
            }
          })
        }
      } catch (searchError) {
        console.error('Search error:', searchError)
      }
    }

    console.log('Filter:', JSON.stringify(filter, null, 2))

    // Fetch inventory items
    const items = await BloodInventory.find(filter).lean()
    console.log(`Found ${items.length} inventory items`)

    // Get unique hospital IDs and fetch hospital details
    const hospitalIdSet = new Set()
    items.forEach((item: any) => {
      if (item.hospitalId) {
        hospitalIdSet.add(item.hospitalId.toString())
      }
    })
    
    // Fetch hospital details for all unique hospital IDs
    const hospitalMap = new Map()
    if (hospitalIdSet.size > 0) {
      const hospitalIdsArray = Array.from(hospitalIdSet)
      const hospitals = await Hospital.find({
        _id: { $in: hospitalIdsArray }
      }).lean()
      
      hospitals.forEach((hospital: any) => {
        hospitalMap.set(hospital._id.toString(), hospital)
      })
      console.log(`Found ${hospitals.length} hospitals for mapping`)
    }

    // Transform data - combine inventory with hospital data
    const transformedInventory = items.map((item: any) => {
      const hospital = hospitalMap.get(item.hospitalId?.toString()) || {}
      
      return {
        id: item._id.toString(),
        hospitalId: item.hospitalId?.toString() || '',
        hospitalName: hospital.hospitalName || 'Unknown Hospital',
        hospitalAddress: hospital.hospitalAddress || 'N/A',
        hospitalPhone: hospital.hospitalPhone || 'N/A',
        hospitalEmail: hospital.hospitalEmail || 'N/A',
        hospitalStatus: hospital.status || 'unknown',
        bloodType: item.bloodType || 'Unknown',
        quantity: item.units || 0,
        minRequired: item.minRequired || 15,
        maxCapacity: item.maxCapacity || 60,
        status: item.status || getBloodStatus(item.units || 0, item.minRequired || 15),
        expirationDate: item.expirationDate || new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        batchNumber: item.batchNumber || '',
        notes: item.notes || '',
        lastUpdated: item.updatedAt || item.createdAt || new Date(),
        createdAt: item.createdAt || new Date(),
        updatedAt: item.updatedAt || new Date()
      }
    })

    // Calculate stats
    const bloodTypeList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodTypeBreakdown: { [key: string]: number } = {};
    
    bloodTypeList.forEach((type: string) => {
      bloodTypeBreakdown[type] = 0;
    });

    let totalHospitals = 0;
    let totalBloodUnits = 0;
    let criticalHospitals = 0;
    let lowStockHospitals = 0;
    const hospitalSet = new Set();

    transformedInventory.forEach((item: any) => {
      if (item.hospitalId) {
        hospitalSet.add(item.hospitalId);
      }
      totalBloodUnits += item.quantity || 0;
      if (bloodTypeBreakdown[item.bloodType] !== undefined) {
        bloodTypeBreakdown[item.bloodType] += item.quantity || 0;
      }
      
      const status = item.status || 'Sufficient';
      if (status === 'Critical') criticalHospitals++;
      else if (status === 'Low') lowStockHospitals++;
    });
    totalHospitals = hospitalSet.size;

    const stats = {
      totalHospitals,
      totalBloodUnits,
      criticalHospitals,
      lowStockHospitals,
      bloodTypeBreakdown
    };

    console.log(`📊 Stats: ${totalHospitals} hospitals, ${totalBloodUnits} units`)

    return NextResponse.json({
      success: true,
      data: transformedInventory,
      stats: stats
    })

  } catch (error: any) {
    console.error('Error fetching blood inventory:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch blood inventory',
        details: error.stack 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
      if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'hospital')) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin or Hospital access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { inventoryId, units, minRequired, maxCapacity, notes } = body

    if (!inventoryId) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
      return NextResponse.json(
        { error: 'Invalid inventory ID format' },
        { status: 400 }
      )
    }

    const inventory = await BloodInventory.findById(inventoryId)
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    if (units !== undefined) inventory.units = units
    if (minRequired !== undefined) inventory.minRequired = minRequired
    if (maxCapacity !== undefined) inventory.maxCapacity = maxCapacity
    if (notes !== undefined) inventory.notes = notes
    
    await inventory.save()

    return NextResponse.json({
      success: true,
      data: {
        id: inventory._id.toString(),
        bloodType: inventory.bloodType,
        units: inventory.units,
        minRequired: inventory.minRequired,
        maxCapacity: inventory.maxCapacity,
        status: inventory.status,
        notes: inventory.notes,
        updatedAt: inventory.updatedAt
      },
      message: 'Inventory updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
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
      if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'hospital')) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin or Hospital access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { hospitalId, bloodType, units, minRequired, maxCapacity, expirationDate, batchNumber, notes } = body

    if (!bloodType || units === undefined) {
      return NextResponse.json(
        { error: 'Blood type and units are required' },
        { status: 400 }
      )
    }

    let targetHospitalId = hospitalId;
    if (!targetHospitalId && decoded.role === 'hospital') {
      targetHospitalId = decoded.userId;
    }

    if (!targetHospitalId || !mongoose.Types.ObjectId.isValid(targetHospitalId)) {
      return NextResponse.json(
        { error: 'Invalid or missing hospital ID' },
        { status: 400 }
      )
    }

    const hospital = await Hospital.findById(targetHospitalId)
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    const existingInventory = await BloodInventory.findOne({ 
      hospitalId: targetHospitalId,
      bloodType: bloodType
    })

    if (existingInventory) {
      return NextResponse.json(
        { error: 'Inventory already exists for this blood type. Use PUT to update.' },
        { status: 409 }
      )
    }

    const newInventory = await BloodInventory.create({
      hospitalId: targetHospitalId,
      bloodType: bloodType,
      units: units,
      minRequired: minRequired || 15,
      maxCapacity: maxCapacity || 60,
      expirationDate: expirationDate || new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
      batchNumber: batchNumber || '',
      notes: notes || ''
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newInventory._id.toString(),
        hospitalId: newInventory.hospitalId,
        bloodType: newInventory.bloodType,
        units: newInventory.units,
        minRequired: newInventory.minRequired,
        maxCapacity: newInventory.maxCapacity,
        status: newInventory.status,
        expirationDate: newInventory.expirationDate,
        batchNumber: newInventory.batchNumber,
        notes: newInventory.notes,
        createdAt: newInventory.createdAt
      },
      message: 'Inventory created successfully'
    })

  } catch (error: any) {
    console.error('Error creating inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create inventory' },
      { status: 500 }
    )
  }
}