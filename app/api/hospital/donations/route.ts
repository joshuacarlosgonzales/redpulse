// app/api/hospital/donations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import Donation from '@/models/Donation'
import BloodInventory from '@/models/BloodInventory'
import InventoryLog from '@/models/InventoryLog'
import User from '@/models/User'
import Donor from '@/models/Donor'
import { cached, cacheInvalidate } from '@/lib/cache'

type DonorStatus = 'active' | 'inactive' | 'pending' | 'rejected'
type BackgroundCheckStatus = 'pending' | 'in-review' | 'cleared' | 'failed'
type RegistrationType = 'walk-in' | 'system'

function auth(request: NextRequest): { decoded: any } | { error: NextResponse } {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 }) }
  }
  const token = authHeader.split(' ')[1]
  let decoded: any
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 }) }
  }
  if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
    return { error: NextResponse.json({ error: 'Unauthorized - Hospital access required' }, { status: 403 }) }
  }
  return { decoded }
}

// ============================================================
// GET — list donations
// ============================================================
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const a = auth(request)
    if ('error' in a) return a.error
    const { decoded } = a

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const bloodType = searchParams.get('bloodType') || 'all'
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const skip = (page - 1) * limit

    const hospitalObjectId = new mongoose.Types.ObjectId(decoded.userId)

    const cacheKey = `donations:${hospitalObjectId}:${status}:${bloodType}:${search}:${page}:${limit}`

    const payload = await cached(cacheKey, 15_000, async () => {
      const filter: any = { hospitalId: hospitalObjectId }
      if (status !== 'all') filter.status = status
      if (bloodType !== 'all') filter.bloodType = bloodType
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        filter.$or = [
          { donorName: { $regex: escaped, $options: 'i' } },
          { hospital: { $regex: escaped, $options: 'i' } },
          { bloodType: { $regex: escaped, $options: 'i' } },
        ]
      }

      const total = await Donation.countDocuments(filter)
      const donations = await Donation.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      const transformedDonations = donations.map((donation: any) => ({
        id: donation._id.toString(),
        donorId: donation.donorId?.toString() || '',
        donorName: donation.donorName || 'Unknown Donor',
        donorEmail: donation.donorEmail || '',
        donorPhone: donation.donorPhone || '',
        bloodType: donation.bloodType || '',
        units: donation.units || 0,
        donationDate: donation.date || donation.createdAt,
        notes: donation.notes || '',
        status: donation.status || 'Pending',
        hospital: donation.hospital || 'Hospital',
        isWalkIn: donation.isWalkIn || false,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
        expirationDate: donation.expirationDate || null,
      }))

      return {
        success: true,
        data: transformedDonations,
        pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      }
    })

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' },
    })
  } catch (error: any) {
    console.error('Error fetching donations:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch donations' }, { status: 500 })
  }
}

