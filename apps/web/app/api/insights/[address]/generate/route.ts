/**
 * POST /api/insights/[address]/generate
 * Generate new AI insight for a wallet (authenticated, rate limited)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import {
  connectToDatabase,
  PortfolioSnapshot,
  Insight,
  User,
} from "@/../../infrastructure/mongodb";
import { getOpenAIClient } from "@/../../services/insights";
import { generateInsight } from "@/../../services/insights";
import { Logger } from "@avax-ledger/utils";
import { GenerateInsightRequestSchema, ChainId } from "@avax-ledger/types";

// Rate limit: 10 insights per hour per wallet
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;

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
            message: "You can only generate insights for your own wallet",
            statusCode: 403,
          },
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = GenerateInsightRequestSchema.safeParse({
      ...body,
      address,
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

    const { type, context } = validation.data;

    await connectToDatabase();

    // Check rate limit
    const recentInsights = await Insight.countDocuments({
      walletAddress: address.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW) },
    });

    if (recentInsights >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Maximum ${RATE_LIMIT_MAX} insights per hour exceeded`,
            statusCode: 429,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": "3600", // 1 hour
          },
        }
      );
    }

    // Get latest portfolio snapshot
    const portfolioSnapshot = await PortfolioSnapshot.findOne({
      walletAddress: address.toLowerCase(),
    })
      .sort({ timestamp: -1 })
      .lean();

    if (!portfolioSnapshot) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_DATA",
            message: "No portfolio data found. Please refresh your portfolio first.",
            statusCode: 404,
          },
        },
        { status: 404 }
      );
    }

    // Convert to Portfolio type
    const portfolio = {
      walletAddress: portfolioSnapshot.walletAddress,
      chainId: portfolioSnapshot.chainId as ChainId,
      tokens: portfolioSnapshot.tokens,
      positions: portfolioSnapshot.positions,
      totalValueUsd: portfolioSnapshot.totalValueUsd,
      totalValueChange24h: portfolioSnapshot.totalValueChange24h || 0,
      totalValueChange7d: portfolioSnapshot.totalValueChange7d || 0,
      tokenCount: portfolioSnapshot.tokenCount,
      protocolCount: portfolioSnapshot.protocolCount,
      lastUpdated: portfolioSnapshot.timestamp,
    };

    // Get user preferences
    const user = await User.findOne({
      walletAddress: address.toLowerCase(),
    });

    // Generate insight
    const openaiClient = getOpenAIClient();
    const result = await generateInsight(
      {
        type,
        walletAddress: address,
        portfolio,
        marketContext: context as any,
        userRiskTolerance: user?.preferences.riskTolerance || "medium",
      },
      openaiClient
    );

    if (!result.insight) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSIGHT_GENERATION_FAILED",
            message: result.error || "Failed to generate insight",
            statusCode: 500,
          },
        },
        { status: 500 }
      );
    }

    // Update user stats
    if (user) {
      await user.incrementInsightCount();
    }

    const duration = Date.now() - startTime;

    Logger.apiResponse(
      "POST",
      `/api/insights/${address}/generate`,
      200,
      duration,
      {
        walletAddress: address,
        type,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        status: "completed",
        insight: result.insight,
        metrics: {
          tokensUsed: result.tokensUsed,
          costUsd: result.costUsd,
          durationMs: result.durationMs,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    Logger.error("Failed to generate insight", error as Error, {
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
          message: "Failed to generate insight",
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

