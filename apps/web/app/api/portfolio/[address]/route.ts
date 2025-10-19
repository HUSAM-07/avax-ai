/**
 * GET /api/portfolio/[address]
 * Fetch current portfolio snapshot for a wallet
 */

import { NextRequest, NextResponse } from "next/server";
import {
  connectToDatabase,
  PortfolioSnapshot,
} from "@/../../infrastructure/mongodb";
import { getZerionClient, getCoinGeckoClient, getDefiLlamaClient } from "@/lib/services";
import { aggregatePortfolio } from "@/../../services/portfolio";
import { Logger } from "@avax-ledger/utils";
import { ChainId, GetPortfolioRequestSchema } from "@avax-ledger/types";
import {
  calculateDiversificationScore,
  calculateRiskScore,
} from "@/../../services/portfolio";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const startTime = Date.now();
  const { address } = await params;

  try {
    // Validate input
    const { searchParams } = new URL(request.url);
    const validation = GetPortfolioRequestSchema.safeParse({
      address,
      includePositions: searchParams.get("include_positions") === "true",
      includeHistory: searchParams.get("include_history") === "true",
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error.errors[0].message,
            statusCode: 400,
          },
        },
        { status: 400 }
      );
    }

    const { address: validatedAddress } = validation.data;

    await connectToDatabase();

    // Check for recent snapshot (< 5 minutes old)
    const recentSnapshot = await PortfolioSnapshot.findOne({
      walletAddress: validatedAddress.toLowerCase(),
      timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    }).sort({ timestamp: -1 });

    let portfolio;

    if (recentSnapshot) {
      // Use cached snapshot
      Logger.debug("Using cached portfolio snapshot", {
        walletAddress: validatedAddress,
        age: Date.now() - recentSnapshot.timestamp.getTime(),
      });

      portfolio = {
        walletAddress: recentSnapshot.walletAddress,
        chainId: recentSnapshot.chainId,
        tokens: recentSnapshot.tokens,
        positions: recentSnapshot.positions,
        totalValueUsd: recentSnapshot.totalValueUsd,
        totalValueChange24h: recentSnapshot.totalValueChange24h,
        totalValueChange7d: recentSnapshot.totalValueChange7d,
        tokenCount: recentSnapshot.tokenCount,
        protocolCount: recentSnapshot.protocolCount,
        lastUpdated: recentSnapshot.timestamp,
      };
    } else {
      // Fetch fresh data
      Logger.info("Fetching fresh portfolio data", {
        walletAddress: validatedAddress,
      });

      const services = {
        zerionClient: getZerionClient(),
        coingeckoClient: getCoinGeckoClient(),
        defiLlamaClient: getDefiLlamaClient(),
      };

      portfolio = await aggregatePortfolio(
        validatedAddress,
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

      // Save snapshot
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
    }

    // Calculate additional metrics
    const riskScore = calculateRiskScore(portfolio);
    const diversificationScore = calculateDiversificationScore(portfolio);

    const duration = Date.now() - startTime;

    Logger.apiResponse("GET", `/api/portfolio/${address}`, 200, duration, {
      walletAddress: validatedAddress,
      totalValue: portfolio.totalValueUsd,
    });

    return NextResponse.json({
      success: true,
      data: {
        portfolio,
        riskScore,
        diversificationScore,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    Logger.error("Failed to fetch portfolio", error as Error, {
      walletAddress: address,
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch portfolio",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

