// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { dbConnect } from '@/lib'
import mongoose from 'mongoose'

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY

export async function POST(request: Request) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { email, password, turnstileToken } = body

    console.log('🔍 Login attempt for:', email)

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Verify Cloudflare Turnstile
    if (!turnstileToken) {
      return NextResponse.json({
        success: false,
        error: 'Security verification required'
      }, { status: 400 })
    }

    // Verify Turnstile token
    const turnstileFormData = new FormData()
    turnstileFormData.append('secret', TURNSTILE_SECRET_KEY || '')
    turnstileFormData.append('response', turnstileToken)

    const turnstileResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: turnstileFormData,
      }
    )

    const turnstileResult = await turnstileResponse.json()

    if (!turnstileResult.success) {
      console.error('Turnstile verification failed:', turnstileResult)
      return NextResponse.json({
        success: false,
        error: 'Security verification failed. Please try again.'
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
    
    // Find the user
    let user = await usersCollection.findOne({ email: cleanEmail })
    
    if (!user) {
      user = await usersCollection.findOne({ 
        email: { $regex: cleanEmail, $options: 'i' } 
      })
    }

    if (!user) {
      console.log('❌ User not found:', cleanEmail)
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isActive: user.isActive
    })

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      }, { status: 403 })
    }

    // Check if hospital is approved
    if (user.role === 'hospital' && !user.isApproved) {
      return NextResponse.json({
        success: false,
        error: 'Your hospital account is pending approval. Please wait for admin verification.'
      }, { status: 403 })
    }

    // Check if donor is approved
    if (user.role === 'donor' && !user.isApproved) {
      return NextResponse.json({
        success: false,
        error: 'Your donor account is pending approval. Please wait for admin verification.'
      }, { status: 403 })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email)
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Get donor data if donor role
    let donorData = null
    if (user.role === 'donor') {
      const donorsCollection = db.collection('donors')
      donorData = await donorsCollection.findOne({ email: user.email })
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email, 
        fullName: user.fullName,
        role: user.role
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    // Build user data
    const userData: any = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || 'Not set',
      bloodType: user.bloodType || 'Not set',
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    // Add role-specific data
    if (user.role === 'donor') {
      userData.totalDonations = user.donationCount || 0
      userData.lastDonation = user.lastDonation || 'No donations yet'
      userData.nextEligible = user.nextEligibleDate || 'Not yet eligible'
      
      if (donorData) {
        userData.donorId = donorData._id?.toString() || null
        userData.donorProfileExists = true
        userData.donorStatus = donorData.status || 'pending'
        userData.status = donorData.status || 'pending'
        userData.isEligible = donorData.isEligible || false
        userData.digitalId = donorData.digitalId || ''
        userData.address = donorData.address || ''
        userData.barangay = donorData.barangay || ''
        userData.municipality = donorData.municipality || ''
        userData.province = donorData.province || ''
        userData.dateOfBirth = donorData.dateOfBirth || ''
        userData.gender = donorData.gender || ''
        userData.weight = donorData.weight || 0
        userData.rejectionReason = donorData.rejectionReason || null
      } else {
        userData.donorId = null
        userData.donorProfileExists = false
        userData.donorStatus = 'none'
        userData.status = 'active'
        userData.isEligible = false
        userData.digitalId = ''
        userData.address = ''
        userData.barangay = ''
        userData.municipality = ''
        userData.province = ''
        userData.dateOfBirth = ''
        userData.gender = ''
        userData.weight = 0
        userData.rejectionReason = null
      }
    } else if (user.role === 'hospital') {
      userData.hospitalName = user.hospitalName || ''
      userData.hospitalLicense = user.hospitalLicense || ''
      userData.hospitalAddress = user.hospitalAddress || ''
      userData.hospitalPhone = user.hospitalPhone || ''
      userData.hospitalType = user.hospitalType || ''
      userData.hospitalCapacity = user.hospitalCapacity || 0
      userData.hospitalEmail = user.hospitalEmail || ''
      userData.hospitalWebsite = user.hospitalWebsite || ''
      userData.status = user.isApproved ? 'approved' : 'pending'
    } else if (user.role === 'admin') {
      userData.status = 'active'
    }

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        token
      }
    })

  } catch (error: any) {
    console.error('❌ Login error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Login failed'
    }, { status: 500 })
  }
}