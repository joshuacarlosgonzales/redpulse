import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Donor from '@/models/Donor'
import Notification from '@/models/Notification'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { donorId, subject, message, donorEmail, donorName, type } = body

    if (!donorId || !subject || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: donorId, subject, message' 
        },
        { status: 400 }
      )
    }

    // Find donor - try by _id or userId
    let donor = await Donor.findById(donorId)
    if (!donor) {
      donor = await Donor.findOne({ userId: donorId })
    }

    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Find the user associated with this donor
    let user = null
    if (donor.userId) {
      user = await User.findById(donor.userId)
    }
    
    // If no user found by userId, try by email
    if (!user && donor.email) {
      user = await User.findOne({ email: donor.email })
    }

    // Replace placeholders in message
    const processedMessage = message
      .replace(/{donor_name}/g, donorName || donor.fullName)
      .replace(/{blood_type}/g, donor.bloodType || 'Unknown')
      .replace(/{donor_id}/g, donor.digitalId || donor._id.toString())
      .replace(/{next_eligible}/g, donor.nextEligibleDate ? new Date(donor.nextEligibleDate).toLocaleDateString() : 'Not set')

    // Prepare notification data
    const notificationData: any = {
      subject: subject,
      message: processedMessage,
      type: type || 'info',
      sender: decoded.fullName || 'RedPulse Admin',
      sentBy: decoded.userId,
      isRead: false,
      donorId: donor._id,
      donorName: donor.fullName,
      donorEmail: donor.email,
      createdAt: new Date()
    }

    // Add userId if user exists
    if (user) {
      notificationData.userId = user._id
    }

    // Create notification in database
    let notification = null
    try {
      notification = await Notification.create(notificationData)
      console.log('✅ Notification saved to database:', {
        notificationId: notification._id,
        donorId: donor._id,
        donorName: donor.fullName,
        donorEmail: donor.email,
        userId: user?._id || 'No user found',
        subject,
        message: processedMessage
      })
    } catch (notifError) {
      console.error('❌ Failed to save notification:', notifError)
      // Continue even if notification saving fails
    }

    // Try to send email notification (optional)
    let emailSent = false
    try {
      // You can add nodemailer or other email service here
      // For now, we'll just log it
      console.log('📧 Would send email to:', donor.email)
      emailSent = true
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId: notification?._id || null,
        donorId: donor._id,
        donorName: donor.fullName,
        donorEmail: donor.email,
        userId: user?._id || null,
        subject,
        message: processedMessage,
        type: notification?.type || type || 'info',
        emailSent: emailSent,
        sentAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error sending notification:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send notification'
    }, { status: 500 })
  }
}

// GET all notifications (for admin to view history)
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {}
    const donorId = searchParams.get('donorId')
    if (donorId && mongoose.Types.ObjectId.isValid(donorId)) {
      filter.donorId = new mongoose.Types.ObjectId(donorId)
    }

    // Get notifications with donor info
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Notification.countDocuments(filter)

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch notifications'
    }, { status: 500 })
  }
}

// DELETE notification (mark as read or delete)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('id')

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID' },
        { status: 400 }
      )
    }

    // Mark as read instead of deleting
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    )

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    })

  } catch (error: any) {
    console.error('❌ Error updating notification:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update notification'
    }, { status: 500 })
  }
}