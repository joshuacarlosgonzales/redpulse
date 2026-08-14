// app/api/user/donors/notifications/route.ts
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
      email: string;
      fullName: string;
      role: string;
    };

    // Get notifications for this user
    const notifications = await Notification.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50)
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