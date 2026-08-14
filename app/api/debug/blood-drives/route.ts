// app/api/debug/blood-drives/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import BloodDrive from '@/models/BloodDrive'
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
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      if (decoded.role !== 'hospital' && decoded.role !== 'admin') {
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

    const bloodDrives = await BloodDrive.find({})
      .select('title registeredDonors registeredDonorIds createdAt')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: bloodDrives.map((drive: any) => ({
        id: drive._id.toString(),
        title: drive.title,
        registeredDonors: drive.registeredDonors || 0,
        registeredDonorIds: drive.registeredDonorIds || [],
        registeredDonorIdsCount: drive.registeredDonorIds?.length || 0,
        createdAt: drive.createdAt
      }))
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    )
  }
}