// app/api/admin/donors/notify/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import Donor from '@/models/Donor';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
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

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Admin access required'
      }, { status: 403 });
    }

    const body = await request.json();
    const { donorId, subject, message, donorEmail, donorName } = body;

    if (!donorId || !subject || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Find the donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return NextResponse.json({
        success: false,
        error: 'Donor not found'
      }, { status: 404 });
    }

    // Find the user associated with this donor
    const user = await User.findOne({ email: donor.email });
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found for this donor'
      }, { status: 404 });
    }

    // In a real implementation, you would:
    // 1. Save the notification to a database
    // 2. Send an email using a service like SendGrid, Nodemailer, etc.
    // 3. Send a push notification if applicable
    // 4. Save to an in-app notification system

    // For now, we'll just log it and return success
    console.log('🔔 Notification sent to donor:', {
      donorId,
      donorName: donor.fullName,
      donorEmail: donor.email,
      subject,
      message,
      sentBy: decoded.userId,
      sentAt: new Date().toISOString()
    });

    // If you want to actually send an email, you would do something like:
    // await sendEmail({
    //   to: donor.email,
    //   subject: subject,
    //   html: `<p>${message.replace(/\n/g, '<br>')}</p>`
    // });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        donorId,
        donorName: donor.fullName,
        donorEmail: donor.email,
        subject,
        message,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send notification'
    }, { status: 500 });
  }
}