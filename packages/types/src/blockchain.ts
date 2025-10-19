/**
 * Blockchain-related types for Avalanche and EVM chains
 */

import { z } from "zod";

/**
 * Supported blockchain networks
 */
export enum ChainId {
  AVALANCHE_MAINNET = 43114,
  AVALANCHE_FUJI = 43113,
}

/**
 * Token standard types
 */
export enum TokenStandard {
  ERC20 = "ERC20",
  ERC721 = "ERC721",
  ERC1155 = "ERC1155",
  NATIVE = "NATIVE",
}

/**
 * Position types in DeFi
 */
export enum PositionType {
  WALLET = "WALLET",
  LIQUIDITY_POOL = "LIQUIDITY_POOL",
  STAKING = "STAKING",
  LENDING = "LENDING",
  BORROWING = "BORROWING",
  FARMING = "FARMING",
  VESTING = "VESTING",
}

/**
 * Token information
 */
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: ChainId;
  standard: TokenStandard;
  logoUrl?: string;
  coingeckoId?: string;
}

/**
 * Token price information
 */
export interface TokenPrice {
  address: string;
  symbol: string;
  priceUsd: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: Date;
}

/**
 * Token balance in a wallet or position
 */
export interface TokenBalance {
  token: Token;
  balance: string; // Raw balance as string to avoid precision issues
  balanceFormatted: number; // Human-readable balance
  valueUsd: number;
  price: number;
}

/**
 * DeFi position (LP, staking, etc.)
 */
export interface Position {
  id: string;
  type: PositionType;
  protocol: string;
  protocolLogoUrl?: string;
  name: string;
  chainId: ChainId;
  
  // Token balances in this position
  tokens: TokenBalance[];
  
  // Total value
  totalValueUsd: number;
  
  // Yield information (if applicable)
  apr?: number;
  apy?: number;
  rewards?: TokenBalance[];
  
  // LP-specific data
  poolShare?: number; // Percentage of pool owned
  poolTotalValueUsd?: number;
  
  // Metadata
  createdAt?: Date;
  lastUpdated: Date;
}

/**
 * Complete portfolio for a wallet address
 */
export interface Portfolio {
  walletAddress: string;
  chainId: ChainId;
  
  // Token holdings
  tokens: TokenBalance[];
  
  // DeFi positions
  positions: Position[];
  
  // Aggregated metrics
  totalValueUsd: number;
  totalValueChange24h: number;
  totalValueChange7d: number;
  
  // Diversification
  tokenCount: number;
  protocolCount: number;
  
  // Last update timestamp
  lastUpdated: Date;
}

/**
 * Historical portfolio snapshot
 */
export interface PortfolioSnapshot {
  id: string;
  walletAddress: string;
  chainId: ChainId;
  totalValueUsd: number;
  tokens: TokenBalance[];
  positions: Position[];
  timestamp: Date;
}

/**
 * Transaction on blockchain
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: Date;
  blockNumber: number;
  status: "success" | "failed" | "pending";
  chainId: ChainId;
}

/**
 * Protocol information
 */
export interface Protocol {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  category: string;
  chainId: ChainId;
  tvl?: number;
  tvlChange24h?: number;
}

/**
 * Zod schemas for runtime validation
 */

export const TokenSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number().int().min(0).max(18),
  chainId: z.nativeEnum(ChainId),
  standard: z.nativeEnum(TokenStandard),
  logoUrl: z.string().url().optional(),
  coingeckoId: z.string().optional(),
});

export const TokenBalanceSchema = z.object({
  token: TokenSchema,
  balance: z.string(),
  balanceFormatted: z.number(),
  valueUsd: z.number(),
  price: z.number(),
});

export const PositionSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(PositionType),
  protocol: z.string(),
  protocolLogoUrl: z.string().url().optional(),
  name: z.string(),
  chainId: z.nativeEnum(ChainId),
  tokens: z.array(TokenBalanceSchema),
  totalValueUsd: z.number(),
  apr: z.number().optional(),
  apy: z.number().optional(),
  rewards: z.array(TokenBalanceSchema).optional(),
  poolShare: z.number().optional(),
  poolTotalValueUsd: z.number().optional(),
  createdAt: z.date().optional(),
  lastUpdated: z.date(),
});

export const PortfolioSchema = z.object({
  walletAddress: z.string(),
  chainId: z.nativeEnum(ChainId),
  tokens: z.array(TokenBalanceSchema),
  positions: z.array(PositionSchema),
  totalValueUsd: z.number(),
  totalValueChange24h: z.number(),
  totalValueChange7d: z.number(),
  tokenCount: z.number().int(),
  protocolCount: z.number().int(),
  lastUpdated: z.date(),
});

