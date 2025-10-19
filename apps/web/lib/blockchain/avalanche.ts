/**
 * Avalanche blockchain constants and utilities
 */

import { type Chain } from "viem";

/**
 * Avalanche C-Chain Mainnet configuration
 */
export const avalanche: Chain = {
  id: 43114,
  name: "Avalanche C-Chain",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc"],
    },
    public: {
      http: ["https://api.avax.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "SnowTrace",
      url: "https://snowtrace.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 11_907_934,
    },
  },
  testnet: false,
};

/**
 * Avalanche Fuji Testnet configuration
 */
export const avalancheFuji: Chain = {
  id: 43113,
  name: "Avalanche Fuji Testnet",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
    public: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "SnowTrace",
      url: "https://testnet.snowtrace.io",
    },
  },
  testnet: true,
};

/**
 * Check if address is valid Ethereum/Avalanche address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Normalize address to lowercase
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Shorten address for display (0x1234...5678)
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) {
    return address;
  }
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

/**
 * Format AVAX amount
 */
export function formatAvax(amount: bigint, decimals = 4): string {
  const avax = Number(amount) / 1e18;
  return avax.toFixed(decimals);
}

/**
 * Parse AVAX amount to wei
 */
export function parseAvax(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e18));
}

