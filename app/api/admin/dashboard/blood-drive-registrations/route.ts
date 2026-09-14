// app/api/admin/dashboard/blood-drive-registrations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import BloodDrive from '@/models/BloodDrive'
import User from '@/models/User'
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Get registrations
    const registrations = await BloodDriveRegistration.find()
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await BloodDriveRegistration.countDocuments()

    // Get donor details
    const donorIds = registrations.map((r: any) => r.donorId).filter(Boolean)
    let donorMap = new Map()
    if (donorIds.length > 0) {
      const donors = await User.find({
        _id: { $in: donorIds }
      }).select('fullName email bloodType').lean()
      
      donors.forEach((d: any) => {
        donorMap.set(d._id.toString(), {
          fullName: d.fullName || 'Unknown Donor',
          email: d.email || '',
          bloodType: d.bloodType || 'N/A'
        })
      })
    }

    // Get blood drive titles
    const driveIds = registrations.map((r: any) => r.bloodDriveId).filter(Boolean)
    let driveMap = new Map()
    if (driveIds.length > 0) {
      const drives = await BloodDrive.find({
        _id: { $in: driveIds }
      }).select('title').lean()
      
      drives.forEach((d: any) => {
        driveMap.set(d._id.toString(), d.title || 'Untitled Drive')
      })
    }

    const transformedRegistrations = registrations.map((reg: any) => {
      const donor = donorMap.get(reg.donorId?.toString()) || {}
      return {
        id: reg._id.toString(),
        donorId: reg.donorId?.toString() || '',
        donorName: donor.fullName || 'Unknown Donor',
        donorEmail: donor.email || '',
        donorBloodType: donor.bloodType || 'N/A',
        bloodDriveId: reg.bloodDriveId?.toString() || '',
        bloodDriveTitle: driveMap.get(reg.bloodDriveId?.toString()) || 'Untitled Drive',
        status: reg.status || 'registered',
        registeredAt: reg.registeredAt || reg.createdAt || new Date().toISOString(),
        attendedAt: reg.attendedAt || null,
        cancelledAt: reg.cancelledAt || null,
        notes: reg.notes || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedRegistrations,
      registrations: transformedRegistrations,
      total: total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch registrations',
        data: [],
        registrations: []
      },
      { status: 500 }
    )
  }
}