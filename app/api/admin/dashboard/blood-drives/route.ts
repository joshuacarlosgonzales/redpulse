// app/api/admin/dashboard/blood-drives/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BloodDrive, { calculateCurrentStatus } from '@/models/BloodDrive'
import User from '@/models/User'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import jwt from 'jsonwebtoken'
import { createNewBloodDriveNotificationWithAdmins, NotificationService } from '@/lib/notification-service'

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
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    // Build filter
    const filter: any = {}
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } }
      ]
    }

    // Get all drives (no status filter in DB)
    const drives = await BloodDrive.find(filter)
      .sort({ date: 1 })
      .lean()

    // Get hospital names
    const hospitalIds = drives
      .map((d: any) => d.hospitalId?.toString())
      .filter(Boolean)
    
    let hospitalMap = new Map()
    if (hospitalIds.length > 0) {
      const hospitals = await User.find({ 
        _id: { $in: hospitalIds },
        role: 'hospital'
      }).select('hospitalName fullName').lean()
      
      hospitals.forEach((h: any) => {
        hospitalMap.set(h._id.toString(), h.hospitalName || h.fullName || 'Unknown Hospital')
      })
    }

    // ✅ Transform drives with CALCULATED status
    let transformedDrives = drives.map((drive: any) => {
      const calculatedStatus = calculateCurrentStatus(
        drive.date,
        drive.startTime,
        drive.endTime,
        drive.status
      )
      
      return {
        id: drive._id.toString(),
        title: drive.title,
        description: drive.description || '',
        location: drive.location,
        address: drive.address || '',
        date: drive.date,
        startTime: drive.startTime,
        endTime: drive.endTime,
        status: calculatedStatus,
        bloodTypesNeeded: drive.bloodTypesNeeded || [],
        targetDonors: drive.targetDonors || 50,
        registeredDonors: drive.registeredDonors || 0,
        completedDonations: drive.completedDonations || 0,
        organizer: drive.organizer || '',
        contactNumber: drive.contactNumber || '',
        contactEmail: drive.contactEmail || '',
        hospitalId: drive.hospitalId?.toString() || '',
        hospitalName: hospitalMap.get(drive.hospitalId?.toString()) || 'Unknown Hospital',
        registrationCount: drive.registeredDonors || 0,
        completionRate: drive.targetDonors > 0 
          ? Math.round((drive.registeredDonors / drive.targetDonors) * 100) 
          : 0
      }
    })

    // ✅ Apply status filter in memory (against calculated status)
    if (status !== 'all') {
      transformedDrives = transformedDrives.filter(
        (d: any) => d.status === status
      )
    }

    // Get total count after filtering
    const total = transformedDrives.length

    // Apply pagination
    const paginatedDrives = transformedDrives.slice(skip, skip + limit)

    // ✅ Calculate stats using CALCULATED status
    const stats = {
      total: drives.length,
      upcoming: transformedDrives.filter((d: any) => d.status === 'upcoming').length,
      ongoing: transformedDrives.filter((d: any) => d.status === 'ongoing').length,
      completed: transformedDrives.filter((d: any) => d.status === 'completed').length,
      cancelled: transformedDrives.filter((d: any) => d.status === 'cancelled').length,
      totalRegistrations: drives.reduce((sum: number, d: any) => sum + (d.registeredDonors || 0), 0),
      totalDonations: drives.reduce((sum: number, d: any) => sum + (d.completedDonations || 0), 0)
    }

    return NextResponse.json({
      success: true,
      data: paginatedDrives,
      drives: paginatedDrives,
      stats: stats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching blood drives for dashboard:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch blood drives', 
        data: [],
        stats: {
          total: 0,
          upcoming: 0,
          ongoing: 0,
          completed: 0,
          cancelled: 0,
          totalRegistrations: 0,
          totalDonations: 0
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      title, 
      description, 
      location, 
      address, 
      date, 
      startTime, 
      endTime,
      bloodTypesNeeded, 
      targetDonors, 
      organizer, 
      contactNumber, 
      contactEmail,
      hospitalId
    } = body

    if (!title || !location || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, location, date, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Get hospital name
    let hospitalName = 'Hospital'
    if (hospitalId) {
      const hospital = await User.findById(hospitalId).select('hospitalName fullName').lean()
      if (hospital) {
        hospitalName = hospital.hospitalName || hospital.fullName || 'Hospital'
      }
    }

    const bloodDrive = await BloodDrive.create({
      title,
      description: description || '',
      location,
      address: address || '',
      date: new Date(date),
      startTime,
      endTime,
      status: 'upcoming',
      bloodTypesNeeded: bloodTypesNeeded || [],
      targetDonors: targetDonors || 50,
      registeredDonors: 0,
      completedDonations: 0,
      organizer: organizer || '',
      contactNumber: contactNumber || '',
      contactEmail: contactEmail || '',
      hospitalId: hospitalId || null,
      registeredDonorIds: [],
      donorStatuses: new Map()
    })

    // ============================================================
    // ✅ CREATE NOTIFICATION FOR NEW BLOOD DRIVE
    // ============================================================
    await createNewBloodDriveNotificationWithAdmins({
      driveId: bloodDrive._id.toString(),
      title: bloodDrive.title,
      location: bloodDrive.location,
      date: bloodDrive.date,
      hospitalId: bloodDrive.hospitalId?.toString() || '',
      hospitalName: hospitalName,
    })

    return NextResponse.json({
      success: true,
      message: 'Blood drive created successfully',
      data: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        location: bloodDrive.location,
        date: bloodDrive.date,
        status: bloodDrive.status,
        targetDonors: bloodDrive.targetDonors
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating blood drive:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create blood drive' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { driveId, status, ...updateData } = body

    if (!driveId) {
      return NextResponse.json(
        { error: 'Drive ID is required' },
        { status: 400 }
      )
    }

    const bloodDrive = await BloodDrive.findById(driveId)
    if (!bloodDrive) {
      return NextResponse.json(
        { error: 'Blood drive not found' },
        { status: 404 }
      )
    }

    // Get hospital name
    let hospitalName = 'Hospital'
    if (bloodDrive.hospitalId) {
      const hospital = await User.findById(bloodDrive.hospitalId).select('hospitalName fullName').lean()
      if (hospital) {
        hospitalName = hospital.hospitalName || hospital.fullName || 'Hospital'
      }
    }

    const oldStatus = bloodDrive.status

    if (status) bloodDrive.status = status
    if (updateData.title) bloodDrive.title = updateData.title
    if (updateData.description !== undefined) bloodDrive.description = updateData.description
    if (updateData.location) bloodDrive.location = updateData.location
    if (updateData.address !== undefined) bloodDrive.address = updateData.address
    if (updateData.date) bloodDrive.date = new Date(updateData.date)
    if (updateData.startTime) bloodDrive.startTime = updateData.startTime
    if (updateData.endTime) bloodDrive.endTime = updateData.endTime
    if (updateData.bloodTypesNeeded) bloodDrive.bloodTypesNeeded = updateData.bloodTypesNeeded
    if (updateData.targetDonors) bloodDrive.targetDonors = updateData.targetDonors
    if (updateData.organizer !== undefined) bloodDrive.organizer = updateData.organizer
    if (updateData.contactNumber !== undefined) bloodDrive.contactNumber = updateData.contactNumber
    if (updateData.contactEmail !== undefined) bloodDrive.contactEmail = updateData.contactEmail

    await bloodDrive.save()

    // ============================================================
    // ✅ CREATE NOTIFICATION FOR STATUS CHANGE
    // ============================================================
    if (status && status !== oldStatus) {
      const statusMessages: Record<string, string> = {
        ongoing: 'The blood drive has started! Please come and donate.',
        completed: 'The blood drive has been completed. Thank you to all participants!',
        cancelled: 'The blood drive has been cancelled.',
      }

      // ✅ 1. Notify the admin who made the change
      await NotificationService.create({
        userId: decoded.userId, // This is a string from JWT
        hospitalName: 'Admin',
        subject: `📅 Blood Drive Status Update: ${bloodDrive.title}`,
        message: `The blood drive "${bloodDrive.title}" has been updated from ${oldStatus} to ${status}. ${statusMessages[status] || ''}`,
        type: 'NEW_BLOOD_DRIVE',
        link: `/admin/blood-drives/${driveId}`,
        data: {
          driveId: driveId,
          title: bloodDrive.title,
          oldStatus: oldStatus,
          newStatus: status,
        },
      })

      // ✅ 2. Notify the hospital that created the drive
      if (bloodDrive.hospitalId) {
        await NotificationService.create({
          userId: bloodDrive.hospitalId.toString(), // ✅ Convert ObjectId to string
          hospitalName: hospitalName,
          subject: `📅 Blood Drive Status Update: ${bloodDrive.title}`,
          message: `The blood drive "${bloodDrive.title}" has been updated from ${oldStatus} to ${status}. ${statusMessages[status] || ''}`,
          type: 'NEW_BLOOD_DRIVE',
          link: `/hospital/blood-drives/${driveId}`,
          data: {
            driveId: driveId,
            title: bloodDrive.title,
            oldStatus: oldStatus,
            newStatus: status,
          },
        })
      }

      // ✅ 3. Notify all registered donors when status changes to ongoing, completed, or cancelled
      if (['ongoing', 'completed', 'cancelled'].includes(status)) {
        try {
          const registrations = await BloodDriveRegistration.find({
            bloodDriveId: driveId,
            status: 'registered'
          })

          for (const reg of registrations) {
            await NotificationService.create({
              userId: reg.donorId.toString(), // ✅ Convert ObjectId to string
              subject: `📅 Blood Drive ${status.charAt(0).toUpperCase() + status.slice(1)}`,
              message: `The blood drive "${bloodDrive.title}" you registered for has been ${status}. ${statusMessages[status] || ''}`,
              type: 'NEW_BLOOD_DRIVE',
              link: `/donor/blood-drives/${driveId}`,
              data: {
                driveId: driveId,
                title: bloodDrive.title,
                status: status,
              },
            })
          }
          console.log(`✅ Notified ${registrations.length} registered donors about status change`)
        } catch (donorError) {
          console.error('Error notifying donors:', donorError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Blood drive updated successfully',
      data: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        status: bloodDrive.status,
        updatedAt: bloodDrive.updatedAt
      }
    })

  } catch (error: any) {
    console.error('Error updating blood drive:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update blood drive' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const driveId = searchParams.get('id')

    if (!driveId) {
      return NextResponse.json(
        { error: 'Drive ID is required' },
        { status: 400 }
      )
    }

    const bloodDrive = await BloodDrive.findById(driveId)
    if (!bloodDrive) {
      return NextResponse.json(
        { error: 'Blood drive not found' },
        { status: 404 }
      )
    }

    // Get hospital name before deleting
    let hospitalName = 'Hospital'
    if (bloodDrive.hospitalId) {
      const hospital = await User.findById(bloodDrive.hospitalId).select('hospitalName fullName').lean()
      if (hospital) {
        hospitalName = hospital.hospitalName || hospital.fullName || 'Hospital'
      }
    }

    const oldStatus = bloodDrive.status
    bloodDrive.status = 'cancelled'
    await bloodDrive.save()

    // ============================================================
    // ✅ CREATE NOTIFICATION FOR CANCELLATION
    // ============================================================
    
    // ✅ 1. Notify the admin who cancelled
    await NotificationService.create({
      userId: decoded.userId, // This is a string from JWT
      hospitalName: 'Admin',
      subject: `📅 Blood Drive Cancelled: ${bloodDrive.title}`,
      message: `The blood drive "${bloodDrive.title}" has been cancelled.`,
      type: 'NEW_BLOOD_DRIVE',
      link: `/admin/blood-drives/${driveId}`,
      data: {
        driveId: driveId,
        title: bloodDrive.title,
        oldStatus: oldStatus,
        newStatus: 'cancelled',
      },
    })

    // ✅ 2. Notify the hospital that created the drive
    if (bloodDrive.hospitalId) {
      await NotificationService.create({
        userId: bloodDrive.hospitalId.toString(), // ✅ Convert ObjectId to string
        hospitalName: hospitalName,
        subject: `📅 Blood Drive Cancelled: ${bloodDrive.title}`,
        message: `The blood drive "${bloodDrive.title}" has been cancelled.`,
        type: 'NEW_BLOOD_DRIVE',
        link: `/hospital/blood-drives/${driveId}`,
        data: {
          driveId: driveId,
          title: bloodDrive.title,
          oldStatus: oldStatus,
          newStatus: 'cancelled',
        },
      })
    }

    // ✅ 3. Notify all registered donors about cancellation
    try {
      const registrations = await BloodDriveRegistration.find({
        bloodDriveId: driveId,
        status: 'registered'
      })

      for (const reg of registrations) {
        await NotificationService.create({
          userId: reg.donorId.toString(), // ✅ Convert ObjectId to string
          subject: `📅 Blood Drive Cancelled: ${bloodDrive.title}`,
          message: `The blood drive "${bloodDrive.title}" you registered for has been cancelled. We apologize for any inconvenience.`,
          type: 'NEW_BLOOD_DRIVE',
          link: `/donor/blood-drives/${driveId}`,
          data: {
            driveId: driveId,
            title: bloodDrive.title,
            status: 'cancelled',
          },
        })
      }
      console.log(`✅ Notified ${registrations.length} registered donors about cancellation`)
    } catch (donorError) {
      console.error('Error notifying donors about cancellation:', donorError)
    }

    return NextResponse.json({
      success: true,
      message: 'Blood drive cancelled successfully',
      data: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        status: bloodDrive.status
      }
    })

  } catch (error: any) {
    console.error('Error cancelling blood drive:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel blood drive' },
      { status: 500 }
    )
  }
}