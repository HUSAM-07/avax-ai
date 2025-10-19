import mongoose, { Schema, Document } from "mongoose";
import { ChainId, PositionType, TokenStandard } from "@avax-ledger/types";

/**
 * Token balance subdocument
 */
const TokenBalanceSchema = new Schema(
  {
    address: { type: String, required: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    decimals: { type: Number, required: true, min: 0, max: 18 },
    balance: { type: String, required: true },
    balanceFormatted: { type: Number, required: true },
    valueUsd: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    logoUrl: { type: String },
  },
  { _id: false }
);

/**
 * Position subdocument
 */
const PositionSchema = new Schema(
  {
    positionId: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(PositionType),
      required: true,
    },
    protocol: { type: String, required: true },
    protocolLogoUrl: { type: String },
    name: { type: String, required: true },
    tokens: [TokenBalanceSchema],
    totalValueUsd: { type: Number, required: true, default: 0 },
    apr: { type: Number },
    apy: { type: Number },
    poolShare: { type: Number },
    poolTotalValueUsd: { type: Number },
  },
  { _id: false }
);

/**
 * Portfolio snapshot document interface
 */
export interface IPortfolioSnapshot extends Document {
  walletAddress: string;
  chainId: ChainId;
  tokens: typeof TokenBalanceSchema[];
  positions: typeof PositionSchema[];
  totalValueUsd: number;
  totalValueChange24h: number;
  totalValueChange7d: number;
  tokenCount: number;
  protocolCount: number;
  riskScore?: number;
  diversificationScore?: number;
  timestamp: Date;
  createdAt: Date;
}

/**
 * Portfolio snapshot schema
 */
const PortfolioSnapshotSchema = new Schema<IPortfolioSnapshot>(
  {
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    chainId: {
      type: Number,
      enum: Object.values(ChainId),
      required: true,
      index: true,
    },
    tokens: [TokenBalanceSchema],
    positions: [PositionSchema],
    totalValueUsd: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    totalValueChange24h: {
      type: Number,
      default: 0,
    },
    totalValueChange7d: {
      type: Number,
      default: 0,
    },
    tokenCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    protocolCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    diversificationScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "portfolio_snapshots",
  }
);

/**
 * Indexes for time-series queries and performance
 */
PortfolioSnapshotSchema.index({ walletAddress: 1, timestamp: -1 });
PortfolioSnapshotSchema.index({ walletAddress: 1, chainId: 1, timestamp: -1 });
PortfolioSnapshotSchema.index({ timestamp: -1 });

// TTL index: automatically delete snapshots older than 90 days
PortfolioSnapshotSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

/**
 * Static methods
 */
PortfolioSnapshotSchema.statics.getLatestForWallet = function (
  walletAddress: string,
  chainId?: ChainId
) {
  const query: any = { walletAddress: walletAddress.toLowerCase() };
  if (chainId) {
    query.chainId = chainId;
  }
  return this.findOne(query).sort({ timestamp: -1 }).exec();
};

PortfolioSnapshotSchema.statics.getHistoryForWallet = function (
  walletAddress: string,
  options: {
    chainId?: ChainId;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
) {
  const query: any = { walletAddress: walletAddress.toLowerCase() };
  
  if (options.chainId) {
    query.chainId = options.chainId;
  }
  
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) {
      query.timestamp.$gte = options.startDate;
    }
    if (options.endDate) {
      query.timestamp.$lte = options.endDate;
    }
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .exec();
};

/**
 * Export PortfolioSnapshot model
 */
export const PortfolioSnapshot =
  mongoose.models.PortfolioSnapshot ||
  mongoose.model<IPortfolioSnapshot>("PortfolioSnapshot", PortfolioSnapshotSchema);

