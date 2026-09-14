// app/api/admin/dashboard/blood-inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodInventory from '@/models/BloodInventory'
import jwt from 'jsonwebtoken'

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
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Fetch all inventory
    const inventory = await BloodInventory.find().lean()

    // Aggregate by blood type (deduplicate)
    const aggregated = inventory.reduce((acc: Record<string, any>, item: any) => {
      const type = item.bloodType || 'Unknown'
      if (!acc[type]) {
        acc[type] = {
          bloodType: type,
          units: 0,
          minRequired: item.minRequired || 15,
          status: 'sufficient'
        }
      }
      acc[type].units += item.units || 0
      
      // Use the most critical status
      const statusPriority: Record<string, number> = { 
        'critical': 0, 
        'out of stock': 1, 
        'low': 2, 
        'sufficient': 3 
      }
      const currentPriority = statusPriority[acc[type].status] ?? 99
      const newPriority = statusPriority[item.status?.toLowerCase()] ?? 99
      if (newPriority < currentPriority) {
        acc[type].status = item.status?.toLowerCase() || 'sufficient'
      }
      
      return acc
    }, {})

    const formattedInventory = Object.values(aggregated)

    // Calculate stats
    const stats = {
      totalUnits: formattedInventory.reduce((sum: number, item: any) => sum + (item.units || 0), 0),
      totalTypes: formattedInventory.length,
      critical: formattedInventory.filter((item: any) => item.status === 'critical').length,
      low: formattedInventory.filter((item: any) => item.status === 'low').length,
      outOfStock: formattedInventory.filter((item: any) => item.status === 'out of stock').length,
      sufficient: formattedInventory.filter((item: any) => item.status === 'sufficient').length
    }

    return NextResponse.json({
      success: true,
      data: formattedInventory,
      inventory: formattedInventory,
      stats: stats
    })

  } catch (error: any) {
    console.error('Error fetching dashboard blood inventory:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch blood inventory',
        data: [],
        inventory: []
      },
      { status: 500 }
    )
  }
}