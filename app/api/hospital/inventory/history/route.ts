// app/api/hospital/inventory/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import BloodRelease from '@/models/BloodRelease'
import InventoryLog from '@/models/InventoryLog'
import User from '@/models/User'
import Hospital from '@/models/Hospital'
import {
  getAuthenticatedHospitalUser,
  getUserIdFromAuth,
  isAuthFailure,
} from '@/lib/hospitalAuth'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) return auth.response

    const decoded = auth.user
    const userId = getUserIdFromAuth(decoded)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid hospital ID in token' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user || user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized - Hospital access required' }, { status: 403 })
    }

    let hospital = await Hospital.findOne({ userId })
    if (!hospital) {
      hospital = await Hospital.create({
        userId,
        hospitalName: user.hospitalName || user.fullName || 'Hospital',
        hospitalAddress: '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        status: 'active',
      })
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10))
    const type = searchParams.get('type') || 'all'
    const search = searchParams.get('search') || ''
    const dateRange = searchParams.get('dateRange') || 'all'
    const skip = (page - 1) * limit

    // Build date filter
    let dateFilter: any = {}
    const now = new Date()
    if (dateRange === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0)
      dateFilter = { $gte: start }
    } else if (dateRange === 'week') {
      const start = new Date(now); start.setDate(start.getDate() - 7)
      dateFilter = { $gte: start }
    } else if (dateRange === 'month') {
      const start = new Date(now); start.setMonth(start.getMonth() - 1)
      dateFilter = { $gte: start }
    }

    const historyRecords: any[] = []

    // ============================================================
    // 1. RELEASES — canonical source is BloodRelease
    // ============================================================
    if (type === 'all' || type === 'release') {
      try {
        const releaseQuery: any = { hospitalId: userObjectId, status: 'released' }
        if (Object.keys(dateFilter).length > 0) releaseQuery.releaseDate = dateFilter
        if (search) {
          const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          releaseQuery.$or = [
            { patientName: { $regex: escaped, $options: 'i' } },
            { bloodType: { $regex: escaped, $options: 'i' } },
            { doctorName: { $regex: escaped, $options: 'i' } },
            { hospitalWard: { $regex: escaped, $options: 'i' } },
          ]
        }

        const releases = await BloodRelease.find(releaseQuery).sort({ releaseDate: -1 }).lean()

        for (const release of releases) {
          historyRecords.push({
            id: `rel-${release._id}`,
            type: 'release',
            bloodType: release.bloodType || 'Unknown',
            units: release.units || 1,
            patientName: release.patientName || 'Unknown Patient',
            patientAge: release.patientAge || null,
            patientGender: release.patientGender || null,
            hospitalWard: release.hospitalWard || 'General Ward',
            doctorName: release.doctorName || 'Unknown Doctor',
            reason: release.reason || 'Blood release',
            date: release.releaseDate || release.createdAt || new Date(),
            status: 'completed',
            notes: release.notes || '',
            receiptNumber: release.receiptNumber || `REL-${release._id.toString().slice(-8)}`,
            destination: release.hospitalWard || 'Unknown Ward',
            releasedBy: release.releasedBy || 'Hospital Staff',
            hospitalName: hospital.hospitalName || 'Hospital',
            requestId: release.requestId || null,
            donorName: release.donorName || null,
          })
        }
      } catch (error) {
        console.error('Error fetching releases:', error)
      }
    }

    // ============================================================
    // 2. INVENTORY LOG — donations, stock adds, edits, syncs
    // ============================================================
    if (type === 'all' || type === 'donation' || type === 'storage') {
      try {
        const logQuery: any = { hospitalId: userObjectId }

        if (type === 'donation') logQuery.type = 'donation'
        else if (type === 'storage') logQuery.type = { $in: ['add', 'remove', 'sync', 'expired'] }

        if (Object.keys(dateFilter).length > 0) logQuery.createdAt = dateFilter

        if (search) {
          const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          logQuery.$or = [
            { bloodType: { $regex: escaped, $options: 'i' } },
            { donorName: { $regex: escaped, $options: 'i' } },
            { donorEmail: { $regex: escaped, $options: 'i' } },
            { notes: { $regex: escaped, $options: 'i' } },
            { actorName: { $regex: escaped, $options: 'i' } },
          ]
        }

        const logs = await InventoryLog.find(logQuery).sort({ createdAt: -1 }).lean()

        for (const log of logs) {
          const recordType: 'donation' | 'storage' = log.type === 'donation' ? 'donation' : 'storage'

          historyRecords.push({
            id: `log-${log._id}`,
            type: recordType,
            bloodType: log.bloodType || 'Unknown',
            units: Math.abs(log.units),
            signedUnits: log.units,
            donorName: log.donorName || undefined,
            donorEmail: log.donorEmail || undefined,
            donorPhone: log.donorPhone || undefined,
            date: log.createdAt,
            status: 'completed',
            notes: log.notes || '',
            receiptNumber:
              log.receiptNumber ||
              `${log.type === 'donation' ? 'DON' : 'STO'}-${log._id.toString().slice(-8)}`,
            hospitalName: hospital.hospitalName || 'Hospital',
            location: recordType === 'storage' ? 'Main Storage' : undefined,
            expiryDate: log.expiryDate || null,
            balanceBefore: log.balanceBefore,
            balanceAfter: log.balanceAfter,
            actorName: log.actorName || 'Hospital Staff',
            logType: log.type,
            bloodDriveId: null,
          })
        }
      } catch (error) {
        console.error('Error fetching inventory logs for history:', error)
      }
    }

    // Sort newest first
    historyRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Post-filter (covers computed fields not indexed in DB)
    const searched = search
      ? historyRecords.filter((r: any) => {
          const s = search.toLowerCase()
          return (
            r.bloodType?.toLowerCase().includes(s) ||
            r.patientName?.toLowerCase().includes(s) ||
            r.donorName?.toLowerCase().includes(s) ||
            r.doctorName?.toLowerCase().includes(s) ||
            r.hospitalWard?.toLowerCase().includes(s) ||
            r.reason?.toLowerCase().includes(s) ||
            r.destination?.toLowerCase().includes(s) ||
            r.actorName?.toLowerCase().includes(s)
          )
        })
      : historyRecords

    const total = searched.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const paginatedRecords = searched.slice(skip, skip + limit)

    const donations = searched.filter((r: any) => r.type === 'donation')
    const releases = searched.filter((r: any) => r.type === 'release')
    const storages = searched.filter((r: any) => r.type === 'storage')

    const stats = {
      totalDonations: donations.length,
      totalReleases: releases.length,
      totalStorage: storages.length,
      totalUnitsDonated: donations.reduce((sum: number, r: any) => sum + (r.units || 0), 0),
      totalUnitsReleased: releases.reduce((sum: number, r: any) => sum + (r.units || 0), 0),
      totalUnitsInStorage: storages.reduce((sum: number, r: any) => sum + (r.signedUnits || 0), 0),
    }

    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      pagination: { page, limit, total, totalPages },
      stats,
    })
  } catch (error: any) {
    console.error('❌ Error fetching history:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch history' }, { status: 500 })
  }
}