// app/api/debug/connection-status/route.ts
import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib'
import mongoose from 'mongoose'

export async function GET() {
  try {
    await dbConnect()
    
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection is not available'
      }, { status: 500 })
    }
    
    // Get database info
    const dbInfo = {
      databaseName: db.databaseName,
      readyState: mongoose.connection.readyState,
      collections: await db.listCollections().toArray(),
    }
    
    // Check the users collection directly
    const usersCollection = db.collection('users')
    const userCount = await usersCollection.countDocuments()
    const sampleUsers = await usersCollection.find({}).limit(5).toArray()
    
    return NextResponse.json({
      success: true,
      database: dbInfo,
      usersCollection: {
        exists: dbInfo.collections.some(c => c.name === 'users'),
        count: userCount,
        sample: sampleUsers.map(u => ({
          email: u.email,
          role: u.role,
          fullName: u.fullName
        }))
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}