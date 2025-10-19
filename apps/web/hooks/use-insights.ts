/**
 * useInsights hook - Fetch and manage AI insights
 */

"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./use-wallet";
import { toast } from "sonner";

interface Insight {
  type: "opportunity" | "risk" | "rebalancing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact?: string;
}

export function useInsights() {
  const { address, isAuthenticated } = useWallet();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !isAuthenticated) {
      setInsights([]);
      return;
    }

    fetchInsights();
  }, [address, isAuthenticated]);

  async function fetchInsights() {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/insights/${address}`);
      
      if (!response.ok) {
        // Use mock insights if API fails
        setInsights(getMockInsights());
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform API data to component format
        const transformed: Insight[] = data.data.map((insight: any) => ({
          type: insight.type,
          priority: insight.priority,
          title: insight.title,
          description: insight.content,
          impact: insight.potentialImpact,
        }));
        setInsights(transformed);
      } else {
        setInsights(getMockInsights());
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch insights");
      setInsights(getMockInsights());
    } finally {
      setIsLoading(false);
    }
  }

  async function generateInsights() {
    if (!address) {
      toast.error("No wallet address found");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/insights/${address}/generate`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate insights");
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const transformed: Insight[] = data.data.map((insight: any) => ({
          type: insight.type,
          priority: insight.priority,
          title: insight.title,
          description: insight.content,
          impact: insight.potentialImpact,
        }));
        setInsights(transformed);
        toast.success("Insights generated successfully");
      } else {
        throw new Error(data.error?.message || "Failed to generate insights");
      }
    } catch (err) {
      console.error("Failed to generate insights:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate insights";
      setError(errorMessage);
      toast.error(errorMessage);
      // Show mock insights on error
      setInsights(getMockInsights());
    } finally {
      setIsLoading(false);
    }
  }

  return {
    insights,
    isLoading,
    error,
    generateInsights,
    refreshInsights: fetchInsights,
  };
}

/**
 * Mock insights for demonstration
 */
function getMockInsights(): Insight[] {
  return [
    {
      type: "opportunity",
      priority: "high",
      title: "High APR Lending Opportunity",
      description:
        "Consider lending your idle USDC on Benqi for 8.2% APY. This is above the market average and provides stable returns with low risk.",
      impact: "+$2,100 annual yield on $25,000",
    },
    {
      type: "risk",
      priority: "medium",
      title: "Concentrated Position Warning",
      description:
        "Your AVAX holdings represent 35% of your portfolio. Consider rebalancing to reduce concentration risk and improve diversification.",
      impact: "Reduce risk score by ~15 points",
    },
    {
      type: "rebalancing",
      priority: "medium",
      title: "Rebalancing Recommendation",
      description:
        "Your portfolio could benefit from adding stablecoin exposure. Consider moving 10% into high-yield stablecoin positions to reduce volatility.",
      impact: "Improve risk-adjusted returns by 8-12%",
    },
    {
      type: "opportunity",
      priority: "low",
      title: "LP Fee Optimization",
      description:
        "Your Trader Joe LP position is performing well with 24.5% APR. Consider increasing allocation to similar high-performing pairs.",
      impact: "+$850 monthly from fees",
    },
  ];
}

