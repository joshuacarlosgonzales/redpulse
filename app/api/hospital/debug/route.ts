// app/api/hospital/debug/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Hospital from '@/models/Hospital'
import BloodRequest from '@/models/BloodRequest'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Get all hospitals
    const allHospitals = await Hospital.find({})
      .select('hospitalName hospitalAddress status userId')
      .lean()

    // Get active hospitals
    const activeHospitals = await Hospital.find({ status: 'active' })
      .select('hospitalName hospitalAddress')
      .lean()

    // Get all blood requests
    const allRequests = await BloodRequest.find({})
      .select('hospitalName hospitalId status bloodType')
      .limit(20)
      .lean()

    // Get users with hospital role
    const hospitalUsers = await User.find({ role: 'hospital' })
      .select('fullName email hospitalName')
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        hospitals: {
          total: allHospitals.length,
          active: activeHospitals.length,
          list: allHospitals.map(h => ({
            name: h.hospitalName,
            status: h.status,
            address: h.hospitalAddress,
            userId: h.userId
          })),
          activeList: activeHospitals.map(h => ({
            name: h.hospitalName,
            address: h.hospitalAddress
          }))
        },
        bloodRequests: {
          total: allRequests.length,
          list: allRequests.map(r => ({
            hospitalName: r.hospitalName,
            hospitalId: r.hospitalId,
            status: r.status,
            bloodType: r.bloodType
          }))
        },
        hospitalUsers: hospitalUsers.map(u => ({
          name: u.fullName,
          email: u.email,
          hospitalName: u.hospitalName || 'Not set'
        }))
      },
      summary: {
        totalHospitals: allHospitals.length,
        activeHospitals: activeHospitals.length,
        totalRequests: allRequests.length,
        totalHospitalUsers: hospitalUsers.length,
        hasActiveHospitals: activeHospitals.length > 0,
        message: activeHospitals.length === 0 
          ? '⚠️ No active hospitals found. Please create a hospital using the Hospital Setup modal.'
          : '✅ Active hospitals found. Donors can request blood from these hospitals.'
      }
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: error.message || 'Debug failed' },
      { status: 500 }
    )
  }
}