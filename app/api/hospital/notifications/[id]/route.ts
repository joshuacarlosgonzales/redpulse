// app/api/hospital/notifications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedHospitalUser, getUserIdFromAuth } from '@/lib/hospitalAuth';
import { HospitalNotificationService } from '@/services/hospital-notification';
import { HospitalService } from '@/services/hospital';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthenticatedHospitalUser(request);
    if (!auth.success) {
      return auth.response;
    }

    const userId = getUserIdFromAuth(auth.user);
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const hospital = await HospitalService.getHospitalByUserId(userId);
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action } = body;

    if (action === 'markAsRead') {
      await HospitalNotificationService.markAsRead(id, userId);
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthenticatedHospitalUser(request);
    if (!auth.success) {
      return auth.response;
    }

    const userId = getUserIdFromAuth(auth.user);
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const hospital = await HospitalService.getHospitalByUserId(userId);
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      );
    }

    const { id } = params;
    await HospitalNotificationService.deleteNotification(id, userId);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}