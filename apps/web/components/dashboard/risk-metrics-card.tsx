/**
 * Risk Metrics Card - Shows portfolio risk analysis
 */

"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, ShieldCheckIcon, AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskMetricsCardProps {
  riskScore?: number;
  diversificationScore?: number;
  volatility?: number;
  isLoading?: boolean;
}

export function RiskMetricsCard({
  riskScore,
  diversificationScore,
  volatility,
  isLoading = false,
}: RiskMetricsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  const getRiskLevel = (score: number): {
    label: string;
    color: string;
    icon: React.ReactNode;
  } => {
    if (score < 30) {
      return {
        label: "Low Risk",
        color: "text-green-500",
        icon: <ShieldCheckIcon className="size-4" />,
      };
    } else if (score < 70) {
      return {
        label: "Medium Risk",
        color: "text-yellow-500",
        icon: <AlertCircleIcon className="size-4" />,
      };
    } else {
      return {
        label: "High Risk",
        color: "text-red-500",
        icon: <AlertTriangleIcon className="size-4" />,
      };
    }
  };

  const getDiversificationLevel = (score: number): string => {
    if (score >= 70) return "Well Diversified";
    if (score >= 40) return "Moderately Diversified";
    return "Concentrated";
  };

  const risk = riskScore !== undefined ? getRiskLevel(riskScore) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Risk</span>
            {risk && (
              <div className={cn("flex items-center gap-1", risk.color)}>
                {risk.icon}
                <span className="text-sm font-semibold">{risk.label}</span>
              </div>
            )}
          </div>
          <Progress
            value={riskScore || 0}
            className="h-2"
          />
          <span className="text-xs text-muted-foreground">
            {riskScore !== undefined ? `${riskScore}/100 risk score` : "No data"}
          </span>
        </div>

        {/* Diversification Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Diversification</span>
            {diversificationScore !== undefined && (
              <Badge variant="outline">
                {getDiversificationLevel(diversificationScore)}
              </Badge>
            )}
          </div>
          <Progress
            value={diversificationScore || 0}
            className="h-2"
          />
          <span className="text-xs text-muted-foreground">
            {diversificationScore !== undefined
              ? `${diversificationScore}/100 diversification score`
              : "No data"}
          </span>
        </div>

        {/* Volatility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Volatility</span>
            {volatility !== undefined && (
              <span className="text-sm font-semibold">
                {volatility.toFixed(2)}%
              </span>
            )}
          </div>
          <Progress
            value={Math.min((volatility || 0) * 2, 100)}
            className="h-2"
          />
          <span className="text-xs text-muted-foreground">
            Based on 24h price movements
          </span>
        </div>

        {/* Risk Info */}
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Risk analysis considers portfolio concentration, asset volatility,
            and DeFi protocol exposure. Lower risk scores indicate more stable
            portfolios with better diversification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

