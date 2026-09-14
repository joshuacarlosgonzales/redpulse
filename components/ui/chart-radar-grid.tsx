// components/ui/chart-radar-grid.tsx
"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ChartRadarGridCircleProps {
  data: Array<{
    bloodType: string;
    units: number;
    status: string;
  }>;
}

export function ChartRadarGridCircle({ data }: ChartRadarGridCircleProps) {
  const chartData = data.map((item) => ({
    bloodType: item.bloodType,
    units: item.units,
  }))

  const chartConfig = {
    units: {
      label: "Units",
      color: "#ef4444",
    },
  } satisfies ChartConfig

  // Calculate total units
  const totalUnits = data.reduce((sum, item) => sum + item.units, 0);
  
  // Get status counts
  const criticalCount = data.filter(item => item.status === 'critical').length;
  const lowCount = data.filter(item => item.status === 'low').length;
  const sufficientCount = data.filter(item => item.status === 'sufficient').length;
  const outOfStockCount = data.filter(item => item.status === 'out of stock').length;

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Blood Inventory Overview</CardTitle>
        <CardDescription>
          Distribution of blood units by type
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="bloodType" />
            <Radar
              dataKey="units"
              fill="var(--color-units)"
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total Units: {totalUnits}
          {sufficientCount > 0 && ` · ✅ ${sufficientCount} sufficient`}
          {lowCount > 0 && ` · ⚠️ ${lowCount} low`}
          {criticalCount > 0 && ` · 🚨 ${criticalCount} critical`}
          {outOfStockCount > 0 && ` · ❌ ${outOfStockCount} out of stock`}
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          Blood type distribution across all hospitals
        </div>
      </CardFooter>
    </Card>
  )
}