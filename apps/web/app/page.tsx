/**
 * Landing Page - Main entry point
 */

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LayoutDashboardIcon,
  BrainCircuitIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  ZapIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container flex flex-col items-center justify-center gap-8 px-4 py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <ZapIcon className="size-4 text-primary" />
              <span className="text-muted-foreground">
                Powered by AI & Blockchain
              </span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Track Your Avalanche{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                DeFi
              </span>
              {" "}Portfolio
            </h1>
            
            <p className="max-w-[700px] px-4 text-base text-muted-foreground sm:text-lg md:text-xl">
              Get real-time insights, AI-powered recommendations, and comprehensive
              analytics for your Avalanche DeFi positions. All in one dashboard.
            </p>
            
            <div className="flex w-full max-w-md flex-col gap-3 px-4 sm:flex-row sm:max-w-none">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/dashboard">
                  <LayoutDashboardIcon className="size-5" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a
                  href="https://github.com/yourusername/avax-ledger"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mx-auto mt-16 w-full grid max-w-6xl gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-all hover:shadow-lg hover:border-primary/20">
              <CardHeader className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <WalletIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Multi-Wallet Support</CardTitle>
                <CardDescription className="text-sm">
                  Connect with MetaMask, WalletConnect, or Coinbase Wallet
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/20">
              <CardHeader className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUpIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Real-Time Tracking</CardTitle>
                <CardDescription className="text-sm">
                  Monitor your portfolio value, positions, and performance metrics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/20">
              <CardHeader className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <BrainCircuitIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Insights</CardTitle>
                <CardDescription className="text-sm">
                  Get intelligent recommendations for rebalancing and risk management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/20">
              <CardHeader className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheckIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Secure Authentication</CardTitle>
                <CardDescription className="text-sm">
                  Sign-In with Ethereum (SIWE) for secure, wallet-based authentication
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/20">
              <CardHeader className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <LayoutDashboardIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Beautiful Dashboard</CardTitle>
                <CardDescription className="text-sm">
                  Intuitive interface with charts, tables, and actionable insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/20">
              <CardHeader className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <ZapIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Lightning Fast</CardTitle>
                <CardDescription className="text-sm">
                  Built with Next.js 14 and optimized for performance
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-[800px] text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mb-12 text-lg text-muted-foreground">
                Get started in three simple steps
              </p>

              <div className="grid gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    1
                  </div>
                  <h3 className="font-semibold">Connect Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign in securely with your Avalanche wallet
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    2
                  </div>
                  <h3 className="font-semibold">View Portfolio</h3>
                  <p className="text-sm text-muted-foreground">
                    See all your DeFi positions aggregated in one place
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    3
                  </div>
                  <h3 className="font-semibold">Get Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive AI-powered recommendations to optimize your portfolio
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <Card className="mx-auto max-w-[800px] border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardContent className="flex flex-col items-center gap-6 p-8 text-center md:p-12">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to optimize your DeFi portfolio?
                </h2>
                <p className="max-w-[600px] text-lg text-muted-foreground">
                  Connect your wallet and start tracking your Avalanche DeFi positions
                  with AI-powered insights today.
                </p>
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboardIcon className="size-5" />
                    Launch Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for the Avalanche ecosystem
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href="https://github.com/yourusername/avax-ledger"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://twitter.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://docs.avax-ledger.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
