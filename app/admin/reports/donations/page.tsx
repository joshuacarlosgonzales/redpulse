// app/admin/reports/donations/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Droplet,
  FileText,
  PieChart as PieChartIcon,
  Calendar,
  TrendingUp,
  Loader2,
  AlertCircle,
  MapPin,
  Target,
  Users,
  CheckCircle,
  Clock,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import {
  ReportHeader,
  SubTabBar,
  StatCard,
  SubTabDef,
  EmptyState,
} from "@/components/admin/reports/ReportControls";

import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

type SubTab =
  | "summary"
  | "by-blood-type"
  | "by-blood-drive"
  | "trends";

const TABS: SubTabDef<SubTab>[] = [
  {
    key: "summary",
    label: "Summary",
    icon: FileText,
  },
  {
    key: "by-blood-type",
    label: "By Blood Type",
    icon: PieChartIcon,
  },
  {
    key: "by-blood-drive",
    label: "By Blood Drive",
    icon: Calendar,
  },
  {
    key: "trends",
    label: "Trends",
    icon: TrendingUp,
  },
];

interface DonationData {
  id: string;
  donorName: string;
  donorEmail: string;
  bloodType: string;
  units: number;
  driveId: string;
  driveName: string;
  hospitalName: string;
  createdAt: string;
}

interface BloodDriveStats {
  id: string;
  name: string;
  date: string;
  count: number;
  units: number;
  targetDonors: number;
  status: string;
  location: string;
}

interface DonationStats {
  selectedMonth: number;
  selectedYear: number;
  monthLabel: string;

  totalDonations: number;
  totalUnits: number;
  thisMonthCount: number;
  averageDaily: number;
  growth: number;

  bloodTypeData: {
    type: string;
    count: number;
    units: number;
  }[];

  byDrive: BloodDriveStats[];

  trend: {
    label: string;
    count: number;
    units: number;
  }[];

  recentDonations: DonationData[];
  allDonations: DonationData[];

  availableMonths: {
    month: number;
    year: number;
    label: string;
  }[];
}

/* =========================================================
   BLOOD TYPE COLORS
========================================================= */

const BLOOD_TYPE_COLORS: Record<string, string> = {
  "O+": "#10b981",
  "O-": "#059669",
  "A+": "#ef4444",
  "A-": "#dc2626",
  "B+": "#f59e0b",
  "B-": "#d97706",
  "AB+": "#8b5cf6",
  "AB-": "#7c3aed",
};

const BLOOD_TYPE_ORDER = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
];

/* =========================================================
   CHART CONFIG
========================================================= */

const chartConfig = {
  units: {
    label: "Units",
    color: "#10b981",
  },

  donations: {
    label: "Donations",
    color: "#ef4444",
  },
} satisfies ChartConfig;

const bloodTypeAreaConfig = {
  units: {
    label: "Units",
    color: "#ef4444",
  },
} satisfies ChartConfig;

