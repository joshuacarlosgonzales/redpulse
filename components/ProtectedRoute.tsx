// components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!isLoading && isAuthenticated && allowedRoles.length > 0) {
      if (!hasRole(allowedRoles)) {
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (user?.role === 'donor' || user?.role === 'user') {
          router.push('/user/dashboard')
        } else if (user?.role === 'hospital') {
          router.push('/hospital/dashboard')
        } else {
          router.push('/')
        }
      }
    }
  }, [isLoading, isAuthenticated, router, allowedRoles, hasRole, user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return null
  }

  return <>{children}</>
}