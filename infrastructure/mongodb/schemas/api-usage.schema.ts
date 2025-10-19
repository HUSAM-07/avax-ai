import mongoose, { Schema, Document } from "mongoose";

/**
 * API service types
 */
export enum ApiService {
  OPENAI = "openai",
  ZERION = "zerion",
  COINGECKO = "coingecko",
  DEFILLAMA = "defillama",
  AVALANCHE_RPC = "avalanche_rpc",
}

/**
 * API usage document interface
 */
export interface IApiUsage extends Document {
  walletAddress?: string;
  service: ApiService;
  endpoint: string;
  method: string;
  requestedAt: Date;
  responseStatus: number;
  responseTimeMs: number;
  tokensUsed?: number;
  costUsd?: number;
  error?: string;
  retries: number;
  metadata?: Record<string, any>;
}

/**
 * API usage schema
 */
const ApiUsageSchema = new Schema<IApiUsage>(
  {
    walletAddress: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    service: {
      type: String,
      enum: Object.values(ApiService),
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      required: true,
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    responseStatus: {
      type: Number,
      required: true,
    },
    responseTimeMs: {
      type: Number,
      required: true,
      min: 0,
    },
    tokensUsed: {
      type: Number,
      min: 0,
    },
    costUsd: {
      type: Number,
      min: 0,
    },
    error: {
      type: String,
    },
    retries: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
    collection: "api_usage",
  }
);

/**
 * Indexes for analytics and cost tracking
 */
ApiUsageSchema.index({ service: 1, requestedAt: -1 });
ApiUsageSchema.index({ walletAddress: 1, service: 1, requestedAt: -1 });
ApiUsageSchema.index({ service: 1, endpoint: 1, requestedAt: -1 });
ApiUsageSchema.index({ requestedAt: -1 });

// TTL index: keep usage data for 90 days
ApiUsageSchema.index({ requestedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/**
 * Static methods for analytics
 */
ApiUsageSchema.statics.getTotalCostForPeriod = async function (
  startDate: Date,
  endDate: Date,
  service?: ApiService
) {
  const match: any = {
    requestedAt: { $gte: startDate, $lte: endDate },
    costUsd: { $exists: true },
  };

  if (service) {
    match.service = service;
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCost: { $sum: "$costUsd" },
        totalRequests: { $sum: 1 },
        avgResponseTime: { $avg: "$responseTimeMs" },
      },
    },
  ]);

  return result[0] || { totalCost: 0, totalRequests: 0, avgResponseTime: 0 };
};

ApiUsageSchema.statics.getCostByService = async function (
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        requestedAt: { $gte: startDate, $lte: endDate },
        costUsd: { $exists: true },
      },
    },
    {
      $group: {
        _id: "$service",
        totalCost: { $sum: "$costUsd" },
        totalRequests: { $sum: 1 },
        avgResponseTime: { $avg: "$responseTimeMs" },
        totalErrors: {
          $sum: { $cond: [{ $gte: ["$responseStatus", 400] }, 1, 0] },
        },
      },
    },
    { $sort: { totalCost: -1 } },
  ]);
};

ApiUsageSchema.statics.getErrorRate = async function (
  service: ApiService,
  startDate: Date,
  endDate: Date
) {
  const result = await this.aggregate([
    {
      $match: {
        service,
        requestedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        errors: {
          $sum: { $cond: [{ $gte: ["$responseStatus", 400] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        errorRate: {
          $cond: [
            { $gt: ["$total", 0] },
            { $divide: ["$errors", "$total"] },
            0,
          ],
        },
        total: 1,
        errors: 1,
      },
    },
  ]);

  return result[0] || { errorRate: 0, total: 0, errors: 0 };
};

/**
 * Export ApiUsage model
 */
export const ApiUsage =
  mongoose.models.ApiUsage || mongoose.model<IApiUsage>("ApiUsage", ApiUsageSchema);

