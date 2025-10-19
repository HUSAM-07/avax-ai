/**
 * Insight generation orchestrator
 * Coordinates portfolio analysis, OpenAI calls, and storage
 */

import {
  Portfolio,
  Insight,
  InsightType,
  InsightSeverity,
  InsightStatus,
  InsightPromptContext,
} from "@avax-ledger/types";
import { Logger } from "@avax-ledger/utils";
import { OpenAIClient } from "./openai-client";
import {
  getRiskAnalysisSystemPrompt,
  getRiskAnalysisUserPrompt,
  getRebalancingSystemPrompt,
  getRebalancingUserPrompt,
  getSentimentSystemPrompt,
  getSentimentUserPrompt,
} from "./prompts";
import { validateInsight } from "./validator";
import { Insight as InsightModel } from "../../../infrastructure/mongodb";

export interface InsightGenerationOptions {
  type: InsightType;
  walletAddress: string;
  portfolio: Portfolio;
  marketContext?: {
    topTokens24hChange: Record<string, number>;
    protocolTvlChanges: Record<string, number>;
  };
  userRiskTolerance?: "low" | "medium" | "high";
}

export interface InsightGenerationResult {
  insight: Insight | null;
  error?: string;
  tokensUsed: number;
  costUsd: number;
  durationMs: number;
}

/**
 * Generate AI insight for a portfolio
 */
export async function generateInsight(
  options: InsightGenerationOptions,
  openaiClient: OpenAIClient
): Promise<InsightGenerationResult> {
  const startTime = Date.now();

  try {
    Logger.insight("start", options.type, options.walletAddress);

    // Step 1: Prepare context
    const context = preparePromptContext(options);

    // Step 2: Get appropriate prompts for insight type
    const { systemPrompt, userPrompt } = getPromptsForType(options.type, context);

    // Step 3: Call OpenAI
    const completion = await openaiClient.generateCompletion(
      {
        systemPrompt,
        userPrompt,
      },
      options.walletAddress
    );

    // Step 4: Parse response
    const parsedInsight = parseInsightResponse(completion.content);

    if (!parsedInsight) {
      throw new Error("Failed to parse insight from OpenAI response");
    }

    // Step 5: Validate insight
    const validationResult = validateInsight(parsedInsight);

    if (!validationResult.isValid) {
      Logger.warn("Insight validation failed", {
        walletAddress: options.walletAddress,
        errors: validationResult.errors,
      });
      // Proceed with warnings, but log them
    }

    // Step 6: Create insight object
    const insight: Insight = {
      id: generateInsightId(),
      walletAddress: options.walletAddress,
      type: options.type,
      severity: parsedInsight.severity || InsightSeverity.INFO,
      status: InsightStatus.COMPLETED,
      title: parsedInsight.title,
      summary: parsedInsight.summary,
      detailedAnalysis: parsedInsight.detailedAnalysis,
      recommendations: parsedInsight.recommendations || [],
      confidence: parsedInsight.confidence || 0.8,
      tags: parsedInsight.tags || [options.type.toLowerCase()],
      portfolioSnapshot: {
        totalValueUsd: options.portfolio.totalValueUsd,
        tokenCount: options.portfolio.tokenCount,
        positionCount: options.portfolio.positions.length,
      },
      tokensUsed: completion.tokensUsed,
      generationTimeMs: completion.durationMs,
      costUsd: completion.costUsd,
      createdAt: new Date(),
    };

    // Step 7: Store in database
    await storeInsight(insight);

    const totalDuration = Date.now() - startTime;

    Logger.insight("complete", options.type, options.walletAddress, {
      duration: totalDuration,
      tokensUsed: completion.tokensUsed,
      costUsd: completion.costUsd,
      severity: insight.severity,
    });

    return {
      insight,
      tokensUsed: completion.tokensUsed,
      costUsd: completion.costUsd,
      durationMs: totalDuration,
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    Logger.insight("failed", options.type, options.walletAddress, {
      duration: totalDuration,
      error: (error as Error).message,
    });

    return {
      insight: null,
      error: (error as Error).message,
      tokensUsed: 0,
      costUsd: 0,
      durationMs: totalDuration,
    };
  }
}

/**
 * Prepare context for prompts
 */
function preparePromptContext(
  options: InsightGenerationOptions
): InsightPromptContext {
  const { portfolio, marketContext, userRiskTolerance } = options;

  // Calculate token percentages
  const tokens = portfolio.tokens.map((t) => ({
    symbol: t.token.symbol,
    valueUsd: t.valueUsd,
    percentage: (t.valueUsd / portfolio.totalValueUsd) * 100,
    priceChange24h: 0, // Would need to be passed in or calculated
  }));

  // Format positions
  const positions = portfolio.positions.map((p) => ({
    protocol: p.protocol,
    type: p.type,
    valueUsd: p.totalValueUsd,
    apr: p.apr,
  }));

  return {
    portfolio: {
      totalValueUsd: portfolio.totalValueUsd,
      tokens,
      positions,
    },
    market: marketContext || {
      topTokens24hChange: {},
      protocolTvlChanges: {},
    },
    user: {
      riskTolerance: userRiskTolerance || "medium",
    },
  };
}

/**
 * Get prompts based on insight type
 */
function getPromptsForType(
  type: InsightType,
  context: InsightPromptContext
): { systemPrompt: string; userPrompt: string } {
  switch (type) {
    case InsightType.RISK_EXPOSURE:
      return {
        systemPrompt: getRiskAnalysisSystemPrompt(),
        userPrompt: getRiskAnalysisUserPrompt(context),
      };

    case InsightType.REBALANCING:
      return {
        systemPrompt: getRebalancingSystemPrompt(),
        userPrompt: getRebalancingUserPrompt(context),
      };

    case InsightType.SENTIMENT_ALERT:
      return {
        systemPrompt: getSentimentSystemPrompt(),
        userPrompt: getSentimentUserPrompt(context),
      };

    default:
      throw new Error(`Unknown insight type: ${type}`);
  }
}

/**
 * Parse JSON response from OpenAI
 */
function parseInsightResponse(content: string): any {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;

    const parsed = JSON.parse(jsonContent);
    return parsed;
  } catch (error) {
    Logger.error("Failed to parse insight JSON", error as Error, {
      content: content.substring(0, 500),
    });
    return null;
  }
}

/**
 * Generate unique insight ID
 */
function generateInsightId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store insight in database
 */
async function storeInsight(insight: Insight): Promise<void> {
  try {
    await InsightModel.create({
      walletAddress: insight.walletAddress,
      type: insight.type,
      severity: insight.severity,
      status: insight.status,
      title: insight.title,
      summary: insight.summary,
      detailedAnalysis: insight.detailedAnalysis,
      recommendations: insight.recommendations,
      confidence: insight.confidence,
      tags: insight.tags,
      portfolioSnapshot: insight.portfolioSnapshot,
      tokensUsed: insight.tokensUsed,
      generationTimeMs: insight.generationTimeMs,
      costUsd: insight.costUsd,
      createdAt: insight.createdAt,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  } catch (error) {
    Logger.error("Failed to store insight", error as Error, {
      walletAddress: insight.walletAddress,
      type: insight.type,
    });
    throw error;
  }
}

/**
 * Batch generate multiple insights
 */
export async function generateBatchInsights(
  options: Omit<InsightGenerationOptions, "type">,
  types: InsightType[],
  openaiClient: OpenAIClient
): Promise<InsightGenerationResult[]> {
  const results: InsightGenerationResult[] = [];

  for (const type of types) {
    const result = await generateInsight(
      {
        ...options,
        type,
      },
      openaiClient
    );
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

