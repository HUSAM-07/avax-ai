/**
 * Insight validation utilities
 * Validates AI-generated insights for quality and safety
 */

import { InsightSeverity } from "@avax-ledger/types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate insight structure and content
 */
export function validateInsight(insight: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!insight.title || typeof insight.title !== "string") {
    errors.push("Missing or invalid title");
  } else if (insight.title.length > 150) {
    errors.push("Title too long (max 150 characters)");
  }

  if (!insight.summary || typeof insight.summary !== "string") {
    errors.push("Missing or invalid summary");
  } else if (insight.summary.length < 50) {
    warnings.push("Summary is quite short");
  } else if (insight.summary.length > 500) {
    errors.push("Summary too long (max 500 characters)");
  }

  if (!insight.detailedAnalysis || typeof insight.detailedAnalysis !== "string") {
    errors.push("Missing or invalid detailed analysis");
  } else if (insight.detailedAnalysis.length < 100) {
    warnings.push("Detailed analysis is quite short");
  } else if (insight.detailedAnalysis.length > 5000) {
    errors.push("Detailed analysis too long (max 5000 characters)");
  }

  // Check recommendations
  if (!Array.isArray(insight.recommendations)) {
    errors.push("Recommendations must be an array");
  } else if (insight.recommendations.length === 0) {
    warnings.push("No recommendations provided");
  } else {
    for (let i = 0; i < insight.recommendations.length; i++) {
      const rec = insight.recommendations[i];
      if (!rec.action || !rec.description) {
        errors.push(`Recommendation ${i + 1} missing action or description`);
      }
      if (!["low", "medium", "high"].includes(rec.priority)) {
        errors.push(`Recommendation ${i + 1} has invalid priority`);
      }
    }
  }

  // Check severity
  const validSeverities = Object.values(InsightSeverity);
  if (!insight.severity || !validSeverities.includes(insight.severity)) {
    errors.push("Invalid or missing severity");
  }

  // Check confidence
  if (
    typeof insight.confidence !== "number" ||
    insight.confidence < 0 ||
    insight.confidence > 1
  ) {
    errors.push("Confidence must be a number between 0 and 1");
  } else if (insight.confidence < 0.5) {
    warnings.push("Low confidence score");
  }

  // Check tags
  if (!Array.isArray(insight.tags)) {
    warnings.push("Missing or invalid tags");
  } else if (insight.tags.length === 0) {
    warnings.push("No tags provided");
  }

  // Content safety checks
  const contentSafetyErrors = checkContentSafety(insight);
  errors.push(...contentSafetyErrors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for inappropriate content, hallucinations, etc.
 */
function checkContentSafety(insight: any): string[] {
  const errors: string[] = [];

  const allText = [
    insight.title,
    insight.summary,
    insight.detailedAnalysis,
    ...insight.recommendations.map((r: any) => r.action + " " + r.description),
  ].join(" ");

  // Check for financial advice disclaimers (should not give definitive advice)
  const definiteAdvicePatterns = [
    /you should definitely/i,
    /you must immediately/i,
    /guaranteed to/i,
    /risk-free/i,
    /100% certain/i,
  ];

  for (const pattern of definiteAdvicePatterns) {
    if (pattern.test(allText)) {
      errors.push(
        "Insight contains overly definitive language that could be construed as financial advice"
      );
      break;
    }
  }

  // Check for hallucinated protocols/tokens
  // (In a real system, you'd check against a whitelist)
  const suspiciousPatterns = [
    /protocol XYZ/i,
    /token ABC/i,
    /unnamed protocol/i,
    /hypothetical/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(allText)) {
      errors.push("Insight may contain hallucinated or placeholder content");
      break;
    }
  }

  // Check for inappropriate content
  const inappropriatePatterns = [
    /scam/i,
    /rug pull/i,
    /ponzi/i,
    /illegal/i,
  ];

  for (const pattern of inappropriatePatterns) {
    if (pattern.test(allText)) {
      errors.push("Insight contains potentially inflammatory language");
      break;
    }
  }

  return errors;
}

/**
 * Sanitize insight content
 */
export function sanitizeInsight(insight: any): any {
  return {
    ...insight,
    title: sanitizeText(insight.title, 150),
    summary: sanitizeText(insight.summary, 500),
    detailedAnalysis: sanitizeText(insight.detailedAnalysis, 5000),
    recommendations: insight.recommendations.map((rec: any) => ({
      ...rec,
      action: sanitizeText(rec.action, 200),
      description: sanitizeText(rec.description, 500),
      estimatedImpact: rec.estimatedImpact
        ? sanitizeText(rec.estimatedImpact, 200)
        : undefined,
    })),
  };
}

/**
 * Sanitize text content
 */
function sanitizeText(text: string, maxLength: number): string {
  if (!text) return "";

  // Remove excessive whitespace
  let sanitized = text.replace(/\s+/g, " ").trim();

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + "...";
  }

  return sanitized;
}

