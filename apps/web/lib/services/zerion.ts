/**
 * Zerion API client for wallet portfolio and positions
 * Documentation: https://developers.zerion.io/reference/intro
 */

import { BaseApiClient } from "./base-client";
import {
  Portfolio,
  Position,
  TokenBalance,
  Token,
  ChainId,
  PositionType,
  TokenStandard,
} from "@avax-ledger/types";
import { constants } from "@avax-ledger/config";

interface ZerionWalletPortfolio {
  data: {
    type: string;
    id: string;
    attributes: {
      positions_distribution_by_type: Record<string, { abs: number }>;
      positions_distribution_by_chain: Record<string, { abs: number }>;
      total: {
        positions: number;
      };
      changes: {
        absolute_1d: number;
        percent_1d: number;
      };
    };
  };
}

interface ZerionPosition {
  type: string;
  id: string;
  attributes: {
    parent: any;
    protocol: string;
    name: string;
    position_type: string;
    quantity: {
      int: string;
      decimals: number;
      float: number;
      numeric: string;
    };
    value: number;
    price: number;
    changes: {
      absolute_1d: number;
      percent_1d: number;
    };
    fungible_info: {
      name: string;
      symbol: string;
      icon: {
        url: string;
      };
      flags: {
        verified: boolean;
      };
      implementations: Array<{
        chain_id: string;
        address: string;
        decimals: number;
      }>;
    };
    flags: {
      displayable: boolean;
      is_trash: boolean;
    };
  };
  relationships: {
    chain: {
      data: {
        type: string;
        id: string;
      };
    };
    fungible: {
      data: {
        type: string;
        id: string;
      };
    };
  };
}

export class ZerionClient extends BaseApiClient {
  constructor(apiKey?: string) {
    super(
      "https://api.zerion.io/v1",
      "zerion",
      apiKey || process.env.ZERION_API_KEY
    );
  }

  /**
   * Get wallet portfolio overview
   */
  async getWalletPortfolio(address: string): Promise<Portfolio | null> {
    try {
      // Get portfolio positions
      const positions = await this.getWalletPositions(address);

      // Calculate total value and metrics
      let totalValueUsd = 0;
      const tokenMap = new Map<string, TokenBalance>();
      const positionsList: Position[] = [];

      for (const position of positions) {
        totalValueUsd += position.totalValueUsd;

        // Add tokens to map
        for (const token of position.tokens) {
          const existing = tokenMap.get(token.token.address);
          if (existing) {
            existing.balanceFormatted += token.balanceFormatted;
            existing.valueUsd += token.valueUsd;
          } else {
            tokenMap.set(token.token.address, { ...token });
          }
        }

        positionsList.push(position);
      }

      const tokens = Array.from(tokenMap.values());

      return {
        walletAddress: address.toLowerCase(),
        chainId: ChainId.AVALANCHE_MAINNET,
        tokens,
        positions: positionsList,
        totalValueUsd,
        totalValueChange24h: 0, // Would need historical data
        totalValueChange7d: 0, // Would need historical data
        tokenCount: tokens.length,
        protocolCount: new Set(positionsList.map((p) => p.protocol)).size,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error(`Failed to fetch portfolio for ${address}:`, error);
      return null;
    }
  }

  /**
   * Get wallet positions
   */
  async getWalletPositions(address: string): Promise<Position[]> {
    try {
      const endpoint = `/wallets/${address}/positions`;
      const params = new URLSearchParams({
        "filter[positions]": "only_simple",
        "filter[trash]": "only_non_trash",
        "sort": "value",
        currency: "usd",
      });

      const response = await this.get<{ data: ZerionPosition[] }>(
        `${endpoint}?${params.toString()}`,
        {
          enabled: true,
          ttlSeconds: constants.CACHE_TTL.PORTFOLIO,
        }
      );

      const positions: Position[] = [];

      for (const item of response.data || []) {
        const attrs = item.attributes;

        if (!attrs.flags.displayable || attrs.flags.is_trash) {
          continue;
        }

        // Extract chain ID
        const chainId = this.parseChainId(item.relationships.chain?.data?.id);
        if (chainId !== ChainId.AVALANCHE_MAINNET) {
          continue; // Only Avalanche for now
        }

        // Build token info
        const fungibleInfo = attrs.fungible_info;
        const implementation = fungibleInfo?.implementations?.find(
          (impl) => this.parseChainId(impl.chain_id) === chainId
        );

        if (!implementation) {
          continue;
        }

        const token: Token = {
          address: implementation.address,
          symbol: fungibleInfo.symbol,
          name: fungibleInfo.name,
          decimals: implementation.decimals,
          chainId,
          standard: TokenStandard.ERC20,
          logoUrl: fungibleInfo.icon?.url,
        };

        const tokenBalance: TokenBalance = {
          token,
          balance: attrs.quantity.int,
          balanceFormatted: attrs.quantity.float,
          valueUsd: attrs.value || 0,
          price: attrs.price || 0,
        };

        const position: Position = {
          id: item.id,
          type: this.mapPositionType(attrs.position_type),
          protocol: attrs.protocol || "Wallet",
          name: attrs.name || fungibleInfo.name,
          chainId,
          tokens: [tokenBalance],
          totalValueUsd: attrs.value || 0,
          lastUpdated: new Date(),
        };

        positions.push(position);
      }

      return positions;
    } catch (error) {
      console.error(`Failed to fetch positions for ${address}:`, error);
      return [];
    }
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(
    address: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<any[]> {
    try {
      const endpoint = `/wallets/${address}/transactions`;
      const params = new URLSearchParams({
        "page[size]": (options.limit || 50).toString(),
        "page[offset]": (options.offset || 0).toString(),
        currency: "usd",
      });

      const response = await this.get<{ data: any[] }>(
        `${endpoint}?${params.toString()}`,
        {
          enabled: false, // Don't cache transactions
          ttlSeconds: 0,
        }
      );

      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch transactions for ${address}:`, error);
      return [];
    }
  }

  /**
   * Parse chain ID from Zerion format
   */
  private parseChainId(chainStr: string): ChainId | null {
    const chainMap: Record<string, ChainId> = {
      avalanche: ChainId.AVALANCHE_MAINNET,
      "avalanche-fuji": ChainId.AVALANCHE_FUJI,
    };

    return chainMap[chainStr] || null;
  }

  /**
   * Map Zerion position type to our internal type
   */
  private mapPositionType(type: string): PositionType {
    const typeMap: Record<string, PositionType> = {
      wallet: PositionType.WALLET,
      "liquidity-pool": PositionType.LIQUIDITY_POOL,
      staked: PositionType.STAKING,
      deposit: PositionType.LENDING,
      borrow: PositionType.BORROWING,
      locked: PositionType.VESTING,
    };

    return typeMap[type] || PositionType.WALLET;
  }
}

// Singleton instance
let zerionClient: ZerionClient | null = null;

export function getZerionClient(): ZerionClient {
  if (!zerionClient) {
    zerionClient = new ZerionClient(process.env.ZERION_API_KEY);
  }
  return zerionClient;
}