/* =========================================================
   PAGINATION
========================================================= */

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  if (totalPages <= 1) return null;

  const startItem =
    (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing{" "}
        <span className="font-medium text-zinc-900 dark:text-white">
          {startItem}
        </span>{" "}
        to{" "}
        <span className="font-medium text-zinc-900 dark:text-white">
          {endItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-zinc-900 dark:text-white">
          {totalItems}
        </span>{" "}
        results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </button>

        <button
          onClick={() =>
            onPageChange(currentPage - 1)
          }
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </button>

        <div className="flex items-center gap-1 px-2">
          {Array.from(
            { length: Math.min(5, totalPages) },
            (_, i) => {
              let pageNum: number;

              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (
                currentPage >=
                totalPages - 2
              ) {
                pageNum =
                  totalPages - 4 + i;
              } else {
                pageNum =
                  currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() =>
                    onPageChange(pageNum)
                  }
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
          )}
        </div>

        <button
          onClick={() =>
            onPageChange(currentPage + 1)
          }
          disabled={
            currentPage === totalPages
          }
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </button>

        <button
          onClick={() =>
            onPageChange(totalPages)
          }
          disabled={
            currentPage === totalPages
          }
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminReportsDonationsPage() {
  const router = useRouter();

  const [activeSubTab, setActiveSubTab] =
    useState<SubTab>("summary");

  const [data, setData] =
    useState<DonationStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [bloodTypeFilter, setBloodTypeFilter] =
    useState("all");

  const [showAllDonations, setShowAllDonations] =
    useState(false);

  const [driveSearchQuery, setDriveSearchQuery] =
    useState("");

  // ✅ Add state for selected month filter (including "all")
  const [selectedMonthFilter, setSelectedMonthFilter] =
    useState<string>("all");

  const ITEMS_PER_PAGE = 10;

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = async (
    month?: number,
    year?: number
  ) => {
    try {
      setError(null);

      const token =
        localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      const params = new URLSearchParams();

      if (month !== undefined) {
        params.set(
          "month",
          String(month)
        );
      }

      if (year !== undefined) {
        params.set(
          "year",
          String(year)
        );
      }

      const response = await fetch(
        `/api/admin/reports/donations?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          router.push("/auth/login");
          return;
        }

        throw new Error(
          "Failed to fetch donations data"
        );
      }

      const result =
        await response.json();

      // ✅ Ensure all fields exist with fallbacks
      const safeData = {
        ...result.data,
        availableMonths: result.data?.availableMonths || [],
        bloodTypeData: result.data?.bloodTypeData || [],
        byDrive: result.data?.byDrive || [],
        trend: result.data?.trend || [],
        recentDonations: result.data?.recentDonations || [],
        allDonations: result.data?.allDonations || [],
      };

      setData(safeData);
    } catch (err) {
      console.error(
        "Error loading donations:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load donations"
      );
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadData().finally(() => {
      setLoading(false);
    });
  }, []);

  /* =========================================================
     MONTH CHANGE
  ========================================================= */

  const handleMonthChange = async (
    value: string
  ) => {
    setSelectedMonthFilter(value);

    if (value === "all") {
      // Load all data (no month/year filter)
      setCurrentPage(1);
      setSearchQuery("");
      setBloodTypeFilter("all");
      setDriveSearchQuery("");

      setRefreshing(true);
      await loadData();
      setRefreshing(false);
    } else {
      const [yearString, monthString] =
        value.split("-");

      const year = Number(yearString);
      const month = Number(monthString);

      setCurrentPage(1);
      setSearchQuery("");
      setBloodTypeFilter("all");
      setDriveSearchQuery("");

      setRefreshing(true);
      await loadData(month, year);
      setRefreshing(false);
    }
  };

  /* =========================================================
     RESET PAGINATION WHEN FILTERS CHANGE
  ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    bloodTypeFilter,
  ]);

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);

    if (selectedMonthFilter === "all") {
      await loadData();
    } else if (data) {
      await loadData(
        data.selectedMonth,
        data.selectedYear
      );
    } else {
      await loadData();
    }

    setRefreshing(false);
  };

  /* =========================================================
     EXPORT CSV
  ========================================================= */

  const handleExport = () => {
    if (!data) return;

    const exportData =
      data.allDonations?.map((d) => ({
        id: d.id,
        donor: d.donorName,
        bloodType: d.bloodType,
        units: d.units,
        drive: d.driveName || "N/A",
        hospital:
          d.hospitalName || "N/A",
        createdAt:
          new Date(
            d.createdAt
          ).toLocaleDateString(),
      })) || [];

    if (exportData.length === 0)
      return;

    const headers = Object.keys(
      exportData[0]
    );

    const csv = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) =>
            JSON.stringify(
              row[
                header as keyof typeof row
              ] ?? ""
            )
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download = `donations-${data.selectedYear}-${String(
      data.selectedMonth
    ).padStart(2, "0")}.csv`;

    a.click();

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     DRIVE STATUS
  ========================================================= */

  const getDriveStatusColor = (
    status: string
  ) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400";

      case "ongoing":
        return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";

      case "completed":
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400";

      case "cancelled":
        return "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400";

      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400";
    }
  };

  const getDriveStatusIcon = (
    status: string
  ) => {
    switch (status) {
      case "upcoming":
        return (
          <Clock className="w-3 h-3" />
        );

      case "ongoing":
      case "completed":
        return (
          <CheckCircle className="w-3 h-3" />
        );

      case "cancelled":
        return (
          <AlertCircle className="w-3 h-3" />
        );

      default:
        return null;
    }
  };

  /* =========================================================
     FILTER DONATIONS
  ========================================================= */

  const filteredDonations = useMemo(() => {
    if (!data?.allDonations)
      return [];

    const search =
      searchQuery.toLowerCase();

    return data.allDonations.filter(
      (d) => {
        const matchesSearch =
          d.donorName
            ?.toLowerCase()
            .includes(search) ||
          d.hospitalName
            ?.toLowerCase()
            .includes(search) ||
          d.driveName
            ?.toLowerCase()
            .includes(search);

        const matchesBloodType =
          bloodTypeFilter === "all" ||
          d.bloodType ===
            bloodTypeFilter;

        return (
          matchesSearch &&
          matchesBloodType
        );
      }
    );
  }, [
    data?.allDonations,
    searchQuery,
    bloodTypeFilter,
  ]);

  const totalPages = Math.ceil(
    filteredDonations.length /
      ITEMS_PER_PAGE
  );

  const paginatedDonations =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredDonations.slice(
        start,
        start + ITEMS_PER_PAGE
      );
    }, [
      filteredDonations,
      currentPage,
    ]);

  /* =========================================================
     FILTER BLOOD DRIVES
  ========================================================= */

  const filteredDrives = useMemo(() => {
    if (!data?.byDrive) return [];

    const search = driveSearchQuery.toLowerCase();

    return data.byDrive.filter((drive) => {
      const matchesSearch =
        drive.name?.toLowerCase().includes(search) ||
        drive.location?.toLowerCase().includes(search);

      return matchesSearch;
    });
  }, [data?.byDrive, driveSearchQuery]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />

          <p className="text-zinc-500 dark:text-zinc-400">
            Loading donations...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />

          <p className="text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState message="No donation data available" />
    );
  }

  /* =========================================================
     CONTENT
  ========================================================= */

  const renderContent = () => {
    switch (activeSubTab) {
      /* =====================================================
         SUMMARY
      ===================================================== */

      case "summary":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Donations"
                value={
                  data.totalDonations
                }
                hint={`${
                  data.growth >= 0
                    ? "↑"
                    : "↓"
                } ${Math.abs(
                  data.growth
                )}% vs previous month`}
                hintColor={
                  data.growth >= 0
                    ? "emerald"
                    : "red"
                }
              />

              <StatCard
                label="This Month"
                value={
                  data.thisMonthCount
                }
                valueColor="default"
                hint={`${data.monthLabel} donations`}
              />

              <StatCard
                label="Avg. Daily"
                value={data.averageDaily.toFixed(
                  1
                )}
                valueColor="blue"
                hint={`Daily average for ${data.monthLabel}`}
              />

              <StatCard
                label="Total Units"
                value={data.totalUnits}
                valueColor="emerald"
                hint={`${data.monthLabel} blood units collected`}
              />
            </div>

            {/* =================================================
                RECENT DONATIONS
            ================================================= */}

            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle>
                      Recent Donations
                    </CardTitle>

                    <CardDescription>
                      Latest blood donations from all hospitals
                    </CardDescription>
                  </div>

                  <button
                    onClick={() =>
                      setShowAllDonations(
                        !showAllDonations
                      )
                    }
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                  >
                    {showAllDonations
                      ? "Show Less"
                      : "View All Donations"}
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                {!showAllDonations ? (
                  <div className="space-y-4">
                    {data.recentDonations
                      ?.slice(0, 5)
                      .map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-white truncate">
                              {d.donorName}
                            </p>

                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              Blood Type:{" "}
                              {d.bloodType}
                            </p>

                            {d.hospitalName && (
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                                Hospital:{" "}
                                {
                                  d.hospitalName
                                }
                              </p>
                            )}

                            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                              Blood Drive:{" "}
                              {d.driveName ||
                                "N/A"}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                              {d.units} unit(s)
                            </p>

                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {new Date(
                                d.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}

                    {(!data.recentDonations ||
                      data
                        .recentDonations
                        .length ===
                        0) && (
                      <EmptyState message={`No donations found for ${data.monthLabel}`} />
                    )}
                  </div>
                ) : (
                  <div>
                    {/* SEARCH / FILTER */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />

                        <input
                          type="text"
                          placeholder="Search by donor, hospital, or drive..."
                          value={searchQuery}
                          onChange={(e) =>
                            setSearchQuery(
                              e.target.value
                            )
                          }
                          className="w-full pl-10 pr-9 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                        />

                        {searchQuery && (
                          <button
                            onClick={() =>
                              setSearchQuery(
                                ""
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <select
                        value={
                          bloodTypeFilter
                        }
                        onChange={(e) =>
                          setBloodTypeFilter(
                            e.target.value
                          )
                        }
                        className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      >
                        <option value="all">
                          All Blood Types
                        </option>

                        <option value="A+">
                          A+
                        </option>
                        <option value="A-">
                          A-
                        </option>
                        <option value="B+">
                          B+
                        </option>
                        <option value="B-">
                          B-
                        </option>
                        <option value="AB+">
                          AB+
                        </option>
                        <option value="AB-">
                          AB-
                        </option>
                        <option value="O+">
                          O+
                        </option>
                        <option value="O-">
                          O-
                        </option>
                      </select>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Donor
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Blood Type
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Units
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Hospital
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Blood Drive
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                          {paginatedDonations.length ===
                          0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center"
                              >
                                <EmptyState message="No donations found" />
                              </td>
                            </tr>
                          ) : (
                            paginatedDonations.map(
                              (donation) => (
                                <tr
                                  key={
                                    donation.id
                                  }
                                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-zinc-900 dark:text-white text-sm">
                                      {
                                        donation.donorName
                                      }
                                    </p>

                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                      {
                                        donation.donorEmail
                                      }
                                    </p>
                                  </td>

                                  <td className="px-4 py-3">
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                                      style={{
                                        backgroundColor:
                                          BLOOD_TYPE_COLORS[
                                            donation
                                              .bloodType
                                          ] ||
                                          "#ef4444",
                                      }}
                                    >
                                      {
                                        donation.bloodType
                                      }
                                    </span>
                                  </td>

                                  <td className="px-4 py-3">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                      {
                                        donation.units
                                      }
                                    </span>
                                  </td>

                                  <td className="px-4 py-3">
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                      {donation.hospitalName ||
                                        "N/A"}
                                    </p>
                                  </td>

                                  <td className="px-4 py-3">
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                      {donation.driveName ||
                                        "N/A"}
                                    </p>
                                  </td>

                                  <td className="px-4 py-3">
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                      {new Date(
                                        donation.createdAt
                                      ).toLocaleDateString()}
                                    </p>
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {filteredDonations.length >
                      0 && (
                      <div className="mt-4">
                        <Pagination
                          currentPage={
                            currentPage
                          }
                          totalPages={
                            totalPages
                          }
                          onPageChange={
                            setCurrentPage
                          }
                          totalItems={
                            filteredDonations.length
                          }
                          itemsPerPage={
                            ITEMS_PER_PAGE
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />

                  {data.growth >= 0
                    ? "+"
                    : ""}
                  {data.growth}% from
                  previous month
                </div>

                <div className="text-muted-foreground">
                  {data.thisMonthCount}{" "}
                  donations in{" "}
                  {data.monthLabel}
                  {showAllDonations &&
                    ` · ${filteredDonations.length} shown`}
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      /* =====================================================
         BY BLOOD TYPE
      ===================================================== */

      case "by-blood-type": {
        const sortedBloodData =
          BLOOD_TYPE_ORDER.map(
            (type) =>
              data.bloodTypeData.find(
                (item) =>
                  item.type === type
              )
          ).filter(
            (
              item
            ): item is {
              type: string;
              count: number;
              units: number;
            } => item !== undefined
          );

        const totalUnitsForChart =
          sortedBloodData.reduce(
            (sum, item) =>
              sum + item.units,
            0
          );

        const areaChartData =
          sortedBloodData.map(
            (item) => ({
              bloodType: item.type,
              units: item.units,
              count: item.count,
              percentage:
                totalUnitsForChart >
                0
                  ? Math.round(
                      (item.units /
                        totalUnitsForChart) *
                        100
                    )
                  : 0,
            })
          );

        const mostCommon =
          sortedBloodData.length > 0
            ? [
                ...sortedBloodData,
              ].sort(
                (a, b) =>
                  b.units - a.units
              )[0]
            : null;

        return (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>
                  Blood Type Distribution
                </CardTitle>

                <CardDescription>
                  {data.monthLabel} · Total
                  units:{" "}
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {
                      totalUnitsForChart
                    }
                  </span>

                  {mostCommon && (
                    <span className="ml-2">
                      · Most common:{" "}
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {mostCommon.type}
                      </span>{" "}
                      ({mostCommon.units}{" "}
                      units)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                  config={
                    bloodTypeAreaConfig
                  }
                  className="aspect-auto h-[350px] w-full"
                >
                  <AreaChart
                    accessibilityLayer
                    data={
                      areaChartData
                    }
                    margin={{
                      top: 15,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="bloodTypeAreaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ef4444"
                          stopOpacity={
                            0.45
                          }
                        />

                        <stop
                          offset="50%"
                          stopColor="#ef4444"
                          stopOpacity={
                            0.18
                          }
                        />

                        <stop
                          offset="100%"
                          stopColor="#ef4444"
                          stopOpacity={
                            0.02
                          }
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-800"
                    />

                    <XAxis
                      dataKey="bloodType"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      allowDecimals={false}
                      width={40}
                    />

                    <ChartTooltip
                      cursor={{
                        stroke: "#ef4444",
                        strokeWidth: 1,
                        strokeDasharray:
                          "4 4",
                      }}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          labelFormatter={(label) =>
                            `Blood Type: ${label}`
                          }
                          formatter={(value) => [
                            `${value} units`,
                            "Units",
                          ]}
                        />
                      }
                    />

                    <Area
                      type="monotone"
                      dataKey="units"
                      name="Units"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fill="url(#bloodTypeAreaGradient)"
                      fillOpacity={1}
                      dot={{
                        r: 4,
                        fill: "#ef4444",
                        stroke:
                          "#ffffff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 7,
                        fill: "#ef4444",
                        stroke:
                          "#ffffff",
                        strokeWidth: 3,
                      }}
                      animationDuration={
                        800
                      }
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>

              <CardFooter className="flex-col items-start gap-3 text-sm">
                {mostCommon && (
                  <div className="flex items-center gap-2 font-medium">
                    <Droplet className="h-4 w-4 text-red-500" />

                    {mostCommon.type} is
                    the most common
                    blood type with{" "}
                    {mostCommon.units}{" "}
                    units
                  </div>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
                  {areaChartData.map(
                    ({
                      bloodType,
                      units,
                    }) => (
                      <span
                        key={
                          bloodType
                        }
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              BLOOD_TYPE_COLORS[
                                bloodType
                              ] ||
                              "#ef4444",
                          }}
                        />

                        {bloodType}:{" "}
                        {units} units
                      </span>
                    )
                  )}
                </div>
              </CardFooter>
            </Card>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {areaChartData.map(
                ({
                  bloodType,
                  count,
                  units,
                  percentage,
                }) => (
                  <Card
                    key={
                      bloodType
                    }
                    className="text-center"
                  >
                    <CardContent className="pt-6">
                      <div
                        className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                        style={{
                          backgroundColor:
                            BLOOD_TYPE_COLORS[
                              bloodType
                            ] ||
                            "#ef4444",
                        }}
                      >
                        {bloodType}
                      </div>

                      <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                        {units}
                      </p>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {count} donation
                        {count !== 1
                          ? "s"
                          : ""}
                      </p>

                      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        {percentage}% of
                        total
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>
        );
      }

      /* =====================================================
         BY BLOOD DRIVE (Full View)
      ===================================================== */

      case "by-blood-drive":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                Blood Drive Statistics
              </CardTitle>

              <CardDescription>
                All blood drives in {data.monthLabel}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* ✅ Search for blood drives */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search blood drives by name or location..."
                  value={driveSearchQuery}
                  onChange={(e) => setDriveSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                />
                {driveSearchQuery && (
                  <button
                    onClick={() => setDriveSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {filteredDrives.length === 0 ? (
                  <EmptyState
                    message={`No blood drives found for ${data.monthLabel}`}
                  />
                ) : (
                  filteredDrives.map(
                    (drive) => {
                      const progress =
                        drive.targetDonors >
                        0
                          ? Math.round(
                              (drive.count /
                                drive.targetDonors) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          key={
                            drive.id
                          }
                          className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="font-semibold text-zinc-900 dark:text-white">
                                  {
                                    drive.name
                                  }
                                </p>

                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getDriveStatusColor(
                                    drive.status
                                  )}`}
                                >
                                  {getDriveStatusIcon(
                                    drive.status
                                  )}

                                  {drive.status
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase() +
                                    drive.status.slice(
                                      1
                                    )}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />

                                  {new Date(
                                    drive.date
                                  ).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month:
                                        "long",
                                      day: "numeric",
                                    }
                                  )}
                                </span>

                                {drive.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />

                                    {
                                      drive.location
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60">
                            <div className="text-center">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                                <Target className="w-3 h-3" />
                                Target
                              </p>

                              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                {
                                  drive.targetDonors
                                }
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center justify-center gap-1">
                                <Users className="w-3 h-3" />
                                Registered
                              </p>

                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {
                                  drive.count
                                }
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center justify-center gap-1">
                                <Droplet className="w-3 h-3" />
                                Completed
                              </p>

                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {
                                  drive.units
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                              <span>
                                Progress
                              </span>

                              <span>
                                {
                                  progress
                                }
                                %
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progress >=
                                  100
                                    ? "bg-emerald-500"
                                    : progress >=
                                      75
                                    ? "bg-blue-500"
                                    : progress >=
                                      50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    progress,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </CardContent>

            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Users className="h-4 w-4 text-blue-500" />

                Total registered donors:{" "}
                {filteredDrives.reduce(
                  (sum, drive) =>
                    sum + drive.count,
                  0
                )}
              </div>

              <div className="text-muted-foreground">
                Across{" "}
                {filteredDrives.length}{" "}
                blood drive
                {filteredDrives.length !==
                1
                  ? "s"
                  : ""}{" "}
                in {data.monthLabel}
              </div>
            </CardFooter>
          </Card>
        );

      /* =====================================================
         TRENDS
      ===================================================== */

      case "trends":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                Donation Trends
              </CardTitle>

              <CardDescription>
                Last 6 months performance
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="h-[300px] w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={data.trend}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.2}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                  />

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        labelFormatter={(label) =>
                          `Month: ${label}`
                        }
                      />
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Donations"
                    stroke="var(--color-donations)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="units"
                    name="Units"
                    stroke="var(--color-units)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>

            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <TrendingUp className="h-4 w-4 text-emerald-500" />

                {data.growth >= 0
                  ? "+"
                  : ""}
                {data.growth}% change from
                previous month
              </div>

              <div className="text-muted-foreground">
                Average{" "}
                {data.trend.length > 0
                  ? (
                      data.trend.reduce(
                        (sum, trend) =>
                          sum +
                          trend.count,
                        0
                      ) /
                      data.trend.length
                    ).toFixed(1)
                  : "0.0"}{" "}
                donations per month
              </div>
            </CardFooter>
          </Card>
        );

      default:
        return null;
    }
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-6">
      <ReportHeader
        icon={Droplet}
        title="Donation Reports"
        subtitle="Analyze donation data and trends"
        onRefresh={handleRefresh}
        onExport={handleExport}
        refreshing={refreshing}
        showPrint={true}
      />

      {/* ✅ MONTH SELECTOR - Now at the top with "All Months" option */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70">
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Select Month
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Choose a month to view donation reports
          </p>
        </div>

        <select
          value={selectedMonthFilter}
          onChange={(e) =>
            handleMonthChange(
              e.target.value
            )
          }
          disabled={refreshing}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition min-w-[180px]"
        >
          {/* ✅ "All Months" option */}
          <option value="all">All Months</option>

          {data.availableMonths.length > 0 ? (
            data.availableMonths.map(
              (month) => (
                <option
                  key={`${month.year}-${month.month}`}
                  value={`${month.year}-${String(
                    month.month
                  ).padStart(
                    2,
                    "0"
                  )}`}
                >
                  {month.label}
                </option>
              )
            )
          ) : (
            <option value={`${data.selectedYear}-${String(data.selectedMonth).padStart(2, "0")}`}>
              {data.monthLabel || "Current Month"}
            </option>
          )}
        </select>
      </div>

      <SubTabBar
        tabs={TABS}
        active={activeSubTab}
        onChange={setActiveSubTab}
      />

      {renderContent()}
    </div>
  );
}