// ============================================================
// POST — record donation (atomic donation + inventory + log)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const a = auth(request)
    if ('error' in a) return a.error
    const { decoded } = a

    const user = await User.findById(decoded.userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const {
      donorName,
      donorEmail,
      donorPhone,
      bloodType,
      units,
      donationDate,
      notes,
      status = 'Completed',
      isWalkIn = false,
    } = body

    if (!donorName || !donorName.trim()) return NextResponse.json({ error: 'Donor name is required' }, { status: 400 })
    if (!bloodType) return NextResponse.json({ error: 'Blood type is required' }, { status: 400 })
    if (!units || units < 1) return NextResponse.json({ error: 'Valid units are required' }, { status: 400 })
    if (!donationDate) return NextResponse.json({ error: 'Donation date is required' }, { status: 400 })

    const hospitalName = user.hospitalName || user.fullName || 'Hospital'
    const hospitalEmail = user.email || 'Hospital Staff'
    const hospitalObjectId = new mongoose.Types.ObjectId(decoded.userId)

    const donationDateObj = new Date(donationDate)
    const expirationDate = new Date(donationDateObj)
    expirationDate.setDate(expirationDate.getDate() + 42)

    // ---- Donor lookup / creation ----
    let donorProfile: any = null
    let donorObjectId: mongoose.Types.ObjectId | null = null

    if (donorEmail && donorEmail.trim()) {
      donorProfile = await Donor.findOne({ email: donorEmail.trim().toLowerCase() })
      if (donorProfile) donorObjectId = donorProfile._id
    }

    if (!donorProfile) {
      const matchedUser = await User.findOne({
        email: donorEmail?.trim().toLowerCase(),
        role: 'donor',
      })
      if (matchedUser) {
        donorProfile = await Donor.findOne({ userId: matchedUser._id })
        if (donorProfile) {
          donorObjectId = donorProfile._id
        } else {
          donorProfile = await Donor.create({
            fullName: donorName.trim(),
            email: donorEmail?.trim() || `${donorName.replace(/\s/g, '').toLowerCase()}@donor.com`,
            phone: donorPhone || 'N/A',
            bloodType,
            address: 'Registered Donor',
            barangay: 'Registered',
            municipality: 'Registered',
            province: 'Registered',
            dateOfBirth: new Date('2000-01-01'),
            gender: 'Other',
            weight: 50,
            status: 'active' as DonorStatus,
            isEligible: true,
            totalDonations: 0,
            lastDonationDate: null,
            nextEligibleDate: null,
            digitalId: `DONOR-${Date.now().toString().slice(-8)}`,
            userId: matchedUser._id,
            isWalkIn: false,
            registrationType: 'system' as RegistrationType,
            backgroundCheckStatus: 'cleared' as BackgroundCheckStatus,
            backgroundCheckDate: new Date(),
            backgroundCheckNotes: 'Registered donor',
            verifiedBy: hospitalEmail,
            verificationDate: new Date(),
            approvedBy: hospitalEmail,
            approvedAt: new Date(),
            emergencyContact: donorPhone || 'N/A',
            emergencyName: 'N/A',
            emergencyRelationship: 'Self',
          })
          donorObjectId = donorProfile._id
        }
      }
    }

    if (!donorProfile) {
      const base = donorEmail?.trim() || `${donorName.replace(/\s/g, '').toLowerCase()}@walkin.com`
      let uniqueEmail = base
      for (let i = 0; i < 10; i++) {
        const existing = await Donor.findOne({ email: uniqueEmail })
        if (!existing) break
        uniqueEmail = `${base.replace('@', `+${i + 1}@`)}`
      }
      if (await Donor.findOne({ email: uniqueEmail })) {
        uniqueEmail = `walkin_${Date.now()}@walkin.com`
      }

      donorProfile = await Donor.create({
        fullName: donorName.trim(),
        email: uniqueEmail,
        phone: donorPhone || 'N/A',
        bloodType,
        address: 'Walk-in Donor',
        barangay: 'Walk-in',
        municipality: 'Walk-in',
        province: 'Walk-in',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Other',
        weight: 50,
        status: 'active' as DonorStatus,
        isEligible: true,
        totalDonations: 0,
        lastDonationDate: null,
        nextEligibleDate: null,
        digitalId: `WALKIN-${Date.now().toString().slice(-8)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        userId: null,
        isWalkIn: true,
        registrationType: 'walk-in' as RegistrationType,
        backgroundCheckStatus: 'cleared' as BackgroundCheckStatus,
        backgroundCheckDate: new Date(),
        backgroundCheckNotes: 'Walk-in donor - automatically approved',
        verifiedBy: hospitalEmail,
        verificationDate: new Date(),
        approvedBy: hospitalEmail,
        approvedAt: new Date(),
        emergencyContact: donorPhone || 'N/A',
        emergencyName: 'N/A',
        emergencyRelationship: 'Self',
      })
      donorObjectId = donorProfile._id
    }

    // ---- Transaction: donation + inventory + log ----
    const session = await mongoose.startSession()
    session.startTransaction()
    let donation: any
    let inventoryData: any = null
    let inventoryUpdated = false

    try {
      ;[donation] = await Donation.create(
        [
          {
            hospitalId: hospitalObjectId,
            donorId: donorObjectId || hospitalObjectId,
            donorName: donorName.trim(),
            donorEmail: donorEmail || '',
            donorPhone: donorPhone || '',
            bloodType,
            units,
            date: donationDateObj,
            expirationDate,
            status,
            hospital: hospitalName,
            notes: notes || '',
            isWalkIn: donorProfile?.isWalkIn || isWalkIn || false,
          },
        ],
        { session }
      )

      if (status === 'Completed') {
        const inventory = await BloodInventory.findOne({
          hospitalId: hospitalObjectId,
          bloodType,
        }).session(session)

        let balanceBefore = 0
        if (inventory) {
          balanceBefore = inventory.units
          inventory.units += units
          if (expirationDate > inventory.expirationDate) {
            inventory.expirationDate = expirationDate
          }
          await inventory.save({ session })
          inventoryData = inventory
          inventoryUpdated = true
        } else {
          const created = await BloodInventory.create(
            [
              {
                hospitalId: hospitalObjectId,
                bloodType,
                units,
                minRequired: 15,
                maxCapacity: 60,
                expirationDate,
                notes: `Initial stock from donation by ${donorName} on ${donationDateObj.toLocaleDateString()}`,
                batchNumber: `DONATION-${Date.now()}`,
              },
            ],
            { session }
          )
          inventoryData = created[0]
          inventoryUpdated = true
        }

        await InventoryLog.create(
          [
            {
              hospitalId: hospitalObjectId,
              bloodType,
              type: 'donation',
              source: 'donation',
              units,
              balanceBefore,
              balanceAfter: inventoryData.units,
              actorName: hospitalEmail,
              actorId: hospitalObjectId,
              donorName: donorName.trim(),
              donorEmail: donorEmail || '',
              donorPhone: donorPhone || '',
              notes: notes || `Donation from ${donorName}`,
              expiryDate: expirationDate,
              receiptNumber: `DON-${donation._id.toString().slice(-8)}`,
              metadata: { donationId: donation._id.toString() },
            },
          ],
          { session }
        )
      }

      await session.commitTransaction()
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }

    // ---- Update donor counters ----
    if (donorProfile) {
      donorProfile.lastDonationDate = donationDateObj
      donorProfile.totalDonations = (donorProfile.totalDonations || 0) + 1
      const nextEligibleDate = new Date(donationDateObj)
      nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3)
      donorProfile.nextEligibleDate = nextEligibleDate
      donorProfile.isEligible = false
      await donorProfile.save()
    }

    cacheInvalidate('donations:')
    cacheInvalidate('inventory:')
    cacheInvalidate('bags:')
    cacheInvalidate('expired:')
    cacheInvalidate('history:')

    return NextResponse.json({
      success: true,
      data: {
        id: donation._id.toString(),
        donorId: donation.donorId?.toString() || '',
        donorName: donation.donorName,
        bloodType: donation.bloodType,
        units: donation.units,
        status: donation.status,
        donationDate: donation.date,
        hospital: donation.hospital,
        expirationDate: status === 'Completed' ? expirationDate : null,
        inventoryUpdated,
        isWalkIn: donation.isWalkIn || false,
        inventory: inventoryData
          ? {
              id: inventoryData._id.toString(),
              bloodType: inventoryData.bloodType,
              units: inventoryData.units,
              status: inventoryData.status,
            }
          : null,
      },
      message:
        status === 'Completed' && inventoryUpdated
          ? 'Donation recorded and inventory updated successfully! 🩸'
          : status === 'Completed' && !inventoryUpdated
          ? 'Donation recorded but inventory update failed. Please sync manually.'
          : 'Donation recorded successfully!',
    })
  } catch (error: any) {
    console.error('Error creating donation:', error)
    return NextResponse.json({ error: error.message || 'Failed to create donation' }, { status: 500 })
  }
}

// ============================================================
// DELETE — remove donation + reverse inventory + log reversal
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    const a = auth(request)
    if ('error' in a) return a.error
    const { decoded } = a

    const { searchParams } = new URL(request.url)
    const donationId = searchParams.get('id')

    if (!donationId) return NextResponse.json({ error: 'Donation ID is required' }, { status: 400 })
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return NextResponse.json({ error: 'Invalid donation ID format' }, { status: 400 })
    }

    const hospitalObjectId = new mongoose.Types.ObjectId(decoded.userId)

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const donation = await Donation.findOne({
        _id: donationId,
        hospitalId: hospitalObjectId,
      }).session(session)

      if (!donation) {
        await session.abortTransaction()
        return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
      }

      if (donation.status === 'Completed') {
        const inventory = await BloodInventory.findOne({
          hospitalId: hospitalObjectId,
          bloodType: donation.bloodType,
        }).session(session)

        if (inventory) {
          if (inventory.units < donation.units) {
            await session.abortTransaction()
            return NextResponse.json(
              {
                error: `Cannot delete: only ${inventory.units} unit(s) remain in inventory for ${donation.bloodType}, but this donation added ${donation.units}.`,
              },
              { status: 409 }
            )
          }
          const before = inventory.units
          inventory.units = Math.max(0, inventory.units - donation.units)
          await inventory.save({ session })

          await InventoryLog.create(
            [
              {
                hospitalId: hospitalObjectId,
                bloodType: donation.bloodType,
                type: 'remove',
                source: 'system',
                units: -donation.units,
                balanceBefore: before,
                balanceAfter: inventory.units,
                actorName: decoded.email || 'Hospital Staff',
                actorId: hospitalObjectId,
                notes: `Donation deleted (reversal) — was from ${donation.donorName}`,
                metadata: { action: 'delete_donation', donationId: donation._id.toString() },
              },
            ],
            { session }
          )
        }
      }

      const BloodBagModel = mongoose.models.BloodBag || (await import('@/models/BloodBag')).default
      await BloodBagModel.deleteMany({ donationId: donation._id }).session(session)

      await Donation.deleteOne({ _id: donation._id }).session(session)
      await session.commitTransaction()

      // Best-effort donor counter rollback
      try {
        if (donation.donorId) {
          await Donor.updateOne(
            { _id: donation.donorId, totalDonations: { $gt: 0 } },
            { $inc: { totalDonations: -1 } }
          )
        }
      } catch {
        /* ignore */
      }

      cacheInvalidate('donations:')
      cacheInvalidate('inventory:')
      cacheInvalidate('bags:')
      cacheInvalidate('expired:')
      cacheInvalidate('history:')

      return NextResponse.json({ success: true, message: 'Donation deleted successfully' })
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }
  } catch (error: any) {
    console.error('Error deleting donation:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete donation' }, { status: 500 })
  }
}