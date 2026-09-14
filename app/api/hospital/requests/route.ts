// app/api/hospital/requests/route.ts

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import BloodRequest from '@/models/BloodRequest'
import User from '@/models/User'
import Hospital from '@/models/Hospital'
import BloodInventory from '@/models/BloodInventory'
import Notification from '@/models/Notification'
import { 
  getAuthenticatedHospitalUser, 
  getUserIdFromAuth,
  isAuthFailure 
} from '@/lib/hospitalAuth'

// ============================================================
// HELPER: SEND NOTIFICATION TO DONOR
// ============================================================

async function sendNotificationToDonor(
  request: any,
  status: string,
  rejectionReason?: string,
  releaseData?: any
) {
  try {
    console.log(
      `📧 Sending notification to donor ${request.donorEmail} about status: ${status}`
    )

    // ========================================================
    // APPROVED REQUEST
    // ========================================================

    if (status === 'approved' && releaseData) {
      try {
        // Find donor's User account
        const donorUser = await User.findOne({
          email: request.donorEmail,
          role: 'donor',
        })

        if (!donorUser) {
          console.log(
            `⚠️ Donor user not found for email: ${request.donorEmail}`
          )
          return true
        }

        const notification = await Notification.create({
          userId: donorUser._id,
          donorId: request.donorId ? request.donorId : undefined,
          hospitalId: request.hospitalId ? request.hospitalId : undefined,
          relatedId: request._id ? request._id : undefined,
          relatedModel: 'BloodRequest',
          subject: 'Your Blood Request Has Been Fulfilled!',
          message: `Your blood donation request for ${
            request.quantity
          } unit(s) of ${request.bloodType} has been approved and fulfilled by ${
            request.hospitalName || 'the hospital'
          }.

Details:
• Patient: ${releaseData.patientName || 'Not specified'}
• Ward: ${
            releaseData.hospitalWard ||
            releaseData.department ||
            request.department ||
            'General'
          }
• Doctor: ${releaseData.doctorName || 'Not specified'}
• Blood Type: ${request.bloodType}
• Units: ${request.quantity}

Thank you for your willingness to help save lives!`,
          type: 'REQUEST_APPROVED',
          category: 'success',
          isRead: false,
          sender: request.hospitalName || 'RedPulse Admin',
          link: '/donors/requests',
          createdAt: new Date(),
        })

        console.log(
          `✅ Approval notification created for donor: ${request.donorEmail}`
        )

        return true
      } catch (notifError) {
        console.error('❌ Error creating approval notification:', notifError)
        return true
      }
    }

    // ========================================================
    // REJECTED REQUEST
    // ========================================================

    if (status === 'rejected') {
      try {
        const donorUser = await User.findOne({
          email: request.donorEmail,
          role: 'donor',
        })

        if (!donorUser) {
          console.log(
            `⚠️ Donor user not found for email: ${request.donorEmail}`
          )
          return true
        }

        const notification = await Notification.create({
          userId: donorUser._id,
          donorId: request.donorId ? request.donorId : undefined,
          hospitalId: request.hospitalId ? request.hospitalId : undefined,
          relatedId: request._id ? request._id : undefined,
          relatedModel: 'BloodRequest',
          subject: 'Blood Request Update',
          message: `Your blood donation request for ${
            request.bloodType
          } has been reviewed.

Status: Rejected
Reason: ${rejectionReason || 'Not specified'}
Hospital: ${request.hospitalName || 'Not specified'}

We appreciate your willingness to help. Please feel free to contact the hospital for more information.`,
          type: 'REQUEST_DECLINED',
          category: 'error',
          isRead: false,
          sender: request.hospitalName || 'RedPulse Admin',
          link: '/donors/requests',
          createdAt: new Date(),
        })

        console.log(
          `✅ Rejection notification created for donor: ${request.donorEmail}`
        )

        return true
      } catch (notifError) {
        console.error('❌ Error creating rejection notification:', notifError)
        return true
      }
    }

    return false
  } catch (error) {
    console.error('❌ Error sending notification:', error)
    return false
  }
}

