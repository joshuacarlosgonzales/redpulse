// app/api/admin/hospitals/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Hospital from '@/models/Hospital';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      role: string;
    };

    if (decoded.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 403 });
    }

    // Await the params for Next.js 15+
    const { id } = await params;

    // Find the hospital document
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return NextResponse.json({
        success: false,
        error: 'Hospital not found'
      }, { status: 404 });
    }

    // Update hospital status
    hospital.status = 'active';
    hospital.approvedAt = new Date();
    hospital.rejectionReason = undefined;
    await hospital.save();

    // Update user isApproved flag
    await User.findByIdAndUpdate(hospital.userId, { 
      isApproved: true,
      isVerified: true,
      isActive: true
    });

    console.log(`✅ Hospital ${hospital.hospitalName} approved by admin ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Hospital approved successfully',
      data: {
        id: hospital._id.toString(),
        hospitalName: hospital.hospitalName,
        hospitalLicense: hospital.hospitalLicense,
        status: hospital.status,
        approvedAt: hospital.approvedAt
      }
    });

  } catch (error: any) {
    console.error('Error approving hospital:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to approve hospital'
    }, { status: 500 });
  }
}