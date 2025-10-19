/**
 * Portfolio calculation utilities
 * Pure functions for financial metrics
 */

import { Portfolio, Position, TokenBalance } from "@avax-ledger/types";

/**
 * Calculate portfolio diversification score (0-100)
 * Higher score = more diversified
 */
export function calculateDiversificationScore(portfolio: Portfolio): number {
  if (portfolio.tokens.length === 0) {
    return 0;
  }

  // Calculate Herfindahl-Hirschman Index (HHI)
  const totalValue = portfolio.totalValueUsd;
  if (totalValue === 0) {
    return 0;
  }

  let hhi = 0;
  for (const token of portfolio.tokens) {
    const share = token.valueUsd / totalValue;
    hhi += share * share;
  }

  // Normalize HHI to 0-100 scale
  // HHI ranges from 1/n (perfectly diversified) to 1 (concentrated)
  // We'll map it inversely: low HHI = high diversification score
  const maxHhi = 1;
  const minHhi = 1 / portfolio.tokens.length;
  const normalizedHhi = (hhi - minHhi) / (maxHhi - minHhi);
  
  // Invert so higher score means more diversified
  const score = (1 - normalizedHhi) * 100;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate portfolio risk score (0-100)
 * Higher score = more risky
 */
export function calculateRiskScore(portfolio: Portfolio): number {
  let riskScore = 0;
  const totalValue = portfolio.totalValueUsd;

  if (totalValue === 0) {
    return 0;
  }

  // Factor 1: Concentration risk (lack of diversification)
  const diversificationScore = calculateDiversificationScore(portfolio);
  riskScore += (100 - diversificationScore) * 0.3; // 30% weight

  // Factor 2: Volatility risk (based on 24h price changes)
  let weightedVolatility = 0;
  for (const token of portfolio.tokens) {
    const weight = token.valueUsd / totalValue;
    const volatility = Math.abs(token.price); // Simplified - would use actual volatility
    weightedVolatility += weight * volatility;
  }
  riskScore += Math.min(weightedVolatility * 10, 40); // 40% weight, capped

  // Factor 3: Protocol risk (DeFi positions)
  const defiPositionsValue = portfolio.positions
    .filter((p) => p.type !== "WALLET")
    .reduce((sum, p) => sum + p.totalValueUsd, 0);
  const defiExposure = (defiPositionsValue / totalValue) * 100;
  riskScore += defiExposure * 0.3; // 30% weight

  return Math.round(Math.max(0, Math.min(100, riskScore)));
}

/**
 * Calculate asset allocation percentages
 */
export function calculateAssetAllocation(
  portfolio: Portfolio
): Array<{ symbol: string; percentage: number; valueUsd: number }> {
  const totalValue = portfolio.totalValueUsd;
  if (totalValue === 0) {
    return [];
  }

  return portfolio.tokens
    .map((token) => ({
      symbol: token.token.symbol,
      percentage: (token.valueUsd / totalValue) * 100,
      valueUsd: token.valueUsd,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

/**
 * Calculate impermanent loss for LP positions
 * Returns percentage loss compared to holding
 */
export function calculateImpermanentLoss(
  initialPrice1: number,
  initialPrice2: number,
  currentPrice1: number,
  currentPrice2: number
): number {
  const priceRatio = (currentPrice1 / currentPrice2) / (initialPrice1 / initialPrice2);
  const k = Math.sqrt(priceRatio);
  
  const holdValue = (currentPrice1 / initialPrice1 + currentPrice2 / initialPrice2) / 2;
  const lpValue = 2 * k / (1 + priceRatio);
  
  const impermanentLoss = ((lpValue - holdValue) / holdValue) * 100;
  
  return impermanentLoss;
}

/**
 * Calculate APR from APY
 */
export function aprToApy(apr: number, compoundingPeriods: number = 365): number {
  return ((1 + apr / 100 / compoundingPeriods) ** compoundingPeriods - 1) * 100;
}

/**
 * Calculate APY from APR
 */
export function apyToApr(apy: number, compoundingPeriods: number = 365): number {
  return (((1 + apy / 100) ** (1 / compoundingPeriods) - 1) * compoundingPeriods) * 100;
}

/**
 * Calculate expected yield for a position
 */
export function calculateExpectedYield(
  principal: number,
  apr: number,
  daysHeld: number
): number {
  return (principal * apr / 100 * daysHeld) / 365;
}

/**
 * Calculate Sharpe ratio (risk-adjusted return)
 * Simplified version using returns and volatility
 */
export function calculateSharpeRatio(
  returns: number,
  volatility: number,
  riskFreeRate: number = 0.05 // 5% annual risk-free rate
): number {
  if (volatility === 0) {
    return 0;
  }
  return (returns - riskFreeRate) / volatility;
}

/**
 * Calculate position weight in portfolio
 */
export function calculatePositionWeight(
  positionValue: number,
  totalPortfolioValue: number
): number {
  if (totalPortfolioValue === 0) {
    return 0;
  }
  return (positionValue / totalPortfolioValue) * 100;
}

/**
 * Calculate portfolio volatility (simplified)
 * Using weighted standard deviation of token price changes
 */
export function calculatePortfolioVolatility(portfolio: Portfolio): number {
  if (portfolio.tokens.length === 0) {
    return 0;
  }

  const totalValue = portfolio.totalValueUsd;
  if (totalValue === 0) {
    return 0;
  }

  // Calculate weighted average of absolute price changes
  let weightedVolatility = 0;
  for (const token of portfolio.tokens) {
    const weight = token.valueUsd / totalValue;
    // Using 24h price change as proxy for volatility
    const priceChange = Math.abs(
      ((token.valueUsd - token.balanceFormatted * token.price) / 
       (token.balanceFormatted * token.price)) * 100
    );
    weightedVolatility += weight * priceChange;
  }

  return weightedVolatility;
}

/**
 * Calculate rebalancing suggestions
 * Returns suggested allocation to reach target risk level
 */
export function suggestRebalancing(
  portfolio: Portfolio,
  targetRiskLevel: "low" | "medium" | "high"
): Array<{
  symbol: string;
  currentPercentage: number;
  suggestedPercentage: number;
  action: "increase" | "decrease" | "hold";
}> {
  const currentAllocation = calculateAssetAllocation(portfolio);
  const suggestions: Array<any> = [];

  // Define target allocations based on risk level
  const targetProfiles = {
    low: { maxSingleAsset: 25, minDiversification: 10 }, // Max 25% in any asset
    medium: { maxSingleAsset: 40, minDiversification: 7 }, // Max 40% in any asset
    high: { maxSingleAsset: 60, minDiversification: 5 }, // Max 60% in any asset
  };

  const target = targetProfiles[targetRiskLevel];

  for (const asset of currentAllocation) {
    let suggestedPercentage = asset.percentage;
    let action: "increase" | "decrease" | "hold" = "hold";

    // If asset is overweight, suggest reducing
    if (asset.percentage > target.maxSingleAsset) {
      suggestedPercentage = target.maxSingleAsset;
      action = "decrease";
    }

    // If too few assets, suggest maintaining diversification
    if (currentAllocation.length < target.minDiversification) {
      // Distribute more evenly
      suggestedPercentage = 100 / target.minDiversification;
      action = asset.percentage < suggestedPercentage ? "increase" : "decrease";
    }

    suggestions.push({
      symbol: asset.symbol,
      currentPercentage: Math.round(asset.percentage * 100) / 100,
      suggestedPercentage: Math.round(suggestedPercentage * 100) / 100,
      action,
    });
  }

  return suggestions;
}

/**
 * Calculate total yield across all positions
 */
export function calculateTotalYield(positions: Position[]): number {
  let totalYield = 0;
  let totalValue = 0;

  for (const position of positions) {
    if (position.apr && position.apr > 0) {
      totalYield += (position.totalValueUsd * position.apr) / 100;
      totalValue += position.totalValueUsd;
    } else if (position.apy && position.apy > 0) {
      const apr = apyToApr(position.apy);
      totalYield += (position.totalValueUsd * apr) / 100;
      totalValue += position.totalValueUsd;
    }
  }

  if (totalValue === 0) {
    return 0;
  }

  return (totalYield / totalValue) * 100;
}

