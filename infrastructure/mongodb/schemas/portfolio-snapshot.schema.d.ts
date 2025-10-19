import mongoose, { Document } from "mongoose";
import { ChainId, PositionType } from "@avax-ledger/types";
/**
 * Token balance subdocument
 */
declare const TokenBalanceSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    _id: false;
}, {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    balance: string;
    balanceFormatted: number;
    valueUsd: number;
    price: number;
    logoUrl?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    balance: string;
    balanceFormatted: number;
    valueUsd: number;
    price: number;
    logoUrl?: string | null | undefined;
}>, {}, mongoose.ResolveSchemaOptions<{
    _id: false;
}>> & mongoose.FlatRecord<{
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    balance: string;
    balanceFormatted: number;
    valueUsd: number;
    price: number;
    logoUrl?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Position subdocument
 */
declare const PositionSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    _id: false;
}, {
    type: PositionType;
    name: string;
    positionId: string;
    protocol: string;
    tokens: mongoose.Types.DocumentArray<{
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }> & {
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }>;
    totalValueUsd: number;
    protocolLogoUrl?: string | null | undefined;
    apr?: number | null | undefined;
    apy?: number | null | undefined;
    poolShare?: number | null | undefined;
    poolTotalValueUsd?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: PositionType;
    name: string;
    positionId: string;
    protocol: string;
    tokens: mongoose.Types.DocumentArray<{
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }> & {
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }>;
    totalValueUsd: number;
    protocolLogoUrl?: string | null | undefined;
    apr?: number | null | undefined;
    apy?: number | null | undefined;
    poolShare?: number | null | undefined;
    poolTotalValueUsd?: number | null | undefined;
}>, {}, mongoose.ResolveSchemaOptions<{
    _id: false;
}>> & mongoose.FlatRecord<{
    type: PositionType;
    name: string;
    positionId: string;
    protocol: string;
    tokens: mongoose.Types.DocumentArray<{
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }> & {
        symbol: string;
        name: string;
        address: string;
        decimals: number;
        balance: string;
        balanceFormatted: number;
        valueUsd: number;
        price: number;
        logoUrl?: string | null | undefined;
    }>;
    totalValueUsd: number;
    protocolLogoUrl?: string | null | undefined;
    apr?: number | null | undefined;
    apy?: number | null | undefined;
    poolShare?: number | null | undefined;
    poolTotalValueUsd?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
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
 * Export PortfolioSnapshot model
 */
export declare const PortfolioSnapshot: mongoose.Model<any, {}, {}, {}, any, any>;
export {};
//# sourceMappingURL=portfolio-snapshot.schema.d.ts.map