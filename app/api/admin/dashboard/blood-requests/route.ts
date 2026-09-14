// app/api/admin/dashboard/blood-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodRequest from '@/models/BloodRequest'
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
    const status = searchParams.get('status') || 'pending'
    const urgency = searchParams.get('urgency') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const filter: any = {}
    if (status !== 'all') filter.status = status
    if (urgency !== 'all') filter.urgency = urgency

    const [requests, total] = await Promise.all([
      BloodRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BloodRequest.countDocuments(filter)
    ])

    const transformedRequests = requests.map((req: any) => ({
      id: req._id.toString(),
      donorId: req.donorId?.toString() || '',
      donorName: req.donorName || 'Unknown',
      donorEmail: req.donorEmail || '',
      donorPhone: req.donorPhone || '',
      bloodType: req.bloodType || 'N/A',
      quantity: req.quantity || 1,
      urgency: req.urgency || 'normal',
      status: req.status || 'pending',
      requestDate: req.requestDate || new Date().toISOString(),
      requiredDate: req.requiredDate || new Date().toISOString(),
      hospitalName: req.hospitalName || 'Unknown Hospital',
      hospitalAddress: req.hospitalAddress || '',
      patientName: req.patientName || '',
      notes: req.notes || ''
    }))

    return NextResponse.json({
      success: true,
      data: transformedRequests,
      requests: transformedRequests,
      total: total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching blood requests:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch blood requests',
        data: [],
        requests: []
      },
      { status: 500 }
    )
  }
}