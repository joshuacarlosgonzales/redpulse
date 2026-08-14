// app/api/hospital/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import Hospital from '@/models/Hospital'
import User from '@/models/User'

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

    if (!decoded || decoded.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    const hospital = await Hospital.findOne({ userId: decoded.userId })
    const user = await User.findById(decoded.userId)

    if (!hospital) {
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          hospitalName: user?.hospitalName || 'Not set',
          hospitalAddress: '',
          hospitalPhone: '',
          hospitalEmail: user?.email || '',
          hospitalLicense: '',
          hospitalType: 'General Hospital',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        hospitalAddress: hospital.hospitalAddress || '',
        hospitalPhone: hospital.hospitalPhone || '',
        hospitalEmail: hospital.hospitalEmail || user?.email || '',
        hospitalLicense: hospital.hospitalLicense || '',
        hospitalType: hospital.hospitalType || 'General Hospital',
        status: hospital.status || 'active',
        createdAt: hospital.createdAt,
        updatedAt: hospital.updatedAt
      }
    })

  } catch (error: any) {
    console.error('Error fetching hospital profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hospital profile' },
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
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    if (!decoded || decoded.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { hospitalName, hospitalAddress, hospitalPhone, hospitalType } = body

    if (!hospitalName) {
      return NextResponse.json(
        { error: 'Hospital name is required' },
        { status: 400 }
      )
    }

    let hospital = await Hospital.findOne({ userId: decoded.userId })

    if (!hospital) {
      // Create new hospital
      const tempLicense = `HOSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      hospital = await Hospital.create({
        hospitalName,
        hospitalAddress: hospitalAddress || 'Address not provided',
        hospitalPhone: hospitalPhone || 'N/A',
        hospitalLicense: tempLicense,
        userId: decoded.userId,
        status: 'active',
        hospitalType: hospitalType || 'General Hospital',
        hospitalCapacity: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } else {
      // Update existing hospital
      if (hospitalName) hospital.hospitalName = hospitalName
      if (hospitalAddress) hospital.hospitalAddress = hospitalAddress
      if (hospitalPhone) hospital.hospitalPhone = hospitalPhone
      if (hospitalType) hospital.hospitalType = hospitalType
      hospital.updatedAt = new Date()
      await hospital.save()
    }

    // Update user's hospitalName
    await User.findByIdAndUpdate(decoded.userId, {
      hospitalName: hospitalName
    })

    return NextResponse.json({
      success: true,
      data: {
        id: hospital._id,
        hospitalName: hospital.hospitalName,
        hospitalAddress: hospital.hospitalAddress,
        hospitalPhone: hospital.hospitalPhone,
        hospitalType: hospital.hospitalType,
        status: hospital.status
      },
      message: 'Profile updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating hospital profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update hospital profile' },
      { status: 500 }
    )
  }
}