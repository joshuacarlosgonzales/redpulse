// app/admin/reports/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Droplet,
  Hospital,
  User,
  Loader2,
  Users,
  AlertCircle,
  Server,
  GitCommitVertical,
} from "lucide-react";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
} from "recharts";

import {
  ReportHeader,
  SubTabBar,
  StatCard,
  SubTabDef,
  EmptyState,
} from "@/components/admin/reports/ReportControls";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useRouter } from "next/navigation";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

type SubTab =
  | "overview"
  | "donation-trends"
  | "request-trends"
  | "inventory-overview"
  | "activity";

const TABS: SubTabDef<SubTab>[] = [
  {
    key: "overview",
    label: "Overview",
    icon: Server,
  },
  {
    key: "donation-trends",
    label: "Donation Trends",
    icon: TrendingUp,
  },
  {
    key: "request-trends",
    label: "Request Trends",
    icon: TrendingDown,
  },
  {
    key: "inventory-overview",
    label: "Inventory Overview",
    icon: Droplet,
  },
  {
    key: "activity",
    label: "Activity",
    icon: Users,
  },
];

interface AnalyticsData {
  totalDonors: number;
  totalHospitals: number;
  totalDonations: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  fulfillmentRate: number;
  totalInventoryUnits: number;

  donationBloodTypes: {
    type: string;
    units: number;
    count: number;
  }[];

  requestStatuses: {
    status: string;
    count: number;
  }[];

  donationTrend: {
    label: string;
    count: number;
    units: number;
  }[];

  requestTrend: {
    label: string;
    count: number;
  }[];

  recentDonations: any[];
  recentRequests: any[];
}

/**
 * ============================================================
 * DONATION LINE CHART CONFIG
 * ============================================================
 */

