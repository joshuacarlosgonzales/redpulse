// context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  _id: string
  fullName: string
  email: string
  phone: string
  role: 'admin' | 'user' | 'donor' | 'hospital'
  isActive: boolean
  isVerified: boolean
  isApproved: boolean
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: boolean
  hasRole: (roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check localStorage for session
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (userData: User, authToken: string) => {
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(authToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    router.push('/auth/login')
  }

  const isAuthenticated = !!token && !!user

  const hasRole = (roles: string[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      logout,
      isAuthenticated,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}