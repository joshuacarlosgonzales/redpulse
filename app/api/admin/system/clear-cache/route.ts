// app/api/admin/system/clear-cache/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // 1. Clear Next.js Server Cache for specific paths
    // This ensures that when you go back to the dashboard, it fetches fresh data
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/donors')
    revalidatePath('/admin/hospitals')
    
    // If you used tags in your fetch requests (e.g., next: { tags: ['stats'] }), use this:
    // revalidateTag('dashboard-stats')
    // revalidateTag('donor-list')

    console.log(`✅ Cache cleared by admin: ${decoded.email}`)

    return NextResponse.json({
      success: true,
      message: 'System cache cleared successfully'
    })

  } catch (error: any) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clear cache' },
      { status: 500 }
    )
  }
}