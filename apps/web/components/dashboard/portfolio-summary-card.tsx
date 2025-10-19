/**
 * Portfolio Summary Card - Shows total portfolio value and changes
 */

"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioSummaryCardProps {
  totalValue?: number;
  change24h?: number;
  change7d?: number;
  tokenCount?: number;
  isLoading?: boolean;
}

export function PortfolioSummaryCard({
  totalValue,
  change24h,
  change7d,
  tokenCount,
  isLoading = false,
}: PortfolioSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Value</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Value */}
        <div>
          <div className="text-4xl font-bold tracking-tight">
            {totalValue !== undefined ? formatCurrency(totalValue) : "$0.00"}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Total portfolio value
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* 24h Change */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">24h Change</span>
            <div className="flex items-center gap-1">
              {change24h !== undefined && change24h >= 0 ? (
                <TrendingUpIcon className="size-4 text-green-500" />
              ) : (
                <TrendingDownIcon className="size-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  change24h !== undefined && change24h >= 0
                    ? "text-green-500"
                    : "text-red-500"
                )}
              >
                {change24h !== undefined ? formatPercentage(change24h) : "0.00%"}
              </span>
            </div>
          </div>

          {/* 7d Change */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">7d Change</span>
            <div className="flex items-center gap-1">
              {change7d !== undefined && change7d >= 0 ? (
                <TrendingUpIcon className="size-4 text-green-500" />
              ) : (
                <TrendingDownIcon className="size-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  change7d !== undefined && change7d >= 0
                    ? "text-green-500"
                    : "text-red-500"
                )}
              >
                {change7d !== undefined ? formatPercentage(change7d) : "0.00%"}
              </span>
            </div>
          </div>

          {/* Token Count */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Assets</span>
            <div className="text-sm font-semibold">
              {tokenCount !== undefined ? tokenCount : 0} tokens
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

