// scripts/check-user.ts
// Use relative paths instead of @ aliases
import { dbConnect } from '../lib/db';
import User from '../models/User';
import Donor from '../models/Donor';

async function checkUser() {
  try {
    await dbConnect();
    
    const email = 'rhexelgimado@gmail.com';
    
    console.log('🔍 Checking for user:', email);
    
    // Check User
    const user = await User.findOne({ email });
    if (user) {
      console.log('✅ User found:', {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        isApproved: user.isApproved,
        hasPassword: !!user.password
      });
    } else {
      console.log('❌ User NOT found:', email);
    }
    
    // Check Donor
    const donor = await Donor.findOne({ email });
    if (donor) {
      console.log('✅ Donor found:', {
        email: donor.email,
        fullName: donor.fullName,
        status: donor.status,
        isEligible: donor.isEligible
      });
    } else {
      console.log('❌ Donor NOT found:', email);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();