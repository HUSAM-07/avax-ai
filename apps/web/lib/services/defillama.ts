/**
 * DeFi Llama API client for protocol TVL and yield data
 */

import { BaseApiClient } from "./base-client";
import { constants } from "@avax-ledger/config";

interface DefiLlamaProtocol {
  id: string;
  name: string;
  address: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: string;
  category: string;
  chains: string[];
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  mcap: number;
}

interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  rewardTokens: string[];
  pool: string;
  apyPct1D: number;
  apyPct7D: number;
  apyPct30D: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  volumeUsd1d: number;
  volumeUsd7d: number;
}

interface DefiLlamaTvlData {
  date: number;
  totalLiquidityUSD: number;
}

export class DefiLlamaClient extends BaseApiClient {
  constructor() {
    super("https://api.llama.fi", "defillama");
  }

  /**
   * Get all protocols
   */
  async getProtocols(): Promise<DefiLlamaProtocol[]> {
    try {
      const data = await this.get<DefiLlamaProtocol[]>("/protocols", {
        enabled: true,
        ttlSeconds: constants.CACHE_TTL.PROTOCOL_DATA,
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch protocols:", error);
      return [];
    }
  }

  /**
   * Get protocols on Avalanche
   */
  async getAvalancheProtocols(): Promise<DefiLlamaProtocol[]> {
    try {
      const allProtocols = await this.getProtocols();
      return allProtocols.filter(
        (p) =>
          p.chains.includes("Avalanche") || p.chain === "Avalanche"
      );
    } catch (error) {
      console.error("Failed to fetch Avalanche protocols:", error);
      return [];
    }
  }

  /**
   * Get protocol details
   */
  async getProtocol(protocolSlug: string): Promise<DefiLlamaProtocol | null> {
    try {
      const data = await this.get<DefiLlamaProtocol>(
        `/protocol/${protocolSlug}`,
        {
          enabled: true,
          ttlSeconds: constants.CACHE_TTL.PROTOCOL_DATA,
        }
      );

      return data;
    } catch (error) {
      console.error(`Failed to fetch protocol ${protocolSlug}:`, error);
      return null;
    }
  }

  /**
   * Get protocol TVL history
   */
  async getProtocolTvl(protocolSlug: string): Promise<DefiLlamaTvlData[]> {
    try {
      const protocol = await this.getProtocol(protocolSlug);
      if (!protocol) {
        return [];
      }

      // TVL data is included in protocol details
      return [];
    } catch (error) {
      console.error(`Failed to fetch TVL for ${protocolSlug}:`, error);
      return [];
    }
  }

  /**
   * Get all yield pools
   */
  async getPools(): Promise<DefiLlamaPool[]> {
    try {
      const response = await this.get<{ status: string; data: DefiLlamaPool[] }>(
        "/pools",
        {
          enabled: true,
          ttlSeconds: constants.CACHE_TTL.PROTOCOL_DATA,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch pools:", error);
      return [];
    }
  }

  /**
   * Get Avalanche yield pools
   */
  async getAvalanchePools(): Promise<DefiLlamaPool[]> {
    try {
      const allPools = await this.getPools();
      return allPools.filter((p) => p.chain === "Avalanche");
    } catch (error) {
      console.error("Failed to fetch Avalanche pools:", error);
      return [];
    }
  }

  /**
   * Get pool by ID
   */
  async getPool(poolId: string): Promise<DefiLlamaPool | null> {
    try {
      const pools = await this.getPools();
      return pools.find((p) => p.pool === poolId) || null;
    } catch (error) {
      console.error(`Failed to fetch pool ${poolId}:`, error);
      return null;
    }
  }

  /**
   * Get pools for a specific protocol
   */
  async getProtocolPools(
    protocolName: string,
    chain: string = "Avalanche"
  ): Promise<DefiLlamaPool[]> {
    try {
      const allPools = await this.getPools();
      return allPools.filter(
        (p) =>
          p.project.toLowerCase() === protocolName.toLowerCase() &&
          p.chain === chain
      );
    } catch (error) {
      console.error(
        `Failed to fetch pools for protocol ${protocolName}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get total TVL across all chains
   */
  async getTotalTvl(): Promise<number> {
    try {
      const response = await this.get<{ totalLiquidityUSD: number }>(
        "/v2/chains",
        {
          enabled: true,
          ttlSeconds: constants.CACHE_TTL.PROTOCOL_DATA,
        }
      );

      return response.totalLiquidityUSD || 0;
    } catch (error) {
      console.error("Failed to fetch total TVL:", error);
      return 0;
    }
  }

  /**
   * Get Avalanche chain TVL
   */
  async getAvalancheTvl(): Promise<number> {
    try {
      const response = await this.get<any>("/v2/chain/Avalanche", {
        enabled: true,
        ttlSeconds: constants.CACHE_TTL.PROTOCOL_DATA,
      });

      return response.tvl || 0;
    } catch (error) {
      console.error("Failed to fetch Avalanche TVL:", error);
      return 0;
    }
  }

  /**
   * Calculate protocol risk score based on metrics
   */
  calculateProtocolRiskScore(protocol: DefiLlamaProtocol): number {
    let score = 50; // Start with neutral score

    // Higher TVL = lower risk
    if (protocol.tvl > 1_000_000_000) score -= 10; // > $1B
    else if (protocol.tvl > 100_000_000) score -= 5; // > $100M
    else if (protocol.tvl < 10_000_000) score += 10; // < $10M

    // Recent TVL changes
    if (protocol.change_7d < -20) score += 15; // Big drop
    else if (protocol.change_7d < -10) score += 10; // Medium drop
    else if (protocol.change_7d > 20) score -= 5; // Big growth

    // Audits reduce risk
    if (protocol.audits && protocol.audits !== "0") score -= 10;

    // Multi-chain presence reduces risk
    if (protocol.chains && protocol.chains.length > 3) score -= 5;

    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
}

// Singleton instance
let defiLlamaClient: DefiLlamaClient | null = null;

export function getDefiLlamaClient(): DefiLlamaClient {
  if (!defiLlamaClient) {
    defiLlamaClient = new DefiLlamaClient();
  }
  return defiLlamaClient;
}