const donationTrendChartConfig = {
  count: {
    label: "Donations",
    color: "#10b981",
  },
  units: {
    label: "Blood Units",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

/**
 * ============================================================
 * INVENTORY RADAR CHART CONFIG
 * ============================================================
 */

const inventoryRadarChartConfig = {
  units: {
    label: "Blood Units",
    color: "#ef4444",
  },
  count: {
    label: "Donations",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

/**
 * ============================================================
 * REQUEST TREND INTERACTIVE LINE CHART CONFIG
 * ============================================================
 */

const requestTrendChartConfig = {
  count: {
    label: "Requests",
    color: "#f59e0b",
  },
  cumulative: {
    label: "Cumulative Requests",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function AdminReportsAnalyticsPage() {
  const router = useRouter();

  const [activeSubTab, setActiveSubTab] =
    useState<SubTab>("overview");

  const [data, setData] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [activeRequestChart, setActiveRequestChart] =
    useState<keyof typeof requestTrendChartConfig>("count");

  /**
   * ============================================================
   * LOAD ANALYTICS DATA
   * ============================================================
   */

  const loadData = async () => {
    try {
      setError(null);

      const token =
        localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(
        "/api/admin/reports/analytics",
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
          "Failed to fetch analytics data"
        );
      }

      const result =
        await response.json();

      setData(result.data);
    } catch (err) {
      console.error(
        "Error loading analytics:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load analytics"
      );
    }
  };

  /**
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    loadData().finally(() => {
      setLoading(false);
    });
  }, []);

  /**
   * ============================================================
   * REFRESH
   * ============================================================
   */

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadData();

    setRefreshing(false);
  };

  /**
   * ============================================================
   * EXPORT
   * ============================================================
   */

  const handleExport = () => {
    if (!data) return;

    const exportData = [
      {
        totalDonors:
          data.totalDonors,

        totalHospitals:
          data.totalHospitals,

        totalRequests:
          data.totalRequests,

        totalDonations:
          data.totalDonations,

        pendingRequests:
          data.pendingRequests,

        fulfillmentRate:
          `${data.fulfillmentRate}%`,

        totalInventoryUnits:
          data.totalInventoryUnits,

        generatedAt:
          new Date().toISOString(),
      },
    ];

    const headers =
      Object.keys(exportData[0]);

    const csv = [
      headers.join(","),

      ...exportData.map((row) =>
        headers
          .map((h) =>
            JSON.stringify(
              row[
                h as keyof typeof row
              ] || ""
            )
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `analytics-summary-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    a.click();

    URL.revokeObjectURL(url);
  };

  /**
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-red-600" />

          <p className="text-zinc-500 dark:text-zinc-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  /**
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />

          <p className="text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            onClick={handleRefresh}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /**
   * ============================================================
   * EMPTY
   * ============================================================
   */

  if (!data) {
    return (
      <EmptyState message="No analytics data available" />
    );
  }

  /**
   * ============================================================
   * CONTENT
   * ============================================================
   */

  const renderContent = () => {
    switch (activeSubTab) {
      /**
       * ========================================================
       * OVERVIEW
       * ========================================================
       */

      case "overview":
        return (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Donors"
                value={data.totalDonors.toLocaleString()}
                hint="Active donors"
                hintColor="emerald"
              />

              <StatCard
                label="Total Hospitals"
                value={data.totalHospitals}
                hint="Active hospitals"
                hintColor="emerald"
              />

              <StatCard
                label="Blood Units Available"
                value={data.totalInventoryUnits}
                valueColor="emerald"
                hint="Across all hospitals"
              />

              <StatCard
                label="Fulfillment Rate"
                value={`${data.fulfillmentRate}%`}
                valueColor="blue"
                hint="Requests approved or completed"
              />
            </div>

            {/* Key Metrics + Blood Types */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Key Metrics */}
              <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Key Metrics
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Total Donations
                    </span>

                    <span className="text-lg font-bold text-zinc-900 dark:text-white">
                      {data.totalDonations}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Total Requests
                    </span>

                    <span className="text-lg font-bold text-emerald-600">
                      {data.totalRequests}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Pending Requests
                    </span>

                    <span className="text-lg font-bold text-yellow-600">
                      {data.pendingRequests}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Fulfillment Rate
                    </span>

                    <span className="text-lg font-bold text-blue-600">
                      {data.fulfillmentRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Blood Types */}
              <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Blood Type Distribution
                </h3>

                <div className="space-y-3">
                  {data.donationBloodTypes.map(
                    ({ type, units }) => {
                      const max =
                        Math.max(
                          ...data.donationBloodTypes.map(
                            (b) => b.units
                          ),
                          1
                        );

                      return (
                        <div
                          key={type}
                          className="flex items-center gap-3"
                        >
                          <span className="w-12 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {type}
                          </span>

                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <div
                              className="h-full rounded-full bg-red-500 transition-all duration-500"
                              style={{
                                width: `${
                                  (units /
                                    max) *
                                  100
                                }%`,
                              }}
                            />
                          </div>

                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            {units}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      /**
       * ========================================================
       * DONATION TRENDS
       *
       * MULTIPLE LINE CHART
       * ========================================================
       */

      case "donation-trends": {
        const donationTrend =
          data.donationTrend || [];

        const totalSixMonthDonations =
          donationTrend.reduce(
            (sum, item) =>
              sum + item.count,
            0
          );

        const totalSixMonthUnits =
          donationTrend.reduce(
            (sum, item) =>
              sum + item.units,
            0
          );

        const averageDonations =
          donationTrend.length > 0
            ? totalSixMonthDonations /
              donationTrend.length
            : 0;

        const donationsPerHospital =
          data.totalHospitals > 0
            ? data.totalDonations /
              data.totalHospitals
            : 0;

        return (
          <div className="space-y-6">
            {/* =================================================
                CHART
            ================================================== */}

            <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
              {/* Header */}
              <div className="p-6 pb-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Donation Trends
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Donations and blood units collected over the last 6 months
                    </p>
                  </div>

                  <div className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/30">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />

                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Donation Activity
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="px-2 pb-6 pt-6 sm:px-6">
                <ChartContainer
                  config={
                    donationTrendChartConfig
                  }
                  className="h-[380px] w-full"
                >
                  <LineChart
                    accessibilityLayer
                    data={donationTrend}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 5,
                      bottom: 10,
                    }}
                  >
                    {/* Grid */}
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-800"
                    />

                    {/* X Axis */}
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{
                        fontSize: 12,
                      }}
                      tickFormatter={(
                        value
                      ) =>
                        String(
                          value
                        ).slice(0, 3)
                      }
                    />

                    {/* Y Axis */}
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={40}
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    {/* Tooltip */}
                    <ChartTooltip
                      cursor={{
                        stroke:
                          "rgba(156, 163, 175, 0.4)",
                        strokeWidth: 1,
                        strokeDasharray:
                          "4 4",
                      }}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          labelFormatter={(
                            label
                          ) =>
                            `Month: ${label}`
                          }
                        />
                      }
                    />

                    {/* Donations Line */}
                    <Line
                      dataKey="count"
                      name="Donations"
                      type="monotone"
                      stroke="var(--color-count)"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "var(--color-count)",
                        stroke:
                          "#ffffff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 7,
                        fill:
                          "var(--color-count)",
                        stroke:
                          "#ffffff",
                        strokeWidth: 3,
                      }}
                    />

                    {/* Units Line */}
                    <Line
                      dataKey="units"
                      name="Blood Units"
                      type="monotone"
                      stroke="var(--color-units)"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "var(--color-units)",
                        stroke:
                          "#ffffff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 7,
                        fill:
                          "var(--color-units)",
                        stroke:
                          "#ffffff",
                        strokeWidth: 3,
                      }}
                    />

                    {/* Legend */}
                    <ChartLegend
                      content={
                        <ChartLegendContent />
                      }
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>

            {/* =================================================
                STATISTICS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Total Donations */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Total Donations
                    </p>

                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {totalSixMonthDonations.toLocaleString()}
                    </p>

                    <p className="mt-1 text-xs text-emerald-500 dark:text-emerald-400">
                      Last 6 months
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                    <Droplet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Average */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Monthly Average
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {averageDonations.toFixed(
                        1
                      )}
                    </p>

                    <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                      donations / month
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Units */}
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5 dark:border-purple-900/30 dark:bg-purple-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Blood Units
                    </p>

                    <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {totalSixMonthUnits.toLocaleString()}
                    </p>

                    <p className="mt-1 text-xs text-purple-500 dark:text-purple-400">
                      Collected in 6 months
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
                    <Droplet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Average */}
            <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Donations per Hospital
                  </p>

                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                    {donationsPerHospital.toFixed(
                      1
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <Hospital className="h-4 w-4" />
                  Average across hospitals
                </div>
              </div>
            </div>
          </div>
        );
      }

      /**
       * ========================================================
       * REQUEST TRENDS
       * ========================================================
       */

      case "request-trends": {
        const requestTrend = data.requestTrend || [];

        let runningTotal = 0;

        const requestTrendWithCumulative = requestTrend.map(
          (item) => {
            runningTotal += item.count;

            return {
              ...item,
              cumulative: runningTotal,
            };
          }
        );

        const requestChartTotals = {
          count: requestTrend.reduce(
            (sum, item) => sum + item.count,
            0
          ),
          cumulative: runningTotal,
        };

        return (
          <div className="space-y-6">
            {/* =================================================
                INTERACTIVE LINE CHART
            ================================================== */}

            <Card className="overflow-hidden py-0 border-zinc-200/60 dark:border-zinc-800/60 dark:bg-zinc-900">
              <CardHeader className="flex flex-col items-stretch border-b border-zinc-200/60 p-0! dark:border-zinc-800/60 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-0">
                  <CardTitle className="text-zinc-900 dark:text-white">
                    Request Trends
                  </CardTitle>

                  <CardDescription>
                    Blood requests over time — tap a metric to switch views
                  </CardDescription>
                </div>

                <div className="flex">
                  {(
                    ["count", "cumulative"] as const
                  ).map((key) => (
                    <button
                      key={key}
                      data-active={
                        activeRequestChart === key
                      }
                      className="flex flex-1 flex-col justify-center gap-1 border-t border-zinc-200/60 px-6 py-4 text-left even:border-l even:border-zinc-200/60 data-[active=true]:bg-zinc-50 dark:border-zinc-800/60 dark:even:border-zinc-800/60 dark:data-[active=true]:bg-zinc-800/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                      onClick={() =>
                        setActiveRequestChart(key)
                      }
                    >
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {
                          requestTrendChartConfig[key]
                            .label
                        }
                      </span>

                      <span className="text-lg leading-none font-bold text-zinc-900 dark:text-white sm:text-3xl">
                        {requestChartTotals[
                          key
                        ].toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="px-2 py-6 sm:p-6">
                <ChartContainer
                  config={requestTrendChartConfig}
                  className="aspect-auto h-[280px] w-full"
                >
                  <LineChart
                    accessibilityLayer
                    data={requestTrendWithCumulative}
                    margin={{
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid
                      vertical={false}
                      className="stroke-zinc-200 dark:stroke-zinc-800"
                    />

                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className="w-[160px]"
                          indicator="dot"
                          labelFormatter={(label) =>
                            `Period: ${label}`
                          }
                        />
                      }
                    />

                    <Line
                      dataKey={activeRequestChart}
                      type="natural"
                      stroke={`var(--color-${activeRequestChart})`}
                      strokeWidth={2.5}
                      dot={({ cx, cy, payload }) => {
                        if (cx == null || cy == null) {
                          return null;
                        }

                        const r = 20;

                        return (
                          <GitCommitVertical
                            key={payload.label}
                            x={cx - r / 2}
                            y={cy - r / 2}
                            width={r}
                            height={r}
                            fill="#ffffff"
                            stroke={`var(--color-${activeRequestChart})`}
                          />
                        );
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        stroke: "#ffffff",
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* =================================================
                STATISTICS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-yellow-50 p-4 dark:bg-yellow-950/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Request Rate
                </p>

                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {(data.totalRequests / 30).toFixed(
                    1
                  )}
                  /day
                </p>

                <p className="text-xs text-yellow-500">
                  Average requests (30d)
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Pending
                </p>

                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {data.pendingRequests}
                </p>

                <p className="text-xs text-red-500">
                  Awaiting review
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Fulfillment Rate
                </p>

                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.fulfillmentRate}%
                </p>

                <p className="text-xs text-green-500">
                  Requests fulfilled
                </p>
              </div>
            </div>
          </div>
        );
      }

      /**
       * ========================================================
       * INVENTORY OVERVIEW
       * ========================================================
       */

      case "inventory-overview": {
        const bloodTypes = data.donationBloodTypes || [];

        const totalTypes = bloodTypes.length;

        const adequateTypes = bloodTypes.filter(
          (b) => b.units >= 10
        ).length;

        const lowStockTypes = bloodTypes.filter(
          (b) => b.units > 0 && b.units < 10
        ).length;

        const criticalTypes = bloodTypes.filter(
          (b) => b.units === 0
        ).length;

        const totalDonationCount = bloodTypes.reduce(
          (sum, b) => sum + b.count,
          0
        );

        const averageUnitsPerType =
          totalTypes > 0
            ? data.totalInventoryUnits / totalTypes
            : 0;

        const mostStockedType = bloodTypes.reduce(
          (max, b) =>
            !max || b.units > max.units ? b : max,
          null as
            | (typeof bloodTypes)[number]
            | null
        );

        const getStockStatus = (units: number) => {
          if (units === 0) {
            return {
              label: "Critical",
              text: "text-red-600 dark:text-red-400",
              bg: "bg-red-100 dark:bg-red-950/30",
              dot: "bg-red-500",
            };
          }

          if (units < 10) {
            return {
              label: "Low",
              text: "text-yellow-600 dark:text-yellow-400",
              bg: "bg-yellow-100 dark:bg-yellow-950/30",
              dot: "bg-yellow-500",
            };
          }

          return {
            label: "Adequate",
            text: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-950/30",
            dot: "bg-emerald-500",
          };
        };

        return (
          <div className="space-y-6">
            {/* =================================================
                TOP LEVEL STATS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Units"
                value={data.totalInventoryUnits}
                valueColor="emerald"
                hint="Across all blood types"
                hintColor="emerald"
              />

              <StatCard
                label="Blood Types Tracked"
                value={totalTypes}
                hint="Distinct types in system"
              />

              <StatCard
                label="Total Donations Recorded"
                value={totalDonationCount.toLocaleString()}
                valueColor="blue"
                hint="Contributing to current stock"
              />

              <StatCard
                label="Avg Units / Type"
                value={averageUnitsPerType.toFixed(
                  1
                )}
                hint={
                  mostStockedType
                    ? `Highest: ${mostStockedType.type}`
                    : "No data yet"
                }
              />
            </div>

            {/* =================================================
                STOCK STATUS BREAKDOWN
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Adequate Stock"
                value={adequateTypes}
                valueColor="emerald"
                hint="10+ units on hand"
                hintColor="emerald"
              />

              <StatCard
                label="Low Stock Types"
                value={lowStockTypes}
                valueColor="yellow"
                hint="Under 10 units — needs attention"
                hintColor="yellow"
              />

              <StatCard
                label="Critical Types"
                value={criticalTypes}
                valueColor="red"
                hint="No units in stock"
                hintColor="red"
              />
            </div>

            {/* =================================================
                RADAR CHART — SUPPLY VS DEMAND BY BLOOD TYPE
            ================================================== */}

            <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
              <div className="p-6 pb-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Inventory Profile by Blood Type
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Units on hand vs. donations recorded, per blood type
                    </p>
                  </div>

                  <div className="flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 dark:bg-red-950/30">
                    <Droplet className="h-4 w-4 text-red-600 dark:text-red-400" />

                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      Supply Snapshot
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-2 pb-6 pt-4 sm:px-6">
                <ChartContainer
                  config={inventoryRadarChartConfig}
                  className="mx-auto aspect-square max-h-[360px]"
                >
                  <RadarChart data={bloodTypes}>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent indicator="line" />
                      }
                    />

                    <PolarAngleAxis dataKey="type" />

                    <PolarGrid radialLines={false} />

                    <Radar
                      dataKey="units"
                      name="Blood Units"
                      fill="var(--color-units)"
                      fillOpacity={0.15}
                      stroke="var(--color-units)"
                      strokeWidth={2}
                    />

                    <Radar
                      dataKey="count"
                      name="Donations"
                      fill="var(--color-count)"
                      fillOpacity={0}
                      stroke="var(--color-count)"
                      strokeWidth={2}
                    />

                    <ChartLegend
                      content={<ChartLegendContent />}
                    />
                  </RadarChart>
                </ChartContainer>
              </div>
            </div>

            {/* =================================================
                PER-TYPE BREAKDOWN TABLE
            ================================================== */}

            <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Stock by Blood Type
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <th className="py-2 pr-4 font-medium">
                        Type
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        Units
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        Donations
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        Share of Inventory
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {bloodTypes.map(
                      ({ type, units, count }) => {
                        const status =
                          getStockStatus(units);

                        const share =
                          data.totalInventoryUnits > 0
                            ? (
                                (units /
                                  data.totalInventoryUnits) *
                                100
                              ).toFixed(1)
                            : "0.0";

                        return (
                          <tr
                            key={type}
                            className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                          >
                            <td className="py-3 pr-4 font-semibold text-zinc-900 dark:text-white">
                              {type}
                            </td>

                            <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                              {units}
                            </td>

                            <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                              {count}
                            </td>

                            <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                              {share}%
                            </td>

                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                />
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                QUICK GRID
            ================================================== */}

            <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Quick Reference
              </h3>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {bloodTypes.map(({ type, units }) => {
                  const status = getStockStatus(units);

                  return (
                    <div
                      key={type}
                      className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/50"
                    >
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {type}
                      </p>

                      <p className="text-xl font-bold text-zinc-900 dark:text-white">
                        {units}
                      </p>

                      <p
                        className={`mt-1 text-xs font-medium ${status.text}`}
                      >
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      /**
       * ========================================================
       * ACTIVITY
       * ========================================================
       */

      case "activity":
        return (
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Recent Activity
            </h3>

            <div className="space-y-4">
              {/* Requests */}
              {data.recentRequests
                ?.slice(0, 3)
                .map(
                  (req, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/30">
                          <Hospital className="h-5 w-5 text-blue-600" />
                        </div>

                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {req.hospitalName ||
                              "Unknown Hospital"}
                          </p>

                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Blood Type:{" "}
                            {req.bloodType}{" "}
                            ·{" "}
                            {req.quantity ||
                              1}{" "}
                            unit(s)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            req.status ===
                            "pending"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                              : req.status ===
                                "approved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          }`}
                        >
                          {req.status
                            ? req.status
                                .charAt(
                                  0
                                )
                                .toUpperCase() +
                              req.status.slice(
                                1
                              )
                            : "Pending"}
                        </span>

                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {req.createdAt
                            ? new Date(
                                req.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )
                )}

              {/* Donations */}
              {data.recentDonations
                ?.slice(0, 2)
                .map(
                  (
                    donation,
                    index
                  ) => (
                    <div
                      key={`donation-${index}`}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/30">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>

                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {donation.donorName ||
                              "Unknown Donor"}
                          </p>

                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {donation.bloodType}{" "}
                            ·{" "}
                            {donation.units ||
                              1}{" "}
                            unit(s)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm text-emerald-600">
                          Completed
                        </span>

                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {donation.createdAt
                            ? new Date(
                                donation.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )
                )}

              {/* Empty */}
              {(!data.recentRequests ||
                data.recentRequests
                  .length === 0) &&
                (!data.recentDonations ||
                  data.recentDonations
                    .length === 0) && (
                  <EmptyState message="No recent activity" />
                )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /**
   * ============================================================
   * FINAL PAGE
   * ============================================================
   */

  return (
    <div className="space-y-6">
      <ReportHeader
        icon={Activity}
        title="Analytics"
        subtitle="Comprehensive analytics and insights"
        onRefresh={handleRefresh}
        onExport={handleExport}
        refreshing={refreshing}
        showPrint={true}
      />

      <SubTabBar
        tabs={TABS}
        active={activeSubTab}
        onChange={setActiveSubTab}
      />

      {renderContent()}
    </div>
  );
}