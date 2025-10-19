/**
 * Service client factory
 * Creates and configures API clients
 */

import { ZerionClient } from "./zerion";
import { CoinGeckoClient } from "./coingecko";
import { DefiLlamaClient } from "./defillama";

// Singleton instances
let zerionClient: ZerionClient | null = null;
let coinGeckoClient: CoinGeckoClient | null = null;
let defiLlamaClient: DefiLlamaClient | null = null;

/**
 * Get or create Zerion client
 */
export function getZerionClient(): ZerionClient {
  if (!zerionClient) {
    zerionClient = new ZerionClient();
  }
  return zerionClient;
}

/**
 * Get or create CoinGecko client
 */
export function getCoinGeckoClient(): CoinGeckoClient {
  if (!coinGeckoClient) {
    coinGeckoClient = new CoinGeckoClient();
  }
  return coinGeckoClient;
}

/**
 * Get or create DefiLlama client
 */
export function getDefiLlamaClient(): DefiLlamaClient {
  if (!defiLlamaClient) {
    defiLlamaClient = new DefiLlamaClient();
  }
  return defiLlamaClient;
}

/**
 * Reset all clients (useful for testing)
 */
export function resetClients(): void {
  zerionClient = null;
  coinGeckoClient = null;
  defiLlamaClient = null;
}

