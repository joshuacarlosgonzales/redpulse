// scripts/test-db.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment')
  console.error('Please make sure .env.local file exists with MONGODB_URI')
  process.exit(1)
}

console.log('🔍 Testing MongoDB connection...')
const sanitizedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@')
console.log('📡 Connecting to:', sanitizedUri)

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    
    console.log('✅ Connected successfully!')
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`)
    
    // List collections
    const collections = await mongoose.connection.db?.listCollections().toArray()
    console.log('📚 Collections:', collections?.map(c => c.name))
    
    // Check if users collection exists and count
    if (collections?.some(c => c.name === 'users')) {
      const count = await mongoose.connection.db?.collection('users').countDocuments()
      console.log(`👤 Users in database: ${count}`)
    }
    
    await mongoose.connection.close()
    console.log('✅ Connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error)
    process.exit(1)
  }
}

testConnection()