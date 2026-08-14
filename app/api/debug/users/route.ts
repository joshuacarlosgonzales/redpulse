// app/api/debug/users/route.ts
import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib'
import User from '@/models/User'

export async function GET() {
  try {
    await dbConnect()
    
    // Get all users
    const users = await User.find({}).select('email role fullName isActive isApproved').lean()
    
    return NextResponse.json({
      success: true,
      total: users.length,
      users: users.map(u => ({
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        isActive: u.isActive,
        isApproved: u.isApproved
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}