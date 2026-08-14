// scripts/create-donor-profiles.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function createDonorProfiles() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found')
      process.exit(1)
    }

    console.log('📡 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI as string)
    console.log('✅ Connected')
    
    const db = mongoose.connection.db
    if (!db) {
      console.error('❌ No database connection')
      process.exit(1)
    }
    
    const users = db.collection('users')
    const donors = db.collection('donors')
    
    // Get existing donor emails to avoid duplicates
    const existingDonors = await donors.find({}).toArray()
    const existingEmails = existingDonors.map(d => d.email)
    console.log(`📊 Existing donors: ${existingDonors.length}`)
    
    // Find all donor users that don't have donor profiles
    const donorUsers = await users.find({ 
      role: 'donor',
      email: { $nin: existingEmails }
    }).toArray()
    
    console.log(`📊 Found ${donorUsers.length} donor users without profiles`)
    
    if (donorUsers.length === 0) {
      console.log('✅ All donor users already have profiles')
      await mongoose.connection.close()
      return
    }
    
    let created = 0
    let failed = 0
    
    for (const user of donorUsers) {
      try {
        // Get current donor count for digital ID
        const currentCount = await donors.countDocuments()
        const year = new Date().getFullYear()
        const digitalId = `RP-${year}-${String(currentCount + 1).padStart(4, '0')}`
        
        // Create donor profile
        const donorData = {
          fullName: user.fullName || 'Unknown',
          email: user.email,
          phone: user.phone || '',
          bloodType: user.bloodType || 'O+',
          address: 'Not provided',
          dateOfBirth: new Date('2000-01-01'),
          gender: 'Not specified',
          weight: 0,
          barangay: '',
          municipality: '',
          province: '',
          digitalId: digitalId,
          emergencyContact: '',
          status: user.isApproved ? 'active' : 'pending',
          isEligible: user.isApproved || false,
          totalDonations: user.donationCount || 0,
          lastDonationDate: null,
          nextEligibleDate: user.nextEligibleDate || null,
          medicalConditions: '',
          currentMedications: '',
          userId: user._id,
          approvedBy: user.isApproved ? 'system' : undefined,
          approvedAt: user.isApproved ? new Date() : undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await donors.insertOne(donorData)
        created++
        console.log(`✅ Created donor profile for ${user.fullName} (${user.email})`)
      } catch (error: any) {
        if (error.code === 11000) {
          console.log(`⚠️ Duplicate email: ${user.email} - Skipping`)
        } else {
          console.error(`❌ Failed to create donor for ${user.email}:`, error.message)
          failed++
        }
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Created: ${created} donor profiles`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📊 Total users without profiles: ${donorUsers.length}`)
    
    await mongoose.connection.close()
    console.log('✅ Done')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createDonorProfiles()