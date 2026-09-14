// components/ui/chart-radial-label.tsx
"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, RadialBar, RadialBarChart } from "recharts"

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

interface ChartRadialLabelProps {
  totalDrives: number;
  registered: number;
  attended: number;
  ongoing: number;
}

export function ChartRadialLabel({ totalDrives, registered, attended, ongoing }: ChartRadialLabelProps) {
  const chartData = [
    { name: "Total Drives", value: totalDrives, fill: "#3b82f6" },
    { name: "Registered", value: registered, fill: "#8b5cf6" },
    { name: "Attended", value: attended, fill: "#10b981" },
    { name: "Ongoing", value: ongoing, fill: "#22c55e" },
  ]

  const chartConfig = {
    value: {
      label: "Count",
    },
    "Total Drives": {
      label: "Total Drives",
      color: "#3b82f6",
    },
    Registered: {
      label: "Registered",
      color: "#8b5cf6",
    },
    Attended: {
      label: "Attended",
      color: "#10b981",
    },
    Ongoing: {
      label: "Ongoing",
      color: "#22c55e",
    },
  } satisfies ChartConfig

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Blood Drive Stats</CardTitle>
        <CardDescription>Overview of all blood drives</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={-90}
            endAngle={380}
            innerRadius={30}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <RadialBar dataKey="value" background>
              <LabelList
                position="insideStart"
                dataKey="name"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total: {totalDrives} drives · {registered} registered · {attended} attended · {ongoing} ongoing
        </div>
        <div className="leading-none text-muted-foreground">
          Blood drive performance overview
        </div>
      </CardFooter>
    </Card>
  )
}