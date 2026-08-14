// lib/mongodb.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

// Log connection info (hide password)
console.log('📡 Connecting to MongoDB...')
const sanitizedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@')
console.log('🔗 Using connection string:', sanitizedUri)

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('✅ Using existing MongoDB connection')
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      family: 4,
      // Add these options for better reliability
      retryWrites: true,
      retryReads: true,
    }

    console.log('🔄 Creating new MongoDB connection...')
    
    try {
      cached.promise = mongoose.connect(MONGODB_URI as string, opts)
        .then((mongoose) => {
          console.log('✅ MongoDB connected successfully!')
          console.log(`📊 Connected to database: ${mongoose.connection.db?.databaseName}`)
          return mongoose
        })
        .catch((error) => {
          console.error('❌ MongoDB connection error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
          })
          cached.promise = null
          throw error
        })
    } catch (error) {
      console.error('❌ Failed to create connection promise:', error)
      cached.promise = null
      throw error
    }
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB connection disconnected')
})

// Handle application shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log('MongoDB connection closed through app termination')
  process.exit(0)
})

export default dbConnect