// app/api/debug/direct-users/route.ts
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
        error: 'Database connection error'
      }, { status: 500 })
    }
    
    // Get all collections
    const collections = await db.listCollections().toArray()
    console.log('📚 Collections:', collections.map(c => c.name))
    
    // Check each collection for users
    const results: any = {}
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name
      const coll = db.collection(collectionName)
      
      // Get all documents in this collection
      const documents = await coll.find({}).toArray()
      
      if (documents.length > 0) {
        results[collectionName] = {
          count: documents.length,
          documents: documents.map(doc => ({
            email: doc.email || 'N/A',
            role: doc.role || 'N/A',
            fullName: doc.fullName || 'N/A',
            _id: doc._id.toString()
          }))
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      databaseName: db.databaseName,
      collections: collections.map(c => c.name),
      data: results
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}