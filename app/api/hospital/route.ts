// app/api/hospitals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Hospital from '@/models/Hospital'

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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Build filter - show active hospitals
    const filter: any = { status: 'active' }
    
    if (search) {
      filter.hospitalName = { $regex: search, $options: 'i' }
    }

    const hospitals = await Hospital.find(filter)
      .select('hospitalName hospitalAddress hospitalPhone hospitalLicense')
      .sort({ hospitalName: 1 })
      .limit(50)
      .lean()

    const transformedHospitals = hospitals.map((hospital: any) => ({
      id: hospital._id.toString(),
      name: hospital.hospitalName,
      address: hospital.hospitalAddress || '',
      phone: hospital.hospitalPhone || '',
      license: hospital.hospitalLicense || ''
    }))

    return NextResponse.json({
      success: true,
      data: transformedHospitals
    })

  } catch (error: any) {
    console.error('Error fetching hospitals:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hospitals' },
      { status: 500 }
    )
  }
}