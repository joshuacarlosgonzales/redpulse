import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'

export async function GET() {
  try {
    await dbConnect()
    
    return NextResponse.json({
      success: true,
      message: '✅ Connected to MongoDB successfully!',
      database: 'redpulse'
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to MongoDB',
      details: error.message
    }, { status: 500 })
  }
}