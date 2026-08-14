// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib'
import mongoose from 'mongoose'

export async function POST(request: Request) {
  try {
    await dbConnect()
    
    const { email, newPassword } = await request.json()
    
    console.log('🔍 Reset password for:', email)
    
    if (!email || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Email and new password are required'
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
    console.log('🔍 Searching for:', cleanEmail)
    
    // Use the users collection directly
    const usersCollection = db.collection('users')
    
    // First, check all users in the collection
    const allUsers = await usersCollection.find({}).project({ email: 1, role: 1 }).toArray()
    console.log('📊 All users in users collection:', allUsers.map(u => ({ email: u.email, role: u.role })))
    
    // Find the user
    let user = await usersCollection.findOne({ email: cleanEmail })
    
    if (!user) {
      console.log('🔍 Trying case insensitive...')
      user = await usersCollection.findOne({ 
        email: { $regex: cleanEmail, $options: 'i' } 
      })
    }
    
    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: {
          searchedEmail: cleanEmail,
          availableUsers: allUsers.map(u => u.email)
        }
      }, { status: 404 })
    }
    
    console.log('✅ User found:', user.email)
    console.log('✅ Role:', user.role)
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    
    // Update the user
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    )
    
    console.log('✅ Password updated:', result.modifiedCount > 0 ? 'Success' : 'No changes')
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      email: user.email,
      role: user.role,
      modifiedCount: result.modifiedCount
    })
    
  } catch (error: any) {
    console.error('❌ Password reset error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Password reset failed'
    }, { status: 500 })
  }
}