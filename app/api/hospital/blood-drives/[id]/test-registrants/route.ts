import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import BloodDrive from '@/models/BloodDrive'  // ✅ Import BloodDrive
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const BloodDriveModel = BloodDrive as any

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
    
    let decoded: any
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
        { error: 'Invalid blood drive ID' },
        { status: 400 }
      )
    }

    const bloodDrive = await BloodDriveModel.findOne({
      _id: id,
      hospitalId: decoded.id
    }).lean()

    if (!bloodDrive) {
      return NextResponse.json(
        { error: 'Blood drive not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        registeredDonorIds: bloodDrive.registeredDonorIds || [],
        registeredDonors: bloodDrive.registeredDonors || 0,
        registeredDonorIdsCount: bloodDrive.registeredDonorIds?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    )
  }
}