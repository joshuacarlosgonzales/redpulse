// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Default settings
const defaultSettings = {
  notifications: {
    email: true,
    push: true,
    sms: false,
    donorRequests: true,
    hospitalRegistrations: true,
    inventoryAlerts: true,
    systemUpdates: false,
  },
  appearance: {
    theme: "light" as const,
    compactMode: false,
    showBadges: true,
  },
  system: {
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
  },
  contact: {
    email: "admin@redpulse.com",
    phone: "+1 (555) 000-0000",
    address: "123 Blood Drive St, City, State 12345",
    supportEmail: "support@redpulse.com",
  },
};

// In-memory settings store (resets on server restart)
// TODO: Replace with database persistence for production
let settingsStore = { ...defaultSettings };

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: settingsStore });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Deep merge to prevent overwriting nested objects entirely
    settingsStore = {
      notifications: { ...settingsStore.notifications, ...body.notifications },
      appearance: { ...settingsStore.appearance, ...body.appearance },
      system: { ...settingsStore.system, ...body.system },
      contact: { ...settingsStore.contact, ...body.contact },
    };

    return NextResponse.json({
      data: settingsStore,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}