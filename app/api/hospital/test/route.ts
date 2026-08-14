// app/api/hospitals/test/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Hospital from '@/models/Hospital'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Get ALL hospitals (no filter)
    const allHospitals = await Hospital.find({})
      .lean()

    return NextResponse.json({
      success: true,
      total: allHospitals.length,
      hospitals: allHospitals.map(h => ({
        id: h._id,
        name: h.hospitalName,
        status: h.status,
        address: h.hospitalAddress
      }))
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}