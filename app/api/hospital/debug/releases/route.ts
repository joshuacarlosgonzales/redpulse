import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodRelease from '@/models/BloodRelease'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

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
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital or Admin access required' },
        { status: 403 }
      )
    }

    const hospitalId = decoded.userId || decoded.id
    console.log('🔍 Debug: Checking BloodRelease records for hospital:', hospitalId)

    // Get ALL releases (no filter)
    const allReleases = await BloodRelease.find({}).lean()
    console.log(`📊 Total BloodRelease records in database: ${allReleases.length}`)

    // Get releases for this hospital
    const hospitalReleases = await BloodRelease.find({
      hospitalId: new mongoose.Types.ObjectId(hospitalId)
    }).lean()
    console.log(`📊 Hospital BloodRelease records: ${hospitalReleases.length}`)

    // Get releases grouped by status
    const statusGroups = await BloodRelease.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    // Get releases grouped by blood type
    const bloodTypeGroups = await BloodRelease.aggregate([
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 },
          totalUnits: { $sum: '$units' }
        }
      }
    ])

    return NextResponse.json({
      success: true,
      summary: {
        totalInDatabase: allReleases.length,
        totalForHospital: hospitalReleases.length,
        statusGroups: statusGroups,
        bloodTypeGroups: bloodTypeGroups,
      },
      hospitalId: hospitalId,
      allReleases: allReleases.map((r: any) => ({
        id: r._id.toString(),
        bloodType: r.bloodType,
        units: r.units,
        patientName: r.patientName,
        hospitalWard: r.hospitalWard,
        doctorName: r.doctorName,
        reason: r.reason,
        releaseDate: r.releaseDate,
        status: r.status,
        receiptNumber: r.receiptNumber,
        hospitalId: r.hospitalId?.toString(),
        donorName: r.donorName,
        createdAt: r.createdAt,
      })),
      hospitalReleases: hospitalReleases.map((r: any) => ({
        id: r._id.toString(),
        bloodType: r.bloodType,
        units: r.units,
        patientName: r.patientName,
        hospitalWard: r.hospitalWard,
        doctorName: r.doctorName,
        reason: r.reason,
        releaseDate: r.releaseDate,
        status: r.status,
        receiptNumber: r.receiptNumber,
        donorName: r.donorName,
        createdAt: r.createdAt,
      })),
    })

  } catch (error: any) {
    console.error('❌ Debug error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch debug info' },
      { status: 500 }
    )
  }
}