// lib/auth.ts
import jwt from 'jsonwebtoken'

export interface DecodedToken {
  userId: string
  email: string
  fullName: string
  role: 'admin' | 'donor' | 'hospital'
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken
    return decoded
  } catch (error) {
    return null
  }
}

export function getSessionData(token: string) {
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  return {
    userId: decoded.userId,
    email: decoded.email,
    fullName: decoded.fullName,
    role: decoded.role
  }
}

export function isAuthenticated(token: string | null): boolean {
  if (!token) return false
  return verifyToken(token) !== null
}

export function hasRole(token: string | null, allowedRoles: string[]): boolean {
  if (!token) return false
  const decoded = verifyToken(token)
  if (!decoded) return false
  return allowedRoles.includes(decoded.role)
}

// Cookie helpers
export function setAuthCookie(token: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
  }
}

export function removeAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'token') {
      return value
    }
  }
  return null
}

// Role checking helpers
export function isAdmin(token: string | null): boolean {
  return hasRole(token, ['admin'])
}

export function isDonor(token: string | null): boolean {
  return hasRole(token, ['donor'])
}

export function isHospital(token: string | null): boolean {
  return hasRole(token, ['hospital'])
}

// Middleware helper for route protection
export function getRedirectPath(role: 'admin' | 'donor' | 'hospital'): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'donor':
      return '/donors/dashboard'
    case 'hospital':
      return '/hospital/dashboard'
    default:
      return '/'
  }
}

// Validate if user can access a specific route
export function canAccessRoute(token: string | null, requiredRole: 'admin' | 'donor' | 'hospital'): boolean {
  if (!token) return false
  const decoded = verifyToken(token)
  if (!decoded) return false
  return decoded.role === requiredRole
}