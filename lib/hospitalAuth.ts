// lib/hospitalAuth.ts

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export interface HospitalAuthPayload {
  userId?: string
  id?: string
  role: 'hospital' | 'admin'
  [key: string]: any
}

export interface AuthSuccess {
  success: true
  user: HospitalAuthPayload
}

export interface AuthFailure {
  success: false
  response: NextResponse
}

export type AuthResult = AuthSuccess | AuthFailure

// Type guard to check if auth was successful
export function isAuthSuccess(result: AuthResult): result is AuthSuccess {
  return result.success === true
}

// Type guard to check if auth failed
export function isAuthFailure(result: AuthResult): result is AuthFailure {
  return result.success === false
}

export function getAuthenticatedHospitalUser(
  request: NextRequest
): AuthResult {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Unauthorized - No token provided',
        },
        {
          status: 401,
        }
      ),
    }
  }

  const token = authHeader.substring(7).trim()

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Unauthorized - No token provided',
        },
        {
          status: 401,
        }
      ),
    }
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing from environment variables')

    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Server configuration error',
        },
        {
          status: 500,
        }
      ),
    }
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as HospitalAuthPayload

    if (!decoded) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Unauthorized - Invalid token',
          },
          {
            status: 401,
          }
        ),
      }
    }

    if (
      decoded.role !== 'hospital' &&
      decoded.role !== 'admin'
    ) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error:
              'Unauthorized - Hospital or Admin access required',
          },
          {
            status: 403,
          }
        ),
      }
    }

    return {
      success: true,
      user: decoded,
    }
  } catch (error) {
    console.error('JWT verification failed:', error)

    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Unauthorized - Invalid token',
        },
        {
          status: 401,
        }
      ),
    }
  }
}

export function getUserIdFromAuth(
  user: HospitalAuthPayload
): string | null {
  const id = user.userId || user.id || null
  
  // Validate that it's a proper ObjectId if it exists
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    console.error('Invalid ObjectId format in token payload:', id)
    return null
  }
  
  return id
}