import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import BloodDrive from '@/models/BloodDrive'
import BloodDriveRegistration from '@/models/BloodDriveRegistration'
import User from '@/models/User'
import Donor from '@/models/Donor'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Type definitions
interface Registrant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  registeredAt: Date;
  status: 'registered' | 'attended' | 'cancelled';
  donationStatus: 'pending' | 'approved' | 'rejected' | 'completed';
}

const BloodDriveModel = BloodDrive as any
const BloodDriveRegistrationModel = BloodDriveRegistration as any
const UserModel = User as any
const DonorModel = Donor as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      if (!decoded || (decoded.role !== 'hospital' && decoded.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized - Hospital or Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid blood drive ID' },
        { status: 400 }
      )
    }

    const hospitalId = decoded.userId || decoded.id
    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID not found in token' },
        { status: 400 }
      )
    }

    const bloodDrive = await BloodDriveModel.findOne({
      _id: id,
      hospitalId: hospitalId
    })

    if (!bloodDrive) {
      return NextResponse.json(
        { error: 'Blood drive not found or unauthorized' },
        { status: 404 }
      )
    }

    const registrants: Registrant[] = []
    
    // If no registrants, try to add a test donor automatically
    if (!bloodDrive.registeredDonorIds || bloodDrive.registeredDonorIds.length === 0) {
      console.log('📋 No registrants found. Looking for a donor to add as test...')
      
      const testDonor = await UserModel.findOne({ 
        role: 'donor', 
        isApproved: true,
        isActive: true 
      }).select('_id fullName email phone bloodType createdAt')

      if (testDonor) {
        console.log('✅ Found test donor:', testDonor.fullName)
        
        // Check if already registered
        const existingRegistration = await BloodDriveRegistrationModel.findOne({
          donorId: testDonor._id,
          bloodDriveId: bloodDrive._id
        })

        // Add to blood drive registeredDonorIds
        bloodDrive.registeredDonorIds.push(testDonor._id)
        bloodDrive.registeredDonors = bloodDrive.registeredDonorIds.length
        
        // Initialize donor status
        if (!bloodDrive.donorStatuses) {
          bloodDrive.donorStatuses = new Map()
        }
        bloodDrive.donorStatuses.set(testDonor._id.toString(), 'pending')
        
        await bloodDrive.save()
        
        // ✅ Create BloodDriveRegistration if it doesn't exist
        if (!existingRegistration) {
          const registration = new BloodDriveRegistrationModel({
            donorId: testDonor._id,
            bloodDriveId: bloodDrive._id,
            status: 'registered',
            registeredAt: new Date(),
            notes: 'Auto-registered for testing'
          })
          await registration.save()
          console.log('✅ BloodDriveRegistration created for test donor')
        }
        
        const donor = await DonorModel.findOne({ userId: testDonor._id })
        
        registrants.push({
          id: testDonor._id.toString(),
          fullName: donor?.fullName || testDonor.fullName || 'Test Donor',
          email: donor?.email || testDonor.email || '',
          phone: donor?.phone || testDonor.phone || '',
          bloodType: donor?.bloodType || testDonor.bloodType || 'O+',
          registeredAt: testDonor.createdAt || new Date(),
          status: 'registered',
          donationStatus: 'pending'
        })
        
        console.log('✅ Test registrant added successfully!')
      } else {
        console.log('📋 No donors found. Creating a test donor...')
        
        const hashedPassword = await bcrypt.hash('TestDonor123!', 10)
        
        const testDonorUser = new UserModel({
          fullName: 'Test Donor',
          email: 'testdonor@redpulse.com',
          password: hashedPassword,
          role: 'donor',
          bloodType: 'O+',
          phone: '09123456789',
          isApproved: true,
          isActive: true,
          isVerified: true,
          createdAt: new Date()
        })
        
        await testDonorUser.save()
        
        const testDonorProfile = new DonorModel({
          userId: testDonorUser._id,
          fullName: 'Test Donor',
          email: 'testdonor@redpulse.com',
          phone: '09123456789',
          bloodType: 'O+',
          status: 'active',
          isEligible: true
        })
        
        await testDonorProfile.save()
        
        // Add to blood drive
        bloodDrive.registeredDonorIds.push(testDonorUser._id)
        bloodDrive.registeredDonors = bloodDrive.registeredDonorIds.length
        
        // Initialize donor status
        if (!bloodDrive.donorStatuses) {
          bloodDrive.donorStatuses = new Map()
        }
        bloodDrive.donorStatuses.set(testDonorUser._id.toString(), 'pending')
        
        await bloodDrive.save()
        
        // ✅ Create BloodDriveRegistration
        const registration = new BloodDriveRegistrationModel({
          donorId: testDonorUser._id,
          bloodDriveId: bloodDrive._id,
          status: 'registered',
          registeredAt: new Date(),
          notes: 'Auto-created test donor'
        })
        await registration.save()
        console.log('✅ BloodDriveRegistration created for new test donor')
        
        registrants.push({
          id: testDonorUser._id.toString(),
          fullName: 'Test Donor',
          email: 'testdonor@redpulse.com',
          phone: '09123456789',
          bloodType: 'O+',
          registeredAt: new Date(),
          status: 'registered',
          donationStatus: 'pending'
        })
        
        console.log('✅ Test donor created and added successfully!')
      }
    } else {
      // Existing registrants - fetch them normally
      const userIds = bloodDrive.registeredDonorIds.map((id: any) => id.toString())
      
      // Get registration records for these donors
      const registrations = await BloodDriveRegistrationModel.find({
        bloodDriveId: bloodDrive._id,
        donorId: { $in: userIds }
      })
      
      const registrationMap = new Map<string, any>()
      registrations.forEach((reg: any) => {
        registrationMap.set(reg.donorId.toString(), reg)
      })
      
      const users = await UserModel.find({
        _id: { $in: userIds }
      }).select('fullName email phone bloodType createdAt')
      
      const donors = await DonorModel.find({
        userId: { $in: userIds }
      }).select('fullName email phone bloodType userId')
      
      const donorMap = new Map<string, any>()
      donors.forEach((donor: any) => {
        if (donor.userId) {
          donorMap.set(donor.userId.toString(), donor)
        }
      })
      
      const userMap = new Map<string, any>()
      users.forEach((user: any) => {
        userMap.set(user._id.toString(), user)
      })

      bloodDrive.registeredDonorIds.forEach((id: any) => {
        const userId = id.toString()
        const user = userMap.get(userId)
        const donor = donorMap.get(userId)
        const registration = registrationMap.get(userId)
        
        // Get status from donorStatuses, default to 'pending'
        const donationStatus = bloodDrive.donorStatuses?.get(userId) || 'pending'
        
        // Get registration status
        const regStatus = registration?.status || 'registered'
        
        if (user) {
          registrants.push({
            id: userId,
            fullName: donor?.fullName || user.fullName || 'Unknown User',
            email: donor?.email || user.email || '',
            phone: donor?.phone || user.phone || '',
            bloodType: donor?.bloodType || user.bloodType || 'Unknown',
            registeredAt: registration?.registeredAt || user.createdAt || new Date(),
            status: regStatus,
            donationStatus: donationStatus
          })
        } else {
          registrants.push({
            id: userId,
            fullName: `User ${userId.slice(-6)}`,
            email: '',
            phone: '',
            bloodType: 'Unknown',
            registeredAt: new Date(),
            status: 'registered',
            donationStatus: 'pending'
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: registrants,
      total: registrants.length,
      bloodDrive: {
        id: bloodDrive._id.toString(),
        title: bloodDrive.title,
        date: bloodDrive.date,
        status: bloodDrive.status,
        registeredDonors: bloodDrive.registeredDonors
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching registrants:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registrants' },
      { status: 500 }
    )
  }
}