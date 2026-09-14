// app/api/user/update-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { sendOTPEmail } from '@/lib/email' // Import the email function

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Get token from header
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - No token provided'
      }, { status: 401 })
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        userId: string
        email: string
      }
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid token'
      }, { status: 401 })
    }

    const body = await request.json()
    const { otp, expiresAt } = body

    if (!otp || !expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'OTP and expiry date are required'
      }, { status: 400 })
    }

    // Find user by ID from token
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Update user with OTP
    user.resetPasswordOTP = otp
    user.resetPasswordOTPExpires = new Date(expiresAt)
    user.updatedAt = new Date()
    await user.save()

    console.log('✅ OTP saved for user:', user.email, 'OTP:', otp)

    // ========== SEND EMAIL WITH OTP ==========
    try {
      await sendOTPEmail(user.email, otp)
      console.log('📧 OTP email sent successfully to:', user.email)
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError)
      // Don't fail the request, the OTP is already saved
      // But log the error for debugging
    }
    // ==========================================

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email successfully',
      data: {
        email: user.email,
        expiresAt: user.resetPasswordOTPExpires
      }
    })

  } catch (error: any) {
    console.error('❌ Error saving OTP:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save OTP'
    }, { status: 500 })
  }
}