"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioSnapshot = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("@avax-ledger/types");
/**
 * Token balance subdocument
 */
const TokenBalanceSchema = new mongoose_1.Schema({
    address: { type: String, required: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    decimals: { type: Number, required: true, min: 0, max: 18 },
    balance: { type: String, required: true },
    balanceFormatted: { type: Number, required: true },
    valueUsd: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    logoUrl: { type: String },
}, { _id: false });
/**
 * Position subdocument
 */
const PositionSchema = new mongoose_1.Schema({
    positionId: { type: String, required: true },
    type: {
        type: String,
        enum: Object.values(types_1.PositionType),
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
}, { _id: false });
/**
 * Portfolio snapshot schema
 */
const PortfolioSnapshotSchema = new mongoose_1.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    chainId: {
        type: Number,
        enum: Object.values(types_1.ChainId),
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
}, {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "portfolio_snapshots",
});
/**
 * Indexes for time-series queries and performance
 */
PortfolioSnapshotSchema.index({ walletAddress: 1, timestamp: -1 });
PortfolioSnapshotSchema.index({ walletAddress: 1, chainId: 1, timestamp: -1 });
PortfolioSnapshotSchema.index({ timestamp: -1 });
// TTL index: automatically delete snapshots older than 90 days
PortfolioSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
/**
 * Static methods
 */
PortfolioSnapshotSchema.statics.getLatestForWallet = function (walletAddress, chainId) {
    const query = { walletAddress: walletAddress.toLowerCase() };
    if (chainId) {
        query.chainId = chainId;
    }
    return this.findOne(query).sort({ timestamp: -1 }).exec();
};
PortfolioSnapshotSchema.statics.getHistoryForWallet = function (walletAddress, options = {}) {
    const query = { walletAddress: walletAddress.toLowerCase() };
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
exports.PortfolioSnapshot = mongoose_1.default.models.PortfolioSnapshot ||
    mongoose_1.default.model("PortfolioSnapshot", PortfolioSnapshotSchema);
