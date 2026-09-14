// app/api/admin/donors/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Donor from '@/models/Donor'
import Notification, { NOTIFICATION_TYPES, NotificationType } from '@/models/Notification'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'

// ============================================
// 📧 EMAIL TEMPLATE FUNCTIONS
// ============================================

function getEmailTemplate(type: string, donorName: string, bloodType: string, message: string, subject: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const templates: Record<string, { subject: string; html: string }> = {
    eligibility: {
      subject: `🩸 You're Eligible to Donate Blood - ${donorName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🩸 RedPulse Blood Donation</h1>
            <p style="color: #fca5a5; margin: 5px 0 0 0; font-size: 14px;">Saving Lives, One Donation at a Time</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="background: #dc2626; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                ✅ ELIGIBLE TO DONATE
              </span>
            </div>
            <p style="font-size: 16px; line-height: 1.8; color: #333; white-space: pre-line;">${message}</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0; font-size: 14px; color: #991b1b;">
                <strong>Blood Type:</strong> ${bloodType}
              </p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${baseUrl}" 
                 style="background-color: #dc2626; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                🏠 Visit RedPulse
              </a>
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message from the RedPulse Blood Donation System.
              <br>If you have any questions, please contact your local blood donation center.
              <br><br>
              © ${new Date().getFullYear()} RedPulse. All rights reserved.
            </p>
          </div>
        </div>
      `
    },
    approved: {
      subject: `✅ Your Blood Donor Application is Approved - ${donorName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Application Approved!</h1>
            <p style="color: #bbf7d0; margin: 5px 0 0 0; font-size: 14px;">Welcome to the RedPulse Donor Family</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="background: #16a34a; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                🎉 WELCOME ABOARD
              </span>
            </div>
            
            <p style="font-size: 16px; line-height: 1.8; color: #333; white-space: pre-line;">${message}</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <p style="margin: 0 0 10px 0; font-size: 15px; color: #166534; font-weight: bold;">
                📋 Your Donor Information:
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #166534;">
                <strong>Blood Type:</strong> ${bloodType}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #166534;">
                <strong>Status:</strong> Active Donor ✅
              </p>
            </div>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0 0 10px 0; font-size: 15px; color: #1e40af; font-weight: bold;">
                📝 Next Steps to Complete Your Donor Journey:
              </p>
              <div style="margin: 10px 0;">
                <div style="display: flex; align-items: flex-start; margin: 8px 0; padding: 8px; background: white; border-radius: 6px;">
                  <span style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 12px; flex-shrink: 0;">1</span>
                  <div>
                    <strong style="color: #1e40af;">Complete Your Profile</strong>
                    <p style="margin: 2px 0 0 0; font-size: 14px; color: #4b5563;">Fill up your complete personal information, medical history, and emergency contacts to ensure a smooth donation process.</p>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; margin: 8px 0; padding: 8px; background: white; border-radius: 6px;">
                  <span style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 12px; flex-shrink: 0;">2</span>
                  <div>
                    <strong style="color: #1e40af;">View Available Blood Drives</strong>
                    <p style="margin: 2px 0 0 0; font-size: 14px; color: #4b5563;">Check our schedule of upcoming blood drives and find the nearest location where you can donate.</p>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; margin: 8px 0; padding: 8px; background: white; border-radius: 6px;">
                  <span style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 12px; flex-shrink: 0;">3</span>
                  <div>
                    <strong style="color: #1e40af;">Register for a Blood Drive</strong>
                    <p style="margin: 2px 0 0 0; font-size: 14px; color: #4b5563;">Sign up for your preferred blood drive event and schedule your donation slot conveniently.</p>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; margin: 8px 0; padding: 8px; background: white; border-radius: 6px;">
                  <span style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 12px; flex-shrink: 0;">4</span>
                  <div>
                    <strong style="color: #1e40af;">Donate & Save Lives</strong>
                    <p style="margin: 2px 0 0 0; font-size: 14px; color: #4b5563;">Attend the event, donate blood, and help save up to 3 lives with every donation. Earn points and rewards for your contribution!</p>
                  </div>
                </div>
              </div>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                💡 <strong>Pro Tip:</strong> Complete your profile now to unlock all features and get notified about upcoming blood drives near you!
              </p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${baseUrl}" 
                 style="background-color: #16a34a; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                🏠 Get Started Now
              </a>
            </div>
            
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message from the RedPulse Blood Donation System.
              <br>© ${new Date().getFullYear()} RedPulse. All rights reserved.
            </p>
          </div>
        </div>
      `
    },
    rejected: {
      subject: `❌ Blood Donor Application Update - ${donorName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
            <p style="color: #fca5a5; margin: 5px 0 0 0; font-size: 14px;">RedPulse Blood Donation System</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="background: #dc2626; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                ❌ Application Not Approved
              </span>
            </div>
            <p style="font-size: 16px; line-height: 1.8; color: #333; white-space: pre-line;">${message}</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0; font-size: 14px; color: #991b1b;">
                <strong>Blood Type:</strong> ${bloodType}
              </p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${baseUrl}" 
                 style="background-color: #dc2626; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                🏠 Visit RedPulse
              </a>
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              If you have questions about this decision, please contact our support team.
              <br>© ${new Date().getFullYear()} RedPulse. All rights reserved.
            </p>
          </div>
        </div>
      `
    },
    reminder: {
      subject: `🔔 Donation Reminder - ${donorName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Donation Reminder</h1>
            <p style="color: #fde68a; margin: 5px 0 0 0; font-size: 14px;">Your Donation Can Save Lives</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.8; color: #333; white-space: pre-line;">${message}</p>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Blood Type:</strong> ${bloodType}
              </p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${baseUrl}" 
                 style="background-color: #f59e0b; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                🏠 Visit RedPulse
              </a>
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message from the RedPulse Blood Donation System.
              <br>© ${new Date().getFullYear()} RedPulse. All rights reserved.
            </p>
          </div>
        </div>
      `
    },
    custom: {
      subject: subject || 'Notification from RedPulse',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📬 RedPulse</h1>
            <p style="color: #c7d2fe; margin: 5px 0 0 0; font-size: 14px;">Donor Notification</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.8; color: #333; white-space: pre-line;">${message}</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${baseUrl}" 
                 style="background-color: #6366f1; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                🏠 Visit RedPulse
              </a>
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message from the RedPulse Blood Donation System.
              <br>© ${new Date().getFullYear()} RedPulse. All rights reserved.
            </p>
          </div>
        </div>
      `
    }
  }

  return templates[type] || templates.custom
}

// ============================================
// 📧 SEND EMAIL FUNCTION
// ============================================

async function sendEmailFunction(to: string, subject: string, html: string, text: string) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('⚠️ Gmail credentials not configured. Email will be skipped.')
      return { success: false, error: 'Gmail credentials not configured' }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    })

    const mailOptions = {
      from: `"RedPulse Blood Donation" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('❌ Email sending failed:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// 🔥 POST: Send Notification
// ============================================

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Authentication check
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
    const { 
      donorId, 
      subject, 
      message, 
      donorEmail, 
      donorName, 
      type, 
      emailTemplate,
      sendEmail = true
    } = body

    if (!donorId || !subject || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: donorId, subject, message' 
        },
        { status: 400 }
      )
    }

    // Find donor
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

    // Find user
    let user = null
    if (donor.userId) {
      user = await User.findById(donor.userId)
    }
    if (!user && donor.email) {
      user = await User.findOne({ email: donor.email })
    }

    // Process subject with placeholders
    const processedSubject = subject
      .replace(/{donor_name}/g, donorName || donor.fullName)
      .replace(/{blood_type}/g, donor.bloodType || 'Unknown')

    // Replace placeholders in message
    const processedMessage = message
      .replace(/{donor_name}/g, donorName || donor.fullName)
      .replace(/{blood_type}/g, donor.bloodType || 'Unknown')
      .replace(/{donor_id}/g, donor.digitalId || donor._id.toString())
      .replace(/{next_eligible}/g, donor.nextEligibleDate ? new Date(donor.nextEligibleDate).toLocaleDateString() : 'Not set')
      .replace(/{total_donations}/g, donor.totalDonations?.toString() || '0')
      .replace(/{location}/g, donor.address || donor.barangay || 'Not specified')

    // Map string types to valid enum values
    const typeMap: Record<string, string> = {
      'info': 'NEW_DONOR',
      'success': 'NEW_DONATION',
      'warning': 'LOW_INVENTORY',
      'error': 'CRITICAL_INVENTORY',
      'approved': 'REQUEST_APPROVED',
      'rejected': 'REQUEST_DECLINED',
      'thank_you': 'NEW_DONATION',
      'reminder': 'NEW_BLOOD_DRIVE',
      'schedule': 'NEW_BLOOD_DRIVE',
      'eligibility': 'NEW_DONATION',
      'custom': 'NEW_DONOR'
    }

    // Get the mapped type or use default
    let mappedType = typeMap[type] || typeMap[emailTemplate] || 'NEW_DONOR'
    
    // Type assertion to ensure it's a valid NotificationType
    const notificationType = mappedType as NotificationType

    // Prepare notification data
    const notificationData = {
      userId: user?._id || undefined,
      donorId: donor._id,
      donorName: donor.fullName,
      donorEmail: donor.email,
      subject: processedSubject,
      message: processedMessage,
      type: notificationType,
      category: 'info' as const,
      sender: decoded.fullName || 'RedPulse Admin',
      sentBy: decoded.userId || '',
      isRead: false,
      isDeleted: false,
      createdAt: new Date()
    }

    console.log('📝 Saving notification:', {
      donorName: notificationData.donorName,
      subject: notificationData.subject,
      type: notificationData.type,
      userId: notificationData.userId
    })

    // Save notification to database
    let notification = null
    try {
      notification = await Notification.create(notificationData)
      console.log('✅ Notification saved to database:', notification._id)
    } catch (notifError: any) {
      console.error('❌ Failed to save notification:', notifError.message)
      if (notifError.errors) {
        console.error('❌ Validation errors:', notifError.errors)
      }
    }

    // ============================================
    // 📧 SEND EMAIL (ONLY IF sendEmail IS TRUE)
    // ============================================
    let emailResult: { success: boolean; messageId: string | null; error: string | null } = { 
      success: false, 
      messageId: null, 
      error: null 
    }

    if (sendEmail === true) {
      try {
        const templateType = emailTemplate || 'custom'
        const template = getEmailTemplate(templateType, donor.fullName, donor.bloodType, processedMessage, processedSubject)
        
        const result = await sendEmailFunction(
          donor.email,
          template.subject || processedSubject,
          template.html,
          processedMessage
        )

        if (result.success) {
          emailResult = { 
            success: true, 
            messageId: result.messageId || null, 
            error: null 
          }
          console.log('✅ Email sent successfully to:', donor.email)
        } else {
          emailResult = { 
            success: false, 
            messageId: null, 
            error: result.error || 'Unknown error' 
          }
          console.error('❌ Email sending failed:', emailResult.error)
        }
      } catch (emailError: any) {
        console.error('❌ Email sending error:', emailError)
        emailResult = { 
          success: false, 
          messageId: null, 
          error: emailError.message 
        }
      }
    } else {
      console.log('📬 Email skipped - In-app notification only')
    }

    return NextResponse.json({
      success: true,
      message: sendEmail ? 'Notification sent successfully with email' : 'In-app notification sent successfully',
      data: {
        notificationId: notification?._id || null,
        donorId: donor._id,
        donorName: donor.fullName,
        donorEmail: donor.email,
        userId: notification?.userId || null,
        subject: processedSubject,
        message: processedMessage,
        type: notification?.type || notificationData.type,
        emailSent: emailResult.success,
        emailMessageId: emailResult.messageId,
        emailError: emailResult.error,
        emailSkipped: !sendEmail,
        sentAt: new Date().toISOString(),
        saved: notification !== null
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

// ============================================
// 📋 GET: Fetch Notifications
// ============================================

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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const filter: any = {}
    const donorId = searchParams.get('donorId')
    if (donorId && mongoose.Types.ObjectId.isValid(donorId)) {
      filter.donorId = new mongoose.Types.ObjectId(donorId)
    }

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

// ============================================
// 🗑️ DELETE: Mark Notification as Read
// ============================================

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

// ============================================
// 🔄 PATCH: Bulk Mark as Read
// ============================================

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { notificationIds } = body

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification IDs' },
        { status: 400 }
      )
    }

    const result = await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { 
        isRead: true,
        readAt: new Date()
      }
    )

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    })

  } catch (error: any) {
    console.error('❌ Error updating notifications:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update notifications'
    }, { status: 500 })
  }
}