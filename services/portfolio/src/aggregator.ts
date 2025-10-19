/**
 * Portfolio aggregation service
 * Orchestrates data fetching from multiple sources
 */

import {
  Portfolio,
  ChainId,
  TokenBalance,
  Position,
} from "@avax-ledger/types";
import { Logger } from "@avax-ledger/utils";
import {
  calculateDiversificationScore,
  calculateRiskScore,
  calculateTotalYield,
} from "./calculator";

// Import service clients
// Note: These will be passed as dependencies to avoid circular imports
export interface PortfolioServices {
  zerionClient: any;
  coingeckoClient: any;
  defiLlamaClient: any;
}

/**
 * Aggregate portfolio data from multiple sources
 */
export async function aggregatePortfolio(
  walletAddress: string,
  chainId: ChainId,
  services: PortfolioServices
): Promise<Portfolio | null> {
  const startTime = Date.now();

  try {
    Logger.info("Starting portfolio aggregation", {
      walletAddress,
      chainId,
    });

    // Step 1: Fetch portfolio from Zerion (primary source)
    const zerionPortfolio = await services.zerionClient.getWalletPortfolio(
      walletAddress
    );

    if (!zerionPortfolio) {
      Logger.warn("No portfolio data from Zerion", { walletAddress });
      return null;
    }

    // Step 2: Enrich with price data from CoinGecko
    const enrichedPortfolio = await enrichWithPrices(
      zerionPortfolio,
      services.coingeckoClient,
      chainId
    );

    // Step 3: Enrich DeFi positions with protocol data
    const finalPortfolio = await enrichWithProtocolData(
      enrichedPortfolio,
      services.defiLlamaClient
    );

    // Step 4: Calculate additional metrics
    const portfolioWithMetrics = addCalculatedMetrics(finalPortfolio);

    const duration = Date.now() - startTime;
    Logger.info("Portfolio aggregation completed", {
      walletAddress,
      duration,
      totalValue: portfolioWithMetrics.totalValueUsd,
      tokenCount: portfolioWithMetrics.tokenCount,
      positionCount: portfolioWithMetrics.positions.length,
    });

    return portfolioWithMetrics;
  } catch (error) {
    const duration = Date.now() - startTime;
    Logger.error("Portfolio aggregation failed", error as Error, {
      walletAddress,
      chainId,
      duration,
    });

    return null;
  }
}

/**
 * Enrich portfolio with latest price data
 */
async function enrichWithPrices(
  portfolio: Portfolio,
  coingeckoClient: any,
  chainId: ChainId
): Promise<Portfolio> {
  try {
    // Extract all token addresses
    const tokenAddresses = Array.from(
      new Set([
        ...portfolio.tokens.map((t) => t.token.address),
        ...portfolio.positions.flatMap((p) =>
          p.tokens.map((t) => t.token.address)
        ),
      ])
    );

    // Fetch batch prices
    const priceMap = await coingeckoClient.getBatchTokenPrices(
      chainId,
      tokenAddresses
    );

    // Update token prices
    const updatedTokens = portfolio.tokens.map((token) => {
      const priceData = priceMap.get(token.token.address.toLowerCase());
      if (priceData) {
        return {
          ...token,
          price: priceData.priceUsd,
          valueUsd: token.balanceFormatted * priceData.priceUsd,
        };
      }
      return token;
    });

    // Update position prices
    const updatedPositions = portfolio.positions.map((position) => {
      const updatedPositionTokens = position.tokens.map((token) => {
        const priceData = priceMap.get(token.token.address.toLowerCase());
        if (priceData) {
          return {
            ...token,
            price: priceData.priceUsd,
            valueUsd: token.balanceFormatted * priceData.priceUsd,
          };
        }
        return token;
      });

      const totalValueUsd = updatedPositionTokens.reduce(
        (sum, t) => sum + t.valueUsd,
        0
      );

      return {
        ...position,
        tokens: updatedPositionTokens,
        totalValueUsd,
      };
    });

    // Recalculate total value
    const totalValueUsd =
      updatedTokens.reduce((sum, t) => sum + t.valueUsd, 0) +
      updatedPositions.reduce((sum, p) => sum + p.totalValueUsd, 0);

    return {
      ...portfolio,
      tokens: updatedTokens,
      positions: updatedPositions,
      totalValueUsd,
    };
  } catch (error) {
    Logger.error("Failed to enrich with prices", error as Error);
    return portfolio;
  }
}

/**
 * Enrich positions with protocol data from DeFi Llama
 */
async function enrichWithProtocolData(
  portfolio: Portfolio,
  defiLlamaClient: any
): Promise<Portfolio> {
  try {
    // Get protocol data for each unique protocol
    const protocols = new Set(portfolio.positions.map((p) => p.protocol));
    const protocolDataMap = new Map<string, any>();

    for (const protocolName of protocols) {
      if (protocolName === "Wallet") continue;

      try {
        const protocolSlug = protocolName.toLowerCase().replace(/\s+/g, "-");
        const protocolData = await defiLlamaClient.getProtocol(protocolSlug);
        if (protocolData) {
          protocolDataMap.set(protocolName, protocolData);
        }
      } catch (error) {
        // Protocol not found, skip
        continue;
      }
    }

    // Enrich positions with protocol data
    const enrichedPositions = portfolio.positions.map((position) => {
      const protocolData = protocolDataMap.get(position.protocol);
      if (protocolData) {
        return {
          ...position,
          protocolLogoUrl: protocolData.logo,
        };
      }
      return position;
    });

    return {
      ...portfolio,
      positions: enrichedPositions,
    };
  } catch (error) {
    Logger.error("Failed to enrich with protocol data", error as Error);
    return portfolio;
  }
}

/**
 * Add calculated metrics to portfolio
 */
function addCalculatedMetrics(portfolio: Portfolio): Portfolio {
  const diversificationScore = calculateDiversificationScore(portfolio);
  const riskScore = calculateRiskScore(portfolio);
  const totalYield = calculateTotalYield(portfolio.positions);

  // Add to portfolio metadata (extend type if needed)
  return {
    ...portfolio,
    // These would need to be added to the Portfolio type
    // diversificationScore,
    // riskScore,
    // totalYield,
  };
}

/**
 * Calculate portfolio value changes
 */
export async function calculatePortfolioChanges(
  currentPortfolio: Portfolio,
  historicalSnapshots: any[]
): Promise<{
  change24h: number;
  change7d: number;
  change30d: number;
}> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const snapshot24h = historicalSnapshots.find(
    (s) => Math.abs(s.timestamp.getTime() - (now - day)) < 3600000 // Within 1 hour
  );

  const snapshot7d = historicalSnapshots.find(
    (s) => Math.abs(s.timestamp.getTime() - (now - 7 * day)) < 3600000
  );

  const snapshot30d = historicalSnapshots.find(
    (s) => Math.abs(s.timestamp.getTime() - (now - 30 * day)) < 3600000
  );

  const change24h = snapshot24h
    ? ((currentPortfolio.totalValueUsd - snapshot24h.totalValueUsd) /
        snapshot24h.totalValueUsd) *
      100
    : 0;

  const change7d = snapshot7d
    ? ((currentPortfolio.totalValueUsd - snapshot7d.totalValueUsd) /
        snapshot7d.totalValueUsd) *
      100
    : 0;

  const change30d = snapshot30d
    ? ((currentPortfolio.totalValueUsd - snapshot30d.totalValueUsd) /
        snapshot30d.totalValueUsd) *
      100
    : 0;

  return {
    change24h,
    change7d,
    change30d,
  };
}

