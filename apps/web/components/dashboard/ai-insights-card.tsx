/**
 * AI Insights Card - Shows AI-generated portfolio recommendations
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuitIcon,
  SparklesIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  RefreshCwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  type: "opportunity" | "risk" | "rebalancing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact?: string;
}

interface AIInsightsCardProps {
  address?: string;
  insights?: Insight[];
  isLoading?: boolean;
  onGenerate?: () => void;
}

export function AIInsightsCard({
  address,
  insights = [],
  isLoading = false,
  onGenerate,
}: AIInsightsCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      await onGenerate?.();
    } finally {
      setIsGenerating(false);
    }
  }

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "opportunity":
        return <TrendingUpIcon className="size-4 text-green-500" />;
      case "risk":
        return <AlertTriangleIcon className="size-4 text-red-500" />;
      case "rebalancing":
        return <SparklesIcon className="size-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: Insight["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuitIcon className="size-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            AI-powered recommendations for your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (!address || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuitIcon className="size-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            AI-powered recommendations for your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <SparklesIcon className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Generate AI Insights</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get personalized recommendations based on your portfolio
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !address}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCwIcon className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="size-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuitIcon className="size-5" />
              AI Insights
            </CardTitle>
            <CardDescription>
              AI-powered recommendations for your portfolio
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2"
          >
            <RefreshCwIcon
              className={cn("size-4", isGenerating && "animate-spin")}
            />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex-shrink-0">{getInsightIcon(insight.type)}</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-none">{insight.title}</h4>
                <Badge variant={getPriorityColor(insight.priority)}>
                  {insight.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
              {insight.impact && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Potential Impact:</span>{" "}
                  {insight.impact}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

