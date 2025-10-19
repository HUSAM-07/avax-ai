/**
 * Header Component - Main navigation header
 */

"use client";

import Link from "next/link";
import { WalletButton } from "@/components/wallet/wallet-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LayoutDashboardIcon } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboardIcon className="size-5" />
          </div>
          <span className="hidden sm:inline-block">Avax Ledger</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

