import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Donation from '../models/Donation'

dotenv.config()

const BLOOD_SHELF_LIFE_DAYS = 42

async function backfillExpirationDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '')
    console.log('📡 Connected to MongoDB')

    // Find all completed donations without expirationDate
    const donations = await Donation.find({
      status: 'Completed',
      expirationDate: { $exists: false }
    })

    console.log(`📊 Found ${donations.length} donations without expiration dates`)

    let updated = 0
    let skipped = 0

    for (const donation of donations) {
      // Calculate expiration date from donation date + 42 days
      const donationDate = new Date(donation.date)
      const expirationDate = new Date(donationDate)
      expirationDate.setDate(expirationDate.getDate() + BLOOD_SHELF_LIFE_DAYS)

      // Update the donation
      await Donation.updateOne(
        { _id: donation._id },
        { $set: { expirationDate: expirationDate } }
      )

      updated++
      
      if (updated % 10 === 0) {
        console.log(`📝 Updated ${updated} donations...`)
      }
    }

    console.log(`✅ Successfully updated ${updated} donations with expiration dates`)
    console.log(`⏭️ Skipped ${skipped} donations`)

    // Verify the update
    const totalWithExpiration = await Donation.countDocuments({
      status: 'Completed',
      expirationDate: { $exists: true }
    })

    console.log(`📊 Total completed donations with expiration dates: ${totalWithExpiration}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

backfillExpirationDates()