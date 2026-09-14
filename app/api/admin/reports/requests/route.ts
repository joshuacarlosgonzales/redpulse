// app/api/admin/reports/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import BloodRequest from '@/models/BloodRequest';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const bloodType = searchParams.get('bloodType') || 'all';
    const search = searchParams.get('search') || '';

    // Build query
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (bloodType !== 'all') {
      query.bloodType = bloodType;
    }
    if (search) {
      query.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { hospitalName: { $regex: search, $options: 'i' } },
        { donorEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch requests
    const requests = await BloodRequest.find(query)
      .sort({ createdAt: -1 });

    // Get stats from all requests (not filtered)
    const allRequests = await BloodRequest.find({});
    const totalRequests = allRequests.length;
    const pending = allRequests.filter(r => r.status === 'pending').length;
    const approved = allRequests.filter(r => r.status === 'approved').length;
    const fulfilled = allRequests.filter(r => r.status === 'fulfilled').length;
    const rejected = allRequests.filter(r => r.status === 'rejected').length;
    const cancelled = allRequests.filter(r => r.status === 'cancelled').length;

    // Group by hospital
    const hospitalMap = new Map();
    allRequests.forEach(r => {
      const key = r.hospitalName || 'Unknown Hospital';
      if (!hospitalMap.has(key)) {
        hospitalMap.set(key, {
          name: key,
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          completed: 0
        });
      }
      const entry = hospitalMap.get(key);
      entry.total += 1;
      if (r.status === 'pending') entry.pending += 1;
      if (r.status === 'approved') entry.approved += 1;
      if (r.status === 'fulfilled') entry.completed += 1;
      if (r.status === 'rejected') entry.rejected += 1;
    });

    // Group by blood type
    const bloodTypeMap = new Map();
    const allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    allRequests.forEach(r => {
      const key = r.bloodType;
      if (!bloodTypeMap.has(key)) {
        bloodTypeMap.set(key, { type: key, count: 0 });
      }
      bloodTypeMap.get(key).count += 1;
    });

    // Ensure all blood types are represented
    allBloodTypes.forEach(type => {
      if (!bloodTypeMap.has(type)) {
        bloodTypeMap.set(type, { type, count: 0 });
      }
    });

    const byBloodType = Array.from(bloodTypeMap.values());

    // Map to response format
    const formattedRequests = requests.map(r => ({
      id: r._id,
      type: r.urgency === 'critical' ? 'emergency' : 'blood_request',
      title: `Blood Request - ${r.bloodType}`,
      description: r.notes || `Request for ${r.quantity} unit(s) of ${r.bloodType} blood`,
      requester: r.donorName,
      requesterEmail: r.donorEmail,
      requesterPhone: r.donorPhone,
      status: r.status,
      priority: r.urgency,
      bloodType: r.bloodType,
      units: r.quantity,
      hospitalName: r.hospitalName,
      location: r.hospitalAddress || '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      stats: {
        total: totalRequests,
        pending,
        approved,
        fulfilled,
        rejected,
        cancelled
      },
      byHospital: Array.from(hospitalMap.values()),
      byBloodType
    });

  } catch (error: any) {
    console.error('Error fetching requests report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests report' },
      { status: 500 }
    );
  }
}