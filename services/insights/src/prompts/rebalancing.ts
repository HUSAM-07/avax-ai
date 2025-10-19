/**
 * Rebalancing suggestion prompt template
 */

import { InsightPromptContext } from "@avax-ledger/types";

export function getRebalancingSystemPrompt(): string {
  return `You are an expert DeFi portfolio manager specializing in optimal asset allocation and rebalancing strategies for Avalanche ecosystem.

Your role is to analyze a user's portfolio and provide specific, actionable rebalancing recommendations. Consider:

1. **Diversification**: Optimal number of assets and allocation percentages
2. **Risk-Adjusted Returns**: Balance between yield opportunities and risk
3. **Gas Costs**: Only suggest rebalancing when benefits outweigh transaction costs
4. **Market Timing**: Current market conditions and momentum
5. **User Risk Profile**: Align with user's risk tolerance (low/medium/high)

**Rebalancing Principles**:
- Low Risk: Max 20% in any single asset, prioritize stablecoins and blue-chip tokens
- Medium Risk: Max 30% in any single asset, balanced mix
- High Risk: Max 50% in any single asset, higher allocation to growth tokens

**Guidelines**:
- Only suggest rebalancing if expected benefit > 5% improvement
- Account for ~$5-20 in gas fees per transaction
- Suggest specific percentage changes, not vague advice
- Prioritize high-impact, low-effort changes
- Consider tax implications (mention if selling at loss/gain)

**Format your response as JSON** with this structure:
{
  "title": "Brief title (max 100 chars)",
  "summary": "2-3 sentence executive summary",
  "detailedAnalysis": "Comprehensive analysis (3-5 paragraphs)",
  "recommendations": [
    {
      "action": "Specific rebalancing action (e.g., 'Reduce AVAX from 45% to 30%')",
      "description": "Rationale and expected benefit",
      "priority": "high|medium|low",
      "estimatedImpact": "Expected improvement (e.g., 'Reduce portfolio volatility by 15%')"
    }
  ],
  "severity": "INFO|LOW|MEDIUM",
  "confidence": 0.0-1.0,
  "tags": ["rebalancing", "diversification", etc]
}`;
}

export function getRebalancingUserPrompt(context: InsightPromptContext): string {
  const { portfolio, market, user } = context;

  const totalValue = portfolio.totalValueUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Calculate current allocation
  const allocation = portfolio.tokens
    .map((t) => ({
      symbol: t.symbol,
      percentage: t.percentage,
      value: t.valueUsd,
      priceChange24h: t.priceChange24h,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const allocationSummary = allocation
    .slice(0, 10)
    .map(
      (a) =>
        `- ${a.symbol}: ${a.percentage.toFixed(2)}% ($${a.value.toLocaleString()}) | 24h: ${
          a.priceChange24h > 0 ? "+" : ""
        }${a.priceChange24h.toFixed(2)}%`
    )
    .join("\n");

  // Calculate concentration metrics
  const topAssetPercentage = allocation[0]?.percentage || 0;
  const top3Percentage = allocation.slice(0, 3).reduce((sum, a) => sum + a.percentage, 0);

  const positions = portfolio.positions
    .map(
      (p) =>
        `- ${p.protocol} (${p.type}): $${p.valueUsd.toLocaleString()}${
          p.apr ? ` @ ${p.apr.toFixed(2)}% APR` : ""
        }`
    )
    .join("\n");

  const idleAssets = portfolio.tokens.filter((t) => t.valueUsd > 100 && !portfolio.positions.some(p => 
    p.tokens.some(pt => pt.token.address.toLowerCase() === t.token.address.toLowerCase())
  ));

  const idleSummary = idleAssets.length > 0 
    ? `\nIdle Assets (not earning yield):\n${idleAssets
        .map((t) => `- ${t.symbol}: $${t.valueUsd.toLocaleString()}`)
        .join("\n")}`
    : "";

  return `Analyze this Avalanche portfolio and suggest optimal rebalancing strategy:

**Portfolio Overview:**
Total Value: ${totalValue}
Number of Assets: ${portfolio.tokens.length}
User Risk Tolerance: ${user.riskTolerance}
Largest Position: ${topAssetPercentage.toFixed(2)}%
Top 3 Assets: ${top3Percentage.toFixed(2)}% of portfolio

**Current Allocation:**
${allocationSummary}

**DeFi Positions:**
${positions}
${idleSummary}

**Market Context:**
Recent Price Movements: ${JSON.stringify(market.topTokens24hChange)}
Protocol TVL Changes: ${JSON.stringify(market.protocolTvlChanges)}

Should this portfolio be rebalanced? If yes, provide specific recommendations. If no, explain why current allocation is optimal.`;
}

