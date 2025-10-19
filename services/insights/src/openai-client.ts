/**
 * OpenAI API client wrapper with token tracking and cost monitoring
 */

import OpenAI from "openai";
import { config, constants } from "@avax-ledger/config";
import { Logger } from "@avax-ledger/utils";
import { ApiUsage, ApiService } from "../../../infrastructure/mongodb";

export interface OpenAICompletionParams {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAICompletionResult {
  content: string;
  tokensUsed: number;
  costUsd: number;
  durationMs: number;
}

/**
 * OpenAI token pricing (as of 2024)
 * gpt-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
 */
const TOKEN_PRICING = {
  "gpt-4o-mini": {
    input: 0.15 / 1_000_000, // per token
    output: 0.60 / 1_000_000, // per token
  },
  "gpt-4o": {
    input: 5.00 / 1_000_000,
    output: 15.00 / 1_000_000,
  },
  "gpt-3.5-turbo": {
    input: 0.50 / 1_000_000,
    output: 1.50 / 1_000_000,
  },
};

export class OpenAIClient {
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || config.ai.openaiApiKey,
    });
    this.defaultModel = constants.OPENAI.MODEL;
  }

  /**
   * Generate completion with token tracking
   */
  async generateCompletion(
    params: OpenAICompletionParams,
    walletAddress?: string
  ): Promise<OpenAICompletionResult> {
    const startTime = Date.now();
    const model = params.model || this.defaultModel;

    try {
      Logger.info("Generating OpenAI completion", {
        model,
        walletAddress,
      });

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        max_tokens: params.maxTokens || constants.OPENAI.MAX_TOKENS,
        temperature: params.temperature ?? constants.OPENAI.TEMPERATURE,
      });

      const content = response.choices[0]?.message?.content || "";
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || 0;

      // Calculate cost
      const pricing = TOKEN_PRICING[model as keyof typeof TOKEN_PRICING] || 
                     TOKEN_PRICING["gpt-4o-mini"];
      const costUsd =
        promptTokens * pricing.input + completionTokens * pricing.output;

      const durationMs = Date.now() - startTime;

      // Log usage
      Logger.cost("openai", "completion", costUsd, {
        model,
        tokensUsed: totalTokens,
        promptTokens,
        completionTokens,
        duration: durationMs,
        walletAddress,
      });

      // Store usage in database
      await this.trackUsage({
        walletAddress,
        endpoint: "/chat/completions",
        tokensUsed: totalTokens,
        costUsd,
        durationMs,
        model,
      });

      return {
        content,
        tokensUsed: totalTokens,
        costUsd,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      Logger.error("OpenAI completion failed", error as Error, {
        model,
        duration: durationMs,
        walletAddress,
      });

      // Track error
      await this.trackUsage({
        walletAddress,
        endpoint: "/chat/completions",
        tokensUsed: 0,
        costUsd: 0,
        durationMs,
        model,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Generate streaming completion (for future use)
   */
  async *generateStreamingCompletion(
    params: OpenAICompletionParams
  ): AsyncGenerator<string, void, unknown> {
    const model = params.model || this.defaultModel;

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        max_tokens: params.maxTokens || constants.OPENAI.MAX_TOKENS,
        temperature: params.temperature ?? constants.OPENAI.TEMPERATURE,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      Logger.error("OpenAI streaming completion failed", error as Error, {
        model,
      });
      throw error;
    }
  }

  /**
   * Track API usage in database
   */
  private async trackUsage(params: {
    walletAddress?: string;
    endpoint: string;
    tokensUsed: number;
    costUsd: number;
    durationMs: number;
    model: string;
    error?: string;
  }): Promise<void> {
    try {
      await ApiUsage.create({
        walletAddress: params.walletAddress,
        service: ApiService.OPENAI,
        endpoint: params.endpoint,
        method: "POST",
        requestedAt: new Date(),
        responseStatus: params.error ? 500 : 200,
        responseTimeMs: params.durationMs,
        tokensUsed: params.tokensUsed,
        costUsd: params.costUsd,
        error: params.error,
        retries: 0,
        metadata: {
          model: params.model,
        },
      });
    } catch (error) {
      // Don't throw - just log the error
      Logger.error("Failed to track OpenAI usage", error as Error);
    }
  }

  /**
   * Get total cost for a time period
   */
  async getTotalCost(startDate: Date, endDate: Date): Promise<number> {
    try {
      const result = await ApiUsage.getTotalCostForPeriod(
        startDate,
        endDate,
        ApiService.OPENAI
      );
      return result.totalCost;
    } catch (error) {
      Logger.error("Failed to get total OpenAI cost", error as Error);
      return 0;
    }
  }

  /**
   * Get usage stats
   */
  async getUsageStats(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCost: number;
    totalRequests: number;
    avgResponseTime: number;
  }> {
    try {
      return await ApiUsage.getTotalCostForPeriod(
        startDate,
        endDate,
        ApiService.OPENAI
      );
    } catch (error) {
      Logger.error("Failed to get OpenAI usage stats", error as Error);
      return { totalCost: 0, totalRequests: 0, avgResponseTime: 0 };
    }
  }
}

// Singleton instance
let openaiClient: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!openaiClient) {
    openaiClient = new OpenAIClient();
  }
  return openaiClient;
}

