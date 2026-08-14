// app/api/admin/notifications/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';
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
      role: string;
    };

    if (decoded.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 403 });
    }

    // Get all notifications with user info
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email')
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      data: notifications
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch notifications'
    }, { status: 500 });
  }
}