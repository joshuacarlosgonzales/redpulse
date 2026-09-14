// app/api/admin/blood-inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BloodInventory from '@/models/BloodInventory';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// ============================================================
// GET - Fetch all blood inventory across hospitals
// ============================================================
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // ---- Auth ----
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

    // ---- Filters ----
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId');
    const bloodType = searchParams.get('bloodType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: any = {};

    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      filter.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }
    if (bloodType && bloodType !== 'all') {
      filter.bloodType = bloodType;
    }
    if (status && status !== 'all') {
      // Map frontend status labels to DB values
      const statusMap: Record<string, string> = {
        Sufficient: 'sufficient',
        Low: 'low',
        Critical: 'critical',
        'Out of Stock': 'out of stock',
      };
      filter.status = statusMap[status] || status.toLowerCase();
    }

    // ---- Fetch inventory ----
    let items = await BloodInventory.find(filter).lean();

    // ---- Hospital names ----
    const hospitalIds = [
      ...new Set(
        items
          .map((item: any) => item.hospitalId?.toString())
          .filter(Boolean)
      ),
    ];

    const hospitals = await User.find({
      _id: { $in: hospitalIds },
      role: 'hospital',
    })
      .select('hospitalName fullName address phone email status')
      .lean();

    const hospitalMap = new Map(
      hospitals.map((h: any) => [
        h._id.toString(),
        {
          name: h.hospitalName || h.fullName || 'Unknown Hospital',
          address: h.address || '',
          phone: h.phone || '',
          email: h.email || '',
          status: h.status || 'active',
        },
      ])
    );

    // ---- Enrich + calculate totals ----
    let totalUnits = 0;
    const bloodTypeBreakdown: Record<string, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
      'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
    };

    const enriched = items.map((item: any) => {
      const units = item.units || 0;
      totalUnits += units;

      if (bloodTypeBreakdown[item.bloodType] !== undefined) {
        bloodTypeBreakdown[item.bloodType] += units;
      }

      const hospital = hospitalMap.get(item.hospitalId?.toString()) || {
        name: 'Unknown Hospital',
        address: '',
        phone: '',
        email: '',
        status: 'active',
      };

      return {
        id: item._id.toString(),
        hospitalId: item.hospitalId?.toString() || '',
        hospitalName: hospital.name,
        hospitalAddress: hospital.address,
        hospitalPhone: hospital.phone,
        hospitalEmail: hospital.email,
        hospitalStatus: hospital.status,
        bloodType: item.bloodType,
        units,                          // ← the actual units
        quantity: units,                // alias for frontend
        minRequired: item.minRequired ?? 15,
        maxCapacity: item.maxCapacity ?? 60,
        status: item.status,
        expirationDate: item.expirationDate,
        batchNumber: item.batchNumber || '',
        notes: item.notes || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        lastUpdated: item.updatedAt || item.createdAt,
      };
    });

    // Optional text search (hospital name or blood type)
    let finalItems = enriched;
    if (search) {
      const q = search.toLowerCase();
      finalItems = enriched.filter(
        (item) =>
          item.hospitalName.toLowerCase().includes(q) ||
          item.bloodType.toLowerCase().includes(q)
      );
    }

    // Count critical / low hospitals
    const criticalHospitals = new Set(
      finalItems
        .filter((i) => i.status === 'critical' || i.status === 'out of stock')
        .map((i) => i.hospitalId)
    ).size;

    const lowStockHospitals = new Set(
      finalItems
        .filter((i) => i.status === 'low')
        .map((i) => i.hospitalId)
    ).size;

    return NextResponse.json({
      success: true,
      data: finalItems,                 // flat list – your frontend already handles this
      stats: {
        totalHospitals: hospitalIds.length,
        totalBloodUnits: totalUnits,    // ← grand total across all hospitals
        criticalHospitals,
        lowStockHospitals,
        bloodTypeBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Error fetching blood inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Add / Update stock
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
    const {
      hospitalId,
      bloodType,
      units,
      minRequired = 15,
      maxCapacity = 60,
      expirationDate,
      notes = '',
      batchNumber = '',
    } = body;

    if (!hospitalId || !bloodType || units === undefined || !expirationDate) {
      return NextResponse.json(
        { error: 'hospitalId, bloodType, units and expirationDate are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return NextResponse.json(
        { error: 'Invalid hospitalId' },
        { status: 400 }
      );
    }

    // Upsert (because of unique index on hospitalId + bloodType)
    const inventory = await BloodInventory.findOneAndUpdate(
      {
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
        bloodType,
      },
      {
        units,
        minRequired,
        maxCapacity,
        expirationDate: new Date(expirationDate),
        notes,
        batchNumber,
        // status is auto-calculated by the pre-save hook
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Inventory saved successfully',
      data: {
        id: inventory._id.toString(),
        hospitalId: inventory.hospitalId.toString(),
        bloodType: inventory.bloodType,
        units: inventory.units,
        status: inventory.status,
      },
    });
  } catch (error: any) {
    console.error('Error saving inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save inventory' },
      { status: 500 }
    );
  }
}