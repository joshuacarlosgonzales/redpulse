// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import Donor from '@/models/Donor';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
      email: string;
      fullName: string;
      role: string;
    };

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    let donorData = null;
    if (user.role === 'donor') {
      donorData = await Donor.findOne({ email: user.email }).lean();
    }

    // Build user profile - ONLY use fields that exist
    const userProfile: any = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || 'Not set',
      bloodType: user.bloodType || 'Not set',
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      totalDonations: (user as any).donationCount || 0,
      lastDonation: (user as any).lastDonation || 'No donations yet',
      nextEligible: (user as any).nextEligibleDate || 'Not yet eligible',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Add donor data if available
    if (donorData) {
      const donor: any = donorData;
      userProfile.donorId = donor._id?.toString() || null;
      userProfile.donorProfileExists = true;
      userProfile.donorStatus = donor.status || 'pending';
      userProfile.status = donor.status || 'pending';
      userProfile.isEligible = donor.isEligible || false;
      userProfile.digitalId = donor.digitalId || '';
      userProfile.address = donor.address || '';
      userProfile.barangay = donor.barangay || '';
      userProfile.municipality = donor.municipality || '';
      userProfile.province = donor.province || '';
      userProfile.dateOfBirth = donor.dateOfBirth || '';
      userProfile.gender = donor.gender || '';
      userProfile.weight = donor.weight || 0;
      userProfile.rejectionReason = donor.rejectionReason || null;
      userProfile.emergencyContact = donor.emergencyContact || '';
      userProfile.medicalConditions = donor.medicalConditions || '';
      userProfile.currentMedications = donor.currentMedications || '';
      userProfile.emergencyName = donor.emergencyName || '';
      userProfile.emergencyRelationship = donor.emergencyRelationship || '';
      userProfile.points = (donor as any).points || 0;
      userProfile.totalDonations = donor.totalDonations || 0;
      userProfile.lastDonationDate = donor.lastDonationDate || '';
    } else {
      userProfile.donorId = null;
      userProfile.donorProfileExists = false;
      userProfile.donorStatus = 'pending';
      userProfile.status = 'pending';
      userProfile.isEligible = false;
      userProfile.digitalId = '';
      userProfile.address = '';
      userProfile.barangay = '';
      userProfile.municipality = '';
      userProfile.province = '';
      userProfile.dateOfBirth = '';
      userProfile.gender = '';
      userProfile.weight = 0;
      userProfile.rejectionReason = null;
      userProfile.emergencyContact = '';
      userProfile.medicalConditions = '';
      userProfile.currentMedications = '';
      userProfile.emergencyName = '';
      userProfile.emergencyRelationship = '';
      userProfile.points = 0;
      userProfile.totalDonations = 0;
      userProfile.lastDonationDate = '';
    }

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch user profile'
    }, { status: 500 });
  }
}

// Add PUT method for updating profile
export async function PUT(request: Request) {
  try {
    await dbConnect();

    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
      email: string;
      fullName: string;
      role: string;
    };

    const body = await request.json();
    console.log('📥 Update profile request:', body);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Update User fields
    if (body.fullName) user.fullName = body.fullName;
    if (body.email) user.email = body.email;
    if (body.phone || body.mobileNumber) {
      user.phone = body.phone || body.mobileNumber;
    }

    await user.save();

    // Update Donor fields if donor exists
    if (user.role === 'donor') {
      const donor = await Donor.findOne({ email: user.email });
      if (donor) {
        const donorDoc: any = donor;
        if (body.fullName) donorDoc.fullName = body.fullName;
        if (body.bloodType) donorDoc.bloodType = body.bloodType;
        if (body.dateOfBirth) donorDoc.dateOfBirth = new Date(body.dateOfBirth);
        if (body.gender) donorDoc.gender = body.gender;
        if (body.weight) donorDoc.weight = parseFloat(body.weight);
        if (body.address) donorDoc.address = body.address;
        if (body.barangay) donorDoc.barangay = body.barangay;
        if (body.municipality) donorDoc.municipality = body.municipality;
        if (body.province) donorDoc.province = body.province;
        if (body.emergencyContact) donorDoc.emergencyContact = body.emergencyContact;
        if (body.medicalConditions !== undefined) donorDoc.medicalConditions = body.medicalConditions;
        if (body.currentMedications !== undefined) donorDoc.currentMedications = body.currentMedications;
        
        await donorDoc.save();
        console.log('✅ Donor updated:', donorDoc._id);
      }
    }

    // Fetch updated profile
    const updatedUser = await User.findById(decoded.userId).lean();
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found after update'
      }, { status: 404 });
    }

    let updatedDonor = null;
    if (updatedUser.role === 'donor') {
      updatedDonor = await Donor.findOne({ email: updatedUser.email }).lean();
    }

    const userProfile: any = {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone || 'Not set',
      bloodType: updatedUser.bloodType || 'Not set',
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      isVerified: updatedUser.isVerified,
      isApproved: updatedUser.isApproved,
      totalDonations: (updatedUser as any).donationCount || 0,
      lastDonation: (updatedUser as any).lastDonation || 'No donations yet',
      nextEligible: (updatedUser as any).nextEligibleDate || 'Not yet eligible',
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    if (updatedDonor) {
      const donor: any = updatedDonor;
      userProfile.donorId = donor._id?.toString() || null;
      userProfile.donorProfileExists = true;
      userProfile.donorStatus = donor.status || 'pending';
      userProfile.status = donor.status || 'pending';
      userProfile.isEligible = donor.isEligible || false;
      userProfile.digitalId = donor.digitalId || '';
      userProfile.address = donor.address || '';
      userProfile.barangay = donor.barangay || '';
      userProfile.municipality = donor.municipality || '';
      userProfile.province = donor.province || '';
      userProfile.dateOfBirth = donor.dateOfBirth || '';
      userProfile.gender = donor.gender || '';
      userProfile.weight = donor.weight || 0;
      userProfile.rejectionReason = donor.rejectionReason || null;
      userProfile.emergencyContact = donor.emergencyContact || '';
      userProfile.medicalConditions = donor.medicalConditions || '';
      userProfile.currentMedications = donor.currentMedications || '';
      userProfile.emergencyName = donor.emergencyName || '';
      userProfile.emergencyRelationship = donor.emergencyRelationship || '';
      userProfile.points = (donor as any).points || 0;
      userProfile.totalDonations = donor.totalDonations || 0;
      userProfile.lastDonationDate = donor.lastDonationDate || '';
    } else {
      userProfile.donorId = null;
      userProfile.donorProfileExists = false;
      userProfile.donorStatus = 'pending';
      userProfile.status = 'pending';
      userProfile.isEligible = false;
      userProfile.digitalId = '';
      userProfile.address = '';
      userProfile.barangay = '';
      userProfile.municipality = '';
      userProfile.province = '';
      userProfile.dateOfBirth = '';
      userProfile.gender = '';
      userProfile.weight = 0;
      userProfile.rejectionReason = null;
      userProfile.emergencyContact = '';
      userProfile.medicalConditions = '';
      userProfile.currentMedications = '';
      userProfile.emergencyName = '';
      userProfile.emergencyRelationship = '';
      userProfile.points = 0;
      userProfile.totalDonations = 0;
      userProfile.lastDonationDate = '';
    }

    return NextResponse.json({
      success: true,
      data: userProfile,
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update profile'
    }, { status: 500 });
  }
}