// app/api/hospital/donors/[id]/background-check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function POST(
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
      if (!decoded) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        )
      }
      
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

    const { id } = await params
    const { status, notes } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Background check status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'in-review', 'cleared', 'failed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, in-review, cleared, or failed' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    const donor = await Donor.findById(id)
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    donor.backgroundCheckStatus = status
    donor.backgroundCheckDate = new Date()
    donor.backgroundCheckNotes = notes || donor.backgroundCheckNotes || ''
    donor.verifiedBy = decoded.userId
    donor.verificationDate = new Date()

    await donor.save()

    const user = await User.findById(decoded.userId).select('fullName')

    return NextResponse.json({
      success: true,
      message: `Background check updated to ${status}`,
      donor: {
        id: donor._id.toString(),
        name: donor.fullName,
        email: donor.email,
        backgroundCheckStatus: donor.backgroundCheckStatus,
        backgroundCheckDate: donor.backgroundCheckDate,
        backgroundCheckNotes: donor.backgroundCheckNotes,
        verifiedBy: user?.fullName || decoded.userId,
        verificationDate: donor.verificationDate,
      }
    })

  } catch (error: any) {
    console.error('Error updating background check:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update background check' },
      { status: 500 }
    )
  }
}

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
      if (!decoded) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        )
      }
      
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

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid donor ID format' },
        { status: 400 }
      )
    }

    const donor = await Donor.findById(id).select(
      'fullName email backgroundCheckStatus backgroundCheckDate backgroundCheckNotes verifiedBy verificationDate'
    )
    
    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    let verifierName = null
    if (donor.verifiedBy) {
      const verifier = await User.findById(donor.verifiedBy).select('fullName')
      verifierName = verifier?.fullName || donor.verifiedBy
    }

    return NextResponse.json({
      success: true,
      data: {
        id: donor._id.toString(),
        fullName: donor.fullName,
        email: donor.email,
        status: donor.backgroundCheckStatus || 'pending',
        date: donor.backgroundCheckDate || null,
        notes: donor.backgroundCheckNotes || '',
        verifiedBy: verifierName || null,
        verificationDate: donor.verificationDate || null,
      }
    })

  } catch (error: any) {
    console.error('Error fetching background check:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch background check' },
      { status: 500 }
    )
  }
}