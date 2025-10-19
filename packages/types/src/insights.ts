/**
 * AI Insight types
 */

import { z } from "zod";

/**
 * Types of insights that can be generated
 */
export enum InsightType {
  RISK_EXPOSURE = "RISK_EXPOSURE",
  REBALANCING = "REBALANCING",
  SENTIMENT_ALERT = "SENTIMENT_ALERT",
}

/**
 * Severity level of an insight
 */
export enum InsightSeverity {
  INFO = "INFO",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/**
 * Status of insight generation
 */
export enum InsightStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Actionable recommendation within an insight
 */
export interface InsightRecommendation {
  action: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimatedImpact?: string;
  links?: {
    label: string;
    url: string;
  }[];
}

/**
 * Generated AI insight
 */
export interface Insight {
  id: string;
  walletAddress: string;
  type: InsightType;
  severity: InsightSeverity;
  status: InsightStatus;
  
  // AI-generated content
  title: string;
  summary: string;
  detailedAnalysis: string;
  recommendations: InsightRecommendation[];
  
  // Metadata
  confidence: number; // 0-1 scale
  tags: string[];
  
  // Context used for generation
  portfolioSnapshot: {
    totalValueUsd: number;
    tokenCount: number;
    positionCount: number;
    diversificationScore?: number;
    riskScore?: number;
  };
  
  // Metrics
  tokensUsed?: number; // OpenAI tokens
  generationTimeMs?: number;
  costUsd?: number;
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
  viewedAt?: Date;
  dismissedAt?: Date;
}

/**
 * Insight generation job
 */
export interface InsightJob {
  id: string;
  walletAddress: string;
  type: InsightType;
  status: InsightStatus;
  error?: string;
  insight?: Insight;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Insight prompt context
 */
export interface InsightPromptContext {
  portfolio: {
    totalValueUsd: number;
    tokens: Array<{
      symbol: string;
      valueUsd: number;
      percentage: number;
      priceChange24h: number;
    }>;
    positions: Array<{
      protocol: string;
      type: string;
      valueUsd: number;
      apr?: number;
    }>;
  };
  market: {
    topTokens24hChange: Record<string, number>;
    protocolTvlChanges: Record<string, number>;
  };
  user: {
    riskTolerance: "low" | "medium" | "high";
  };
}

/**
 * OpenAI API usage tracking
 */
export interface ApiUsage {
  id: string;
  walletAddress?: string;
  service: "openai" | "zerion" | "coingecko" | "defillama";
  endpoint: string;
  
  // Request details
  requestedAt: Date;
  responseStatus: number;
  responseTimeMs: number;
  
  // Cost tracking (for OpenAI)
  tokensUsed?: number;
  costUsd?: number;
  
  // Error tracking
  error?: string;
  retries?: number;
}

/**
 * Zod schemas for validation
 */

export const InsightRecommendationSchema = z.object({
  action: z.string(),
  description: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  estimatedImpact: z.string().optional(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string().url(),
  })).optional(),
});

export const InsightSchema = z.object({
  id: z.string(),
  walletAddress: z.string(),
  type: z.nativeEnum(InsightType),
  severity: z.nativeEnum(InsightSeverity),
  status: z.nativeEnum(InsightStatus),
  title: z.string(),
  summary: z.string(),
  detailedAnalysis: z.string(),
  recommendations: z.array(InsightRecommendationSchema),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
  portfolioSnapshot: z.object({
    totalValueUsd: z.number(),
    tokenCount: z.number().int(),
    positionCount: z.number().int(),
    diversificationScore: z.number().optional(),
    riskScore: z.number().optional(),
  }),
  tokensUsed: z.number().int().optional(),
  generationTimeMs: z.number().int().optional(),
  costUsd: z.number().optional(),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
  viewedAt: z.date().optional(),
  dismissedAt: z.date().optional(),
});

