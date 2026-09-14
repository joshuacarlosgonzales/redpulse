// app/api/hospital/donors/[id]/history/route.ts

import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Donor from "@/models/Donor"
import Donation from "@/models/Donation"
import User from "@/models/User"
import BloodDriveRegistration from "@/models/BloodDriveRegistration"
import {
  getAuthenticatedHospitalUser,
  getUserIdFromAuth,
  isAuthFailure,
} from "@/lib/hospitalAuth"
import mongoose from "mongoose"

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    await dbConnect()

    const auth = getAuthenticatedHospitalUser(request)

    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid donor ID format" },
        { status: 400 }
      )
    }

    const requestedDonorId = new mongoose.Types.ObjectId(id)

    // ============================================================
    // FIND DONOR - Try both Donor and User collections
    // ============================================================
    let donor: any = await Donor.findById(requestedDonorId).lean()
    let linkedUser: any = null

    if (!donor) {
      linkedUser = await User.findById(requestedDonorId)
        .select("_id fullName name email phone bloodType")
        .lean()

      if (linkedUser) {
        donor = await Donor.findOne({ userId: requestedDonorId }).lean()
      }
    }

    if (!donor && !linkedUser) {
      return NextResponse.json(
        { success: false, error: "Donor not found" },
        { status: 404 }
      )
    }

    const actualDonorId = donor?._id
      ? donor._id.toString()
      : requestedDonorId.toString()

    const donorUserId = donor?.userId
      ? donor.userId.toString()
      : linkedUser?._id
        ? linkedUser._id.toString()
        : ""

    const donorName = donor?.fullName || linkedUser?.fullName || linkedUser?.name || "Unknown Donor"
    const donorEmail = (donor?.email || linkedUser?.email || "").trim().toLowerCase()
    const donorPhone = donor?.phone || linkedUser?.phone || ""
    const donorBloodType = donor?.bloodType || linkedUser?.bloodType || ""

    // ============================================================
    // HOSPITAL INFO
    // ============================================================
    const hospitalId = decoded.role === "hospital" ? getUserIdFromAuth(decoded) : null

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: "Hospital ID not found" },
        { status: 401 }
      )
    }

    const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId)

    let hospitalEmail = decoded.email || ""
    const hospitalUser = await User.findById(hospitalId)
      .select("email hospitalName")
      .lean()
    hospitalEmail = hospitalUser?.email || decoded.email || ""

    console.log('🔍 DONATION HISTORY API')
    console.log('🔍 Hospital ID:', hospitalId)
    console.log('🔍 Donor ID:', actualDonorId)
    console.log('🔍 Donor Email:', donorEmail)
    console.log('🔍 Donor User ID:', donorUserId)
    console.log('🔍 Is Walk-in:', donor?.isWalkIn || false)

    // ============================================================
    // HOSPITAL ACCESS CHECK
    // ============================================================
    let hasAccess = false

    // For walk-in donors, check if they belong to this hospital
    if (donor?.isWalkIn === true) {
      if (donor.approvedBy === hospitalEmail) {
        hasAccess = true
        console.log('✅ Walk-in donor belongs to this hospital (approvedBy matches)')
      } else if (donor.hospitalId && donor.hospitalId.toString() === hospitalId) {
        hasAccess = true
        console.log('✅ Walk-in donor belongs to this hospital (hospitalId matches)')
      }
    }

    // Check donations at THIS hospital
    if (!hasAccess) {
      const donationAccessIds: mongoose.Types.ObjectId[] = [
        new mongoose.Types.ObjectId(actualDonorId),
      ]

      if (donorUserId && mongoose.Types.ObjectId.isValid(donorUserId)) {
        donationAccessIds.push(new mongoose.Types.ObjectId(donorUserId))
      }

      const hasDonationAtHospital = await Donation.exists({
        $or: [
          { donorId: { $in: donationAccessIds } },
          ...(donorEmail ? [{ donorEmail: donorEmail }] : [])
        ],
        hospitalId: hospitalObjectId,
      })

      if (hasDonationAtHospital) {
        hasAccess = true
      }
    }

    // Check blood drive registrations at THIS hospital
    if (!hasAccess) {
      const registrationDonorIds: mongoose.Types.ObjectId[] = [
        new mongoose.Types.ObjectId(actualDonorId),
      ]

      if (donorUserId && mongoose.Types.ObjectId.isValid(donorUserId)) {
        registrationDonorIds.push(new mongoose.Types.ObjectId(donorUserId))
      }

      const hasRegistration = await BloodDriveRegistration.exists({
        $or: [
          { donorId: { $in: registrationDonorIds } },
          ...(donorEmail ? [{ donorEmail: donorEmail }] : [])
        ],
        hospitalId: hospitalObjectId,
        status: { $in: ["registered", "attended"] },
      })

      if (hasRegistration) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      console.warn(`Hospital ${hospitalEmail} attempted to access donor ${actualDonorId} without permission`)
      return NextResponse.json(
        { success: false, error: "Access denied - donor does not belong to your hospital" },
        { status: 403 }
      )
    }

    // ============================================================
    // ✅ BUILD ALL POSSIBLE DONOR IDs (including email and name matches for walk-ins)
    // ============================================================
    const donorIdCandidates: mongoose.Types.ObjectId[] = []

    if (mongoose.Types.ObjectId.isValid(actualDonorId)) {
      donorIdCandidates.push(new mongoose.Types.ObjectId(actualDonorId))
    }

    if (donorUserId && mongoose.Types.ObjectId.isValid(donorUserId)) {
      const userObjectId = new mongoose.Types.ObjectId(donorUserId)
      const alreadyExists = donorIdCandidates.some(
        (candidate) => candidate.toString() === userObjectId.toString()
      )
      if (!alreadyExists) {
        donorIdCandidates.push(userObjectId)
      }
    }

    // ✅ Also find all donors with the same email
    if (donorEmail) {
      const donorsWithSameEmail = await Donor.find({
        email: { $regex: `^${donorEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: 'i' }
      }).select('_id userId').lean()

      donorsWithSameEmail.forEach((d: any) => {
        const did = d._id.toString()
        if (!donorIdCandidates.some(id => id.toString() === did)) {
          donorIdCandidates.push(new mongoose.Types.ObjectId(did))
        }
        if (d.userId) {
          const uid = d.userId.toString()
          if (!donorIdCandidates.some(id => id.toString() === uid)) {
            donorIdCandidates.push(new mongoose.Types.ObjectId(uid))
          }
        }
      })

      // Also find users with this email
      const usersWithSameEmail = await User.find({
        email: { $regex: `^${donorEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: 'i' },
        role: 'donor'
      }).select('_id').lean()

      usersWithSameEmail.forEach((u: any) => {
        const uid = u._id.toString()
        if (!donorIdCandidates.some(id => id.toString() === uid)) {
          donorIdCandidates.push(new mongoose.Types.ObjectId(uid))
        }
      })
    }

    // ✅ For walk-in donors, also try to find by name
    if (donor?.isWalkIn && donor.fullName) {
      const donorsWithSameName = await Donor.find({
        fullName: { $regex: `^${donor.fullName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: 'i' },
        isWalkIn: true
      }).select('_id userId').lean()

      donorsWithSameName.forEach((d: any) => {
        const did = d._id.toString()
        if (!donorIdCandidates.some(id => id.toString() === did)) {
          donorIdCandidates.push(new mongoose.Types.ObjectId(did))
        }
      })
    }

    console.log('🔍 Donor ID Candidates (all):', donorIdCandidates.map(id => id.toString()))
    console.log('🔍 Donor Email:', donorEmail)

    // ✅ Build donation query with BOTH donorId AND email matching
    const orConditions: any[] = [
      { donorId: { $in: donorIdCandidates } }
    ]

    // Add email match if email exists
    if (donorEmail) {
      orConditions.push({
        donorEmail: {
          $regex: `^${donorEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i"
        }
      })
    }

    // ✅ For walk-in donors, also match by name
    if (donor?.isWalkIn && donor.fullName) {
      orConditions.push({
        donorName: {
          $regex: `^${donor.fullName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i"
        }
      })
    }

    // ✅ CRITICAL FIX: Filter by hospital AND match by donorId or email
    const donationQuery: any = {
      $and: [
        { $or: orConditions },
        { hospitalId: hospitalObjectId }
      ]
    }

    console.log('🔍 Donation Query:', JSON.stringify(donationQuery, null, 2))

    let donations = await Donation.find(donationQuery)
      .sort({ date: -1, createdAt: -1 })
      .lean()

    console.log(`📊 Found ${donations.length} donations from this hospital`)

    // Remove duplicates
    const uniqueDonations = new Map<string, any>()
    for (const donation of donations) {
      const donationId = donation._id?.toString()
      if (donationId && !uniqueDonations.has(donationId)) {
        uniqueDonations.set(donationId, donation)
      }
    }

    const sortedDonations = Array.from(uniqueDonations.values()).sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })

    // ============================================================
    // TRANSFORM DONATIONS
    // ============================================================
    const history = sortedDonations.map((donation: any) => {
      const donationDate = donation.date || donation.createdAt || null
      let normalizedStatus = (donation.status || "Pending").toLowerCase()

      return {
        id: donation._id?.toString() || "",
        donationId: donation._id?.toString() || "",
        donorId: donation.donorId?.toString() || actualDonorId,
        hospitalId: donation.hospitalId?.toString() || "",
        bloodDriveId: donation.bloodDriveId?.toString() || "",
        donorName: donation.donorName || donorName,
        donorEmail: donation.donorEmail || donorEmail,
        donorPhone: donation.donorPhone || donorPhone,
        bloodType: donation.bloodType || donorBloodType,
        units: Number(donation.units || 0),
        donationDate,
        date: donationDate,
        status: normalizedStatus,
        hospital: donation.hospital || "Hospital",
        notes: donation.notes || "",
        location: donation.location || donation.hospital || "",
        eventTitle: donation.eventTitle || donation.bloodDriveTitle || (donation.bloodDriveId ? "Blood Drive Donation" : "Walk-in Donation"),
        eventId: donation.bloodDriveId?.toString() || "",
        recordedBy: donation.recordedBy || "Hospital Staff",
        isWalkIn: donation.isWalkIn || false,
        createdAt: donation.createdAt || null,
        updatedAt: donation.updatedAt || null,
      }
    })

    // ============================================================
    // SUMMARY
    // ============================================================
    const completedHistory = history.filter((donation: any) => donation.status === "completed")
    const totalUnits = completedHistory.reduce((total: number, donation: any) => total + Number(donation.units || 0), 0)
    const latestDonation = history.length > 0 ? history[0] : null
    const latestCompletedDonation = completedHistory.length > 0 ? completedHistory[0] : null

    console.log(`📊 Total donations: ${history.length}, Completed: ${completedHistory.length}, Units: ${totalUnits}`)

    // ============================================================
    // RESPONSE
    // ============================================================
    return NextResponse.json({
      success: true,
      donor: {
        id: actualDonorId,
        userId: donorUserId || null,
        fullName: donorName,
        email: donorEmail,
        phone: donorPhone,
        bloodType: donorBloodType,
        totalDonations: history.length,
        completedDonations: completedHistory.length,
        lastDonationDate: latestCompletedDonation?.donationDate || latestDonation?.donationDate || null,
        isWalkIn: donor?.isWalkIn || false,
      },
      history,
      summary: {
        totalDonations: history.length,
        completedDonations: completedHistory.length,
        totalUnits,
        lastDonation: latestCompletedDonation?.donationDate || latestDonation?.donationDate || null,
      },
    })
  } catch (error: any) {
    console.error("Error fetching donor donation history:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch donor donation history" },
      { status: 500 }
    )
  }
}