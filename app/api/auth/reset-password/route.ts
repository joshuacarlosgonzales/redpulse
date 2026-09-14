// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib'
import mongoose from 'mongoose'

export async function POST(request: Request) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { email, otp, newPassword } = body
    
    console.log('🔍 Reset password for email:', email)
    console.log('🔍 OTP provided:', otp)
    
    if (!email || !otp || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Email, OTP, and new password are required'
      }, { status: 400 })
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters'
      }, { status: 400 })
    }
    
    // Get native MongoDB connection
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error'
      }, { status: 500 })
    }
    
    const cleanEmail = email.trim().toLowerCase()
    const usersCollection = db.collection('users')
    
    // Find user with valid OTP
    const user = await usersCollection.findOne({
      email: cleanEmail,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: {
        $gt: new Date(),
      },
    })
    
    if (!user) {
      console.log('❌ Invalid or expired OTP for:', cleanEmail)
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired code. Please request a new one.'
      }, { status: 400 })
    }
    
    console.log('✅ User found with valid OTP:', user.email)
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    
    // Update the user and clear OTP fields
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetPasswordOTP: "",
          resetPasswordOTPExpires: "",
        }
      }
    )
    
    console.log('✅ Password updated:', result.modifiedCount > 0 ? 'Success' : 'No changes')
    
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
      data: {
        email: user.email,
        modifiedCount: result.modifiedCount
      }
    })
    
  } catch (error: any) {
    console.error('❌ Password reset error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Password reset failed'
    }, { status: 500 })
  }
}