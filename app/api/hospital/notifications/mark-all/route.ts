import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedHospitalUser, getUserIdFromAuth } from '@/lib/hospitalAuth';
import { HospitalNotificationService } from '@/services/hospital-notification';
import { HospitalService } from '@/services/hospital';

export async function POST(request: NextRequest) {
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

    await HospitalNotificationService.markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}