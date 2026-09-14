// app/api/user/donors/notifications/read-all/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';

export async function PUT(request: Request) {
  try {
    await dbConnect();

    // Get token from Authorization header
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - No token provided'
      }, { status: 401 });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        userId: string;
        email: string;
        fullName: string;
        role: string;
      };
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid token'
      }, { status: 401 });
    }

    // Validate that userId exists
    if (!decoded.userId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID in token'
      }, { status: 400 });
    }

    // Mark all unread notifications as read for this user
    const result = await Notification.updateMany(
      { 
        userId: decoded.userId, 
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    console.log(`📬 Marked ${result.modifiedCount} notifications as read for user ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read successfully',
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error: any) {
    console.error('❌ Error marking all notifications as read:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to mark all notifications as read'
    }, { status: 500 });
  }
}