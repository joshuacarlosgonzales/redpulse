// app/api/admin/profile/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, DecodedToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Mock user data with passwords
// In a real app, this would come from your database
const usersWithPassword = [
  {
    id: "1",
    email: "admin@redpulse.com",
    password: "$2a$10$YourHashedPasswordHere", // This would be the hashed password
  },
  {
    id: "2", 
    email: "user@redpulse.com",
    password: "$2a$10$AnotherHashedPasswordHere",
  }
];

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token) as DecodedToken | null;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // In a real app, you would query your database for the user
    const user = usersWithPassword.find(u => u.id === decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    // In a real app, you would compare with the stored hashed password
    // For demo purposes, we'll check against a stored password
    // You should replace this with actual bcrypt.compare
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // In a real app, you would update the password in your database here
    // For demo: update the mock user data
    const updatedUser = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };

    // Log success (in a real app, you'd save to database)
    console.log(`Password updated for user: ${user.email}`);

    return NextResponse.json({ 
      message: "Password updated successfully",
      data: { 
        passwordUpdated: true,
        userId: decoded.userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}