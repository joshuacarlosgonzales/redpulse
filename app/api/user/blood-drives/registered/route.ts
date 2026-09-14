import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { dbConnect } from '@/lib/db'
import BloodDrive from '@/models/BloodDrive'

import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest
) {
  try {
    await dbConnect()

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const authHeader =
      request.headers.get(
        'authorization'
      )

    if (
      !authHeader ||
      !authHeader.startsWith(
        'Bearer '
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Unauthorized - No token provided',
        },
        {
          status: 401,
        }
      )
    }

    const token =
      authHeader.split(' ')[1]

    let decoded: any

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          'secret'
      ) as any

      if (
        decoded.role !==
          'donor' &&
        decoded.role !==
          'user'
      ) {
        return NextResponse.json(
          {
            error:
              'Unauthorized - Donor access required',
          },
          {
            status: 403,
          }
        )
      }
    } catch {
      return NextResponse.json(
        {
          error:
            'Unauthorized - Invalid token',
        },
        {
          status: 401,
        }
      )
    }

    const donorId =
      decoded.userId

    // ============================================================
    // FIND REGISTERED DRIVES
    // ============================================================

    const bloodDrives =
      await BloodDrive.find({
        registeredDonorIds:
          donorId,
      })
        .sort({
          date: 1,
        })
        .lean()

    // ============================================================
    // DATE
    // ============================================================

    const now =
      new Date()

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )

    // ============================================================
    // TRANSFORM
    // ============================================================

    const transformedDrives =
      bloodDrives.map(
        (drive: any) => {
          let actualStatus =
            drive.status ||
            'upcoming'

          const driveDate =
            new Date(
              drive.date
            )

          const driveDateOnly =
            new Date(
              driveDate.getFullYear(),
              driveDate.getMonth(),
              driveDate.getDate()
            )

          // Existing behavior
          if (
            driveDateOnly <
              today &&
            (
              drive.status ===
                'upcoming' ||
              drive.status ===
                'ongoing'
            )
          ) {
            actualStatus =
              'completed'
          }

          if (
            driveDateOnly <
              today &&
            drive.status ===
              'ongoing'
          ) {
            actualStatus =
              'completed'
          }

          if (
            driveDateOnly.getTime() ===
              today.getTime() &&
            drive.status ===
              'upcoming'
          ) {
            actualStatus =
              'ongoing'
          }

          return {
            id:
              drive._id.toString(),

            title:
              drive.title,

            description:
              drive.description ||
              '',

            location:
              drive.location,

            address:
              drive.address ||
              '',

            date:
              drive.date,

            startTime:
              drive.startTime,

            endTime:
              drive.endTime,

            status:
              actualStatus,

            bloodTypesNeeded:
              drive.bloodTypesNeeded ||
              [],

            targetDonors:
              drive.targetDonors ||
              0,

            registeredDonors:
              drive.registeredDonors ||
              0,

            completedDonations:
              drive.completedDonations ||
              0,

            organizer:
              drive.organizer ||
              '',

            contactNumber:
              drive.contactNumber ||
              '',

            contactEmail:
              drive.contactEmail ||
              '',

            isRegistered:
              true,

            createdAt:
              drive.createdAt,

            updatedAt:
              drive.updatedAt,
          }
        }
      )

    return NextResponse.json({
      success: true,

      data:
        transformedDrives,
    })
  } catch (error: any) {
    console.error(
      'Error fetching registered drives:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to fetch registered drives',
      },
      {
        status: 500,
      }
    )
  }
}