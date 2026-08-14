// app/api/hospitals/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Hospital from '@/models/Hospital'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

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

    const body = await request.json()
    const { hospitalName, hospitalAddress, hospitalPhone } = body

    if (!hospitalName) {
      return NextResponse.json(
        { error: 'Hospital name is required' },
        { status: 400 }
      )
    }

    // Check if hospital already exists
    let hospital = await Hospital.findOne({ 
      hospitalName: { $regex: new RegExp('^' + hospitalName + '$', 'i') } 
    })

    if (hospital) {
      // Update to active if not already
      if (hospital.status !== 'active') {
        hospital.status = 'active'
        await hospital.save()
      }
      return NextResponse.json({
        success: true,
        message: 'Hospital already exists and is now active',
        data: {
          id: hospital._id,
          name: hospital.hospitalName,
          address: hospital.hospitalAddress,
          status: hospital.status
        }
      })
    }

    // Create new hospital
    const tempLicense = `HOSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    hospital = await Hospital.create({
      hospitalName,
      hospitalAddress: hospitalAddress || 'Address not provided',
      hospitalPhone: hospitalPhone || 'N/A',
      hospitalLicense: tempLicense,
      userId: decoded.userId,
      status: 'active',
      hospitalType: 'General Hospital',
      hospitalCapacity: 0,
      hospitalEmail: decoded.email || '',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Update user's hospitalName
    await User.findByIdAndUpdate(decoded.userId, {
      hospitalName: hospitalName
    })

    return NextResponse.json({
      success: true,
      message: 'Hospital created successfully!',
      data: {
        id: hospital._id,
        name: hospital.hospitalName,
        address: hospital.hospitalAddress,
        status: hospital.status
      }
    })

  } catch (error: any) {
    console.error('Error creating hospital:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create hospital' },
      { status: 500 }
    )
  }
}