/**
 * Dashboard Page - Main authenticated dashboard
 */

"use client";

import { Header } from "@/components/layout/header";
import { NetworkSwitcher } from "@/components/wallet/network-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon, WalletIcon, TrendingUpIcon, PieChartIcon, BrainCircuitIcon } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

export default function DashboardPage() {
  const { isConnected, isAuthenticated, isCorrectChain } = useWallet();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your Avalanche DeFi portfolio dashboard
            </p>
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

          {/* Dashboard Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WalletIcon className="size-5" />
                  Portfolio Overview
                </CardTitle>
                <CardDescription>
                  View your total portfolio value and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to see your portfolio
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="size-5" />
                  Asset Allocation
                </CardTitle>
                <CardDescription>
                  See how your assets are distributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to see your allocation
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuitIcon className="size-5" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Get personalized recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to receive insights
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="size-5" />
                  Performance History
                </CardTitle>
                <CardDescription>
                  Track your portfolio performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to see performance charts
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

