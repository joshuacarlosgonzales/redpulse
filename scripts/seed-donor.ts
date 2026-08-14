// scripts/seed-donor.ts
import { dbConnect } from '../lib/db';
import User from '../models/User';
import Donor from '../models/Donor';
import bcrypt from 'bcryptjs';

async function seedDonor() {
  try {
    await dbConnect();
    
    const email = 'rhexelgimado@gmail.com';
    const password = 'donor123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔍 Checking for user:', email);
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('✅ User already exists:', user.email);
      
      // Check if password is correct
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('🔄 Password is wrong, updating...');
        await User.updateOne(
          { email },
          { $set: { password: hashedPassword } }
        );
        console.log('✅ Password updated');
      }
      
      // Update user fields
      await User.updateOne(
        { email },
        {
          $set: {
            fullName: 'Rhexel Gimado',
            phone: '09123456789',
            bloodType: 'O+',
            role: 'donor',
            isActive: true,
            isVerified: true,
            isApproved: true,
            donationCount: 5,
            lastDonation: new Date().toISOString(),
            nextEligibleDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          }
        }
      );
      console.log('✅ User updated');
    } else {
      console.log('❌ User NOT found, creating...');
      
      // Create new user
      user = await User.create({
        fullName: 'Rhexel Gimado',
        email,
        password: hashedPassword,
        phone: '09123456789',
        bloodType: 'O+',
        role: 'donor',
        isActive: true,
        isVerified: true,
        isApproved: true,
        donationCount: 5,
        lastDonation: new Date().toISOString(),
        nextEligibleDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
      
      console.log('✅ User created with ID:', user._id);
    }
    
    // Now handle donor profile - with proper status type
    console.log('🔍 Checking for donor profile...');
    
    // Status must be one of: 'active' | 'inactive' | 'pending'
    const donorData = {
      fullName: 'Rhexel Gimado',
      email: email,
      phone: '09123456789',
      bloodType: 'O+',
      status: 'active' as const, // Use 'as const' to satisfy TypeScript
      donationCount: 0,
      address: '123 Test Street',
      barangay: 'Test Barangay',
      municipality: 'Test Municipality',
      province: 'Test Province',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      weight: 70,
      digitalId: 'DON-2024-001',
      isEligible: true,
      isApproved: true,
    };
    
    // Try to find existing donor
    const existingDonor = await Donor.findOne({ email });
    
    if (existingDonor) {
      console.log('✅ Donor profile exists, updating...');
      
      await Donor.updateOne(
        { email },
        { $set: donorData }
      );
      console.log('✅ Donor profile updated');
    } else {
      console.log('❌ Donor profile NOT found, creating...');
      
      // Create donor profile
      await Donor.create(donorData);
      console.log('✅ Donor profile created');
    }
    
    console.log('\n✅ Seeding complete!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\nTry logging in now!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDonor();