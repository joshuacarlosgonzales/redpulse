import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BloodInventory from '@/models/BloodInventory';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  checkAndSendInventoryAlerts
} from '@/lib/notification-service';

// ============================================================
// GET - Fetch all inventory alerts
// ============================================================
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId');
    const bloodType = searchParams.get('bloodType');
    const alertType = searchParams.get('type'); // 'all' | 'stock' | 'expiring' | 'expired'

    // Build filter
    const filter: any = {};
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      filter.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }
    if (bloodType) filter.bloodType = bloodType;

    // Fetch inventory items
    const items = await BloodInventory.find(filter).lean();

    // Get hospital names
    const hospitalIds = new Set<string>();
    items.forEach((item: any) => {
      if (item.hospitalId) {
        hospitalIds.add(item.hospitalId.toString());
      }
    });

    const hospitalMap = new Map<string, string>();
    if (hospitalIds.size > 0) {
      const hospitals = await User.find({
        _id: { $in: Array.from(hospitalIds) },
        role: 'hospital'
      }).select('hospitalName fullName').lean();
      
      hospitals.forEach((h: any) => {
        hospitalMap.set(h._id.toString(), h.hospitalName || h.fullName || 'Unknown Hospital');
      });
    }

    // Categorize alerts
    const alerts = {
      lowStock: [] as any[],
      criticalStock: [] as any[],
      outOfStock: [] as any[],
      expiringSoon: [] as any[],
      expired: [] as any[],
    };

    const now = new Date();

    for (const item of items) {
      const hospitalName = hospitalMap.get(item.hospitalId?.toString()) || 'Unknown Hospital';
      const units = item.units || 0;
      const minRequired = item.minRequired || 15;
      const bloodType = item.bloodType || 'Unknown';
      const expirationDate = item.expirationDate ? new Date(item.expirationDate) : null;
      
      let daysUntilExpiry: number | null = null;
      let daysOverdue: number | null = null;
      
      if (expirationDate) {
        const diffTime = expirationDate.getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          daysOverdue = Math.abs(daysUntilExpiry);
        }
      }

      // Stock alerts
      if (units === 0) {
        alerts.outOfStock.push({
          id: item._id.toString(),
          hospitalId: item.hospitalId?.toString() || '',
          hospitalName,
          bloodType,
          units,
          minRequired,
          status: 'out of stock',
          severity: 'critical',
          message: `${hospitalName} is OUT OF STOCK of ${bloodType} blood.`,
          daysUntilExpiry,
          daysOverdue,
          batchNumber: item.batchNumber || '',
          expirationDate: expirationDate?.toISOString() || '',
          createdAt: item.updatedAt || item.createdAt || new Date(),
        });
      } else if (units <= 5) {
        alerts.criticalStock.push({
          id: item._id.toString(),
          hospitalId: item.hospitalId?.toString() || '',
          hospitalName,
          bloodType,
          units,
          minRequired,
          status: 'critical',
          severity: 'critical',
          message: `${hospitalName} has CRITICAL shortage of ${bloodType} blood. Only ${units} units available.`,
          daysUntilExpiry,
          daysOverdue,
          batchNumber: item.batchNumber || '',
          expirationDate: expirationDate?.toISOString() || '',
          createdAt: item.updatedAt || item.createdAt || new Date(),
        });
      } else if (units < minRequired) {
        alerts.lowStock.push({
          id: item._id.toString(),
          hospitalId: item.hospitalId?.toString() || '',
          hospitalName,
          bloodType,
          units,
          minRequired,
          status: 'low',
          severity: 'warning',
          message: `${hospitalName} has low inventory of ${bloodType} blood. ${units} units available. Minimum required: ${minRequired}.`,
          daysUntilExpiry,
          daysOverdue,
          batchNumber: item.batchNumber || '',
          expirationDate: expirationDate?.toISOString() || '',
          createdAt: item.updatedAt || item.createdAt || new Date(),
        });
      }

      // Expiration alerts
      if (daysUntilExpiry !== null) {
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          alerts.expiringSoon.push({
            id: item._id.toString(),
            hospitalId: item.hospitalId?.toString() || '',
            hospitalName,
            bloodType,
            units,
            minRequired,
            expirationDate: expirationDate?.toISOString() || '',
            daysUntilExpiry,
            daysOverdue,
            batchNumber: item.batchNumber || 'N/A',
            status: 'expiring',
            severity: daysUntilExpiry <= 3 ? 'critical' : 'warning',
            message: `${hospitalName} has ${units} unit(s) of ${bloodType} blood expiring in ${daysUntilExpiry} day(s). Batch: ${item.batchNumber || 'N/A'}`,
            createdAt: item.updatedAt || item.createdAt || new Date(),
          });
        }

        if (daysUntilExpiry < 0) {
          alerts.expired.push({
            id: item._id.toString(),
            hospitalId: item.hospitalId?.toString() || '',
            hospitalName,
            bloodType,
            units,
            minRequired,
            expirationDate: expirationDate?.toISOString() || '',
            daysUntilExpiry,
            daysOverdue: Math.abs(daysUntilExpiry),
            batchNumber: item.batchNumber || 'N/A',
            status: 'expired',
            severity: 'critical',
            message: `${hospitalName} has ${units} unit(s) of EXPIRED ${bloodType} blood. Batch: ${item.batchNumber || 'N/A'}. Expired ${Math.abs(daysUntilExpiry)} day(s) ago.`,
            createdAt: item.updatedAt || item.createdAt || new Date(),
          });
        }
      }
    }

    // Filter by alert type
    let filteredAlerts = alerts;
    if (alertType === 'stock') {
      filteredAlerts = {
        lowStock: alerts.lowStock,
        criticalStock: alerts.criticalStock,
        outOfStock: alerts.outOfStock,
        expiringSoon: [],
        expired: [],
      };
    } else if (alertType === 'expiring') {
      filteredAlerts = {
        lowStock: [],
        criticalStock: [],
        outOfStock: [],
        expiringSoon: alerts.expiringSoon,
        expired: [],
      };
    } else if (alertType === 'expired') {
      filteredAlerts = {
        lowStock: [],
        criticalStock: [],
        outOfStock: [],
        expiringSoon: [],
        expired: alerts.expired,
      };
    }

    // Calculate total alerts
    const totalAlerts = Object.values(filteredAlerts).reduce((sum, arr) => sum + arr.length, 0);

    return NextResponse.json({
      success: true,
      data: filteredAlerts,
      summary: {
        totalAlerts,
        lowStock: filteredAlerts.lowStock.length,
        criticalStock: filteredAlerts.criticalStock.length,
        outOfStock: filteredAlerts.outOfStock.length,
        expiringSoon: filteredAlerts.expiringSoon.length,
        expired: filteredAlerts.expired.length,
      },
    });

  } catch (error: any) {
    console.error('Error fetching inventory alerts:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch inventory alerts',
        data: {
          lowStock: [],
          criticalStock: [],
          outOfStock: [],
          expiringSoon: [],
          expired: [],
        },
        summary: {
          totalAlerts: 0,
          lowStock: 0,
          criticalStock: 0,
          outOfStock: 0,
          expiringSoon: 0,
          expired: 0,
        }
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Trigger inventory alert check
// ============================================================
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { hospitalId, forceResend = false } = body;

    // Run the inventory check
    const result = await checkAndSendInventoryAlerts(hospitalId, forceResend);

    return NextResponse.json({
      success: true,
      message: `Inventory check completed. ${result.notificationsSent} alerts sent.`,
      data: result,
    });

  } catch (error: any) {
    console.error('Error checking inventory alerts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check inventory alerts' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Resolve/archive an alert
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get('inventoryId');

    if (!inventoryId) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
      return NextResponse.json(
        { error: 'Invalid inventory ID format' },
        { status: 400 }
      );
    }

    console.log("📝 Resolving inventory item via DELETE main route:", inventoryId);

    // Mark the inventory item as resolved
    const inventory = await BloodInventory.findByIdAndUpdate(
      inventoryId,
      { 
        status: 'sufficient',
        notes: `Alert resolved by admin at ${new Date().toISOString()}`,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    console.log("✅ Alert resolved successfully:", inventory._id);

    return NextResponse.json({
      success: true,
      message: 'Alert resolved successfully',
      data: {
        id: inventory._id.toString(),
        bloodType: inventory.bloodType,
        units: inventory.units,
        status: inventory.status,
      }
    });

  } catch (error: any) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}