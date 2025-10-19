/**
 * CoinGecko API client for token prices and market data
 */

import { BaseApiClient } from "./base-client";
import { TokenPrice } from "@avax-ledger/types";
import { constants } from "@avax-ledger/config";

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  last_updated: string;
}

interface CoinGeckoSimplePrice {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_7d_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
  };
}

export class CoinGeckoClient extends BaseApiClient {
  constructor(apiKey?: string) {
    super(
      apiKey
        ? "https://pro-api.coingecko.com/api/v3"
        : "https://api.coingecko.com/api/v3",
      "coingecko",
      apiKey
    );
  }

  /**
   * Get token price by contract address
   */
  async getTokenPrice(
    chainId: number,
    contractAddress: string
  ): Promise<TokenPrice | null> {
    try {
      const platformId = this.getPlatformId(chainId);
      if (!platformId) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const endpoint = `/simple/token_price/${platformId}`;
      const params = new URLSearchParams({
        contract_addresses: contractAddress.toLowerCase(),
        vs_currencies: "usd",
        include_24hr_change: "true",
        include_7d_change: "true",
        include_market_cap: "true",
        include_24hr_vol: "true",
      });

      const data = await this.get<CoinGeckoSimplePrice>(
        `${endpoint}?${params.toString()}`,
        {
          enabled: true,
          ttlSeconds: constants.CACHE_TTL.TOKEN_PRICE,
        }
      );

      const priceData = data[contractAddress.toLowerCase()];
      if (!priceData) {
        return null;
      }

      return {
        address: contractAddress,
        symbol: "", // Not provided by this endpoint
        priceUsd: priceData.usd,
        priceChange24h: priceData.usd_24h_change || 0,
        priceChange7d: priceData.usd_7d_change || 0,
        marketCap: priceData.usd_market_cap,
        volume24h: priceData.usd_24h_vol,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error(`Failed to fetch price for ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Get multiple token prices in batch
   */
  async getBatchTokenPrices(
    chainId: number,
    contractAddresses: string[]
  ): Promise<Map<string, TokenPrice>> {
    const priceMap = new Map<string, TokenPrice>();

    if (contractAddresses.length === 0) {
      return priceMap;
    }

    try {
      const platformId = this.getPlatformId(chainId);
      if (!platformId) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      // CoinGecko supports up to 250 addresses per request
      const batchSize = 250;
      const batches: string[][] = [];

      for (let i = 0; i < contractAddresses.length; i += batchSize) {
        batches.push(contractAddresses.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const endpoint = `/simple/token_price/${platformId}`;
        const params = new URLSearchParams({
          contract_addresses: batch.map((a) => a.toLowerCase()).join(","),
          vs_currencies: "usd",
          include_24hr_change: "true",
          include_7d_change: "true",
          include_market_cap: "true",
          include_24hr_vol: "true",
        });

        const data = await this.get<CoinGeckoSimplePrice>(
          `${endpoint}?${params.toString()}`,
          {
            enabled: true,
            ttlSeconds: constants.CACHE_TTL.TOKEN_PRICE,
          }
        );

        for (const [address, priceData] of Object.entries(data)) {
          priceMap.set(address, {
            address,
            symbol: "",
            priceUsd: priceData.usd,
            priceChange24h: priceData.usd_24h_change || 0,
            priceChange7d: priceData.usd_7d_change || 0,
            marketCap: priceData.usd_market_cap,
            volume24h: priceData.usd_24h_vol,
            lastUpdated: new Date(),
          });
        }
      }

      return priceMap;
    } catch (error) {
      console.error("Failed to fetch batch token prices:", error);
      return priceMap;
    }
  }

  /**
   * Get top tokens by market cap on Avalanche
   */
  async getTopTokens(limit: number = 50): Promise<CoinGeckoPrice[]> {
    try {
      const endpoint = "/coins/markets";
      const params = new URLSearchParams({
        vs_currency: "usd",
        category: "avalanche-ecosystem",
        order: "market_cap_desc",
        per_page: limit.toString(),
        page: "1",
        sparkline: "false",
        price_change_percentage: "24h,7d",
      });

      const data = await this.get<CoinGeckoPrice[]>(
        `${endpoint}?${params.toString()}`,
        {
          enabled: true,
          ttlSeconds: constants.CACHE_TTL.PROTOCOL_DATA,
        }
      );

      return data;
    } catch (error) {
      console.error("Failed to fetch top tokens:", error);
      return [];
    }
  }

  /**
   * Get native token (AVAX) price
   */
  async getAvaxPrice(): Promise<TokenPrice | null> {
    try {
      const endpoint = "/simple/price";
      const params = new URLSearchParams({
        ids: "avalanche-2",
        vs_currencies: "usd",
        include_24hr_change: "true",
        include_7d_change: "true",
        include_market_cap: "true",
        include_24hr_vol: "true",
      });

      const data = await this.get<any>(
        `${endpoint}?${params.toString()}`,
        {
          enabled: true,
          ttlSeconds: constants.CACHE_TTL.TOKEN_PRICE,
        }
      );

      const avaxData = data["avalanche-2"];
      if (!avaxData) {
        return null;
      }

      return {
        address: "0x0000000000000000000000000000000000000000", // Native token
        symbol: "AVAX",
        priceUsd: avaxData.usd,
        priceChange24h: avaxData.usd_24h_change || 0,
        priceChange7d: avaxData.usd_7d_change || 0,
        marketCap: avaxData.usd_market_cap,
        volume24h: avaxData.usd_24h_vol,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Failed to fetch AVAX price:", error);
      return null;
    }
  }

  /**
   * Map chain ID to CoinGecko platform ID
   */
  private getPlatformId(chainId: number): string | null {
    const platformMap: Record<number, string> = {
      1: "ethereum",
      56: "binance-smart-chain",
      137: "polygon-pos",
      43114: "avalanche",
      43113: "avalanche", // Fuji testnet uses same platform
      250: "fantom",
      42161: "arbitrum-one",
      10: "optimistic-ethereum",
    };

    return platformMap[chainId] || null;
  }
}

// Singleton instance
let coingeckoClient: CoinGeckoClient | null = null;

export function getCoinGeckoClient(): CoinGeckoClient {
  if (!coingeckoClient) {
    coingeckoClient = new CoinGeckoClient(process.env.COINGECKO_API_KEY);
  }
  return coingeckoClient;
}

