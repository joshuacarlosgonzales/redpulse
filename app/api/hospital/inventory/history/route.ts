// app/api/hospital/inventory/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import BloodInventory from '@/models/BloodInventory'
import BloodRelease from '@/models/BloodRelease'
import User from '@/models/User'
import Hospital from '@/models/Hospital'
import { 
  getAuthenticatedHospitalUser, 
  getUserIdFromAuth,
  isAuthFailure 
} from '@/lib/hospitalAuth'

// Try to import Donation, but don't fail if it doesn't exist
let Donation: any = null
try {
  Donation = require('@/models/Donation').default
} catch (error) {
  console.log('📝 Donation model not found, skipping donations in history')
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Use shared authentication helper
    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user
    const userId = getUserIdFromAuth(decoded)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid hospital ID in token' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    if (!user || user.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      )
    }

    let hospital = await Hospital.findOne({ userId })
    if (!hospital) {
      const hospitalName = user.hospitalName || user.fullName || 'Hospital'
      hospital = await Hospital.create({
        userId,
        hospitalName,
        hospitalAddress: '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        status: 'active',
      })
    }

    // FIXED: Donation.hospitalId (like BloodRelease.hospitalId and
    // BloodInventory.hospitalId) is a ref: 'User', and is always written
    // and queried elsewhere in this codebase using the User document's
    // own _id (decoded.userId / userObjectId) - not the separate Hospital
    // collection's _id. This route previously introduced a second,
    // unrelated ID (hospital._id from the Hospital collection) and used
    // it only for the donation query below, which meant that query could
    // never match any real donation and always returned zero results.
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || 'all'
    const search = searchParams.get('search') || ''
    const dateRange = searchParams.get('dateRange') || 'all'

    const skip = (page - 1) * limit

    let historyRecords: any[] = []

    // Build date filter
    let dateFilter: any = {}
    const now = new Date()
    
    if (dateRange === 'today') {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      dateFilter = { $gte: start }
    } else if (dateRange === 'week') {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      dateFilter = { $gte: start }
    } else if (dateRange === 'month') {
      const start = new Date(now)
      start.setMonth(start.getMonth() - 1)
      dateFilter = { $gte: start }
    }

    // ============================================================
    // 1. FETCH RELEASES FROM BLOODRELEASE MODEL
    // ============================================================
    
    if (type === 'all' || type === 'release') {
      try {
        const releaseQuery: any = {
          hospitalId: userObjectId,
          status: 'released'
        }
        
        if (Object.keys(dateFilter).length > 0) {
          releaseQuery.releaseDate = dateFilter
        }
        
        if (search) {
          releaseQuery.$or = [
            { patientName: { $regex: search, $options: 'i' } },
            { bloodType: { $regex: search, $options: 'i' } },
            { doctorName: { $regex: search, $options: 'i' } },
            { hospitalWard: { $regex: search, $options: 'i' } },
          ]
        }
        
        const releases = await BloodRelease.find(releaseQuery)
          .sort({ releaseDate: -1 })
          .lean()

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
    // 2. FETCH DONATIONS (if Donation model exists)
    // ============================================================
    
    if (Donation && (type === 'all' || type === 'donation')) {
      try {
        // FIXED: was querying with hospitalObjectId (Hospital collection's
        // _id), which never matches Donation.hospitalId (a User _id).
        // Now uses userObjectId, consistent with every other route that
        // queries the Donation collection.
        const donationQuery: any = {
          hospitalId: userObjectId,
          status: 'Completed'
        }
        
        if (Object.keys(dateFilter).length > 0) {
          donationQuery.date = dateFilter
        }
        
        if (search) {
          donationQuery.$or = [
            { donorName: { $regex: search, $options: 'i' } },
            { bloodType: { $regex: search, $options: 'i' } },
            { donorEmail: { $regex: search, $options: 'i' } },
          ]
        }
        
        const donations = await Donation.find(donationQuery)
          .sort({ date: -1 })
          .lean()

        for (const donation of donations) {
          historyRecords.push({
            id: `don-${donation._id}`,
            type: 'donation',
            bloodType: donation.bloodType || 'Unknown',
            units: donation.units || 1,
            donorName: donation.donorName || 'Unknown Donor',
            donorEmail: donation.donorEmail || '',
            donorPhone: donation.donorPhone || '',
            date: donation.date || donation.createdAt || new Date(),
            status: 'completed',
            notes: donation.notes || '',
            receiptNumber: `DON-${donation._id.toString().slice(-8)}`,
            hospitalName: donation.hospital || hospital.hospitalName || 'Hospital',
            bloodDriveId: donation.bloodDriveId?.toString() || null,
          })
        }
      } catch (error) {
        console.error('Error fetching donations:', error)
      }
    }

    // ============================================================
    // 3. FETCH STORAGE RECORDS FROM INVENTORY
    // ============================================================
    
    if (type === 'all' || type === 'storage') {
      try {
        const inventoryItems = await BloodInventory.find({
          hospitalId: userObjectId
        }).lean()

        for (const item of inventoryItems) {
          if (item.notes && (
            item.notes.includes('Synced from') || 
            item.notes.includes('Added via') || 
            item.notes.includes('donation') || 
            item.notes.includes('walk-in')
          )) {
            let donorName = 'Unknown'
            const donorMatch = item.notes.match(/from\s+([^|]+)/i)
            if (donorMatch) {
              donorName = donorMatch[1].trim()
            }
            
            const unitsMatch = item.notes.match(/\+\s*(\d+)\s*units?/i)
            const units = unitsMatch ? parseInt(unitsMatch[1]) : item.units || 0
            
            historyRecords.push({
              id: `sto-${item._id}`,
              type: 'storage',
              bloodType: item.bloodType || 'Unknown',
              units: units || 0,
              donorName: donorName,
              date: item.createdAt || new Date(),
              status: 'completed',
              location: 'Main Storage',
              expiryDate: item.expirationDate || null,
              notes: item.notes || '',
              receiptNumber: `STO-${item._id.toString().slice(-8)}`,
              hospitalName: hospital.hospitalName || 'Hospital',
            })
          }
        }
      } catch (error) {
        console.error('Error fetching inventory:', error)
      }
    }

    // ============================================================
    // 4. FALLBACK: PARSE RELEASES FROM INVENTORY NOTES
    // ============================================================
    
    const releaseCount = historyRecords.filter(r => r.type === 'release').length
    if (releaseCount === 0) {
      try {
        const inventoryItems = await BloodInventory.find({
          hospitalId: userObjectId
        }).lean()

        for (const item of inventoryItems) {
          if (item.notes) {
            const sections = item.notes.split(/📋 BLOOD RELEASE/)
            
            for (const section of sections) {
              if (!section.includes('Donor') && !section.includes('Patient')) continue
              
              const donorMatch = section.match(/Donor\s*:\s*([^\n]+)/i)
              const requestIdMatch = section.match(/Request ID\s*:\s*([^\n]+)/i)
              const releasedMatch = section.match(/Released\s*:\s*([^\n]+)/i)
              const unitsMatch = section.match(/Units\s*:\s*(\d+)/i)
              const bloodTypeMatch = section.match(/Blood Type\s*:\s*([^\n]+)/i)
              const patientMatch = section.match(/Patient\s*:\s*([^\n]+)/i)
              const doctorMatch = section.match(/Doctor\s*:\s*([^\n]+)/i)
              const wardMatch = section.match(/Ward\s*:\s*([^\n]+)/i)

              if (!patientMatch && !donorMatch) continue

              let releaseDate = new Date()
              if (releasedMatch) {
                try {
                  const dateStr = releasedMatch[1].trim()
                  const parsedDate = new Date(dateStr)
                  if (!isNaN(parsedDate.getTime())) {
                    releaseDate = parsedDate
                  }
                } catch (e) {}
              }

              let bloodType = bloodTypeMatch ? bloodTypeMatch[1].trim() : item.bloodType || 'Unknown'
              bloodType = bloodType.replace(/^\s*Blood Type\s*:\s*/i, '').trim()

              let units = unitsMatch ? parseInt(unitsMatch[1]) : 0
              let patientName = patientMatch ? patientMatch[1].trim() : 'Unknown'
              patientName = patientName.replace(/^\s*Patient\s*:\s*/i, '').trim()
              let doctorName = doctorMatch ? doctorMatch[1].trim() : 'Unknown'
              doctorName = doctorName.replace(/^\s*Doctor\s*:\s*/i, '').trim()
              let ward = wardMatch ? wardMatch[1].trim() : 'General'
              ward = ward.replace(/^\s*Ward\s*:\s*/i, '').trim()
              let donorName = donorMatch ? donorMatch[1].trim() : null
              if (donorName) {
                donorName = donorName.replace(/^\s*Donor\s*:\s*/i, '').trim()
              }
              let requestId = requestIdMatch ? requestIdMatch[1].trim() : null
              if (requestId) {
                requestId = requestId.replace(/^\s*Request ID\s*:\s*/i, '').trim()
              }

              const exists = historyRecords.some((r: any) => 
                r.patientName === patientName &&
                r.bloodType === bloodType &&
                r.units === units &&
                Math.abs(new Date(r.date).getTime() - releaseDate.getTime()) < 60000
              )

              if (!exists && units > 0) {
                historyRecords.push({
                  id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  type: 'release',
                  bloodType: bloodType,
                  units: units,
                  patientName: patientName,
                  doctorName: doctorName,
                  hospitalWard: ward,
                  reason: 'Blood release',
                  date: releaseDate,
                  status: 'completed',
                  receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
                  notes: section.trim(),
                  releasedBy: 'Hospital Staff',
                  hospitalName: hospital.hospitalName || 'Hospital',
                  destination: ward,
                  donorName: donorName,
                  requestId: requestId,
                })
              }
            }

            // Parse old format
            const oldReleaseMatches = item.notes.match(/\[RELEASE\][^\n]*/g)
            if (oldReleaseMatches) {
              for (const match of oldReleaseMatches) {
                const dateMatch = match.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
                const unitsMatch = match.match(/(\d+) unit\(s\) of ([A-Z+\-]+)/)
                const patientMatch = match.match(/patient:\s*([^|]+)/)
                const doctorMatch = match.match(/Doctor:\s*([^|]+)/)
                const wardMatch = match.match(/Ward:\s*([^|]+)/)
                const reasonMatch = match.match(/Reason:\s*([^|]+)/)
                const receiptMatch = match.match(/Receipt:\s*([A-Z0-9-]+)/)
                const donorMatch = match.match(/Donor:\s*([^|]+)/)
                const requestIdMatch = match.match(/Request ID:\s*([^|]+)/)

                const exists = historyRecords.some((r: any) => 
                  r.patientName === (patientMatch ? patientMatch[1].trim() : '') &&
                  r.bloodType === (unitsMatch ? unitsMatch[2] : '')
                )

                if (!exists && (patientMatch || unitsMatch)) {
                  historyRecords.push({
                    id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    type: 'release',
                    bloodType: unitsMatch ? unitsMatch[2] : item.bloodType || 'Unknown',
                    units: unitsMatch ? parseInt(unitsMatch[1]) : 0,
                    patientName: patientMatch ? patientMatch[1].trim() : 'Unknown',
                    doctorName: doctorMatch ? doctorMatch[1].trim() : 'Unknown',
                    hospitalWard: wardMatch ? wardMatch[1].trim() : 'General',
                    reason: reasonMatch ? reasonMatch[1].trim() : 'Blood release',
                    date: dateMatch ? new Date(dateMatch[0]) : new Date(),
                    status: 'completed',
                    receiptNumber: receiptMatch ? receiptMatch[1] : `RCP-${Date.now().toString().slice(-8)}`,
                    notes: match,
                    releasedBy: 'Hospital Staff',
                    hospitalName: hospital.hospitalName || 'Hospital',
                    destination: wardMatch ? wardMatch[1].trim() : 'General',
                    donorName: donorMatch ? donorMatch[1].trim() : null,
                    requestId: requestIdMatch ? requestIdMatch[1].trim() : null,
                  })
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing inventory notes:', error)
      }
    }

    // Sort by date (newest first)
    historyRecords.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })

    if (search) {
      const searchLower = search.toLowerCase()
      historyRecords = historyRecords.filter((r: any) => 
        r.bloodType?.toLowerCase().includes(searchLower) ||
        r.patientName?.toLowerCase().includes(searchLower) ||
        r.donorName?.toLowerCase().includes(searchLower) ||
        r.doctorName?.toLowerCase().includes(searchLower) ||
        r.hospitalWard?.toLowerCase().includes(searchLower) ||
        r.reason?.toLowerCase().includes(searchLower) ||
        r.destination?.toLowerCase().includes(searchLower)
      )
    }

    const total = historyRecords.length
    const totalPages = Math.ceil(total / limit) || 1
    const paginatedRecords = historyRecords.slice(skip, skip + limit)

    const donations = historyRecords.filter((r: any) => r.type === 'donation')
    const releases = historyRecords.filter((r: any) => r.type === 'release')
    const storages = historyRecords.filter((r: any) => r.type === 'storage')
    
    const stats = {
      totalDonations: donations.length,
      totalReleases: releases.length,
      totalStorage: storages.length,
      totalUnitsDonated: donations.reduce((sum: number, r: any) => sum + (r.units || 0), 0),
      totalUnitsReleased: releases.reduce((sum: number, r: any) => sum + (r.units || 0), 0),
      totalUnitsInStorage: storages.reduce((sum: number, r: any) => sum + (r.units || 0), 0),
    }

    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      stats: stats
    })

  } catch (error: any) {
    console.error('❌ Error fetching history:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch history' },
      { status: 500 }
    )
  }
}