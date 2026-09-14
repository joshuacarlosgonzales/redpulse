import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

import dbConnect from '@/lib/mongodb'
import Donor from '@/models/Donor'
import BloodDrive from '@/models/BloodDrive'
import Donation from '@/models/Donation'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import User from '@/models/User'

import {
  getAuthenticatedHospitalUser,
  getUserIdFromAuth,
  isAuthFailure,
} from '@/lib/hospitalAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) return auth.response
    const decoded = auth.user

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid donor ID format' }, { status: 400 })
    }

    const requestedDonorId = new mongoose.Types.ObjectId(id)
    const donor = await Donor.findById(requestedDonorId).lean()

    if (!donor) {
      return NextResponse.json({ error: 'Donor not found' }, { status: 404 })
    }

    const donorId = donor._id.toString()
    const userId = donor.userId?.toString() || null

    const hospitalId = decoded.role === 'hospital' ? getUserIdFromAuth(decoded) : null
    const hospitalObjectId =
      hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)
        ? new mongoose.Types.ObjectId(hospitalId)
        : null

    let hospitalUser: any = null
    if (decoded.role === 'hospital' && hospitalObjectId) {
      hospitalUser = await User.findById(hospitalObjectId)
        .select('email fullName hospitalName name organizationName')
        .lean()
    }

    const currentHospitalName = (
      hospitalUser?.hospitalName ||
      hospitalUser?.organizationName ||
      hospitalUser?.fullName ||
      hospitalUser?.name ||
      ''
    ).trim()

    // ==========================================================
    // BUILD DONOR LOOKUP IDS
    // ==========================================================
    const lookupIds: mongoose.Types.ObjectId[] = [donor._id]
    if (userId && mongoose.Types.ObjectId.isValid(userId) && userId !== donorId) {
      lookupIds.push(new mongoose.Types.ObjectId(userId))
    }

    const donorConditions: any[] = [{ donorId: { $in: lookupIds } }]
    if (donor.email && typeof donor.email === 'string') {
      donorConditions.push({ donorEmail: donor.email.trim().toLowerCase() })
    }
    const donorMatch = { $or: donorConditions }

    // ==========================================================
    // HOSPITAL-SPECIFIC DONATION QUERY
    // ==========================================================
    let donationQuery: any

    if (decoded.role === 'hospital' && hospitalObjectId) {
      const hospitalConditions: any[] = [
        { hospitalId: hospitalObjectId },
        { hospitalId: hospitalObjectId.toString() }, // Fallback if saved as string
      ]

      if (currentHospitalName) {
        // CRITICAL FIX: Case-insensitive exact match for hospital name.
        // This catches older donations that have a wrong/duplicate hospitalId 
        // (e.g., ...527 instead of ...526) but the correct hospital name.
        const hospitalNameRegex = new RegExp(
          `^${currentHospitalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        )
        hospitalConditions.push({ hospital: hospitalNameRegex })
      }

      donationQuery = {
        $and: [donorMatch, { $or: hospitalConditions }],
      }
    } else {
      // ADMIN
      donationQuery = donorMatch
    }

    console.log(`🏥 Hospital Match: Allowing donations with hospitalId=${hospitalObjectId} OR hospital name matching "${currentHospitalName}"`)

    // ==========================================================
    // FETCH FILTERED DONATIONS
    // ==========================================================
    let donations = await Donation.find(donationQuery).sort({ date: -1, createdAt: -1 }).lean()

    console.log(`✅ Query matched ${donations.length} donations for this hospital.`)

    // Remove duplicates
    const uniqueDonationMap = new Map<string, any>()
    for (const donation of donations) {
      const donationId = donation._id?.toString()
      if (donationId && !uniqueDonationMap.has(donationId)) {
        uniqueDonationMap.set(donationId, donation)
      }
    }
    donations = Array.from(uniqueDonationMap.values())

    // ==========================================================
    // HOSPITAL ACCESS CHECK
    // ==========================================================
    if (decoded.role === 'hospital' && hospitalObjectId) {
      let hasAccess = donations.length > 0

      if (!hasAccess && donor.isWalkIn === true && hospitalUser?.email && donor.approvedBy) {
        if (donor.approvedBy.toLowerCase() === hospitalUser.email.toLowerCase()) {
          hasAccess = true
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied - donor does not belong to your hospital' },
          { status: 403 }
        )
      }
    }

    // ==========================================================
    // FETCH EVENTS (Blood Drives & Registrations)
    // ==========================================================
    const registeredEvents: any[] = []
    
    const bloodDriveQuery: any = { registeredDonorIds: { $in: lookupIds } }
    if (decoded.role === 'hospital' && hospitalObjectId) {
      bloodDriveQuery.hospitalId = hospitalObjectId
    }

    const bloodDrives = await BloodDrive.find(bloodDriveQuery)
      .select('title date status registeredDonorIds donorStatuses hospitalId location')
      .lean()

    const registrations = await BloodDriveRegistration.find({ donorId: { $in: lookupIds } })
      .populate('bloodDriveId', 'title date location status hospitalId')
      .lean()

    const filteredRegistrations =
      decoded.role === 'hospital' && hospitalObjectId
        ? registrations.filter((reg: any) => reg.bloodDriveId?.hospitalId?.toString() === hospitalObjectId.toString())
        : registrations

    bloodDrives.forEach((drive: any) => {
      const driveId = drive._id.toString()
      const registration = filteredRegistrations.find(
        (reg: any) => (reg.bloodDriveId?._id?.toString() || reg.bloodDriveId?.toString()) === driveId
      )

      let eventStatus = 'registered'
      if (registration?.status === 'attended') eventStatus = 'attended'
      else if (registration?.status === 'cancelled') eventStatus = 'cancelled'

      if (drive.donorStatuses) {
        const lookupId = donor.isWalkIn ? donorId : userId || donorId
        const donorStatus = drive.donorStatuses[lookupId] || drive.donorStatuses.get?.(lookupId)
        if (donorStatus === 'attended' || donorStatus === 'completed') eventStatus = 'attended'
      }

      const hasCompletedDonation = donations.some((donation: any) => {
        const matchingDonor = lookupIds.some((id) => id.toString() === donation.donorId?.toString())
        return matchingDonor && donation.bloodDriveId?.toString() === driveId && (donation.status || '').toLowerCase() === 'completed'
      })

      if (hasCompletedDonation) eventStatus = 'attended'

      registeredEvents.push({
        eventId: driveId,
        eventTitle: drive.title || 'Blood Drive',
        eventDate: drive.date ? new Date(drive.date).toISOString() : null,
        eventLocation: drive.location || '',
        status: eventStatus,
        registeredAt: registration?.registeredAt || null,
        attendedAt: registration?.attendedAt || null,
        hospitalId: drive.hospitalId?.toString() || '',
        source: 'blood_drive',
      })
    })

    filteredRegistrations.forEach((registration: any) => {
      const bloodDriveId = registration.bloodDriveId?._id?.toString() || registration.bloodDriveId?.toString()
      if (!bloodDriveId || registeredEvents.some((e) => e.eventId === bloodDriveId)) return

      const drive = registration.bloodDriveId || {}
      if (decoded.role === 'hospital' && hospitalObjectId && drive.hospitalId?.toString() !== hospitalObjectId.toString()) return

      registeredEvents.push({
        eventId: bloodDriveId,
        eventTitle: drive.title || 'Blood Drive',
        eventDate: drive.date ? new Date(drive.date).toISOString() : null,
        eventLocation: drive.location || '',
        status: registration.status || 'registered',
        registeredAt: registration.registeredAt || null,
        attendedAt: registration.attendedAt || null,
        hospitalId: drive.hospitalId?.toString() || '',
        source: 'registration',
      })
    })

    registeredEvents.sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0
      return dateB - dateA
    })

    // ==========================================================
    // BUILD DONATION HISTORY & STATS
    // ==========================================================
    const donationHistory = donations.map((donation: any) => ({
      id: donation._id.toString(),
      donationId: donation._id.toString(),
      donationDate: donation.date ? new Date(donation.date).toISOString() : new Date().toISOString(),
      donorId: donation.donorId?.toString() || '',
      hospitalId: donation.hospitalId?.toString() || '',
      donorName: donation.donorName || donor.fullName || '',
      donorEmail: donation.donorEmail || donor.email || '',
      donorPhone: donation.donorPhone || donor.phone || '',
      bloodType: donation.bloodType || donor.bloodType || '',
      units: donation.units || 0,
      date: donation.date ? new Date(donation.date).toISOString() : null,
      status: (donation.status || 'pending').toLowerCase() as 'completed' | 'cancelled' | 'deferred' | 'pending',
      hospital: donation.hospital || '',
      notes: donation.notes || '',
      isWalkIn: donation.isWalkIn || false,
      eventTitle: donation.bloodDriveId ? 'Blood Drive Donation' : 'Walk-in Donation',
      location: donation.hospital || '',
      recordedBy: donation.hospital || 'Hospital Staff',
      createdAt: donation.createdAt ? new Date(donation.createdAt).toISOString() : null,
      updatedAt: donation.updatedAt ? new Date(donation.updatedAt).toISOString() : null,
    }))

    donationHistory.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })

    const completed = donationHistory.filter((item: any) => item.status === 'completed')
    
    let lastDonationDate: string | null = null
    if (completed.length > 0) {
      const latest = completed.slice().sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0]
      if (latest?.date) lastDonationDate = new Date(latest.date).toISOString().split('T')[0]
    }

    const attendedEvents = registeredEvents.filter((e: any) => e.status === 'attended')
    const upcomingEvents = registeredEvents.filter((e: any) => e.eventDate && new Date(e.eventDate) > new Date() && e.status === 'registered')
    const totalDonationUnits = completed.reduce((total: number, item: any) => total + Number(item.units || 0), 0)

    return NextResponse.json({
      success: true,
      donor: {
        id: donor._id.toString(),
        userId: userId || '',
        fullName: donor.fullName || 'Unknown',
        email: donor.email || '',
        phone: donor.phone || '',
        bloodType: donor.bloodType || 'Unknown',
        status: donor.status || 'pending',
        location: donor.address || '',
        address: donor.address || '',
        lastDonation: lastDonationDate || 'No donations yet',
        totalDonations: completed.length,
        registered: donor.createdAt ? new Date(donor.createdAt).toISOString().split('T')[0] : '',
        nextEligible: donor.nextEligibleDate ? new Date(donor.nextEligibleDate).toISOString().split('T')[0] : 'Not yet eligible',
        digitalId: donor.digitalId || '',
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
        points: completed.length * 10,
        emergencyName: donor.emergencyName || '',
        emergencyRelationship: donor.emergencyRelationship || '',
        backgroundCheckStatus: donor.backgroundCheckStatus || 'pending',
        backgroundCheckDate: donor.backgroundCheckDate || null,
        backgroundCheckNotes: donor.backgroundCheckNotes || '',
        verifiedBy: donor.verifiedBy || '',
        verificationDate: donor.verificationDate || null,
        isWalkIn: donor.isWalkIn || false,
        registeredEvents,
        upcomingEventsCount: upcomingEvents.length,
        attendedEventsCount: attendedEvents.length,
        donationHistory,
        donationCount: donationHistory.length,
        completedDonationCount: completed.length,
        totalDonationUnits,
      },
    })
  } catch (error: any) {
    console.error('Error fetching donor:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch donor' }, { status: 500 })
  }
}