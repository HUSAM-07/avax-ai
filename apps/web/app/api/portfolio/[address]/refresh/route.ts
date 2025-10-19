/**
 * POST /api/portfolio/[address]/refresh
 * Force refresh portfolio data (rate limited)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import {
  connectToDatabase,
  PortfolioSnapshot,
} from "@/../../infrastructure/mongodb";
import { getZerionClient, getCoinGeckoClient, getDefiLlamaClient } from "@/lib/services";
import { aggregatePortfolio } from "@/../../services/portfolio";
import { Logger } from "@avax-ledger/utils";
import { ChainId } from "@avax-ledger/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const startTime = Date.now();
  const { address } = await params;

  try {
    // Require authentication
    const session = await requireAuth();

    // Verify user owns this wallet
    if (session.address.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only refresh your own portfolio",
            statusCode: 403,
          },
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Check rate limit: Max 1 refresh per minute
    const recentRefresh = await PortfolioSnapshot.findOne({
      walletAddress: address.toLowerCase(),
      timestamp: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentRefresh) {
      const waitTime = Math.ceil(
        (60 * 1000 - (Date.now() - recentRefresh.timestamp.getTime())) / 1000
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Please wait ${waitTime} seconds before refreshing again`,
            statusCode: 429,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": waitTime.toString(),
          },
        }
      );
    }

    Logger.info("Refreshing portfolio data", {
      walletAddress: address,
    });

    // Fetch fresh data
    const services = {
      zerionClient: getZerionClient(),
      coingeckoClient: getCoinGeckoClient(),
      defiLlamaClient: getDefiLlamaClient(),
    };

    const portfolio = await aggregatePortfolio(
      address,
      ChainId.AVALANCHE_MAINNET,
      services
    );

    if (!portfolio) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WALLET_NOT_FOUND",
            message: "No portfolio data found for this wallet",
            statusCode: 404,
          },
        },
        { status: 404 }
      );
    }

    // Save new snapshot
    await PortfolioSnapshot.create({
      walletAddress: portfolio.walletAddress,
      chainId: portfolio.chainId,
      tokens: portfolio.tokens,
      positions: portfolio.positions,
      totalValueUsd: portfolio.totalValueUsd,
      totalValueChange24h: portfolio.totalValueChange24h,
      totalValueChange7d: portfolio.totalValueChange7d,
      tokenCount: portfolio.tokenCount,
      protocolCount: portfolio.protocolCount,
      timestamp: new Date(),
    });

    const duration = Date.now() - startTime;

    Logger.apiResponse(
      "POST",
      `/api/portfolio/${address}/refresh`,
      200,
      duration,
      {
        walletAddress: address,
        totalValue: portfolio.totalValueUsd,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        status: "completed",
        portfolio,
        refreshedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    Logger.error("Failed to refresh portfolio", error as Error, {
      walletAddress: address,
      duration,
    });

    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            statusCode: 401,
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refresh portfolio",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

