import mongoose, { Document } from "mongoose";
import { InsightType, InsightSeverity, InsightStatus } from "@avax-ledger/types";
/**
 * Recommendation subdocument
 */
declare const RecommendationSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    _id: false;
}, {
    description: string;
    action: string;
    priority: "low" | "medium" | "high";
    links: mongoose.Types.DocumentArray<{
        label: string;
        url: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        label: string;
        url: string;
    }> & {
        label: string;
        url: string;
    }>;
    estimatedImpact?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    description: string;
    action: string;
    priority: "low" | "medium" | "high";
    links: mongoose.Types.DocumentArray<{
        label: string;
        url: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        label: string;
        url: string;
    }> & {
        label: string;
        url: string;
    }>;
    estimatedImpact?: string | null | undefined;
}>, {}, mongoose.ResolveSchemaOptions<{
    _id: false;
}>> & mongoose.FlatRecord<{
    description: string;
    action: string;
    priority: "low" | "medium" | "high";
    links: mongoose.Types.DocumentArray<{
        label: string;
        url: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        label: string;
        url: string;
    }> & {
        label: string;
        url: string;
    }>;
    estimatedImpact?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Portfolio snapshot subdocument
 */
declare const PortfolioSnapshotInfoSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    _id: false;
}, {
    totalValueUsd: number;
    tokenCount: number;
    positionCount: number;
    riskScore?: number | null | undefined;
    diversificationScore?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    totalValueUsd: number;
    tokenCount: number;
    positionCount: number;
    riskScore?: number | null | undefined;
    diversificationScore?: number | null | undefined;
}>, {}, mongoose.ResolveSchemaOptions<{
    _id: false;
}>> & mongoose.FlatRecord<{
    totalValueUsd: number;
    tokenCount: number;
    positionCount: number;
    riskScore?: number | null | undefined;
    diversificationScore?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
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
 * Export Insight model
 */
export declare const Insight: mongoose.Model<any, {}, {}, {}, any, any>;
export {};
//# sourceMappingURL=insight.schema.d.ts.map