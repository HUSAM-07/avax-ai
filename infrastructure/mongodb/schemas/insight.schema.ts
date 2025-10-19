import mongoose, { Schema, Document } from "mongoose";
import { InsightType, InsightSeverity, InsightStatus } from "@avax-ledger/types";

/**
 * Recommendation subdocument
 */
const RecommendationSchema = new Schema(
  {
    action: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    estimatedImpact: { type: String },
    links: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  },
  { _id: false }
);

/**
 * Portfolio snapshot subdocument
 */
const PortfolioSnapshotInfoSchema = new Schema(
  {
    totalValueUsd: { type: Number, required: true },
    tokenCount: { type: Number, required: true },
    positionCount: { type: Number, required: true },
    diversificationScore: { type: Number },
    riskScore: { type: Number },
  },
  { _id: false }
);

/**
 * Insight document interface
 */
export interface IInsight extends Document {
  walletAddress: string;
  type: InsightType;
  severity: InsightSeverity;
  status: InsightStatus;
  title: string;
  summary: string;
  detailedAnalysis: string;
  recommendations: typeof RecommendationSchema[];
  confidence: number;
  tags: string[];
  portfolioSnapshot: typeof PortfolioSnapshotInfoSchema;
  tokensUsed?: number;
  generationTimeMs?: number;
  costUsd?: number;
  createdAt: Date;
  expiresAt?: Date;
  viewedAt?: Date;
  dismissedAt?: Date;
}

/**
 * Insight schema
 */
const InsightSchema = new Schema<IInsight>(
  {
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(InsightType),
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(InsightSeverity),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(InsightStatus),
      required: true,
      default: InsightStatus.PENDING,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    detailedAnalysis: {
      type: String,
      required: true,
    },
    recommendations: [RecommendationSchema],
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.5,
    },
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    portfolioSnapshot: {
      type: PortfolioSnapshotInfoSchema,
      required: true,
    },
    tokensUsed: {
      type: Number,
      min: 0,
    },
    generationTimeMs: {
      type: Number,
      min: 0,
    },
    costUsd: {
      type: Number,
      min: 0,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    viewedAt: {
      type: Date,
    },
    dismissedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "insights",
  }
);

/**
 * Compound indexes for complex queries
 */
InsightSchema.index({ walletAddress: 1, createdAt: -1 });
InsightSchema.index({ walletAddress: 1, type: 1, createdAt: -1 });
InsightSchema.index({ walletAddress: 1, severity: 1, createdAt: -1 });
InsightSchema.index({ walletAddress: 1, status: 1 });
InsightSchema.index({ createdAt: -1 });

// TTL index for expired insights
InsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Instance methods
 */
InsightSchema.methods.markAsViewed = function () {
  if (!this.viewedAt) {
    this.viewedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

InsightSchema.methods.dismiss = function () {
  this.dismissedAt = new Date();
  return this.save();
};

/**
 * Static methods
 */
InsightSchema.statics.getActiveForWallet = function (
  walletAddress: string,
  options: {
    type?: InsightType;
    severity?: InsightSeverity;
    limit?: number;
  } = {}
) {
  const query: any = {
    walletAddress: walletAddress.toLowerCase(),
    status: InsightStatus.COMPLETED,
    dismissedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  if (options.type) {
    query.type = options.type;
  }

  if (options.severity) {
    query.severity = options.severity;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 10)
    .exec();
};

/**
 * Export Insight model
 */
export const Insight =
  mongoose.models.Insight || mongoose.model<IInsight>("Insight", InsightSchema);

