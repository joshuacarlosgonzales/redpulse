// app/api/user/donors/notifications/[id]/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export async function PUT(
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
    };

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid notification ID'
      }, { status: 400 });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
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
    console.error('Error marking notification as read:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to mark notification as read'
    }, { status: 500 });
  }
}

export async function DELETE(
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

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid notification ID'
      }, { status: 400 });
    }

    // Admin can delete any notification, donor can only delete their own
    const query: any = { _id: id };
    if (decoded.role !== 'admin') {
      query.userId = decoded.userId;
    }

    const notification = await Notification.findOneAndDelete(query);

    if (!notification) {
      return NextResponse.json({
        success: false,
        error: 'Notification not found or unauthorized'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete notification'
    }, { status: 500 });
  }
}