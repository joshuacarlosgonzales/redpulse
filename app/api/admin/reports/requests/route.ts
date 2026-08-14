// app/api/admin/reports/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

interface RequestItem {
  id: string;
  type: 'donor' | 'hospital' | 'blood_drive' | 'emergency';
  title: string;
  description: string;
  requester: string;
  requesterEmail: string;
  requesterPhone: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  bloodType?: string;
  units?: number;
  location?: string;
  hospitalName?: string;
}

interface ReportStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  completedRequests: number;
  emergencyRequests: number;
  byType: {
    donor: number;
    hospital: number;
    blood_drive: number;
    emergency: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const priority = searchParams.get('priority') || 'all'
    const search = searchParams.get('search') || ''

    // Generate mock data
    const mockRequests = generateMockRequests()

    // Filter mock data
    let filtered = mockRequests
    if (status !== 'all') {
      filtered = filtered.filter(r => r.status === status)
    }
    if (type !== 'all') {
      filtered = filtered.filter(r => r.type === type)
    }
    if (priority !== 'all') {
      filtered = filtered.filter(r => r.priority === priority)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.requester.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      )
    }

    const stats = calculateStats(mockRequests)

    return NextResponse.json({
      success: true,
      data: filtered,
      stats: stats
    })

  } catch (error: any) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// Mock data generator
function generateMockRequests(): RequestItem[] {
  const now = new Date()
  const types: ('donor' | 'hospital' | 'blood_drive' | 'emergency')[] = ['donor', 'hospital', 'blood_drive', 'emergency']
  const statuses: ('pending' | 'approved' | 'rejected' | 'completed')[] = ['pending', 'approved', 'rejected', 'completed']
  const priorities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical']
  const names = ['Juan Dela Cruz', 'Maria Santos', 'Jose Reyes', 'Ana Garcia', 'Pedro Lopez']
  const hospitals = ['Manila General Hospital', 'Quezon City Medical Center', 'Cebu Doctors Hospital', 'Davao Regional Medical Center', 'St. Luke\'s Medical Center']
  
  return Array.from({ length: 15 }, (_, i) => {
    const type = types[i % types.length]
    const status = statuses[i % statuses.length]
    const priority = priorities[i % priorities.length]
    const name = names[i % names.length]
    const hospital = hospitals[i % hospitals.length]
    
    return {
      id: `req-${i + 1}`,
      type,
      title: `${type === 'donor' ? 'Donor Registration Request' : type === 'hospital' ? 'Hospital Registration Request' : type === 'blood_drive' ? 'Blood Drive Request' : 'Emergency Blood Request'}`,
      description: `${type === 'donor' ? `${name} wants to register as a blood donor` : type === 'hospital' ? `${hospital} wants to register as a partner hospital` : type === 'blood_drive' ? `Blood drive request from ${hospital}` : `Emergency blood request from ${hospital}`}`,
      requester: name,
      requesterEmail: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      requesterPhone: `09${Math.floor(Math.random() * 1000000000)}`,
      status,
      priority,
      createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - i * 12 * 60 * 60 * 1000).toISOString(),
      bloodType: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][i % 8],
      units: Math.floor(Math.random() * 5) + 1,
      location: `${hospital}, Philippines`,
      hospitalName: hospital
    }
  })
}

function calculateStats(data: RequestItem[]): ReportStats {
  const stats: ReportStats = {
    totalRequests: data.length,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    completedRequests: 0,
    emergencyRequests: 0,
    byType: {
      donor: 0,
      hospital: 0,
      blood_drive: 0,
      emergency: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
  }

  data.forEach((item: RequestItem) => {
    // Count by status
    if (item.status === 'pending') stats.pendingRequests++
    else if (item.status === 'approved') stats.approvedRequests++
    else if (item.status === 'rejected') stats.rejectedRequests++
    else if (item.status === 'completed') stats.completedRequests++
    
    // Count by type
    if (item.type === 'emergency') stats.emergencyRequests++
    if (item.type === 'donor') stats.byType.donor++
    else if (item.type === 'hospital') stats.byType.hospital++
    else if (item.type === 'blood_drive') stats.byType.blood_drive++
    else if (item.type === 'emergency') stats.byType.emergency++
    
    // Count by priority
    if (item.priority === 'low') stats.byPriority.low++
    else if (item.priority === 'medium') stats.byPriority.medium++
    else if (item.priority === 'high') stats.byPriority.high++
    else if (item.priority === 'critical') stats.byPriority.critical++
  })

  return stats
}