/**
 * Wagmi configuration for wallet connections
 */

import { createConfig, http } from "wagmi";
import { avalanche, avalancheFuji } from "@/lib/blockchain/avalanche";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";

// Get WalletConnect project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";

if (!projectId) {
  console.warn(
    "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set. WalletConnect will not work."
  );
}

/**
 * Wagmi configuration
 */
export const wagmiConfig = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: [
    // Injected wallet (MetaMask, Brave, etc.)
    injected({
      shimDisconnect: true,
    }),
    // WalletConnect
    walletConnect({
      projectId,
      metadata: {
        name: "Avax Ledger",
        description: "Avalanche DeFi Portfolio Tracker with AI Insights",
        url: typeof window !== "undefined" ? window.location.origin : "",
        icons: ["/logo.svg"],
      },
      showQrModal: true,
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: "Avax Ledger",
      appLogoUrl: "/logo.svg",
    }),
  ],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
  },
  ssr: true,
});

