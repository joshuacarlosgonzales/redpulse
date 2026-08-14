// scripts/link-donor-user.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function linkDonorUser() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment')
      process.exit(1)
    }

    console.log('📡 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI as string)
    console.log('✅ Connected to MongoDB')
    
    const db = mongoose.connection.db
    if (!db) {
      console.error('❌ Database connection is not available')
      process.exit(1)
    }
    
    const donors = db.collection('donors')
    const users = db.collection('users')
    
    // Get all donors without userId
    const donorsWithoutUser = await donors.find({ userId: { $exists: false } }).toArray()
    console.log(`📊 Found ${donorsWithoutUser.length} donors without userId`)
    
    if (donorsWithoutUser.length === 0) {
      console.log('✅ All donors already have userId linked')
      await mongoose.connection.close()
      return
    }
    
    let linked = 0
    let notFound = 0
    
    for (const donor of donorsWithoutUser) {
      // Find user by email
      const user = await users.findOne({ email: donor.email })
      if (user) {
        await donors.updateOne(
          { _id: donor._id },
          { $set: { userId: user._id } }
        )
        linked++
        console.log(`✅ Linked donor ${donor.fullName || 'Unknown'} (${donor.email}) to user ${user.fullName || 'Unknown'}`)
      } else {
        notFound++
        console.log(`❌ No user found for donor ${donor.fullName || 'Unknown'} (${donor.email})`)
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Linked: ${linked} donors`)
    console.log(`   ❌ Not found: ${notFound} donors`)
    console.log(`   📊 Total processed: ${donorsWithoutUser.length} donors`)
    
    await mongoose.connection.close()
    console.log('✅ Done')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

linkDonorUser()