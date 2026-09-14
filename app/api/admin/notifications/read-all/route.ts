// app/api/admin/notifications/read-all/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';

export async function PUT(request: Request) {
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

    const result = await Notification.updateMany(
      { 
        isRead: false,
        isDeleted: { $ne: true }
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${result.modifiedCount} notifications as read`,
      count: result.modifiedCount
    });

  } catch (error: any) {
    console.error('Error marking all as read:', error);
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to mark all as read'
    }, { status: 500 });
  }
}