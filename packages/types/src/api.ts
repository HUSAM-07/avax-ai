/**
 * API request and response types
 */

import { z } from "zod";
import { Portfolio, Position, TokenBalance } from "./blockchain";
import { Insight } from "./insights";

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  
  // Business logic errors
  WALLET_NOT_FOUND = "WALLET_NOT_FOUND",
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA",
  INSIGHT_GENERATION_FAILED = "INSIGHT_GENERATION_FAILED",
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Portfolio API endpoints
 */

export interface GetPortfolioRequest {
  address: string;
  includePositions?: boolean;
  includeHistory?: boolean;
}

export interface GetPortfolioResponse {
  portfolio: Portfolio;
  riskScore?: number;
  diversificationScore?: number;
}

export interface GetPortfolioHistoryRequest extends PaginationParams {
  address: string;
  startDate?: string;
  endDate?: string;
}

export interface GetPortfolioHistoryResponse extends PaginatedResponse<{
  timestamp: Date;
  totalValueUsd: number;
  tokenCount: number;
  positionCount: number;
}> {}

export interface RefreshPortfolioRequest {
  address: string;
  force?: boolean;
}

export interface RefreshPortfolioResponse {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  estimatedCompletionTime?: number; // milliseconds
}

/**
 * Insights API endpoints
 */

export interface GenerateInsightRequest {
  address: string;
  type: "RISK_EXPOSURE" | "REBALANCING" | "SENTIMENT_ALERT";
  context?: Record<string, unknown>;
}

export interface GenerateInsightResponse {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  insight?: Insight;
}

export interface GetInsightsRequest extends PaginationParams {
  address: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetInsightsResponse extends PaginatedResponse<Insight> {}

/**
 * Authentication API endpoints
 */

export interface GetNonceRequest {
  address: string;
}

export interface GetNonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface VerifySignatureRequest {
  message: string;
  signature: string;
  address: string;
}

export interface VerifySignatureResponse {
  success: boolean;
  sessionId: string;
  user: {
    address: string;
    createdAt: string;
  };
}

/**
 * User API endpoints
 */

export interface GetUserRequest {
  address: string;
}

export interface GetUserResponse {
  address: string;
  preferences: {
    notifications: boolean;
    riskTolerance: "low" | "medium" | "high";
    theme: "light" | "dark" | "system";
  };
  stats: {
    totalInsightsGenerated: number;
    lastLoginAt: string;
    createdAt: string;
  };
}

export interface UpdateUserPreferencesRequest {
  address: string;
  preferences: {
    notifications?: boolean;
    riskTolerance?: "low" | "medium" | "high";
    theme?: "light" | "dark" | "system";
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  services: {
    database: "up" | "down";
    openai: "up" | "down";
    externalApis: {
      zerion: "up" | "down";
      coingecko: "up" | "down";
      defillama: "up" | "down";
    };
  };
  uptime: number; // seconds
}

/**
 * Zod schemas for request validation
 */

export const GetPortfolioRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  includePositions: z.boolean().optional(),
  includeHistory: z.boolean().optional(),
});

export const GenerateInsightRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  type: z.enum(["RISK_EXPOSURE", "REBALANCING", "SENTIMENT_ALERT"]),
  context: z.record(z.unknown()).optional(),
});

export const VerifySignatureRequestSchema = z.object({
  message: z.string().min(1),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, "Invalid signature"),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