// ============================================================
// GET - GET HOSPITAL BLOOD REQUESTS
// ============================================================

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // ========================================================
    // ✅ FIX: Use consistent authentication helper
    // ========================================================

    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user
    const hospitalId = getUserIdFromAuth(decoded)

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID not found' },
        { status: 400 }
      )
    }

    // ========================================================
    // CHECK USER
    // ========================================================

    const user = await User.findById(hospitalId)

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        {
          status: 404,
        }
      )
    }

    if (user.role !== 'hospital') {
      return NextResponse.json(
        {
          error: 'Unauthorized - Hospital access required',
        },
        {
          status: 403,
        }
      )
    }

    // ========================================================
    // GET OR CREATE HOSPITAL RECORD
    // ========================================================

    let hospital = await Hospital.findOne({
      userId: hospitalId,
    })

    // If no hospital record exists, create one from user data
    if (!hospital) {
      // ✅ FIXED: Use only fields that exist on User model
   const hospitalName = user.hospitalName || user.fullName || 'Hospital'
const hospitalAddress = ''
      
      hospital = await Hospital.create({
        userId: hospitalId,
        hospitalName: hospitalName,
        hospitalAddress: hospitalAddress,
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        status: 'active',
      })
      console.log(`✅ Created hospital record for ${hospitalName}`)
    }

    // ========================================================
    // QUERY PARAMETERS
    // ========================================================

    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const urgency = searchParams.get('urgency') || ''

    // ========================================================
    // BUILD FILTER
    // ========================================================

    const filter: any = {
      hospitalId: hospital._id,
    }

    if (status !== 'all') {
      filter.status = status
    }

    if (search) {
      filter.$or = [
        {
          donorName: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          patientName: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          bloodType: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          department: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          doctorName: {
            $regex: search,
            $options: 'i',
          },
        },
      ]
    }

    if (urgency) {
      filter.urgency = urgency
    }

    console.log(
      '🔍 Hospital requests filter:',
      JSON.stringify(filter, null, 2)
    )

    // ========================================================
    // GET REQUESTS
    // ========================================================

    const requests = await BloodRequest.find(filter)
      .sort({
        createdAt: -1,
      })
      .lean()

    console.log(
      `📦 Found ${requests.length} requests for hospital ${hospital.hospitalName}`
    )

    // ========================================================
    // TRANSFORM DATA
    // ========================================================

    const transformedRequests = requests.map((req: any) => ({
      id: req._id.toString(),
      donorId: req.donorId?.toString() || '',
      donorName: req.donorName || 'Unknown Donor',
      donorEmail: req.donorEmail || '',
      donorPhone: req.donorPhone || '',
      donorBloodType: req.bloodType || '',
      bloodType: req.bloodType || '',
      quantity: req.quantity || 1,
      urgency: req.urgency || 'normal',
      status: req.status || 'pending',
      requestDate: req.requestDate || req.createdAt,
      requiredDate: req.requiredDate,
      hospitalName: req.hospitalName || hospital.hospitalName,
      hospitalAddress: req.hospitalAddress || hospital.hospitalAddress || '',
      patientName: req.patientName || '',
      patientAge: req.patientAge || null,
      notes: req.notes || '',
      requestMethod: req.requestMethod || 'routine',
      department: req.department || '',
      doctorName: req.doctorName || '',
      contactNumber: req.contactNumber || '',
      rejectionReason: req.rejectionReason || '',
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    }))

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,
      data: transformedRequests,
      debug: {
        hospitalId: hospital._id,
        hospitalName: hospital.hospitalName,
        totalRequests: transformedRequests.length,
        filter,
      },
    })
  } catch (error: any) {
    console.error('❌ Error fetching hospital requests:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch requests',
      },
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// PUT - APPROVE / REJECT BLOOD REQUEST
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()

    // ========================================================
    // ✅ FIX: Use consistent authentication helper
    // ========================================================

    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user
    const hospitalId = getUserIdFromAuth(decoded)

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID not found' },
        { status: 400 }
      )
    }

    // ========================================================
    // CHECK HOSPITAL USER
    // ========================================================

    const user = await User.findById(hospitalId)

    if (!user || user.role !== 'hospital') {
      return NextResponse.json(
        {
          error: 'Unauthorized - Hospital access required',
        },
        {
          status: 403,
        }
      )
    }

    // ========================================================
    // GET HOSPITAL
    // ========================================================

    let hospital = await Hospital.findOne({
      userId: hospitalId,
    })

    if (!hospital) {
      // ✅ FIXED: Use only fields that exist on User model
    const hospitalName = user.hospitalName || user.fullName || 'Hospital'
const hospitalAddress = ''
      
      hospital = await Hospital.create({
        userId: hospitalId,
        hospitalName: hospitalName,
        hospitalAddress: hospitalAddress,
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        status: 'active',
      })
    }

    // ========================================================
    // REQUEST ID
    // ========================================================

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json(
        {
          error: 'Request ID is required',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body = await request.json()
    const { status, rejectionReason, releaseData } = body

    if (!status) {
      return NextResponse.json(
        {
          error: 'Status is required',
        },
        {
          status: 400,
        }
      )
    }

    // ✅ Only allow approved/rejected
    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json(
        {
          error: 'Invalid status. Only approved or rejected are allowed.',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // FIND REQUEST
    // ========================================================

    const bloodRequest = await BloodRequest.findOne({
      _id: requestId,
      hospitalId: hospital._id,
    })

    if (!bloodRequest) {
      return NextResponse.json(
        {
          error: 'Request not found or unauthorized',
        },
        {
          status: 404,
        }
      )
    }

    let releaseResult = null
    let notificationSent = false

    // ========================================================
    // APPROVE REQUEST
    // ========================================================

    if (status === 'approved') {
      // Inventory uses User._id as hospitalId
      const inventoryHospitalId = new mongoose.Types.ObjectId(hospitalId)

      console.log(`🔍 Looking for inventory with hospitalId: ${inventoryHospitalId}`)
      console.log(`🔍 Blood type: ${bloodRequest.bloodType}`)

      // ======================================================
      // FIND INVENTORY
      // ======================================================

      const inventoryItem = await BloodInventory.findOne({
        hospitalId: inventoryHospitalId,
        bloodType: bloodRequest.bloodType,
      })

      console.log('📦 Inventory found:', inventoryItem ? 'Yes' : 'No')

      if (!inventoryItem) {
        return NextResponse.json(
          {
            error: `No inventory found for ${bloodRequest.bloodType}`,
          },
          {
            status: 400,
          }
        )
      }

      // ======================================================
      // CHECK EXPIRATION
      // ======================================================

      if (
        inventoryItem.expirationDate &&
        new Date(inventoryItem.expirationDate) < new Date()
      ) {
        return NextResponse.json(
          {
            error: `Inventory for ${bloodRequest.bloodType} has expired`,
          },
          {
            status: 400,
          }
        )
      }

      // ======================================================
      // CHECK AVAILABLE UNITS
      // ======================================================

      if (inventoryItem.units < bloodRequest.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient inventory for ${bloodRequest.bloodType}. Available: ${inventoryItem.units}, Required: ${bloodRequest.quantity}`,
          },
          {
            status: 400,
          }
        )
      }

      // ======================================================
      // START TRANSACTION
      // ======================================================

      const session = await mongoose.startSession()
      session.startTransaction()

      try {
        // ====================================================
        // DEDUCT BLOOD UNITS
        // ====================================================

        const updatedInventory = await BloodInventory.findByIdAndUpdate(
          inventoryItem._id,
          {
            $inc: {
              units: -bloodRequest.quantity,
            },
            $set: {
              updatedAt: new Date(),
            },
          },
          {
            session,
            new: true,
          }
        )

        if (!updatedInventory) {
          await session.abortTransaction()
          return NextResponse.json(
            {
              error: 'Failed to update inventory',
            },
            {
              status: 500,
            }
          )
        }

        // ====================================================
        // RELEASE LOG
        // ====================================================

        const formattedDate = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        const releaseLog = `
📋 BLOOD RELEASE
─────────────────────────────────────────────────
  Donor       : ${bloodRequest.donorName || 'Unknown'}
  Request ID  : ${requestId.slice(0, 8)}
  Released    : ${formattedDate}
  Units       : ${bloodRequest.quantity}
  Blood Type  : ${bloodRequest.bloodType}
  Patient     : ${bloodRequest.patientName || 'Unknown'}
  Doctor      : ${bloodRequest.doctorName || 'Unknown'}
  Ward        : ${bloodRequest.department || 'General'}
─────────────────────────────────────────────────`

        // ====================================================
        // UPDATE RELEASE NOTES
        // ====================================================

        await BloodInventory.findByIdAndUpdate(
          inventoryItem._id,
          {
            $set: {
              notes: inventoryItem.notes
                ? `${inventoryItem.notes}\n\n${releaseLog}`
                : releaseLog,
            },
          },
          {
            session,
          }
        )

        // ====================================================
        // COMMIT TRANSACTION
        // ====================================================

        await session.commitTransaction()

        // ====================================================
        // RELEASE RESULT
        // ====================================================

        releaseResult = {
          bloodType: bloodRequest.bloodType,
          units: bloodRequest.quantity,
          remainingUnits: updatedInventory.units,
          patientName: bloodRequest.patientName || 'Unknown Patient',
          donorName: bloodRequest.donorName,
          donorEmail: bloodRequest.donorEmail,
          donorPhone: bloodRequest.donorPhone,
          doctorName: bloodRequest.doctorName,
          department: bloodRequest.department,
          hospitalWard: bloodRequest.department,
          releaseDate: new Date().toISOString(),
          requestId,
        }

        // ====================================================
        // SEND APPROVAL NOTIFICATION
        // ====================================================

        notificationSent = await sendNotificationToDonor(
          bloodRequest,
          'approved',
          undefined,
          releaseResult
        )
      } catch (error) {
        await session.abortTransaction()
        console.error('❌ Transaction error:', error)
        throw error
      } finally {
        await session.endSession()
      }
    }

    // ========================================================
    // REJECT REQUEST
    // ========================================================

    if (status === 'rejected') {
      if (!rejectionReason || rejectionReason.trim() === '') {
        return NextResponse.json(
          {
            error: 'Rejection reason is required',
          },
          {
            status: 400,
          }
        )
      }

      notificationSent = await sendNotificationToDonor(
        bloodRequest,
        'rejected',
        rejectionReason
      )
    }

    // ========================================================
    // UPDATE BLOOD REQUEST
    // ========================================================

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === 'approved') {
      updateData.approvedBy = hospitalId
      updateData.approvedAt = new Date()
    }

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    // ========================================================
    // SAVE REQUEST STATUS
    // ========================================================

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      requestId,
      updateData,
      {
        new: true,
      }
    )

    if (!updatedRequest) {
      return NextResponse.json(
        {
          error: 'Failed to update request',
        },
        {
          status: 500,
        }
      )
    }

    console.log(`✅ Request ${requestId} updated to ${status}`)

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRequest._id.toString(),
        status: updatedRequest.status,
        updatedAt: updatedRequest.updatedAt,
      },
      release: releaseResult,
      notificationSent,
      message: `Request ${status} successfully${
        status === 'approved'
          ? ' and blood released from inventory'
          : ''
      }`,
    })
  } catch (error: any) {
    console.error('❌ Error updating request:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to update request',
      },
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// DELETE - DELETE PENDING REQUEST
// ============================================================

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    // ========================================================
    // ✅ FIX: Use consistent authentication helper
    // ========================================================

    const auth = getAuthenticatedHospitalUser(request)
    if (isAuthFailure(auth)) {
      return auth.response
    }

    const decoded = auth.user
    const hospitalId = getUserIdFromAuth(decoded)

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID not found' },
        { status: 400 }
      )
    }

    // ========================================================
    // CHECK USER
    // ========================================================

    const user = await User.findById(hospitalId)

    if (!user || user.role !== 'hospital') {
      return NextResponse.json(
        {
          error: 'Unauthorized - Hospital access required',
        },
        {
          status: 403,
        }
      )
    }

    // ========================================================
    // GET HOSPITAL
    // ========================================================

    let hospital = await Hospital.findOne({
      userId: hospitalId,
    })

    if (!hospital) {
      // ✅ FIXED: Use only fields that exist on User model
     const hospitalName = user.hospitalName || user.fullName || 'Hospital'
const hospitalAddress = ''
      
      hospital = await Hospital.create({
        userId: hospitalId,
        hospitalName: hospitalName,
        hospitalAddress: hospitalAddress,
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        status: 'active',
      })
    }

    // ========================================================
    // REQUEST ID
    // ========================================================

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json(
        {
          error: 'Request ID is required',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // FIND REQUEST
    // ========================================================

    const bloodRequest = await BloodRequest.findOne({
      _id: requestId,
      hospitalId: hospital._id,
    })

    if (!bloodRequest) {
      return NextResponse.json(
        {
          error: 'Request not found or unauthorized',
        },
        {
          status: 404,
        }
      )
    }

    // ========================================================
    // ONLY PENDING CAN BE DELETED
    // ========================================================

    if (bloodRequest.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Only pending requests can be deleted',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // DELETE
    // ========================================================

    await BloodRequest.deleteOne({
      _id: requestId,
    })

    console.log(`🗑️ Request ${requestId} deleted by hospital ${hospital.hospitalName}`)

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ Error deleting request:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to delete request',
      },
      {
        status: 500,
      }
    )
  }
}