/**
 * Risk analysis prompt template
 */

import { InsightPromptContext } from "@avax-ledger/types";

export function getRiskAnalysisSystemPrompt(): string {
  return `You are an expert DeFi portfolio risk analyst with deep knowledge of Avalanche ecosystem protocols, impermanent loss, smart contract risks, and portfolio diversification.

Your role is to analyze a user's portfolio and provide clear, actionable risk assessment insights. Focus on:

1. **Concentration Risk**: Identify if the portfolio is too concentrated in single assets or protocols
2. **Protocol Risk**: Assess smart contract risk, audit status, and TVL changes of protocols used
3. **Impermanent Loss Risk**: Evaluate liquidity pool positions for IL exposure
4. **Market Risk**: Analyze exposure to volatile assets and market conditions
5. **Opportunity Cost**: Identify if assets are sitting idle when they could be earning yield

**Guidelines**:
- Be direct and specific about risks
- Use percentages and concrete numbers when possible
- Prioritize risks by severity (Critical > High > Medium > Low)
- Suggest concrete mitigation strategies
- Keep explanations clear for non-technical users
- Focus on actionable insights, not just descriptions

**Format your response as JSON** with this structure:
{
  "title": "Brief title (max 100 chars)",
  "summary": "2-3 sentence executive summary",
  "detailedAnalysis": "Comprehensive analysis (3-5 paragraphs)",
  "recommendations": [
    {
      "action": "Specific action to take",
      "description": "Why this helps",
      "priority": "high|medium|low",
      "estimatedImpact": "Expected benefit"
    }
  ],
  "severity": "INFO|LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": 0.0-1.0,
  "tags": ["risk", "concentration", etc]
}`;
}

export function getRiskAnalysisUserPrompt(context: InsightPromptContext): string {
  const { portfolio, market, user } = context;

  // Format portfolio summary
  const totalValue = portfolio.totalValueUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const topTokens = portfolio.tokens
    .slice(0, 5)
    .map((t) => `- ${t.symbol}: ${t.percentage.toFixed(2)}% ($${t.valueUsd.toLocaleString()})`)
    .join("\n");

  const positions = portfolio.positions
    .map(
      (p) =>
        `- ${p.protocol} (${p.type}): $${p.valueUsd.toLocaleString()}${
          p.apr ? ` @ ${p.apr.toFixed(2)}% APR` : ""
        }`
    )
    .join("\n");

  // Format market context
  const marketSummary = Object.entries(market.topTokens24hChange)
    .slice(0, 5)
    .map(([symbol, change]) => `- ${symbol}: ${change > 0 ? "+" : ""}${change.toFixed(2)}%`)
    .join("\n");

  const protocolSummary = Object.entries(market.protocolTvlChanges)
    .slice(0, 5)
    .map(([protocol, change]) => `- ${protocol}: ${change > 0 ? "+" : ""}${change.toFixed(2)}%`)
    .join("\n");

  return `Analyze the risk profile of this Avalanche DeFi portfolio:

**Portfolio Overview:**
Total Value: ${totalValue}
Number of Assets: ${portfolio.tokens.length}
Number of Positions: ${portfolio.positions.length}
User Risk Tolerance: ${user.riskTolerance}

**Top Holdings:**
${topTokens}

**DeFi Positions:**
${positions}

**Market Context (24h changes):**
Top Tokens:
${marketSummary}

Protocol TVL Changes:
${protocolSummary}

Provide a comprehensive risk analysis following the specified JSON format.`;
}

