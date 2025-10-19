/**
 * useWallet hook - Convenient wallet state management
 */

"use client";

import { useAccount, useChainId, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";
import { avalanche } from "@/lib/blockchain/avalanche";

export interface WalletState {
  address: string | undefined;
  isConnected: boolean;
  isAuthenticated: boolean;
  isCorrectChain: boolean;
  chainId: number;
  disconnect: () => void;
  refetchAuth: () => Promise<void>;
}

/**
 * Hook to manage wallet connection and authentication state
 */
export function useWallet(): WalletState {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if on correct chain (Avalanche C-Chain)
  const isCorrectChain = chainId === avalanche.id;

  /**
   * Check authentication status
   */
  async function checkAuthStatus() {
    if (!address || !isConnected) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        const isAuth =
          !!data.address &&
          data.address.toLowerCase() === address.toLowerCase();
        setIsAuthenticated(isAuth);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      setIsAuthenticated(false);
    }
  }

  // Check auth status when address changes
  useEffect(() => {
    checkAuthStatus();
  }, [address, isConnected]);

  return {
    address,
    isConnected,
    isAuthenticated,
    isCorrectChain,
    chainId,
    disconnect,
    refetchAuth: checkAuthStatus,
  };
}

