// app/api/admin/reports/donations/route.ts

import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import Donation from "@/models/Donation"
import BloodDrive, { calculateCurrentStatus } from "@/models/BloodDrive"

// ============================================================
// TYPES
// ============================================================

type DonationData = {
  id: string
  donorName: string
  donorEmail: string
  bloodType: string
  units: number
  driveId: string
  driveName: string
  hospitalName: string
  createdAt: Date
}

type BloodTypeData = {
  type: string
  count: number
  units: number
}

type TrendData = {
  label: string
  count: number
  units: number
}

// ============================================================
// GET DONATION REPORT
// ============================================================

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No token provided",
        },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as any

      if (!decoded || decoded.role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized - Admin access required",
          },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid token",
        },
        { status: 401 }
      )
    }

    // ========================================================
    // GET SELECTED MONTH / YEAR
    // ========================================================

    const now = new Date()

    const searchParams = request.nextUrl.searchParams

    const requestedMonth = Number(
      searchParams.get("month")
    )

    const requestedYear = Number(
      searchParams.get("year")
    )

    // ✅ Check if month/year are provided (not "all")
    const isFilteringByMonth = !isNaN(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
    const isFilteringByYear = !isNaN(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100

    const selectedMonth = isFilteringByMonth ? requestedMonth : now.getMonth() + 1
    const selectedYear = isFilteringByYear ? requestedYear : now.getFullYear()

    // ========================================================
    // SELECTED MONTH RANGE (only if filtering by month)
    // ========================================================

    let monthStart: Date
    let nextMonthStart: Date
    let previousMonthStart: Date

    if (isFilteringByMonth && isFilteringByYear) {
      monthStart = new Date(
        selectedYear,
        selectedMonth - 1,
        1,
        0,
        0,
        0,
        0
      )

      nextMonthStart = new Date(
        selectedMonth === 12
          ? selectedYear + 1
          : selectedYear,
        selectedMonth === 12
          ? 0
          : selectedMonth,
        1,
        0,
        0,
        0,
        0
      )

      previousMonthStart = new Date(
        selectedYear,
        selectedMonth - 2,
        1,
        0,
        0,
        0,
        0
      )
    } else {
      // ✅ If "All Months", use a wide range
      monthStart = new Date(2000, 0, 1)
      nextMonthStart = new Date(2100, 0, 1)
      previousMonthStart = new Date(2000, 0, 1)
    }

    // ========================================================
    // MONTH LABEL
    // ========================================================

    const monthLabel = isFilteringByMonth && isFilteringByYear
      ? monthStart.toLocaleString("default", {
          month: "long",
          year: "numeric",
        })
      : "All Months"

    // ========================================================
    // GET COMPLETED DONATIONS
    // ========================================================

    const completedDonations =
      await Donation.find({
        status: "Completed",
      })
        .sort({
          date: -1,
        })
        .lean()

    // ========================================================
    // SELECTED MONTH DONATIONS
    // ========================================================

    const selectedMonthDonations =
      isFilteringByMonth && isFilteringByYear
        ? completedDonations.filter((donation) => {
            const donationDate = new Date(
              donation.date
            )
            return (
              donationDate >= monthStart &&
              donationDate < nextMonthStart
            )
          })
        : completedDonations // ✅ All donations for "All Months"

    // ========================================================
    // PREVIOUS MONTH DONATIONS (for growth calculation)
    // ========================================================

    const previousMonthDonations =
      isFilteringByMonth && isFilteringByYear
        ? completedDonations.filter((donation) => {
            const donationDate = new Date(
              donation.date
            )
            return (
              donationDate >= previousMonthStart &&
              donationDate < monthStart
            )
          })
        : []

    // ========================================================
    // TOTAL DONATIONS
    // ========================================================

    const totalDonations =
      selectedMonthDonations.length

    // ========================================================
    // TOTAL BLOOD UNITS
    // ========================================================

    const totalUnits =
      selectedMonthDonations.reduce(
        (sum, donation) => {
          return (
            sum +
            Number(donation.units || 0)
          )
        },
        0
      )

    // ========================================================
    // THIS MONTH COUNT
    // ========================================================

    const thisMonthCount =
      totalDonations

    // ========================================================
    // DAYS IN SELECTED MONTH
    // ========================================================

    const daysInSelectedMonth =
      isFilteringByMonth && isFilteringByYear
        ? new Date(
            selectedYear,
            selectedMonth,
            0
          ).getDate()
        : 30 // Default for "All Months"

    // ========================================================
    // AVERAGE DAILY
    // ========================================================

    const averageDaily =
      totalDonations > 0
        ? totalDonations /
          daysInSelectedMonth
        : 0

    // ========================================================
    // GROWTH VS PREVIOUS MONTH
    // ========================================================

    const previousMonthCount =
      previousMonthDonations.length

    let growth = 0

    if (previousMonthCount > 0) {
      growth = Math.round(
        (
          (totalDonations -
            previousMonthCount) /
          previousMonthCount
        ) * 100
      )
    } else if (totalDonations > 0) {
      growth = 100
    }

    // ========================================================
    // BLOOD TYPE BREAKDOWN
    // ========================================================

    const allBloodTypes = [
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
    ]

    const bloodTypeMap =
      new Map<string, BloodTypeData>()

    allBloodTypes.forEach((type) => {
      bloodTypeMap.set(type, {
        type,
        count: 0,
        units: 0,
      })
    })

    selectedMonthDonations.forEach((donation) => {
      const bloodType =
        donation.bloodType

      if (!bloodTypeMap.has(bloodType)) {
        bloodTypeMap.set(bloodType, {
          type: bloodType,
          count: 0,
          units: 0,
        })
      }

      const entry =
        bloodTypeMap.get(bloodType)!

      entry.count += 1

      entry.units += Number(
        donation.units || 0
      )
    })

    const bloodTypeData =
      Array.from(
        bloodTypeMap.values()
      )

    // ========================================================
    // GET ALL BLOOD DRIVES WITH CALCULATED STATUS
    // ========================================================

    const drives =
      await BloodDrive.find({})
        .sort({
          date: -1,
        })
        .lean()

    // ========================================================
    // FORMAT BLOOD DRIVE DATA WITH CALCULATED STATUS
    // ========================================================

    const byDrive = drives
      .filter((drive) => {
        if (isFilteringByMonth && isFilteringByYear) {
          // Filter by selected month
          const driveDate = new Date(drive.date)
          return (
            driveDate >= monthStart &&
            driveDate < nextMonthStart
          )
        }
        return true // ✅ All drives for "All Months"
      })
      .map((drive) => {
        // ✅ Calculate the REAL current status
        const currentStatus = calculateCurrentStatus(
          drive.date,
          drive.startTime,
          drive.endTime,
          drive.status
        )

        return {
          id: String(
            drive._id
          ),

          name:
            drive.title ||
            "Unnamed Blood Drive",

          date:
            drive.date,

          count:
            drive.registeredDonors ||
            0,

          units:
            drive.completedDonations ||
            0,

          targetDonors:
            Number(
              drive.targetDonors ||
                0
            ),

          status: currentStatus,

          location:
            drive.location ||
            "",
        }
      })
      .sort(
        (a, b) =>
          new Date(
            b.date
          ).getTime() -
          new Date(
            a.date
          ).getTime()
      )

    // ========================================================
    // MONTHLY TREND
    // ========================================================

    const trendMap =
      new Map<string, TrendData>()

    for (let i = 5; i >= 0; i--) {
      const trendDate =
        new Date(
          selectedYear,
          selectedMonth - 1 - i,
          1
        )

      const label =
        trendDate.toLocaleString(
          "default",
          {
            month: "short",
            year: "numeric",
          }
        )

      const key =
        `${trendDate.getFullYear()}-${trendDate.getMonth()}`

      trendMap.set(key, {
        label,
        count: 0,
        units: 0,
      })
    }

    completedDonations.forEach(
      (donation) => {
        const donationDate =
          new Date(
            donation.date
          )

        const key =
          `${donationDate.getFullYear()}-${donationDate.getMonth()}`

        if (!trendMap.has(key)) {
          return
        }

        const entry =
          trendMap.get(key)!

        entry.count += 1

        entry.units += Number(
          donation.units || 0
        )
      }
    )

    const trend =
      Array.from(
        trendMap.values()
      )

    // ========================================================
    // FORMAT DONATION
    // ========================================================

    const driveMap =
      new Map<string, any>()

    drives.forEach((drive) => {
      driveMap.set(
        String(drive._id),
        drive
      )
    })

    const formatDonation = (
      donation: any
    ): DonationData => {
      const driveId =
        donation.bloodDriveId
          ? String(
              donation.bloodDriveId
            )
          : ""

      const drive =
        driveId
          ? driveMap.get(
              driveId
            )
          : null

      return {
        id: String(
          donation._id
        ),

        donorName:
          donation.donorName ||
          "Unknown Donor",

        donorEmail:
          donation.donorEmail ||
          "",

        bloodType:
          donation.bloodType ||
          "",

        units: Number(
          donation.units || 0
        ),

        driveId,

        driveName:
          drive?.title ||
          "",

        hospitalName:
          donation.hospital ||
          "",

        createdAt:
          donation.date,
      }
    }

    // ========================================================
    // RECENT DONATIONS
    // ========================================================

    const recentDonations =
      selectedMonthDonations
        .slice(0, 10)
        .map(formatDonation)

    // ========================================================
    // ALL DONATIONS FOR SELECTED MONTH
    // ========================================================

    const allDonations =
      selectedMonthDonations.map(
        formatDonation
      )

    // ========================================================
    // AVAILABLE MONTHS
    // ========================================================

    const availableMonthMap =
      new Map<
        string,
        {
          month: number
          year: number
          label: string
        }
      >()

    // Always include current month
    availableMonthMap.set(
      `${now.getFullYear()}-${
        now.getMonth() + 1
      }`,
      {
        month:
          now.getMonth() + 1,

        year:
          now.getFullYear(),

        label:
          now.toLocaleString(
            "default",
            {
              month: "long",
              year: "numeric",
            }
          ),
      }
    )

    // Add months from donation history
    completedDonations.forEach(
      (donation) => {
        const donationDate =
          new Date(
            donation.date
          )

        const month =
          donationDate.getMonth() + 1

        const year =
          donationDate.getFullYear()

        const key =
          `${year}-${month}`

        if (
          !availableMonthMap.has(
            key
          )
        ) {
          availableMonthMap.set(
            key,
            {
              month,
              year,

              label:
                donationDate.toLocaleString(
                  "default",
                  {
                    month:
                      "long",
                    year:
                      "numeric",
                  }
                ),
            }
          )
        }
      }
    )

    // Sort months (newest first)
    const availableMonths =
      Array.from(
        availableMonthMap.values()
      ).sort((a, b) => {
        const dateA =
          new Date(
            a.year,
            a.month - 1,
            1
          ).getTime()

        const dateB =
          new Date(
            b.year,
            b.month - 1,
            1
          ).getTime()

        return dateB - dateA
      })

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      data: {
        selectedMonth: isFilteringByMonth ? selectedMonth : 0,
        selectedYear: isFilteringByYear ? selectedYear : 0,
        monthLabel,
        totalDonations,
        totalUnits,
        thisMonthCount,
        averageDaily:
          Number(
            averageDaily.toFixed(1)
          ),
        growth,
        bloodTypeData,
        byDrive,
        trend,
        recentDonations,
        allDonations,
        availableMonths: availableMonths || [],
        isAllMonths: !isFilteringByMonth || !isFilteringByYear,
      },
    })
  } catch (error: any) {
    console.error(
      "Error fetching donations report:",
      error
    )

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to fetch donations report",
      },
      {
        status: 500,
      }
    )
  }
}