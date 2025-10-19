/**
 * Dashboard Page - Main authenticated dashboard with portfolio data
 */

"use client";

import { Header } from "@/components/layout/header";
import { NetworkSwitcher } from "@/components/wallet/network-switcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InfoIcon, RefreshCwIcon } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useInsights } from "@/hooks/use-insights";
import {
  PortfolioSummaryCard,
  AssetAllocationChart,
  PositionsTable,
  RiskMetricsCard,
  AIInsightsCard,
} from "@/components/dashboard";
import { useState } from "react";

export default function DashboardPage() {
  const { address, isConnected, isAuthenticated, isCorrectChain } = useWallet();
  const { portfolio, isLoading, refreshPortfolio } = usePortfolio();
  const { insights, isLoading: isLoadingInsights, generateInsights } = useInsights();
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refreshPortfolio();
    setTimeout(() => setIsRefreshing(false), 500);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Header with Refresh */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Track your Avalanche DeFi portfolio
              </p>
            </div>
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCwIcon
                  className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
          </div>

          {/* Network Switcher Alert */}
          {isConnected && !isCorrectChain && <NetworkSwitcher />}

          {/* Connection Alert */}
          {!isConnected && (
            <Alert className="mb-8">
              <InfoIcon className="size-4" />
              <AlertTitle>Connect Your Wallet</AlertTitle>
              <AlertDescription>
                Connect and sign in with your wallet to view your portfolio,
                positions, and AI-powered insights.
              </AlertDescription>
            </Alert>
          )}

          {/* Authentication Alert */}
          {isConnected && !isAuthenticated && (
            <Alert className="mb-8">
              <InfoIcon className="size-4" />
              <AlertTitle>Sign In Required</AlertTitle>
              <AlertDescription>
                Please sign the message in your wallet to authenticate and access your dashboard.
              </AlertDescription>
            </Alert>
          )}

          {/* Dashboard Grid - Show when authenticated */}
          {isAuthenticated && (
            <div className="space-y-6">
              {/* Top Row - Portfolio Summary */}
              <PortfolioSummaryCard
                totalValue={portfolio?.totalValue}
                change24h={portfolio?.change24h}
                change7d={portfolio?.change7d}
                tokenCount={portfolio?.tokenCount}
                isLoading={isLoading}
              />

              {/* Middle Row - Charts and Risk */}
              <div className="grid gap-6 lg:grid-cols-2">
                <AssetAllocationChart
                  data={portfolio?.tokens}
                  isLoading={isLoading}
                />
                <RiskMetricsCard
                  riskScore={portfolio?.riskScore}
                  diversificationScore={portfolio?.diversificationScore}
                  volatility={portfolio?.volatility}
                  isLoading={isLoading}
                />
              </div>

              {/* Bottom Row - Positions and Insights */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <PositionsTable
                    positions={portfolio?.positions}
                    isLoading={isLoading}
                  />
                </div>
                <div className="lg:col-span-2">
                  <AIInsightsCard
                    address={address}
                    insights={insights}
                    isLoading={isLoadingInsights}
                    onGenerate={generateInsights}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
