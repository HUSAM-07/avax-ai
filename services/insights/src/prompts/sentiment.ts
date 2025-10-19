/**
 * Market sentiment alert prompt template
 */

import { InsightPromptContext } from "@avax-ledger/types";

export function getSentimentSystemPrompt(): string {
  return `You are an expert DeFi market analyst specializing in on-chain metrics, sentiment analysis, and risk alerts for the Avalanche ecosystem.

Your role is to identify urgent market conditions, protocol issues, or opportunities that require immediate attention. Focus on:

1. **Protocol Health**: Sudden TVL drops, exploits, or migrations
2. **Token Momentum**: Unusual price movements or volume changes
3. **Market Conditions**: Broader crypto market trends affecting the portfolio
4. **Opportunities**: Emerging yield opportunities or protocol launches
5. **Risks**: Potential liquidations, depegging events, or smart contract issues

**Alert Criteria** (raise alert if):
- Token drops >15% in 24h with significant position
- Protocol TVL drops >20% in 24h
- Unusual volume spikes (>300% increase)
- Stablecoin depeg >2%
- New high-yield opportunity (>20% APR increase)

**Guidelines**:
- Only generate alerts for significant events requiring action
- Distinguish between normal volatility and genuine concerns
- Provide clear next steps (monitor, reduce exposure, take profit, etc.)
- Include time-sensitive context ("in the last 4 hours", "urgent")
- Be specific about which positions are affected

**Format your response as JSON** with this structure:
{
  "title": "Brief alert title (max 100 chars)",
  "summary": "2-3 sentence summary of the situation",
  "detailedAnalysis": "Detailed explanation of the event and its impact",
  "recommendations": [
    {
      "action": "Immediate action to consider",
      "description": "Why this action is recommended now",
      "priority": "high|medium|low",
      "estimatedImpact": "Potential outcome of taking/not taking action"
    }
  ],
  "severity": "INFO|LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": 0.0-1.0,
  "tags": ["sentiment", "alert", specific asset/protocol names]
}`;
}

export function getSentimentUserPrompt(context: InsightPromptContext): string {
  const { portfolio, market } = context;

  const totalValue = portfolio.totalValueUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Identify significantly affected holdings
  const affectedHoldings = portfolio.tokens
    .filter((t) => Math.abs(t.priceChange24h) > 10)
    .map(
      (t) =>
        `- ${t.symbol}: ${t.priceChange24h > 0 ? "+" : ""}${t.priceChange24h.toFixed(
          2
        )}% (${t.percentage.toFixed(2)}% of portfolio, $${t.valueUsd.toLocaleString()})`
    );

  const affectedSummary = affectedHoldings.length > 0 
    ? `\nHoldings with Significant Price Moves:\n${affectedHoldings.join("\n")}`
    : "\nNo significant price movements in held assets.";

  // Protocol changes
  const protocolChanges = Object.entries(market.protocolTvlChanges)
    .filter(([_, change]) => Math.abs(change) > 15)
    .map(
      ([protocol, change]) =>
        `- ${protocol}: ${change > 0 ? "+" : ""}${change.toFixed(2)}% TVL change`
    );

  const protocolSummary = protocolChanges.length > 0
    ? `\nProtocols with Significant TVL Changes:\n${protocolChanges.join("\n")}`
    : "\nNo significant protocol TVL changes.";

  // Current positions
  const positions = portfolio.positions
    .map(
      (p) =>
        `- ${p.protocol} (${p.type}): $${p.valueUsd.toLocaleString()} (${(
          (p.totalValueUsd / portfolio.totalValueUsd) *
          100
        ).toFixed(2)}%)${p.apr ? ` @ ${p.apr.toFixed(2)}% APR` : ""}`
    )
    .join("\n");

  return `Analyze current market conditions and identify any urgent alerts for this Avalanche portfolio:

**Portfolio Overview:**
Total Value: ${totalValue}
Number of Positions: ${portfolio.positions.length}

**Current Positions:**
${positions}

**Market Data:**${affectedSummary}${protocolSummary}

**All Token Price Changes (24h):**
${JSON.stringify(market.topTokens24hChange, null, 2)}

**All Protocol TVL Changes (24h):**
${JSON.stringify(market.protocolTvlChanges, null, 2)}

Are there any urgent alerts, concerns, or opportunities this user should know about? If yes, provide detailed alert. If no significant events, return null or state "No urgent alerts at this time."`;
}

