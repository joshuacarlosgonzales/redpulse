// scripts/fix-walkin-donations.ts
// Run with: npx ts-node scripts/fix-walkin-donations.ts

import mongoose from 'mongoose'
import Donor from '../models/Donor'
import Donation from '../models/Donation'
import dbConnect from '../lib/mongodb'

async function fixWalkinDonations() {
  await dbConnect()

  console.log('🔍 Fixing walk-in donor donation counts...')

  // Find all walk-in donors
  const walkinDonors = await Donor.find({
    isWalkIn: true
  })

  console.log(`📊 Found ${walkinDonors.length} walk-in donors`)

  let fixed = 0

  for (const donor of walkinDonors) {
    try {
      // Count actual donations for this donor
      const donationCount = await Donation.countDocuments({
        donorId: donor._id,
        status: 'Completed'
      })

      console.log(`  Donor ${donor.fullName}: ${donationCount} donations`)

      // Update the donor's totalDonations if it doesn't match
      if (donor.totalDonations !== donationCount) {
        donor.totalDonations = donationCount
        await donor.save()
        fixed++
        console.log(`  ✅ Updated ${donor.fullName} totalDonations to ${donationCount}`)
      }
    } catch (err) {
      console.error(`❌ Error fixing donor ${donor._id}:`, err)
    }
  }

  console.log(`✅ Migration complete! Fixed ${fixed} donors.`)
  process.exit(0)
}

fixWalkinDonations().catch(console.error)