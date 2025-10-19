/**
 * Asset Allocation Chart - Pie chart showing portfolio allocation
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface AssetAllocationData {
  symbol: string;
  value: number;
  percentage: number;
}

interface AssetAllocationChartProps {
  data?: AssetAllocationData[];
  isLoading?: boolean;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function AssetAllocationChart({
  data = [],
  isLoading = false,
}: AssetAllocationChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No assets to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take top 5 assets and group rest as "Other"
  const topAssets = data.slice(0, 5);
  const otherAssets = data.slice(5);
  const otherValue = otherAssets.reduce((sum, asset) => sum + asset.value, 0);
  const otherPercentage = otherAssets.reduce((sum, asset) => sum + asset.percentage, 0);

  const chartData = [...topAssets];
  if (otherAssets.length > 0) {
    chartData.push({
      symbol: "Other",
      value: otherValue,
      percentage: otherPercentage,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ symbol, percentage }) =>
                  `${symbol} ${percentage.toFixed(1)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as AssetAllocationData;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold">
                            {data.symbol}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ${data.value.toLocaleString()} ({data.percentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {chartData.map((asset, index) => (
            <div key={asset.symbol} className="flex items-center gap-2">
              <div
                className="size-3 rounded-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs">
                {asset.symbol} ({asset.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

