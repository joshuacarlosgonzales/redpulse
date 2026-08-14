// app/api/user/donors/notifications/read-all/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';

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
    };

    await Notification.updateMany(
      { userId: decoded.userId, isRead: false },
      { isRead: true }
    );

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error: any) {
    console.error('Error marking all as read:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to mark all as read'
    }, { status: 500 });
  }
}