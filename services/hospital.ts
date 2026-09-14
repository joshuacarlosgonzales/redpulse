import dbConnect from '@/lib/mongodb';
import Hospital from '@/models/Hospital';
import User from '@/models/User';
import mongoose from 'mongoose';

export class HospitalService {
  static async getHospitalByUserId(userId: string) {
    await dbConnect();
    return Hospital.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
  }

  static async getHospitalById(hospitalId: string) {
    await dbConnect();
    return Hospital.findById(hospitalId).lean();
  }

  static async getHospitalWithUser(userId: string) {
    await dbConnect();
    const hospital = await Hospital.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
    if (!hospital) return null;
    
    const user = await User.findById(userId).lean();
    return {
      ...hospital,
      user,
    };
  }

  static async getHospitalByLicense(license: string) {
    await dbConnect();
    return Hospital.findOne({ hospitalLicense: license }).lean();
  }

  static async getHospitalByEmail(email: string) {
    await dbConnect();
    const user = await User.findOne({ email, role: 'hospital' }).lean();
    if (!user) return null;
    
    return Hospital.findOne({ userId: user._id }).lean();
  }

  static async createHospital(data: {
    userId: string;
    hospitalName: string;
    hospitalLicense: string;
    hospitalAddress: string;
    hospitalPhone: string;
    hospitalType?: string;
    hospitalCapacity?: number;
    hospitalEmail?: string;
    hospitalWebsite?: string;
  }) {
    await dbConnect();
    return Hospital.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      hospitalName: data.hospitalName,
      hospitalLicense: data.hospitalLicense,
      hospitalAddress: data.hospitalAddress,
      hospitalPhone: data.hospitalPhone,
      hospitalType: data.hospitalType || 'General Hospital',
      hospitalCapacity: data.hospitalCapacity || 0,
      hospitalEmail: data.hospitalEmail,
      hospitalWebsite: data.hospitalWebsite,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static async updateHospital(userId: string, data: any) {
    await dbConnect();
    return Hospital.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { 
        ...data, 
        updatedAt: new Date() 
      },
      { new: true, upsert: true }
    );
  }

  static async updateHospitalStatus(
    userId: string, 
    status: 'pending' | 'active' | 'inactive' | 'rejected',
    rejectionReason?: string
  ) {
    await dbConnect();
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'active') {
      updateData.approvedAt = new Date();
    }

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    return Hospital.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      updateData,
      { new: true }
    );
  }

  static async getAllHospitals(options: { 
    limit?: number; 
    page?: number; 
    status?: string 
  } = {}) {
    await dbConnect();
    const { limit = 10, page = 1, status } = options;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [data, total] = await Promise.all([
      Hospital.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hospital.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getPendingHospitals() {
    await dbConnect();
    return Hospital.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .lean();
  }

  static async getActiveHospitals() {
    await dbConnect();
    return Hospital.find({ status: 'active' })
      .sort({ hospitalName: 1 })
      .lean();
  }

  static async deleteHospital(userId: string) {
    await dbConnect();
    return Hospital.findOneAndDelete({ userId: new mongoose.Types.ObjectId(userId) });
  }

  static async countHospitalsByStatus() {
    await dbConnect();
    const result = await Hospital.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const counts: Record<string, number> = {};
    result.forEach((item: any) => {
      counts[item._id] = item.count;
    });
    
    return {
      total: await Hospital.countDocuments(),
      pending: counts.pending || 0,
      active: counts.active || 0,
      inactive: counts.inactive || 0,
      rejected: counts.rejected || 0,
    };
  }
}