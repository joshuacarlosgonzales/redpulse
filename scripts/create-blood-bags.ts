// scripts/create-blood-bags.ts
// Run with: npx ts-node scripts/create-blood-bags.ts

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Donation from '../models/Donation'
import BloodBag from '../models/BloodBag'

dotenv.config()

async function createBloodBagsForExistingDonations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '')
    console.log('📡 Connected to MongoDB')

    // Find all completed donations
    const donations = await Donation.find({
      status: 'Completed'
    })

    console.log(`📊 Found ${donations.length} completed donations`)

    let totalBagsCreated = 0
    let skipped = 0

    for (const donation of donations) {
      // Check if blood bags already exist for this donation
      const existingBags = await BloodBag.find({ donationId: donation._id })
      
      if (existingBags.length > 0) {
        console.log(`⏭️ Skipping donation ${donation._id} - ${existingBags.length} bags already exist`)
        skipped++
        continue
      }

      console.log(`📦 Creating ${donation.units} blood bag(s) for donation ${donation._id}`)

      const bags = []
      for (let i = 0; i < donation.units; i++) {
        const batchNumber = `${donation.bloodType}-${Date.now().toString().slice(-6)}-${String.fromCharCode(65 + i)}`
        
        bags.push({
          hospitalId: donation.hospitalId,
          bloodType: donation.bloodType,
          units: 1,
          donationId: donation._id,
          donationDate: donation.date,
          expirationDate: donation.expirationDate,
          status: new Date(donation.expirationDate) < new Date() ? 'expired' : 'available',
          batchNumber: batchNumber,
          location: 'Main Storage',
          notes: donation.notes || '',
        })
      }

      if (bags.length > 0) {
        await BloodBag.insertMany(bags)
        totalBagsCreated += bags.length
        console.log(`✅ Created ${bags.length} bag(s) for donation ${donation._id}`)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`  ✅ Created ${totalBagsCreated} blood bags`)
    console.log(`  ⏭️ Skipped ${skipped} donations (already have bags)`)
    console.log(`  📦 Total donations processed: ${donations.length}`)

    // Verify
    const totalBags = await BloodBag.countDocuments({})
    console.log(`\n📊 Total blood bags in database: ${totalBags}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

createBloodBagsForExistingDonations()