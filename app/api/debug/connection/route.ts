// app/api/debug/connection/route.ts
import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib'
import mongoose from 'mongoose'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    const conn = await dbConnect()
    
    const connectionState = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    
    const dbName = mongoose.connection.db?.databaseName || 'Unknown'
    
    // Try to count users
    let userCount = 0
    try {
      const User = require('@/models/User').default
      userCount = await User.countDocuments()
    } catch (error) {
      console.error('Error counting users:', error)
    }
    
    return NextResponse.json({
      success: true,
      connectionState: states[connectionState as keyof typeof states],
      connectionStateNumber: connectionState,
      databaseName: dbName,
      userCount: userCount,
      connectionString: process.env.MONGODB_URI?.replace(/:([^:@]+)@/, ':****@'),
      mongooseVersion: mongoose.version,
    })
  } catch (error: any) {
    console.error('Connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}