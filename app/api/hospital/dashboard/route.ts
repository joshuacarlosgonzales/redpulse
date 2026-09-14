// app/api/hospital/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import Donor from '@/models/Donor';
import Donation from '@/models/Donation';
import BloodRequest from '@/models/BloodRequest';
import BloodInventory from '@/models/BloodInventory';
import BloodBag from '@/models/BloodBag';
import BloodDrive from '@/models/BloodDrive';
import User from '@/models/User';
import Hospital from '@/models/Hospital';
import { 
  getAuthenticatedHospitalUser, 
  getUserIdFromAuth,
  isAuthFailure 
} from '@/lib/hospitalAuth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const auth = getAuthenticatedHospitalUser(request);
    if (isAuthFailure(auth)) {
      return auth.response;
    }

    const decoded = auth.user;
    const userId = getUserIdFromAuth(decoded);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid hospital ID in token' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Unauthorized - Hospital access required' },
        { status: 403 }
      );
    }

    let hospital = await Hospital.findOne({ userId });
    if (!hospital) {
      const hospitalName = user.hospitalName || user.fullName || 'Hospital';
      hospital = await Hospital.create({
        userId,
        hospitalName,
        hospitalAddress: '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        status: 'active',
      });
    }

    // ✅ FIXED: Use consistent IDs
    const hospitalObjectId = hospital._id;  // For Hospital collection references
    const userObjectId = new mongoose.Types.ObjectId(userId); // For User collection references

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'month';
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // ============================================================
    // 1. STATS
    // ============================================================

    // ✅ FIXED: Get hospital-scoped donor IDs from donations
    const hospitalDonorIds = await Donation.distinct('donorId', {
      hospitalId: hospitalObjectId
    });
    
    const totalDonors = await Donor.countDocuments({
      _id: { $in: hospitalDonorIds },
      status: 'active'
    });

    const totalDonations = await Donation.countDocuments({
      hospitalId: hospitalObjectId,
      status: 'Completed'
    });

    const pendingRequests = await BloodRequest.countDocuments({
      hospitalId: hospitalObjectId,
      status: 'pending'
    });

    const completedRequests = await BloodRequest.countDocuments({
      hospitalId: hospitalObjectId,
      status: 'fulfilled'
    });

    const totalBloodRequests = await BloodRequest.countDocuments({
      hospitalId: hospitalObjectId
    });

    // ✅ FIXED: Blood Bags use userObjectId (since BloodBag.hospitalId references User._id)
    const totalBloodBags = await BloodBag.countDocuments({
      hospitalId: userObjectId
    });

    const availableBloodBags = await BloodBag.countDocuments({
      hospitalId: userObjectId,
      status: 'available'
    });

    const expiredBloodBags = await BloodBag.countDocuments({
      hospitalId: userObjectId,
      status: 'expired'
    });

    // ✅ FIXED: Monthly Requests - proper 12-month rolling with year grouping
    const monthlyRequests = await BloodRequest.aggregate([
      {
        $match: {
          hospitalId: hospitalObjectId,
          createdAt: { 
            $gte: new Date(currentYear - 1, currentMonth, 1),
            $lte: new Date(currentYear, currentMonth + 1, 0)
          }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthlyRequestsArray = Array(12).fill(0);
    monthlyRequests.forEach((item: any) => {
      monthlyRequestsArray[item._id.month - 1] += item.count;
    });

    // ============================================================
    // 2. PENDING REQUESTS
    // ============================================================

    const pendingRequestsList = await BloodRequest.find({
      hospitalId: hospitalObjectId,
      status: 'pending'
    })
    .sort({ requiredDate: 1, createdAt: -1 })
    .limit(5)
    .lean();

    // ============================================================
    // 3. RECENT ACTIVITIES
    // ============================================================

    const recentDonations = await Donation.find({
      hospitalId: hospitalObjectId
    })
    .sort({ date: -1 })
    .limit(3)
    .lean();

    const recentRequests = await BloodRequest.find({
      hospitalId: hospitalObjectId
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

    const recentDonors = await Donor.find({
      _id: { $in: hospitalDonorIds }
    })
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

    const activities: any[] = [];

    recentDonations.forEach((d: any) => {
      activities.push({
        id: d._id.toString(),
        type: 'donation_made',
        message: `Blood donation recorded: ${d.units} unit${d.units > 1 ? 's' : ''} ${d.bloodType}`,
        timestamp: d.date || d.createdAt,
        status: 'completed'
      });
    });

    recentRequests.forEach((r: any) => {
      const statusMap: Record<string, string> = {
        pending: 'pending',
        approved: 'pending',
        fulfilled: 'completed',
        cancelled: 'failed',
        rejected: 'failed'
      };
      activities.push({
        id: r._id.toString(),
        type: r.urgency === 'critical' ? 'emergency_request' : 'request_created',
        message: `Blood request: ${r.bloodType} for ${r.patientName || 'patient'} (${r.urgency})`,
        timestamp: r.createdAt,
        status: statusMap[r.status] || 'pending'
      });
    });

    recentDonors.forEach((d: any) => {
      activities.push({
        id: d._id.toString(),
        type: 'donor_registered',
        message: `New donor registered: ${d.fullName} (${d.bloodType})`,
        timestamp: d.createdAt,
        status: 'completed'
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivities = activities.slice(0, 5);

    // ============================================================
    // 4. ANALYTICS - INVENTORY
    // ============================================================

    // ✅ FIXED: BloodInventory uses userObjectId (since BloodInventory.hospitalId references User._id)
    const inventoryData = await BloodInventory.find({
      hospitalId: userObjectId
    }).lean();

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    const inventoryByType = bloodTypes.map(type => {
      const found = inventoryData.find((i: any) => i.bloodType === type);
      const units = found?.units || 0;
      let status: 'sufficient' | 'low' | 'critical' | 'out of stock' = 'out of stock';
      
      if (units === 0) status = 'out of stock';
      else if (units <= 5) status = 'critical';
      else if (units <= (found?.minRequired || 15)) status = 'low';
      else status = 'sufficient';
      
      return {
        bloodType: type,
        units,
        status,
        availableBags: units,
        expiredBags: 0
      };
    });

    const statusCounts = {
      sufficient: inventoryByType.filter(i => i.status === 'sufficient').length,
      low: inventoryByType.filter(i => i.status === 'low').length,
      critical: inventoryByType.filter(i => i.status === 'critical').length,
      outOfStock: inventoryByType.filter(i => i.status === 'out of stock').length,
    };

    const totalUnits = inventoryByType.reduce((sum, i) => sum + i.units, 0);

    // ============================================================
    // 5. ANALYTICS - DONATIONS ✅ FIXED: Use 'date' field
    // ============================================================

    const donationsByMonth = await Donation.aggregate([
      {
        $match: {
          hospitalId: hospitalObjectId,
          status: 'Completed',
          date: { 
            $gte: new Date(currentYear - 1, currentMonth, 1)
          }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: '$date' },
            year: { $year: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const donationsByMonthArray = months.map((month, index) => {
      const total = donationsByMonth
        .filter((d: any) => d._id.month === index + 1)
        .reduce((sum: number, d: any) => sum + d.count, 0);
      return { month, count: total };
    });

    const donationsByBloodType = await Donation.aggregate([
      {
        $match: {
          hospitalId: hospitalObjectId,
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 }
        }
      }
    ]);

    const donationsByBloodTypeArray = bloodTypes.map(type => {
      const found = donationsByBloodType.find((d: any) => d._id === type);
      return { bloodType: type, count: found?.count || 0 };
    });

    const thisMonthDonations = await Donation.countDocuments({
      hospitalId: hospitalObjectId,
      status: 'Completed',
      date: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    const prevMonthDonations = await Donation.countDocuments({
      hospitalId: hospitalObjectId,
      status: 'Completed',
      date: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1)
      }
    });

    // ✅ FIXED: Better percentage calculation
    let percentageChange = 0;
    if (prevMonthDonations > 0) {
      percentageChange = ((thisMonthDonations - prevMonthDonations) / prevMonthDonations) * 100;
    } else if (thisMonthDonations > 0) {
      percentageChange = 100; // New
    } else {
      percentageChange = 0;
    }

    // ============================================================
    // 6. ANALYTICS - REQUESTS
    // ============================================================

    const requestsByMonth = await BloodRequest.aggregate([
      {
        $match: {
          hospitalId: hospitalObjectId,
          createdAt: { 
            $gte: new Date(currentYear - 1, currentMonth, 1)
          }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: '$createdAt' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const requestsByMonthArray = months.map((month, index) => {
      const total = requestsByMonth
        .filter((r: any) => r._id.month === index + 1)
        .reduce((sum: number, r: any) => sum + r.count, 0);
      const fulfilled = requestsByMonth
        .filter((r: any) => r._id.month === index + 1 && r._id.status === 'fulfilled')
        .reduce((sum: number, r: any) => sum + r.count, 0);
      return { month, requests: total, fulfilled };
    });

    const urgencyCounts = await BloodRequest.aggregate([
      {
        $match: { hospitalId: hospitalObjectId }
      },
      {
        $group: {
          _id: '$urgency',
          count: { $sum: 1 }
        }
      }
    ]);

    const urgencyMap: Record<string, string> = {
      critical: 'Critical',
      urgent: 'Urgent',
      normal: 'Normal'
    };

    const requestsByUrgency = urgencyCounts.map((u: any) => ({
      urgency: urgencyMap[u._id] || u._id,
      count: u.count
    }));

    const cancelledRequests = await BloodRequest.countDocuments({
      hospitalId: hospitalObjectId,
      status: 'cancelled'
    });

    const rejectedRequests = await BloodRequest.countDocuments({
      hospitalId: hospitalObjectId,
      status: 'rejected'
    });

    // ============================================================
    // 7. ANALYTICS - BLOOD DRIVES ✅ FIXED: Use userObjectId
    // ============================================================

    const bloodDrives = await BloodDrive.find({ 
      hospitalId: userObjectId 
    }).lean();
    
    const nowDate = new Date();

    const bloodDriveStats = {
      total: bloodDrives.length,
      upcoming: bloodDrives.filter((d: any) => new Date(d.date) > nowDate).length,
      completed: bloodDrives.filter((d: any) => new Date(d.date) < nowDate && d.status === 'completed').length,
      registered: bloodDrives.reduce((sum: number, d: any) => sum + (d.registeredDonors || 0), 0),
      attended: bloodDrives.reduce((sum: number, d: any) => sum + (d.completedDonations || 0), 0),
    };

    // ============================================================
    // 8. ANALYTICS - DONOR STATS
    // ============================================================

    const donorStats = {
      active: await Donor.countDocuments({ 
        _id: { $in: hospitalDonorIds }, 
        status: 'active' 
      }),
      inactive: await Donor.countDocuments({ 
        _id: { $in: hospitalDonorIds }, 
        status: 'inactive' 
      }),
      pending: await Donor.countDocuments({ 
        _id: { $in: hospitalDonorIds }, 
        status: 'pending' 
      }),
      rejected: await Donor.countDocuments({ 
        _id: { $in: hospitalDonorIds }, 
        status: 'rejected' 
      }),
      totalDonations: totalDonations,
      averageDonations: totalDonors > 0 ? totalDonations / totalDonors : 0,
    };

    // ============================================================
    // 9. TRENDS
    // ============================================================

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyDonations = await Donation.aggregate([
      {
        $match: {
          hospitalId: hospitalObjectId,
          status: 'Completed',
          date: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          count: { $sum: 1 }
        }
      }
    ]);

    const weeklyRequests = await BloodRequest.aggregate([
      {
        $match: {
          hospitalId: hospitalObjectId,
          createdAt: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 }
        }
      }
    ]);

    // ✅ FIXED: MongoDB dayOfWeek: 1=Sunday, 2=Monday, ..., 7=Saturday
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrends = days.map((day, index) => {
      const dayOfWeek = index + 1;
      return {
        day,
        donations: weeklyDonations.find((d: any) => d._id === dayOfWeek)?.count || 0,
        requests: weeklyRequests.find((d: any) => d._id === dayOfWeek)?.count || 0,
      };
    });

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    
    const monthlyDonationsTrend = await Donation.aggregate([
      {
        $match: {
          hospitalId: hospitalObjectId,
          status: 'Completed',
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyRequestsTrend = await BloodRequest.aggregate([
      {
        $match: {
          hospitalId: hospitalObjectId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      }
    ]);

    const lastSixMonths: string[] = [];
    for (let i = 0; i < 6; i++) {
      const monthIndex = (now.getMonth() - 5 + i + 12) % 12;
      lastSixMonths.push(months[monthIndex]);
    }

    const monthlyTrends = lastSixMonths.map((month, index) => {
      const monthNum = (now.getMonth() - 5 + index + 12) % 12 + 1;
      return {
        month,
        donations: monthlyDonationsTrend.find((d: any) => d._id === monthNum)?.count || 0,
        requests: monthlyRequestsTrend.find((d: any) => d._id === monthNum)?.count || 0,
      };
    });

    // ============================================================
    // 10. RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalDonors,
          totalDonations,
          pendingRequests,
          completedRequests,
          totalBloodRequests,
          monthlyRequests: monthlyRequestsArray,
          totalBloodBags,
          expiredBloodBags,
          availableBloodBags,
        },
        pendingRequests: pendingRequestsList.map((r: any) => ({
          id: r._id.toString(),
          bloodType: r.bloodType,
          quantity: r.quantity,
          urgency: r.urgency,
          requiredDate: r.requiredDate,
          patientName: r.patientName,
          patientAge: r.patientAge,
          notes: r.notes,
          createdAt: r.createdAt,
          status: r.status,
          department: r.department,
        })),
        activities: recentActivities,
        analytics: {
          inventory: {
            byBloodType: inventoryByType,
            totalUnits,
            totalAvailableBags: availableBloodBags,
            totalExpiredBags: expiredBloodBags,
            statusCounts,
          },
          donations: {
            total: totalDonations,
            thisMonth: thisMonthDonations,
            percentageChange: Math.round(percentageChange * 10) / 10,
            byMonth: donationsByMonthArray,
            byBloodType: donationsByBloodTypeArray,
          },
          requests: {
            total: totalBloodRequests,
            pending: pendingRequests,
            fulfilled: completedRequests,
            cancelled: cancelledRequests,
            rejected: rejectedRequests,
            byMonth: requestsByMonthArray,
            byUrgency: requestsByUrgency,
          },
          bloodDrives: bloodDriveStats,
          donorStats,
          trends: {
            weekly: weeklyTrends,
            monthly: monthlyTrends,
          },
        },
      },
    });

  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}