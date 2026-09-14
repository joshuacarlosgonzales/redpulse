// app/api/hospital/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedHospitalUser, getUserIdFromAuth } from '@/lib/hospitalAuth';
import { HospitalNotificationService } from '@/services/hospital-notification';
import { HospitalService } from '@/services/hospital';

export async function GET(request: NextRequest) {
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

    // Verify user is a hospital
    const hospital = await HospitalService.getHospitalByUserId(userId);
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const result = await HospitalNotificationService.getHospitalNotifications(
      userId,
      { limit, page, unreadOnly }
    );

    const unreadCount = await HospitalNotificationService.getUnreadCount(userId);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

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