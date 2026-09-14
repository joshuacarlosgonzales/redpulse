// app/api/admin/reports/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import Donation from '@/models/Donation';
import BloodRequest from '@/models/BloodRequest';
import BloodBag from '@/models/BloodBag';
import Hospital from '@/models/Hospital';
import Donor from '@/models/Donor'; // ✅ swapped in place of User

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

    const now = new Date();
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 1. Get total donors
    // ✅ FIX: donors live in the Donor collection, not User.
    // Counting ALL donors regardless of status (active/pending/inactive/rejected)
    // and regardless of registrationType (system or walk-in).
    // If you only want approved donors, change this to:
    //   Donor.countDocuments({ status: 'active' })
    const totalDonors = await Donor.countDocuments({});

    // 2. Get total hospitals
    const totalHospitals = await Hospital.countDocuments({ 
      status: 'active' 
    });

    // 3. Get donations (last 60 days) - using Donation model
    const donations = await Donation.find({
      createdAt: { $gte: sixtyDaysAgo },
      status: 'Completed'
    });

    const totalDonations = donations.length;
    const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);

    // 4. Get blood requests (last 30 days) - using BloodRequest model
    const requests = await BloodRequest.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const completedRequests = requests.filter(r => r.status === 'approved' || r.status === 'fulfilled').length;
    const fulfillmentRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

    // 5. Get inventory overview (BloodBags - available)
    const bloodBags = await BloodBag.find({
      status: 'available'
    });

    const totalInventoryUnits = bloodBags.reduce((sum, b) => sum + b.units, 0);

    // 6. Blood type distribution from all completed donations
    const allCompletedDonations = await Donation.find({ status: 'Completed' });
    const bloodTypeMap = new Map();
    allCompletedDonations.forEach(d => {
      const key = d.bloodType;
      if (!bloodTypeMap.has(key)) {
        bloodTypeMap.set(key, { type: key, units: 0, count: 0 });
      }
      const entry = bloodTypeMap.get(key);
      entry.units += d.units;
      entry.count += 1;
    });

    // Ensure all blood types are represented
    const allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    allBloodTypes.forEach(type => {
      if (!bloodTypeMap.has(type)) {
        bloodTypeMap.set(type, { type, units: 0, count: 0 });
      }
    });

    const donationBloodTypes = Array.from(bloodTypeMap.values());

    // 7. Request status breakdown
    const statusMap = new Map();
    const allRequests = await BloodRequest.find({});
    allRequests.forEach(r => {
      const key = r.status;
      if (!statusMap.has(key)) {
        statusMap.set(key, { status: key, count: 0 });
      }
      statusMap.get(key).count += 1;
    });

    // Ensure all statuses are represented
    const allStatuses = ['pending', 'approved', 'fulfilled', 'cancelled', 'rejected'];
    allStatuses.forEach(status => {
      if (!statusMap.has(status)) {
        statusMap.set(status, { status, count: 0 });
      }
    });

    const requestStatuses = Array.from(statusMap.values());

    // 8. Monthly donation trend (last 6 months)
    const trendMap = new Map();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      trendMap.set(monthKey, { label: monthKey, count: 0, units: 0 });
    }

    const sixMonthDonations = await Donation.find({
      createdAt: { $gte: sixMonthsAgo },
      status: 'Completed'
    });

    sixMonthDonations.forEach(d => {
      const monthKey = new Date(d.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (trendMap.has(monthKey)) {
        const entry = trendMap.get(monthKey);
        entry.count += 1;
        entry.units += d.units;
      }
    });

    const donationTrend = Array.from(trendMap.values()).reverse();

    // 9. Monthly request trend (last 6 months)
    const requestTrendMap = new Map();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      requestTrendMap.set(monthKey, { label: monthKey, count: 0 });
    }

    const sixMonthRequests = await BloodRequest.find({
      createdAt: { $gte: sixMonthsAgo }
    });

    sixMonthRequests.forEach(r => {
      const monthKey = new Date(r.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (requestTrendMap.has(monthKey)) {
        requestTrendMap.get(monthKey).count += 1;
      }
    });

    const requestTrend = Array.from(requestTrendMap.values()).reverse();

    // 10. Recent donations
    const recentDonations = await Donation.find({ status: 'Completed' })
      .sort({ createdAt: -1 })
      .limit(5);

    // 11. Recent requests
    const recentRequests = await BloodRequest.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        totalDonors,
        totalHospitals,
        totalDonations,
        totalRequests,
        pendingRequests,
        completedRequests,
        fulfillmentRate,
        totalInventoryUnits,
        donationBloodTypes,
        requestStatuses,
        donationTrend,
        requestTrend,
        recentDonations: recentDonations.map(d => ({
          id: d._id,
          donorName: d.donorName,
          bloodType: d.bloodType,
          units: d.units,
          hospitalName: d.hospital,
          createdAt: d.createdAt
        })),
        recentRequests: recentRequests.map(r => ({
          id: r._id,
          hospitalName: r.hospitalName,
          bloodType: r.bloodType,
          quantity: r.quantity,
          status: r.status,
          createdAt: r.createdAt
        }))
      }
    });

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}