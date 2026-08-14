// app/api/hospital/donors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import User from '@/models/User'
import BloodDrive from '@/models/BloodDrive'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Get token from header
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
      
      // Check if user is hospital or admin
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const bloodType = searchParams.get('bloodType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build query for donors
    const donorQuery: any = {}

    // Status filter
    if (status !== 'all' && status) {
      const statusMap: Record<string, string> = {
        'active': 'active',
        'approved': 'active',
        'pending': 'pending',
        'inactive': 'inactive',
        'rejected': 'inactive'
      }
      donorQuery.status = statusMap[status] || status
    }

    // Blood type filter
    if (bloodType && bloodType !== 'all') {
      donorQuery.bloodType = bloodType
    }

    // Search filter
    if (search) {
      donorQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { digitalId: { $regex: search, $options: 'i' } },
      ]
    }

    // Get donors from donor collection
    const donorDocs = await Donor.find(donorQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count
    const total = await Donor.countDocuments(donorQuery)

    // Get all donor IDs for fetching registrations
    const donorIds = donorDocs.map(d => d._id)

    // Fetch blood drives where these donors are registered
    let bloodDrives: any[] = []
    if (donorIds.length > 0) {
      bloodDrives = await BloodDrive.find({
        registeredDonorIds: { $in: donorIds }
      })
        .select('title date status registeredDonorIds')
        .lean()
    }

    // Transform donors
    const transformedDonors = donorDocs.map((donor: any) => {
      // Get registrations for this donor
      const donorRegistrations = bloodDrives.filter(
        (drive: any) => drive.registeredDonorIds && drive.registeredDonorIds.some(
          (id: any) => id.toString() === donor._id.toString()
        )
      )

      // Transform registrations
      const registeredEvents = donorRegistrations.map((drive: any) => {
        const statusMap: Record<string, string> = {
          'upcoming': 'registered',
          'ongoing': 'registered',
          'completed': 'attended',
          'cancelled': 'cancelled'
        }
        return {
          eventId: drive._id.toString(),
          eventTitle: drive.title || 'Blood Drive',
          eventDate: drive.date || new Date().toISOString(),
          status: statusMap[drive.status] || 'registered',
          registeredAt: new Date().toISOString()
        }
      })

      // Count upcoming events
      const upcomingEventsCount = registeredEvents.filter(
        (e: any) => new Date(e.eventDate) > new Date() && e.status === 'registered'
      ).length

      return {
        id: donor._id.toString(),
        userId: donor.userId?.toString() || '',
        fullName: donor.fullName || 'Unknown',
        email: donor.email || '',
        phone: donor.phone || '',
        bloodType: donor.bloodType || 'Unknown',
        status: donor.status || 'pending',
        location: donor.address || '',
        lastDonation: donor.lastDonationDate 
          ? new Date(donor.lastDonationDate).toISOString().split('T')[0] 
          : 'No donations yet',
        totalDonations: donor.totalDonations || 0,
        registered: donor.createdAt 
          ? new Date(donor.createdAt).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
        nextEligible: donor.nextEligibleDate 
          ? new Date(donor.nextEligibleDate).toISOString().split('T')[0] 
          : 'Not yet eligible',
        digitalId: donor.digitalId || '',
        address: donor.address || '',
        barangay: donor.barangay || '',
        municipality: donor.municipality || '',
        province: donor.province || '',
        dateOfBirth: donor.dateOfBirth ? new Date(donor.dateOfBirth).toISOString().split('T')[0] : '',
        gender: donor.gender || '',
        weight: donor.weight || 0,
        emergencyContact: donor.emergencyContact || '',
        medicalConditions: donor.medicalConditions || '',
        currentMedications: donor.currentMedications || '',
        approvedBy: donor.approvedBy || '',
        approvedAt: donor.approvedAt || null,
        rejectionReason: donor.rejectionReason || '',
        isEligible: donor.isEligible || false,
        points: (donor.totalDonations || 0) * 10,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
        emergencyName: donor.emergencyName || '',
        emergencyRelationship: donor.emergencyRelationship || '',
        // ✅ Added missing fields for frontend
        backgroundCheckStatus: donor.backgroundCheckStatus || 'pending',
        backgroundCheckDate: donor.backgroundCheckDate || null,
        backgroundCheckNotes: donor.backgroundCheckNotes || '',
        verifiedBy: donor.verifiedBy || '',
        verificationDate: donor.verificationDate || null,
        registeredEvents: registeredEvents,
        upcomingEventsCount: upcomingEventsCount,
      }
    })

    return NextResponse.json({
      success: true,
      donors: transformedDonors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error: any) {
    console.error('Error fetching hospital donors:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch donors' },
      { status: 500 }
    )
  }
}