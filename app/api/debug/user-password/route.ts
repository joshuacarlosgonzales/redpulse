// app/api/debug/user-password/route.ts
import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter required'
      }, { status: 400 })
    }
    
    const user = await User.findOne({ email: email.trim().toLowerCase() })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
      passwordHash: user.password ? user.password.substring(0, 30) + '...' : null,
      role: user.role
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}