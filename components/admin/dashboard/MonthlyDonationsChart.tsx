// components/admin/dashboard/MonthlyDonationsChart.tsx
'use client';

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface MonthlyDonationsChartProps {
  data: number[];
  className?: string;
}

// ✅ FIX: Generate month labels dynamically based on current date
const getMonthLabels = () => {
  const labels = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    labels.push(date.toLocaleString('default', { month: 'short' }));
  }
  return labels;
};

const chartConfig = {
  donations: {
    label: 'Donations',
    color: '#ef4444',
  },
} satisfies Record<string, { label: string; color: string }>;

export function MonthlyDonationsChart({ data, className }: MonthlyDonationsChartProps) {
  // ✅ FIX: Get dynamic month labels
  const monthLabels = getMonthLabels();
  
  // Transform data for Recharts
  const chartData = data.map((value, index) => ({
    month: monthLabels[index] || `Month ${index + 1}`,
    donations: value,
    monthIndex: index,
  }));

  // Calculate stats
  const totalDonations = data.reduce((sum, val) => sum + val, 0);
  const averageDonations = totalDonations / data.length;
  const maxDonations = Math.max(...data);
  const maxMonth = monthLabels[data.indexOf(maxDonations)];
  const minDonations = Math.min(...data);
  const minMonth = monthLabels[data.indexOf(minDonations)];
  
  // Calculate trend
  const lastMonth = data[data.length - 1] || 0;
  const previousMonth = data[data.length - 2] || 0;
  const trend = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';

  // Check if all data is zero
  const hasData = data.some(v => v > 0);

  if (!data || data.length === 0 || !hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Monthly Donations
              </CardTitle>
              <CardDescription>No donation data available</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <div className="text-4xl mb-2">📊</div>
            <p>No donation data available</p>
            <p className="text-sm text-zinc-400">Donations will appear here once recorded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Monthly Donations
            </CardTitle>
            <CardDescription>
              Total: <span className="font-bold text-zinc-900 dark:text-white">{totalDonations}</span> donations
              {maxDonations > 0 && (
                <span className="ml-2">
                  · Highest: <span className="font-medium text-zinc-900 dark:text-white">{maxMonth}</span> ({maxDonations})
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="text-sm font-bold">{Math.round(averageDonations)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Trend</p>
              <div className="flex items-center gap-1">
                {trendDirection === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {trendDirection === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                {trendDirection === 'flat' && <Minus className="h-4 w-4 text-muted-foreground" />}
                <span className={`text-sm font-bold ${
                  trendDirection === 'up' ? 'text-emerald-500' : 
                  trendDirection === 'down' ? 'text-red-500' : 
                  'text-muted-foreground'
                }`}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-zinc-200 dark:stroke-zinc-800"
            />
            
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="dark:text-zinc-400"
            />
            
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              width={40}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="dark:text-zinc-400"
            />
            
            <ChartTooltip
              cursor={{
                stroke: '#ef4444',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(label) => `Month: ${label}`}
                  formatter={(value) => [`${value} donations`, 'Donations']}
                />
              }
            />
            
            <Legend
              verticalAlign="top"
              height={36}
              content={({ payload }) => (
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Donations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400/30 border-2 border-blue-400" />
                    <span>Average: {Math.round(averageDonations)}</span>
                  </div>
                </div>
              )}
            />
            
            <Line
              type="monotone"
              dataKey="donations"
              name="Donations"
              stroke="var(--color-donations)"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: '#ef4444',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: '#ef4444',
                stroke: '#ffffff',
                strokeWidth: 3,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <TrendingUp className={`h-4 w-4 ${
            trendDirection === 'up' ? 'text-emerald-500' : 
            trendDirection === 'down' ? 'text-red-500' : 
            'text-muted-foreground'
          }`} />
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% change from previous month
        </div>
        <div className="text-muted-foreground">
          Average {Math.round(averageDonations)} donations per month
          {maxDonations > 0 && ` · Highest in ${maxMonth} (${maxDonations})`}
        </div>
      </CardFooter>
    </Card>
  );
}