// app/api/admin/notifications/unread-count/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - No token provided'
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
      role: string;
    };

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden - Admin access required'
      }, { status: 403 });
    }

    const unreadCount = await Notification.countDocuments({
      isRead: false,
      isDeleted: { $ne: true }
    });

    return NextResponse.json({
      success: true,
      unreadCount
    });

  } catch (error: any) {
    console.error('Error getting unread count:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get unread count'
    }, { status: 500 });
  }
}