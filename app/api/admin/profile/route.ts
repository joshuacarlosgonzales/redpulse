// app/api/admin/profile/route.ts
import { NextRequest, NextResponse } from "next/server";

// Get user data from localStorage (server-side)
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // For demo, return mock data
    return NextResponse.json({
      data: {
        id: "1",
        fullName: "Admin User",
        email: "admin@redpulse.com",
        phone: "+1 (555) 000-0000",
        role: "admin",
        department: "IT Department",
        position: "System Administrator",
        office: "Main Office, Floor 3",
        avatar: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        permissions: ["all"],
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // For demo, return the updated data
    return NextResponse.json({
      data: {
        id: "1",
        fullName: body.fullName || "Admin User",
        email: body.email || "admin@redpulse.com",
        phone: body.phone || "+1 (555) 000-0000",
        role: "admin",
        department: body.department || "IT Department",
        position: body.position || "System Administrator",
        office: body.office || "Main Office, Floor 3",
        avatar: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        permissions: ["all"],
      },
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}