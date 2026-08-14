// scripts/update-password-direct.ts
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found')
  process.exit(1)
}

async function updatePasswordDirect() {
  try {
    console.log('📡 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI as string)
    console.log('✅ Connected to MongoDB')
    
    const db = mongoose.connection.db
    if (!db) {
      console.error('❌ Database connection is not available')
      process.exit(1)
    }
    
    const collection = db.collection('users')
    
    // First, find all users
    console.log('📊 Finding all users...')
    const allUsers = await collection.find({}).project({ email: 1, _id: 1 }).toArray()
    console.log('Users in database:')
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u._id})`)
    })
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const newPassword = 'lattegin062102'
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    
    // Update the specific user
    const emailToUpdate = 'joshuacarlosgonzales@gmail.com'
    console.log(`\n🔍 Updating password for: ${emailToUpdate}`)
    
    // Try exact match first
    let result = await collection.updateOne(
      { email: emailToUpdate },
      { $set: { password: hashedPassword } }
    )
    
    // If not found, try case insensitive
    if (result.matchedCount === 0) {
      console.log('🔍 Trying case insensitive...')
      result = await collection.updateOne(
        { email: { $regex: emailToUpdate, $options: 'i' } },
        { $set: { password: hashedPassword } }
      )
    }
    
    if (result.matchedCount === 0) {
      console.log('❌ User not found with email:', emailToUpdate)
      
      // Show all emails again
      console.log('\n📊 Available emails:')
      const users = await collection.find({}).project({ email: 1 }).toArray()
      users.forEach(u => console.log(`  - ${u.email}`))
      
    } else {
      console.log(`✅ Password updated! (${result.modifiedCount} document(s) modified)`)
      console.log(`   New password: ${newPassword}`)
    }
    
    await mongoose.connection.close()
    console.log('✅ Connection closed')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updatePasswordDirect()