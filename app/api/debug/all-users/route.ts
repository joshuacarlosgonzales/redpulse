// app/api/debug/all-users/route.ts
import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib'
import User from '@/models/User'

export async function GET() {
  try {
    await dbConnect()
    
    // Get all users with their exact emails
    const users = await User.find({}).select('email role phone').lean()
    
    return NextResponse.json({
      success: true,
      total: users.length,
      users: users.map(u => ({
        email: u.email,
        emailLength: u.email.length,
        emailChars: u.email.split('').map(c => ({ char: c, code: c.charCodeAt(0) })),
        role: u.role,
        phone: u.phone
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}