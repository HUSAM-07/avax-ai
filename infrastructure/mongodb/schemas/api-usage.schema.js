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
exports.ApiUsage = exports.ApiService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * API service types
 */
var ApiService;
(function (ApiService) {
    ApiService["OPENAI"] = "openai";
    ApiService["ZERION"] = "zerion";
    ApiService["COINGECKO"] = "coingecko";
    ApiService["DEFILLAMA"] = "defillama";
    ApiService["AVALANCHE_RPC"] = "avalanche_rpc";
})(ApiService || (exports.ApiService = ApiService = {}));
/**
 * API usage schema
 */
const ApiUsageSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
    },
}, {
    timestamps: false,
    collection: "api_usage",
});
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
ApiUsageSchema.statics.getTotalCostForPeriod = async function (startDate, endDate, service) {
    const match = {
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
ApiUsageSchema.statics.getCostByService = async function (startDate, endDate) {
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
ApiUsageSchema.statics.getErrorRate = async function (service, startDate, endDate) {
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
exports.ApiUsage = mongoose_1.default.models.ApiUsage || mongoose_1.default.model("ApiUsage", ApiUsageSchema);
