import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BloodInventory from '@/models/BloodInventory';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// ============================================================
// PATCH - Resolve a specific inventory alert
// ============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log("🔄 PATCH /resolve - Starting...");
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // ✅ FIX: Await params (Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    console.log("📝 Resolving alert ID:", id);

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Alert ID is required'
      }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid alert ID format'
      }, { status: 400 });
    }

    const body = await request.json();
    const { resolvedBy, resolvedAt } = body;

    console.log("📝 Updating inventory item:", id);

    // ✅ Use 'sufficient' (valid enum value) instead of 'resolved'
    const updatedItem = await BloodInventory.findByIdAndUpdate(
      id,
      {
        status: 'sufficient',
        notes: `Alert resolved by ${resolvedBy || 'admin'} at ${resolvedAt || new Date().toISOString()}`,
        updatedAt: new Date(),
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updatedItem) {
      console.error("❌ Inventory item not found:", id);
      return NextResponse.json({
        success: false,
        error: 'Inventory item not found'
      }, { status: 404 });
    }

    console.log("✅ Alert resolved successfully:", updatedItem._id);

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Alert resolved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error resolving alert:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 });
    }

    if (error.name === 'CastError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid alert ID format'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to resolve alert'
    }, { status: 500 });
  }
}

// ============================================================
// DELETE - Soft delete/resolve an alert (for compatibility)
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log("🔄 DELETE /resolve - Starting...");
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // ✅ FIX: Await params (Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    console.log("📝 Deleting/Resolving alert ID:", id);

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Alert ID is required'
      }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid alert ID format'
      }, { status: 400 });
    }

    // ✅ Use 'sufficient' (valid enum value)
    const updatedItem = await BloodInventory.findByIdAndUpdate(
      id,
      {
        status: 'sufficient',
        notes: `Alert resolved by admin at ${new Date().toISOString()}`,
        updatedAt: new Date(),
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updatedItem) {
      console.error("❌ Inventory item not found:", id);
      return NextResponse.json({
        success: false,
        error: 'Inventory item not found'
      }, { status: 404 });
    }

    console.log("✅ Alert resolved successfully via DELETE:", updatedItem._id);

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Alert resolved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error resolving alert:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to resolve alert'
    }, { status: 500 });
  }
}