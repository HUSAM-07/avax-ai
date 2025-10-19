/**
 * usePortfolio hook - Fetch and manage portfolio data
 */

"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./use-wallet";

interface PortfolioData {
  totalValue: number;
  change24h: number;
  change7d: number;
  tokenCount: number;
  protocolCount: number;
  tokens: Array<{
    symbol: string;
    value: number;
    percentage: number;
  }>;
  positions: Array<{
    protocol: string;
    type: string;
    totalValueUsd: number;
    tokens: Array<{
      symbol: string;
      amount: number;
    }>;
    apr?: number;
    apy?: number;
  }>;
  riskScore: number;
  diversificationScore: number;
  volatility: number;
}

export function usePortfolio() {
  const { address, isAuthenticated, isCorrectChain } = useWallet();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !isAuthenticated || !isCorrectChain) {
      setPortfolio(null);
      return;
    }

    fetchPortfolio();
  }, [address, isAuthenticated, isCorrectChain]);

  async function fetchPortfolio() {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolio/${address}`);
      
      if (!response.ok) {
        // For now, use mock data if API fails
        setPortfolio(getMockPortfolio());
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        // Transform API data to component format
        const transformed: PortfolioData = {
          totalValue: data.data.totalValueUsd,
          change24h: data.data.totalValueChange24h || 0,
          change7d: data.data.totalValueChange7d || 0,
          tokenCount: data.data.tokenCount,
          protocolCount: data.data.protocolCount,
          tokens: data.data.tokens?.map((t: any) => ({
            symbol: t.token.symbol,
            value: t.valueUsd,
            percentage: (t.valueUsd / data.data.totalValueUsd) * 100,
          })) || [],
          positions: data.data.positions || [],
          riskScore: 45, // Would calculate from portfolio
          diversificationScore: 65, // Would calculate from portfolio
          volatility: 12.5, // Would calculate from portfolio
        };
        setPortfolio(transformed);
      } else {
        // Use mock data
        setPortfolio(getMockPortfolio());
      }
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch portfolio");
      // Use mock data on error
      setPortfolio(getMockPortfolio());
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshPortfolio() {
    await fetchPortfolio();
  }

  return {
    portfolio,
    isLoading,
    error,
    refreshPortfolio,
  };
}

/**
 * Mock portfolio data for demonstration
 */
function getMockPortfolio(): PortfolioData {
  return {
    totalValue: 125487.32,
    change24h: 3.45,
    change7d: -1.23,
    tokenCount: 12,
    protocolCount: 5,
    tokens: [
      { symbol: "AVAX", value: 45000, percentage: 35.87 },
      { symbol: "USDC", value: 30000, percentage: 23.91 },
      { symbol: "WETH.e", value: 20000, percentage: 15.94 },
      { symbol: "JOE", value: 15487.32, percentage: 12.34 },
      { symbol: "GMX", value: 10000, percentage: 7.97 },
      { symbol: "Other", value: 5000, percentage: 3.98 },
    ],
    positions: [
      {
        protocol: "Trader Joe",
        type: "LIQUIDITY",
        totalValueUsd: 35000,
        tokens: [
          { symbol: "AVAX", amount: 150.5 },
          { symbol: "USDC", amount: 17500 },
        ],
        apr: 24.5,
      },
      {
        protocol: "Benqi",
        type: "LENDING",
        totalValueUsd: 25000,
        tokens: [
          { symbol: "AVAX", amount: 100 },
        ],
        apy: 8.2,
      },
      {
        protocol: "GMX",
        type: "STAKED",
        totalValueUsd: 15000,
        tokens: [
          { symbol: "GMX", amount: 250 },
        ],
        apr: 18.7,
      },
      {
        protocol: "Aave",
        type: "LENDING",
        totalValueUsd: 20000,
        tokens: [
          { symbol: "USDC", amount: 20000 },
        ],
        apy: 5.3,
      },
    ],
    riskScore: 45,
    diversificationScore: 68,
    volatility: 12.5,
  };
}

