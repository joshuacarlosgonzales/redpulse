// lib/index.ts
import dbConnect from './mongodb'
import User from '@/models/User'
import Donor from '@/models/Donor'
import BloodInventory from '@/models/BloodInventory'
import Donation from '@/models/Donation'

// Export all models
export { User, Donor, BloodInventory, Donation }

// Export connection function
export { dbConnect }

// Helper function to check connection status
export async function isConnected() {
  try {
    const mongoose = await dbConnect()
    return mongoose.connection.readyState === 1
  } catch (error) {
    console.error('Connection check failed:', error)
    return false
  }
}

// Helper function to get connection status
export function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }
  const mongoose = require('mongoose')
  const state = mongoose.connection.readyState
  return states[state as keyof typeof states] || 'unknown'
}