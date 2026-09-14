// app/api/hospital/donors/route.ts

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import BloodDrive from '@/models/BloodDrive'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import Donation from '@/models/Donation'
import User from '@/models/User'
import {
  getAuthenticatedHospitalUser,
  getUserIdFromAuth,
  isAuthFailure,
} from '@/lib/hospitalAuth'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION
    // ============================================================
    const auth = getAuthenticatedHospitalUser(request)

    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user

    // ============================================================
    // QUERY PARAMETERS
    // ============================================================
    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const bloodType = searchParams.get('bloodType') || ''

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    // ============================================================
    // GET HOSPITAL INFO
    // ============================================================
    const hospitalId = decoded.role === 'hospital' ? getUserIdFromAuth(decoded) : null

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID not found' },
        { status: 401 }
      )
    }

    const hospitalUser = await User.findById(hospitalId)
      .select('email hospitalName')
      .lean()

    const hospitalEmail = hospitalUser?.email || decoded.email
    const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId)

    console.log('=== HOSPITAL DONORS API ===')
    console.log('Hospital ID:', hospitalId)
    console.log('Hospital Email:', hospitalEmail)

    // ============================================================
    // BUILD DONOR QUERY - ONLY DONORS WITH DONATIONS AT THIS HOSPITAL
    // ============================================================
    const donorQuery: any = {}

    if (status !== 'all' && status) {
      const validStatuses = ['pending', 'active', 'inactive', 'approved', 'rejected']
      if (validStatuses.includes(status)) {
        donorQuery.status = status
      }
    }

    if (bloodType && bloodType !== 'all') {
      donorQuery.bloodType = bloodType
    }

    if (search) {
      donorQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { digitalId: { $regex: search, $options: 'i' } },
      ]
    }

    // ============================================================
    // ✅ FIX: Get ALL donor IDs from donations at THIS hospital ONLY
    // ============================================================
    const donationDonorIds = await Donation.distinct('donorId', {
      hospitalId: hospitalObjectId,
      status: { $in: ['Completed', 'Pending', 'Scheduled'] },
    })

    // ✅ Get walk-in donors approved by this hospital
    const walkInDonors = await Donor.distinct('_id', {
      isWalkIn: true,
      approvedBy: hospitalEmail,
    })

    // ✅ Get donors from blood drive registrations at this hospital
    const bloodDriveDonorIds = await BloodDriveRegistration.distinct('donorId', {
      hospitalId: hospitalObjectId,
      status: { $in: ['registered', 'attended'] },
    })

    console.log(`📊 Donor breakdown for ${hospitalEmail}:`)
    console.log(`   - From donations: ${donationDonorIds.length}`)
    console.log(`   - Walk-in donors: ${walkInDonors.length}`)
    console.log(`   - From blood drives: ${bloodDriveDonorIds.length}`)

    const allDonorIds = [...donationDonorIds, ...walkInDonors, ...bloodDriveDonorIds]

    const uniqueDonorIds = Array.from(
      new Set(allDonorIds.map((id) => id.toString()))
    ).map((id) => new mongoose.Types.ObjectId(id))

    console.log(`✅ Total unique donors: ${uniqueDonorIds.length}`)

    if (uniqueDonorIds.length === 0) {
      return NextResponse.json({
        success: true,
        donors: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      })
    }

    donorQuery._id = { $in: uniqueDonorIds }

    console.log('=== FINAL QUERY ===')
    console.log('donorQuery:', JSON.stringify(donorQuery, null, 2))

    // ============================================================
    // FETCH DONORS
    // ============================================================
    const donorDocs = await Donor.find(donorQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Donor.countDocuments(donorQuery)

    console.log(
      `📋 Returning ${donorDocs.length} donors (page ${page}/${Math.ceil(total / limit)})`
    )

    // ============================================================
    // PREPARE LOOKUP IDs (Donor._id + linked User._id)
    // ============================================================
    const donorDocsWithIds = donorDocs.map((donor: any) => {
      const donorId = donor._id.toString()
      const userId = donor.userId?.toString() || null
      return { ...donor, donorId, userId }
    })

    const lookupIds: mongoose.Types.ObjectId[] = []
    const donorIdToLookupKeys = new Map<string, string[]>()

    donorDocsWithIds.forEach((d: any) => {
      const keys: string[] = [d.donorId]
      if (d.userId && d.userId !== d.donorId) {
        keys.push(d.userId)
      }
      donorIdToLookupKeys.set(d.donorId, keys)

      keys.forEach((k) => {
        if (mongoose.Types.ObjectId.isValid(k)) {
          lookupIds.push(new mongoose.Types.ObjectId(k))
        }
      })
    })

    const uniqueLookupIds = Array.from(
      new Set(lookupIds.map((id) => id.toString()))
    ).map((id) => new mongoose.Types.ObjectId(id))

    // ============================================================
    // FETCH BLOOD DRIVES + REGISTRATIONS - ONLY FROM THIS HOSPITAL
    // ============================================================
    const bloodDrives = await BloodDrive.find({
      registeredDonorIds: { $in: uniqueLookupIds },
      hospitalId: hospitalObjectId, // ✅ Filter by hospital
    })
      .select('title date status registeredDonorIds donorStatuses hospitalId location')
      .lean()

    console.log(`📊 Found ${bloodDrives.length} blood drives from this hospital`)

    const registrations = await BloodDriveRegistration.find({
      donorId: { $in: uniqueLookupIds },
      hospitalId: hospitalObjectId, // ✅ Filter by hospital
    })
      .populate('bloodDriveId', 'title date location status hospitalId')
      .lean()

    console.log(`📊 Found ${registrations.length} registrations from this hospital`)

    // ============================================================
    // ✅ FIX: Fetch ONLY donations from THIS hospital
    // ============================================================
    const allDonations = await Donation.find({
      donorId: { $in: uniqueLookupIds },
      hospitalId: hospitalObjectId, // ✅ CRITICAL FIX: Filter by hospital
    })
      .sort({ date: -1, createdAt: -1 })
      .lean()

    console.log(`📊 Found ${allDonations.length} total donations from this hospital`)

    // ============================================================
    // TRANSFORM DONORS
    // ============================================================
    const transformedDonors = donorDocsWithIds.map((donor: any) => {
      const donorId = donor.donorId
      const userId = donor.userId
      const possibleKeys = donorIdToLookupKeys.get(donorId) || [donorId]

      // ---------- BUILD registeredEvents ----------
      const registeredEvents: any[] = []

      // 1. From BloodDrive.registeredDonorIds
      bloodDrives.forEach((drive: any) => {
        const driveId = drive._id.toString()

        const isInDrive = drive.registeredDonorIds?.some((id: any) =>
          possibleKeys.includes(id.toString())
        )
        if (!isInDrive) return

        const registration = registrations.find((reg: any) => {
          const regDriveId =
            reg.bloodDriveId?._id?.toString() || reg.bloodDriveId?.toString()
          return (
            regDriveId === driveId &&
            possibleKeys.includes(reg.donorId?.toString())
          )
        })

        let eventStatus = registration?.status || 'registered'

        // Check donorStatuses map
        if (drive.donorStatuses) {
          for (const key of possibleKeys) {
            const status =
              drive.donorStatuses[key] ||
              (typeof drive.donorStatuses.get === 'function'
                ? drive.donorStatuses.get(key)
                : null)
            if (status === 'attended' || status === 'completed') {
              eventStatus = 'attended'
              break
            }
          }
        }

        // Check completed donation for this drive
        const completedDonation = allDonations.find(
          (d: any) =>
            possibleKeys.includes(d.donorId?.toString()) &&
            d.bloodDriveId?.toString() === driveId &&
            d.status === 'Completed'
        )
        if (completedDonation) {
          eventStatus = 'attended'
        }

        registeredEvents.push({
          eventId: driveId,
          eventTitle: drive.title || 'Blood Drive',
          eventDate: drive.date ? new Date(drive.date).toISOString() : null,
          status: eventStatus,
          registeredAt: registration?.registeredAt || null,
          attendedAt:
            registration?.attendedAt ||
            (completedDonation ? completedDonation.date : null),
          bloodDriveId: driveId,
        })
      })

      // 2. Registrations not already covered
      registrations.forEach((reg: any) => {
        if (!possibleKeys.includes(reg.donorId?.toString())) return

        const bloodDriveId =
          reg.bloodDriveId?._id?.toString() || reg.bloodDriveId?.toString()
        if (!bloodDriveId) return

        const alreadyExists = registeredEvents.some(
          (e) => e.eventId === bloodDriveId
        )
        if (alreadyExists) return

        const drive = reg.bloodDriveId || {}
        registeredEvents.push({
          eventId: bloodDriveId,
          eventTitle: drive.title || 'Blood Drive',
          eventDate: drive.date ? new Date(drive.date).toISOString() : null,
          status: reg.status || 'registered',
          registeredAt: reg.registeredAt || null,
          attendedAt: reg.attendedAt || null,
          bloodDriveId,
        })
      })

      // Sort newest first
      registeredEvents.sort((a, b) => {
        const da = a.eventDate ? new Date(a.eventDate).getTime() : 0
        const db = b.eventDate ? new Date(b.eventDate).getTime() : 0
        return db - da
      })

      // ---------- FULL DONATION HISTORY ----------
      // ✅ FIX: Include ONLY donations from THIS hospital
      let donorDonations = allDonations.filter((d: any) =>
        possibleKeys.includes(d.donorId?.toString())
      )

      // Also try to match by email as fallback (still filtered by hospital)
      if (donor.email) {
        const emailMatches = allDonations.filter((d: any) =>
          d.donorEmail?.toLowerCase() === donor.email?.toLowerCase()
        )
        // Merge and deduplicate
        const existingIds = new Set(donorDonations.map((d: any) => d._id?.toString()))
        emailMatches.forEach((d: any) => {
          const id = d._id?.toString()
          if (id && !existingIds.has(id)) {
            donorDonations.push(d)
            existingIds.add(id)
          }
        })
      }

      // Remove duplicates just in case
      const uniqueDonationMap = new Map<string, any>()
      donorDonations.forEach((d: any) => {
        const id = d._id?.toString()
        if (id && !uniqueDonationMap.has(id)) {
          uniqueDonationMap.set(id, d)
        }
      })

      const sortedDonations = Array.from(uniqueDonationMap.values()).sort(
        (a: any, b: any) => {
          const dateA = a.date
            ? new Date(a.date).getTime()
            : a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0
          const dateB = b.date
            ? new Date(b.date).getTime()
            : b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0
          return dateB - dateA
        }
      )

      console.log(`📊 ${sortedDonations.length} donations for ${donor.fullName}`)

      const donationHistory = sortedDonations.map((donation: any) => ({
        id: donation._id.toString(),
        donationId: donation._id.toString(),
        donorId: donation.donorId?.toString() || '',
        bloodDriveId: donation.bloodDriveId?.toString() || '',
        hospitalId: donation.hospitalId?.toString() || '',
        donorName: donation.donorName || donor.fullName || '',
        donorEmail: donation.donorEmail || donor.email || '',
        donorPhone: donation.donorPhone || donor.phone || '',
        bloodType: donation.bloodType || donor.bloodType || '',
        units: donation.units || 0,
        date: donation.date ? new Date(donation.date).toISOString() : null,
        donationDate: donation.date
          ? new Date(donation.date).toISOString()
          : null,
        status: (donation.status || 'Pending').toLowerCase(),
        hospital: donation.hospital || '',
        notes: donation.notes || '',
        eventTitle: donation.bloodDriveId
          ? 'Blood Drive Donation'
          : donation.isWalkIn
            ? 'Walk-in Donation'
            : 'Blood Donation',
        location: donation.hospital || '',
        recordedBy: donation.hospital || 'Hospital Staff',
        createdAt: donation.createdAt
          ? new Date(donation.createdAt).toISOString()
          : null,
        updatedAt: donation.updatedAt
          ? new Date(donation.updatedAt).toISOString()
          : null,
        isWalkIn: donation.isWalkIn || false,
      }))

      const completedDonations = donationHistory.filter(
        (d: any) => d.status === 'completed'
      )

      const totalDonationUnits = completedDonations.reduce(
        (total: number, d: any) => total + Number(d.units || 0),
        0
      )

      const latestDonation =
        completedDonations.length > 0
          ? completedDonations
              .slice()
              .sort(
                (a: any, b: any) =>
                  new Date(b.date || 0).getTime() -
                  new Date(a.date || 0).getTime()
              )[0]
          : null

      let lastDonationDate = donor.lastDonationDate
        ? new Date(donor.lastDonationDate).toISOString().split('T')[0]
        : null

      if (latestDonation?.date) {
        lastDonationDate = new Date(latestDonation.date)
          .toISOString()
          .split('T')[0]
      }

      // ---------- FINAL DONOR OBJECT ----------
      return {
        id: donorId,
        userId: userId || '',
        fullName: donor.fullName || 'Unknown',
        email: donor.email || '',
        phone: donor.phone || '',
        bloodType: donor.bloodType || 'Unknown',
        status: donor.status || 'pending',
        location: donor.address || '',
        address: donor.address || '',
        lastDonation: lastDonationDate || 'Not specified',
        totalDonations: completedDonations.length,
        registered: donor.createdAt
          ? new Date(donor.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        nextEligible: donor.nextEligibleDate
          ? new Date(donor.nextEligibleDate).toISOString().split('T')[0]
          : 'Not yet eligible',
        digitalId: donor.digitalId || '',
        barangay: donor.barangay || '',
        municipality: donor.municipality || '',
        province: donor.province || '',
        dateOfBirth: donor.dateOfBirth
          ? new Date(donor.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: donor.gender || '',
        weight: donor.weight || 0,
        emergencyContact: donor.emergencyContact || '',
        medicalConditions: donor.medicalConditions || '',
        currentMedications: donor.currentMedications || '',
        approvedBy: donor.approvedBy || '',
        approvedAt: donor.approvedAt || null,
        rejectionReason: donor.rejectionReason || '',
        isEligible: donor.isEligible || false,
        points: completedDonations.length * 10,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
        emergencyName: donor.emergencyName || '',
        emergencyRelationship: donor.emergencyRelationship || '',
        backgroundCheckStatus: donor.backgroundCheckStatus || 'pending',
        backgroundCheckDate: donor.backgroundCheckDate || null,
        backgroundCheckNotes: donor.backgroundCheckNotes || '',
        verifiedBy: donor.verifiedBy || '',
        verificationDate: donor.verificationDate || null,
        registeredEvents,
        upcomingEventsCount: registeredEvents.filter((event: any) => {
          if (!event.eventDate) return false
          return (
            new Date(event.eventDate) > new Date() &&
            event.status === 'registered'
          )
        }).length,
        attendedEventsCount: registeredEvents.filter(
          (event: any) => event.status === 'attended'
        ).length,
        donationHistory,
        donationCount: donationHistory.length,
        completedDonationCount: completedDonations.length,
        totalDonationUnits,
        isWalkIn: donor.isWalkIn || false,
        registrationType: donor.registrationType || 'regular',
      }
    })

    // ============================================================
    // RESPONSE
    // ============================================================
    return NextResponse.json({
      success: true,
      donors: transformedDonors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching hospital donors:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch donors',
      },
      {
        status: 500,
      }
    )
  }
}