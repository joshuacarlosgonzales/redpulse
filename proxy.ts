// proxy.ts (renamed from middleware.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

// Define which routes each role can access
const roleRoutes: Record<string, string[]> = {
  admin: ['/admin'],
  donor: ['/donor', '/donors'],
  hospital: ['/hospital']
}

// Define public routes (no authentication required)
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/_next',
  '/favicon.ico',
  '/public'
]

// Define routes that should redirect to login if not authenticated
const protectedRoutes = [
  '/admin',
  '/donor',
  '/donors',
  '/hospital',
  '/dashboard'
]

// ✅ CHANGED: 'middleware' → 'proxy'
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Check if route is public - allow access without authentication
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route is a protected route
  const isProtected = protectedRoutes.some(route => path.startsWith(route))
  if (!isProtected) {
    // If not a protected route, allow access
    return NextResponse.next()
  }

  // Get token from cookies
  let token = request.cookies.get('token')?.value
  
  // If not in cookies, check Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const decoded = verifyToken(token)
  if (!decoded) {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('token')
    return response
  }

  const { role } = decoded

  // Check if the user's role has access to this route
  const allowedPaths = roleRoutes[role] || []
  const hasAccess = allowedPaths.some(allowedPath => path.startsWith(allowedPath))

  if (!hasAccess) {
    // Redirect to appropriate dashboard based on role
    let redirectPath = '/'
    if (role === 'admin') redirectPath = '/admin/dashboard'
    else if (role === 'donor') redirectPath = '/donors/dashboard'
    else if (role === 'hospital') redirectPath = '/hospital/dashboard'
    
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Add user info to headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', decoded.userId)
  requestHeaders.set('x-user-role', decoded.role)
  requestHeaders.set('x-user-email', decoded.email)
  requestHeaders.set('x-user-name', decoded.fullName)

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - .svg, .png, .jpg, .jpeg, .gif, .webp (image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
