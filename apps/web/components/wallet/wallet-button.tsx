/**
 * Wallet Connect Button - Main wallet interaction component
 */

"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { useSignMessage } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  WalletIcon,
  LogOutIcon,
  ExternalLinkIcon,
  CheckCircle2Icon,
  CopyIcon,
} from "lucide-react";
import { shortenAddress } from "@/lib/blockchain/avalanche";
import { toast } from "sonner";

interface WalletButtonProps {
  onAuthSuccess?: () => void;
}

export function WalletButton({ onAuthSuccess }: WalletButtonProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [address]);

  async function checkAuthStatus() {
    if (!address) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.address && data.address.toLowerCase() === address.toLowerCase());
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      setIsAuthenticated(false);
    }
  }

  async function handleAuthenticate() {
    if (!address) return;

    setIsAuthenticating(true);
    try {
      // Get nonce
      const nonceResponse = await fetch("/api/auth/nonce", {
        method: "POST",
      });

      if (!nonceResponse.ok) {
        throw new Error("Failed to get nonce");
      }

      const { nonce } = await nonceResponse.json();

      // Prepare SIWE message
      const domain = window.location.host;
      const origin = window.location.origin;
      
      const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to Avax Ledger with your wallet\n\nURI: ${origin}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;

      // Sign message
      const signature = await signMessageAsync({ message });

      // Verify signature
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          signature,
          nonce,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Authentication failed");
      }

      setIsAuthenticated(true);
      toast.success("Successfully authenticated!");
      onAuthSuccess?.();
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to authenticate"
      );
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleDisconnect() {
    try {
      // Logout from backend
      await fetch("/api/auth/logout", { method: "POST" });
      
      // Disconnect wallet
      disconnect();
      setIsAuthenticated(false);
      toast.success("Disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect");
    }
  }

  async function copyAddress() {
    if (address) {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied!");
    }
  }

  function openExplorer() {
    if (address) {
      window.open(`https://snowtrace.io/address/${address}`, "_blank");
    }
  }

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <>
        <Button
          onClick={() => setShowConnectDialog(true)}
          className="gap-2"
          size="sm"
        >
          <WalletIcon className="size-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </Button>

        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choose a wallet to connect to Avax Ledger
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  variant="outline"
                  onClick={() => {
                    connect({ connector });
                    setShowConnectDialog(false);
                  }}
                  disabled={isPending}
                  className="justify-start gap-2"
                >
                  <WalletIcon className="size-4" />
                  {connector.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Connected but not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="gap-1.5 hidden md:flex">
          <div className="size-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs">Not Signed In</span>
        </Badge>
        <Button
          onClick={handleAuthenticate}
          disabled={isAuthenticating}
          className="gap-2"
          size="sm"
        >
          {isAuthenticating && <Spinner className="size-4" />}
          <span className="hidden sm:inline">Sign Message</span>
          <span className="sm:hidden">Sign In</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => disconnect()}
          title="Disconnect"
          className="size-8"
        >
          <LogOutIcon className="size-4" />
        </Button>
      </div>
    );
  }

  // Connected and authenticated - show account dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1.5 sm:gap-2" size="sm">
          <Avatar className="size-5">
            <AvatarFallback className="text-xs">
              {address?.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-mono text-xs sm:text-sm">{shortenAddress(address!)}</span>
          <Badge variant="default" className="gap-1 hidden lg:flex">
            <CheckCircle2Icon className="size-3" />
            <span className="text-xs">Signed In</span>
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Account</span>
            <span className="font-mono text-sm">{shortenAddress(address!)}</span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={copyAddress} className="gap-2">
          <CopyIcon className="size-4" />
          Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={openExplorer} className="gap-2">
          <ExternalLinkIcon className="size-4" />
          View on Explorer
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOutIcon className="size-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

