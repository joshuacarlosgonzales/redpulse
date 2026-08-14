import dbConnect from './mongodb'
import { User, Donor, BloodInventory, Donation } from '@/models'

// Export all models
export { User, Donor, BloodInventory, Donation }

// Export connection function
export { dbConnect }

// Helper function to check connection status
export async function isConnected() {
  const mongoose = await dbConnect()
  return mongoose.connection.readyState === 1
}