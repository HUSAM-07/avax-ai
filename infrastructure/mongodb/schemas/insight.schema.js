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
exports.Insight = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("@avax-ledger/types");
/**
 * Recommendation subdocument
 */
const RecommendationSchema = new mongoose_1.Schema({
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
}, { _id: false });
/**
 * Portfolio snapshot subdocument
 */
const PortfolioSnapshotInfoSchema = new mongoose_1.Schema({
    totalValueUsd: { type: Number, required: true },
    tokenCount: { type: Number, required: true },
    positionCount: { type: Number, required: true },
    diversificationScore: { type: Number },
    riskScore: { type: Number },
}, { _id: false });
/**
 * Insight schema
 */
const InsightSchema = new mongoose_1.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(types_1.InsightType),
        required: true,
        index: true,
    },
    severity: {
        type: String,
        enum: Object.values(types_1.InsightSeverity),
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: Object.values(types_1.InsightStatus),
        required: true,
        default: types_1.InsightStatus.PENDING,
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
}, {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "insights",
});
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
InsightSchema.statics.getActiveForWallet = function (walletAddress, options = {}) {
    const query = {
        walletAddress: walletAddress.toLowerCase(),
        status: types_1.InsightStatus.COMPLETED,
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
exports.Insight = mongoose_1.default.models.Insight || mongoose_1.default.model("Insight", InsightSchema);
