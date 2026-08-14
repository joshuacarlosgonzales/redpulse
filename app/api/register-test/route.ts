import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    
    const user = new User({
      fullName: body.fullName || 'Test User',
      email: body.email || 'test@example.com',
      phone: body.phone || '09123456789',
      bloodType: body.bloodType || 'A+',
      password: 'hashedpassword123',
    })
    
    await user.save()
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: user
    })
  } catch (error: any) {
    console.error('Test registration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}