import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import BloodDrive from '@/models/BloodDrive';
import BloodDriveRegistration from '@/models/BloodDriveRegistration';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const BloodDriveRegistrationModel = BloodDriveRegistration as any;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - No token provided'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        userId: string;
        role: string;
      };
      
      if (decoded.role !== 'donor' && decoded.role !== 'user' && decoded.role !== 'admin') {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized - Only donors can cancel registration'
        }, { status: 403 });
      }
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid token'
      }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid blood drive ID'
      }, { status: 400 });
    }

    const bloodDrive = await BloodDrive.findById(id);
    if (!bloodDrive) {
      return NextResponse.json({
        success: false,
        error: 'Blood drive not found'
      }, { status: 404 });
    }

    const donorId = decoded.userId;

    // ✅ Check if donor is in the blood drive's registeredDonorIds
    const isRegistered = bloodDrive.registeredDonorIds && bloodDrive.registeredDonorIds.some(
      (did: any) => did.toString() === donorId
    );

    if (!isRegistered) {
      return NextResponse.json({
        success: false,
        error: 'You are not registered for this blood drive'
      }, { status: 400 });
    }

    // Check if blood drive is still open for cancellation
    if (bloodDrive.status === 'completed' || bloodDrive.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: `Cannot cancel registration for a ${bloodDrive.status} blood drive`
      }, { status: 400 });
    }

    // ✅ Find and update BloodDriveRegistration (if exists)
    const registration = await BloodDriveRegistrationModel.findOne({
      donorId: donorId,
      bloodDriveId: id
    });

    if (registration) {
      // Update existing registration to cancelled
      registration.status = 'cancelled';
      registration.cancelledAt = new Date();
      await registration.save();
      console.log('✅ BloodDriveRegistration cancelled:', registration._id);
    } else {
      // If no registration exists, create one with cancelled status
      console.log('⚠️ No BloodDriveRegistration found, creating one...');
      const newRegistration = new BloodDriveRegistrationModel({
        donorId: donorId,
        bloodDriveId: id,
        status: 'cancelled',
        registeredAt: new Date(),
        cancelledAt: new Date(),
        notes: 'Registration cancelled (was not properly registered)'
      });
      await newRegistration.save();
      console.log('✅ New BloodDriveRegistration created with cancelled status');
    }

    // ✅ Remove donor from blood drive's registeredDonorIds
    const donorIndex = bloodDrive.registeredDonorIds.findIndex(
      (did: any) => did.toString() === donorId
    );

    if (donorIndex !== -1) {
      bloodDrive.registeredDonorIds.splice(donorIndex, 1);
      bloodDrive.registeredDonors = Math.max(0, (bloodDrive.registeredDonors || 0) - 1);
      
      // ✅ Remove donor status
      if (bloodDrive.donorStatuses) {
        bloodDrive.donorStatuses.delete(donorId);
      }
      
      await bloodDrive.save();
      console.log('✅ Donor removed from blood drive');
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully cancelled your registration',
      data: {
        bloodDriveId: bloodDrive._id.toString(),
        title: bloodDrive.title,
        date: bloodDrive.date,
        location: bloodDrive.location,
        registeredDonors: bloodDrive.registeredDonors
      }
    });

  } catch (error: any) {
    console.error('❌ Error cancelling registration:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to cancel registration'
    }, { status: 500 });
  }
}