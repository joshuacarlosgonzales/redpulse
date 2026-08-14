// app/api/auth/reset-password-direct/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbConnect } from '@/lib'
import mongoose from 'mongoose'

export async function POST(request: Request) {
  try {
    await dbConnect()
    
    const { email, newPassword } = await request.json()
    
    console.log('🔍 Reset password for:', email)
    
    if (!email || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Email and new password are required'
      }, { status: 400 })
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters'
      }, { status: 400 })
    }
    
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error'
      }, { status: 500 })
    }
    
    const cleanEmail = email.trim().toLowerCase()
    
    // List all collections
    const collections = await db.listCollections().toArray()
    console.log('📚 Available collections:', collections.map(c => c.name))
    
    let foundUser = null
    let foundCollection = null
    
    // Search in all collections
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name
      const coll = db.collection(collectionName)
      
      console.log(`🔍 Searching in collection: ${collectionName}`)
      
      // Try to find the user
      let user = await coll.findOne({ email: cleanEmail })
      
      if (!user) {
        user = await coll.findOne({ 
          email: { $regex: cleanEmail, $options: 'i' } 
        })
      }
      
      if (user) {
        foundUser = user
        foundCollection = collectionName
        console.log(`✅ Found user in collection: ${collectionName}`)
        break
      }
    }
    
    if (!foundUser) {
      console.log('❌ User not found in any collection')
      
      // Show what's in each collection
      const debug: any = {}
      for (const collectionInfo of collections) {
        const coll = db.collection(collectionInfo.name)
        const docs = await coll.find({}).limit(5).toArray()
        debug[collectionInfo.name] = docs.map(d => ({
          email: d.email || 'N/A',
          role: d.role || 'N/A'
        }))
      }
      
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: {
          searchedEmail: cleanEmail,
          collections: debug
        }
      }, { status: 404 })
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    
    // Update the user
    const collection = db.collection(foundCollection!)
    const result = await collection.updateOne(
      { _id: foundUser._id },
      { $set: { password: hashedPassword } }
    )
    
    console.log('✅ Password updated in collection:', foundCollection)
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      email: foundUser.email,
      collection: foundCollection,
      modifiedCount: result.modifiedCount
    })
    
  } catch (error: any) {
    console.error('❌ Password reset error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Password reset failed'
    }, { status: 500 })
  }
}