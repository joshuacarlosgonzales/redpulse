// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import Donor from '@/models/Donor'
import Hospital from '@/models/Hospital'

export async function POST(request: Request) {
  try {
    await dbConnect()
    
    const body = await request.json()
    console.log('📥 Registration payload:', body)
    
    const { 
      fullName, 
      email, 
      phone, 
      bloodType, 
      password, 
      role = 'donor',
      // Hospital fields
      hospitalName,
      hospitalLicense,
      hospitalAddress,
      hospitalPhone,
      hospitalType,
      hospitalCapacity,
      hospitalEmail,
      hospitalWebsite,
      // Donor specific fields
      address,
      dateOfBirth,
      gender,
      weight,
      barangay,
      municipality,
      province,
      emergencyContact,
      medicalConditions,
      currentMedications,
    } = body

    // Validate required fields
    if (!fullName || !email || !phone || !bloodType || !password) {
      return NextResponse.json({
        success: false,
        error: 'All required fields must be filled'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters'
      }, { status: 400 })
    }

    // Validate blood type
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    if (!validBloodTypes.includes(bloodType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid blood type'
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['donor', 'hospital', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role'
      }, { status: 400 })
    }

    // Validate donor-specific fields if role is donor
    if (role === 'donor') {
      if (!dateOfBirth) {
        return NextResponse.json({
          success: false,
          error: 'Date of birth is required for donors'
        }, { status: 400 })
      }
      
      let parsedDate;
      try {
        parsedDate = new Date(dateOfBirth);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json({
            success: false,
            error: 'Invalid date format. Please use YYYY-MM-DD'
          }, { status: 400 })
        }
      } catch (err) {
        return NextResponse.json({
          success: false,
          error: 'Invalid date format. Please use YYYY-MM-DD'
        }, { status: 400 })
      }
      
      if (!gender) {
        return NextResponse.json({
          success: false,
          error: 'Gender is required for donors'
        }, { status: 400 })
      }
      if (!weight || weight <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Valid weight is required for donors'
        }, { status: 400 })
      }
    }

    // Validate hospital-specific fields if role is hospital
    if (role === 'hospital') {
      if (!hospitalName) {
        return NextResponse.json({
          success: false,
          error: 'Hospital name is required'
        }, { status: 400 })
      }
      if (!hospitalLicense) {
        return NextResponse.json({
          success: false,
          error: 'Hospital license is required'
        }, { status: 400 })
      }
      if (!hospitalAddress) {
        return NextResponse.json({
          success: false,
          error: 'Hospital address is required'
        }, { status: 400 })
      }
      if (!hospitalPhone) {
        return NextResponse.json({
          success: false,
          error: 'Hospital phone is required'
        }, { status: 400 })
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    })
    
    if (existingUser) {
      let errorMessage = 'User with this '
      if (existingUser.email === email.toLowerCase()) {
        errorMessage += 'email already exists'
      } else {
        errorMessage += 'phone number already exists'
      }
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 })
    }

    // Check if donor already exists (for donor role)
    if (role === 'donor') {
      const existingDonor = await Donor.findOne({ 
        $or: [
          { email: email.toLowerCase().trim() },
          { phone: phone.trim() }
        ]
      })
      
      if (existingDonor) {
        return NextResponse.json({
          success: false,
          error: 'A donor profile with this email or phone already exists'
        }, { status: 400 })
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Build user data based on role
    const userData: any = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      bloodType: bloodType,
      password: hashedPassword,
      role: role,
      isActive: true,
      isVerified: role === 'admin' ? true : false,
      isApproved: role === 'admin' ? true : false, // Admin auto-approved
    }

    // Add donor-specific fields to User
    if (role === 'donor') {
      userData.donationCount = 0
      const nextEligible = new Date()
      nextEligible.setDate(nextEligible.getDate() + 90)
      userData.nextEligibleDate = nextEligible
      userData.isVerified = false // Donors need email verification
      userData.isApproved = false // Donor needs admin approval
    }

    // Add hospital-specific fields
    if (role === 'hospital') {
      userData.hospitalName = hospitalName.trim()
      userData.hospitalLicense = hospitalLicense.trim()
      userData.hospitalAddress = hospitalAddress.trim()
      userData.hospitalPhone = hospitalPhone.trim()
      userData.hospitalType = hospitalType || ''
      userData.hospitalCapacity = hospitalCapacity ? parseInt(hospitalCapacity) : 0
      userData.hospitalEmail = hospitalEmail || ''
      userData.hospitalWebsite = hospitalWebsite || ''
      userData.isApproved = false // Hospital needs admin approval
      userData.isVerified = true // Hospitals are pre-verified
    }

    // Admin-specific fields
    if (role === 'admin') {
      userData.isApproved = true
      userData.isVerified = true
    }

    // Create user
    const user = await User.create(userData)
    console.log('✅ User created:', user._id)

    // ============================================
    // CREATE DONOR PROFILE IF ROLE IS DONOR
    // ============================================
    let donorProfileCreated = false;
    let donorDigitalId = '';

    if (role === 'donor') {
      try {
        // Generate digital ID
        const donorCount = await Donor.countDocuments()
        const year = new Date().getFullYear()
        donorDigitalId = `RP-${year}-${String(donorCount + 1).padStart(4, '0')}`

        // Build full address
        const fullAddress = address || 
          (barangay || municipality || province 
            ? `${barangay || ''}${barangay && municipality ? ', ' : ''}${municipality || ''}${municipality && province ? ', ' : ''}${province || ''}`.trim()
            : '')

        // Parse date of birth
        let parsedDateOfBirth = undefined;
        if (dateOfBirth) {
          try {
            parsedDateOfBirth = new Date(dateOfBirth);
            if (isNaN(parsedDateOfBirth.getTime())) {
              parsedDateOfBirth = undefined;
            }
          } catch (err) {
            parsedDateOfBirth = undefined;
          }
        }

        // Create donor profile with pending status
        const donorData: any = {
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          bloodType: bloodType,
          address: fullAddress || 'Not provided',
          dateOfBirth: parsedDateOfBirth,
          gender: gender || 'Not specified',
          weight: parseFloat(weight) || 0,
          barangay: barangay || '',
          municipality: municipality || '',
          province: province || '',
          digitalId: donorDigitalId,
          emergencyContact: emergencyContact || '',
          status: 'pending', // ⭐ Pending approval
          isEligible: false,
          totalDonations: 0,
          medicalConditions: medicalConditions || '',
          currentMedications: currentMedications || '',
          lastDonationDate: null,
          nextEligibleDate: null,
          userId: user._id, // Link to user
        }

        // Remove undefined values
        Object.keys(donorData).forEach(key => {
          if (donorData[key] === undefined) {
            delete donorData[key];
          }
        });

        console.log('📝 Donor data to save:', donorData);

        await Donor.create(donorData)
        donorProfileCreated = true;
        console.log(`✅ Donor profile created with ID: ${donorDigitalId} - Status: pending`)
      } catch (donorError: any) {
        console.error('❌ Error creating donor profile:', donorError)
      }
    }

    // ============================================
    // CREATE HOSPITAL PROFILE IF ROLE IS HOSPITAL
    // ============================================
    if (role === 'hospital') {
      try {
        await Hospital.create({
          userId: user._id,
          hospitalName: hospitalName.trim(),
          hospitalLicense: hospitalLicense.trim(),
          hospitalAddress: hospitalAddress.trim(),
          hospitalPhone: hospitalPhone.trim(),
          hospitalType: hospitalType || 'General Hospital',
          hospitalCapacity: hospitalCapacity ? parseInt(hospitalCapacity) : 0,
          hospitalEmail: hospitalEmail || email.toLowerCase().trim(),
          hospitalWebsite: hospitalWebsite || '',
          status: 'pending'
        });
        console.log(`✅ Hospital profile created: ${hospitalName} - Status: pending`);
      } catch (hospitalError: any) {
        console.error('❌ Error creating hospital profile:', hospitalError);
      }
    }

    // Remove password from response
    const userResponse = user.toObject()
    const { password: _, ...userWithoutPassword } = userResponse

    return NextResponse.json({
      success: true,
      message: role === 'donor' 
        ? 'Registration successful! Your donor profile is pending approval.' 
        : role === 'hospital'
        ? 'Hospital registration successful! Your account is pending admin approval.'
        : 'Registration successful!',
      data: {
        ...userWithoutPassword,
        requiresApproval: role === 'hospital' || role === 'donor' ? true : false,
        requiresVerification: role === 'donor' ? true : false,
        donorProfileCreated: donorProfileCreated,
        donorDigitalId: donorDigitalId,
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Registration error:', error)
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json({
        success: false,
        error: `${field} already exists`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Registration failed'
    }, { status: 500 })
  }
}