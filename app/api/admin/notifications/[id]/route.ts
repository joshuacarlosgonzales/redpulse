// app/api/admin/notifications/[id]/read/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

    const notification = await Notification.findByIdAndUpdate(
      params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({
        success: false,
        error: 'Notification not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error: any) {
    console.error('Error marking as read:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to mark as read'
    }, { status: 500 });
  }
}